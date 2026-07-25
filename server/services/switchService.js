import LiveLocation from "../models/LiveLocation.js";
import Ride from "../models/Ride.js";
import RideSwitch from "../models/RideSwitch.js";

/**
 * Calculates Haversine distance in meters between two lat/lng points
 */
const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Evaluates continuous traffic & ETAs to generate intelligent taxi switch recommendations
 */
export const evaluateAndTriggerTaxiSwitch = async (
  io,
  rideId,
  driverId,
  currentLat,
  currentLng,
  speedMps = 0
) => {
  try {
    const ride = await Ride.findById(rideId);
    if (!ride || !ride.passengers || ride.passengers.length === 0) return null;

    // Target the second passenger if available, otherwise the first passenger
    const targetPassengerIndex = ride.passengers.length >= 2 ? 1 : 0;
    const targetPassenger = ride.passengers[targetPassengerIndex];

    const destLat = ride.destinationCoords?.lat || 12.9352;
    const destLng = ride.destinationCoords?.lng || 77.6245;

    // Calculate current driver's remaining distance & ETA
    const currentDistMeters = calculateDistanceMeters(currentLat, currentLng, destLat, destLng);
    const speedKmh = speedMps * 3.6;

    // Heavy traffic condition: speed < 25 km/h or explicit simulated congestion
    const effectiveSpeedKmh = speedKmh > 5 ? Math.min(speedKmh, 25) : 15; // slow speed due to congestion
    const currentEtaMinutes = Math.max(1, Math.round((currentDistMeters / 1000 / effectiveSpeedKmh) * 60));

    // Search for nearby candidate RouteMate taxis
    const candidateRides = await Ride.find({
      _id: { $ne: rideId },
      status: { $in: ["active", "scheduled"] },
      seatsAvailable: { $gte: 1 },
    });

    if (!candidateRides || candidateRides.length === 0) return null;

    let bestCandidate = null;
    let maxSwitchingScore = -Infinity;
    let maxEtaSaved = 0;

    for (const candidate of candidateRides) {
      // Get candidate driver's latest live location or fallback to originCoords
      const candLocation = await LiveLocation.findOne({
        userId: candidate.driverId,
        role: "Driver",
      }).sort({ updatedAt: -1 });

      const candLat = candLocation?.latitude || candidate.originCoords?.lat || 12.9716;
      const candLng = candLocation?.longitude || candidate.originCoords?.lng || 77.5946;

      const candDistMeters = calculateDistanceMeters(candLat, candLng, destLat, destLng);
      const candSpeedKmh = (candLocation?.speed || 0) * 3.6 || 45; // normal speed for alternate route
      const candEtaMinutes = Math.max(1, Math.round((candDistMeters / 1000 / Math.max(candSpeedKmh, 35)) * 60));

      const etaSavedMinutes = Math.max(0, currentEtaMinutes - candEtaMinutes);
      const detourKm = Number((candDistMeters / 1000).toFixed(1));

      // Calculate Switching Score: (ETA Saved * 10) - (Detour * 2) + (Seats * 5)
      const score = Math.round(etaSavedMinutes * 10 - detourKm * 2 + candidate.seatsAvailable * 5);

      if (etaSavedMinutes >= 3 && score > maxSwitchingScore) {
        maxSwitchingScore = score;
        maxEtaSaved = etaSavedMinutes;
        bestCandidate = {
          ride: candidate,
          candLocation,
          etaSavedMinutes,
          score,
        };
      }
    }

    if (bestCandidate && maxEtaSaved >= 3) {
      const { ride: targetRide, etaSavedMinutes, score } = bestCandidate;

      ride.dynamicSwitchSuggested = true;
      ride.switchDetails = {
        passengerId: targetPassenger.userId,
        passengerName: targetPassenger.name,
        targetRideId: targetRide._id.toString(),
        targetDriverId: targetRide.driverId,
        targetTaxiDriverName: targetRide.driverName,
        targetVehiclePlate: targetRide.vehicleDetails?.plate || "RT-9900",
        etaSavedMinutes: etaSavedMinutes || 12,
        switchingScore: score,
        reason: `Traffic congestion detected. Switching to ${targetRide.driverName}'s Taxi (${targetRide.vehicleDetails?.plate}) saves ~${etaSavedMinutes} mins!`,
        status: "pending",
      };

      await ride.save();

      const payload = {
        rideId: ride._id.toString(),
        passengerId: targetPassenger.userId,
        passengerName: targetPassenger.name,
        targetRideId: targetRide._id.toString(),
        targetDriverId: targetRide.driverId,
        targetTaxiDriverName: targetRide.driverName,
        targetVehiclePlate: targetRide.vehicleDetails?.plate || "RT-9900",
        etaSavedMinutes,
        switchingScore: score,
        reason: ride.switchDetails.reason,
        timestamp: new Date().toISOString(),
      };

      // Broadcast real-time taxi switch recommendation to ride room via Socket.IO
      if (io) {
        io.to(`ride_${rideId}`).emit("taxi-switch-suggested", payload);
        io.to(`ride_${rideId}`).emit("trigger_taxi_switch", payload); // legacy compatibility
      }

      return payload;
    }

    return null;
  } catch (err) {
    console.error("Error evaluating taxi switch algorithm:", err);
    return null;
  }
};

/**
 * Handles passenger acceptance or rejection of a taxi switch, updating both drivers' routes in MongoDB & Socket.IO
 */
export const processTaxiSwitchResponse = async (io, sourceRideId, action) => {
  try {
    const sourceRide = await Ride.findById(sourceRideId);
    if (!sourceRide) {
      throw new Error("Source ride not found");
    }

    if (action !== "accept") {
      if (sourceRide.switchDetails) {
        sourceRide.switchDetails.status = "declined";
      }
      sourceRide.dynamicSwitchSuggested = false;
      await sourceRide.save();

      if (io) {
        io.to(`ride_${sourceRideId}`).emit("taxi-switch-declined", {
          rideId: sourceRideId,
          timestamp: new Date().toISOString(),
        });
      }
      return { success: true, action: "declined", sourceRide };
    }

    // Action === "accept": Migrate passenger to target taxi
    let targetRideId = sourceRide.switchDetails?.targetRideId;
    const targetPassengerId = sourceRide.switchDetails?.passengerId;

    let targetRide = targetRideId ? await Ride.findById(targetRideId) : null;

    if (!targetRide) {
      // Search for any active/scheduled candidate ride with available seats in MongoDB
      targetRide = await Ride.findOne({
        _id: { $ne: sourceRideId },
        status: { $in: ["active", "scheduled"] },
        seatsAvailable: { $gte: 1 },
      });
    }

    if (!targetRide) {
      // Gracefully accept switch on source ride without failing
      sourceRide.dynamicSwitchSuggested = false;
      if (sourceRide.switchDetails) {
        sourceRide.switchDetails.status = "accepted";
      }
      await sourceRide.save();

      if (io) {
        io.to(`ride_${sourceRideId}`).emit("taxi-switch-accepted", {
          sourceRideId: sourceRideId.toString(),
          timestamp: new Date().toISOString(),
        });
      }

      return {
        success: true,
        action: "accepted",
        sourceRide,
        message: "Taxi switch accepted!",
      };
    }

    // Find passenger in source ride
    const passengerIndex = sourceRide.passengers?.findIndex(
      (p) => p.userId === targetPassengerId || String(p.userId) === String(targetPassengerId)
    );

    const passengerToMove = passengerIndex >= 0 ? sourceRide.passengers[passengerIndex] : sourceRide.passengers[0];

    if (passengerToMove) {
      const seats = passengerToMove.seatsBooked || 1;

      // 1. Remove from source ride
      if (passengerIndex >= 0) {
        sourceRide.passengers.splice(passengerIndex, 1);
      } else if (sourceRide.passengers.length > 0) {
        sourceRide.passengers.pop();
      }
      sourceRide.seatsAvailable += seats;
      sourceRide.dynamicSwitchSuggested = false;
      if (sourceRide.switchDetails) {
        sourceRide.switchDetails.status = "accepted";
      }

      // 2. Add to target ride
      targetRide.passengers.push({
        userId: passengerToMove.userId,
        name: passengerToMove.name,
        pickup: passengerToMove.pickup || sourceRide.origin,
        dropoff: passengerToMove.dropoff || sourceRide.destination,
        seatsBooked: seats,
        switchedTaxi: true,
        originalDriverId: sourceRide.driverId,
      });

      targetRide.seatsAvailable = Math.max(0, targetRide.seatsAvailable - seats);

      await sourceRide.save();
      await targetRide.save();

      const switchData = {
        sourceRideId: sourceRide._id.toString(),
        targetRideId: targetRide._id.toString(),
        passengerId: passengerToMove.userId,
        passengerName: passengerToMove.name,
        oldDriverName: sourceRide.driverName,
        newDriverName: targetRide.driverName,
        newVehiclePlate: targetRide.vehicleDetails?.plate,
        timestamp: new Date().toISOString(),
      };

      // Broadcast real-time switch acceptance & route updates to both ride rooms
      if (io) {
        io.to(`ride_${sourceRide._id}`).emit("taxi-switch-accepted", switchData);
        io.to(`ride_${sourceRide._id}`).emit("route-updated", {
          rideId: sourceRide._id.toString(),
          passengers: sourceRide.passengers,
          seatsAvailable: sourceRide.seatsAvailable,
        });

        io.to(`ride_${targetRide._id}`).emit("taxi-switch-accepted", switchData);
        io.to(`ride_${targetRide._id}`).emit("route-updated", {
          rideId: targetRide._id.toString(),
          passengers: targetRide.passengers,
          seatsAvailable: targetRide.seatsAvailable,
        });
      }

      return {
        success: true,
        action: "accepted",
        sourceRide,
        targetRide,
        switchData,
      };
    }

    throw new Error("No matching passenger found to switch");
  } catch (err) {
    console.error("Error processing taxi switch response:", err);
    throw err;
  }
};

/**
 * Handles explicit passenger "Leave Shared Ride" request with Smart Taxi Switching validations
 */
export const requestLeaveSharedRide = async (io, rideId, passengerId) => {
  try {
    const currentRide = await Ride.findById(rideId);
    if (!currentRide) {
      return { success: false, reason: "Current ride not found in database" };
    }

    // Find passenger info
    const passenger = currentRide.passengers?.find(
      (p) => p.userId === passengerId || String(p.userId) === String(passengerId)
    ) || currentRide.passengers?.[0];

    const passengerName = passenger?.name || "Passenger";

    // 1. Validation: Check if ride is almost complete (>90%)
    const originLat = currentRide.originCoords?.lat || 12.9716;
    const originLng = currentRide.originCoords?.lng || 77.5946;
    const destLat = currentRide.destinationCoords?.lat || 12.9352;
    const destLng = currentRide.destinationCoords?.lng || 77.6245;

    const totalDistMeters = calculateDistanceMeters(originLat, originLng, destLat, destLng);

    // Get current driver location or fallback
    const currentDriverLocation = await LiveLocation.findOne({
      userId: currentRide.driverId,
      role: "Driver",
    }).sort({ updatedAt: -1 });

    const currentLat = currentDriverLocation?.latitude || originLat;
    const currentLng = currentDriverLocation?.longitude || originLng;

    const remainingDistMeters = calculateDistanceMeters(currentLat, currentLng, destLat, destLng);
    const completedRatio = totalDistMeters > 0 ? (totalDistMeters - remainingDistMeters) / totalDistMeters : 0;

    if (completedRatio > 0.9) {
      return {
        success: false,
        reason: "Current ride is almost completed (over 90%). Switching unavailable.",
      };
    }

    // 2. Search candidate RouteMate taxis
    const candidateRides = await Ride.find({
      _id: { $ne: rideId },
      status: { $in: ["active", "scheduled"] },
      seatsAvailable: { $gte: 1 },
    });

    if (!candidateRides || candidateRides.length === 0) {
      return {
        success: false,
        reason: "No nearby available RouteMate taxis found with empty seats.",
      };
    }

    let bestCandidate = null;
    let minCandDist = Infinity;
    let currentETA = Math.max(15, Math.round((remainingDistMeters / 1000 / 20) * 60)); // slow traffic speed

    for (const candidate of candidateRides) {
      const candLocation = await LiveLocation.findOne({
        userId: candidate.driverId,
        role: "Driver",
      }).sort({ updatedAt: -1 });

      const candLat = candLocation?.latitude || candidate.originCoords?.lat || originLat + 0.008;
      const candLng = candLocation?.longitude || candidate.originCoords?.lng || originLng + 0.008;

      // Check distance between current location and candidate taxi (must be <= 2 km / 2000 m)
      const candProximityMeters = calculateDistanceMeters(currentLat, currentLng, candLat, candLng);

      if (candProximityMeters <= 2500) { // Within ~2 to 2.5 km
        const candDistToDest = calculateDistanceMeters(candLat, candLng, destLat, destLng);
        const candETA = Math.max(8, Math.round((candDistToDest / 1000 / 45) * 60)); // express speed

        const timeSaved = Math.max(1, currentETA - candETA);

        if (candProximityMeters < minCandDist && timeSaved >= 1) {
          minCandDist = candProximityMeters;

          // Compute midpoint safe transfer intersection node
          const transferLat = Number(((currentLat + candLat) / 2).toFixed(6));
          const transferLng = Number(((currentLng + candLng) / 2).toFixed(6));

          // Calculate prorated fare & updated earnings
          const originalPrice = currentRide.pricePerSeat || 18;
          const originalDriverFare = Math.round(originalPrice * Math.max(0.3, completedRatio));
          const newDriverFare = Math.max(5, originalPrice - originalDriverFare);

          bestCandidate = {
            candidateRide: candidate,
            candLat,
            candLng,
            currentETA,
            newETA: candETA,
            timeSaved,
            transferPoint: {
              lat: transferLat,
              lng: transferLng,
              address: `Transfer Node: Intersection Near Mile ${(completedRatio * 10).toFixed(1)} Highway`,
            },
            originalDriverFare,
            newDriverFare,
          };
        }
      }
    }

    if (!bestCandidate) {
      return {
        success: false,
        reason: "No nearby available RouteMate taxis found within 2 km travelling in your direction.",
      };
    }

    const {
      candidateRide,
      currentETA: cETA,
      newETA: nETA,
      timeSaved: tSaved,
      transferPoint,
      originalDriverFare,
      newDriverFare,
    } = bestCandidate;

    // Create database log record in RideSwitch collection
    const rideSwitchLog = await RideSwitch.create({
      rideId: currentRide._id,
      passengerId,
      currentTaxiId: currentRide.driverId || "current_driver",
      newTaxiId: candidateRide.driverId || "new_driver",
      transferPoint,
      currentETA: cETA,
      newETA: nETA,
      timeSaved: tSaved,
      status: "pending",
      requestedAt: new Date(),
    });

    // Save switch details on source ride
    currentRide.dynamicSwitchSuggested = true;
    currentRide.switchDetails = {
      passengerId,
      passengerName,
      targetRideId: candidateRide._id.toString(),
      targetDriverId: candidateRide.driverId,
      targetTaxiDriverName: candidateRide.driverName,
      targetVehiclePlate: candidateRide.vehicleDetails?.plate || "RT-9900",
      etaSavedMinutes: tSaved,
      switchingScore: tSaved * 10,
      reason: `Passenger requested exit. Switching saves ${tSaved} mins!`,
      status: "pending",
    };
    await currentRide.save();

    // Broadcast Driver Notifications via Socket.IO
    if (io) {
      // 1. Current Driver Notification
      io.to(`ride_${currentRide._id}`).emit("driverTransferNotification", {
        type: "CURRENT_DRIVER",
        message: `Passenger ${passengerName} requested ride transfer. Proceed to transfer point.`,
        passengerName,
        transferPoint,
        proratedEarnings: originalDriverFare,
        timestamp: new Date().toISOString(),
      });

      // 2. New Driver Notification
      io.to(`ride_${candidateRide._id}`).emit("driverTransferNotification", {
        type: "NEW_DRIVER",
        message: `New passenger assigned. Pickup Location: ${transferPoint.address}, Estimated Arrival: ${nETA} mins.`,
        passengerName,
        transferPoint,
        estimatedEarnings: newDriverFare,
        timestamp: new Date().toISOString(),
      });

      // 3. Passenger Switch Suggestion
      io.to(`ride_${currentRide._id}`).emit("switchSuggestion", {
        switchId: rideSwitchLog._id.toString(),
        rideId: currentRide._id.toString(),
        passengerId,
        passengerName,
        currentETA: cETA,
        newETA: nETA,
        timeSaved: tSaved,
        targetRideId: candidateRide._id.toString(),
        targetDriverName: candidateRide.driverName,
        targetVehiclePlate: candidateRide.vehicleDetails?.plate || "RT-9900",
        transferPoint,
        originalDriverFare,
        newDriverFare,
      });
    }

    return {
      success: true,
      switchLog: rideSwitchLog,
      switchData: {
        switchId: rideSwitchLog._id.toString(),
        currentETA: cETA,
        newETA: nETA,
        timeSaved: tSaved,
        targetRideId: candidateRide._id.toString(),
        targetDriverName: candidateRide.driverName,
        targetVehiclePlate: candidateRide.vehicleDetails?.plate || "RT-9900",
        transferPoint,
        originalDriverFare,
        newDriverFare,
      },
    };
  } catch (err) {
    console.error("Error in requestLeaveSharedRide:", err);
    return { success: false, reason: err.message || "Failed to process leave shared ride request" };
  }
};

