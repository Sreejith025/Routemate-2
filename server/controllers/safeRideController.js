import Ride from "../models/Ride.js";
import User from "../models/User.js";
import RideComplaint from "../models/RideComplaint.js";
import SOS from "../models/SOS.js";
import RideSwitch from "../models/RideSwitch.js";
import LiveLocation from "../models/LiveLocation.js";

// Helper: Haversine distance in meters
const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
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

// Helper: Route similarity calculation (0 to 100%)
const calculateRouteSimilarity = (origin1, dest1, origin2, dest2) => {
  const dOrigin = calculateDistanceMeters(origin1.lat, origin1.lng, origin2.lat, origin2.lng);
  const dDest = calculateDistanceMeters(dest1.lat, dest1.lng, dest2.lat, dest2.lng);

  // Proximity score: if both origins and destinations are close (e.g. within 5km), similarity is >80%
  const maxAllowedDist = 5000; // 5 KM
  const originScore = Math.max(0, 1 - dOrigin / maxAllowedDist);
  const destScore = Math.max(0, 1 - dDest / maxAllowedDist);

  return Math.round(((originScore + destScore) / 2) * 100);
};

/**
 * FEATURE 2: Report Discomfort
 */
export const reportDiscomfort = async (req, res) => {
  try {
    const { id } = req.params;
    const passengerId = req.auth?.userId || req.body?.passengerId;
    const { reason, description } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: "Reason is required" });
    }

    const ride = await Ride.findById(id);
    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found" });
    }

    // SECURITY: Validate passenger is in the active ride
    const isPassengerInRide = ride.passengers?.some(
      (p) => p.userId === passengerId || String(p.userId) === String(passengerId)
    );

    if (!isPassengerInRide && ride.driverId !== passengerId) {
      return res.status(403).json({
        success: false,
        message: "Security Error: Only active passengers in this ride can report discomfort.",
      });
    }

    // SECURITY: Rate limit repeated reports (prevent duplicate reports within 60 seconds)
    const recentReport = await RideComplaint.findOne({
      rideId: ride._id,
      passengerId,
      createdAt: { $gte: new Date(Date.now() - 60000) },
    });

    if (recentReport) {
      return res.status(429).json({
        success: false,
        message: "Please wait before submitting another discomfort report.",
      });
    }

    const passenger = ride.passengers?.find(
      (p) => p.userId === passengerId || String(p.userId) === String(passengerId)
    );

    const complaint = await RideComplaint.create({
      rideId: ride._id,
      passengerId: passengerId || "passenger_demo",
      passengerName: passenger?.name || "Passenger",
      driverId: ride.driverId || "driver_unassigned",
      driverName: ride.driverName || "Driver",
      reason,
      description: description || "",
      time: new Date(),
      status: "pending",
    });

    const io = req.app.get("io");
    if (io) {
      // 1. Notify Driver (Discreet)
      io.to(`ride_${ride._id}`).emit("driverNotification", {
        type: "DISCOMFORT_REPORTED",
        message: "Passenger has requested assistance. Please continue safely.",
        rideId: ride._id.toString(),
        timestamp: new Date().toISOString(),
      });

      // 2. Notify Admin Dashboard & Support Team
      io.emit("reportDiscomfort", {
        complaint,
        rideId: ride._id.toString(),
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(201).json({
      success: true,
      message: "Discomfort report recorded and dispatched to support team.",
      complaint,
    });
  } catch (error) {
    console.error("Report Discomfort Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process discomfort report",
      error: error.message,
    });
  }
};

/**
 * FEATURE 3: Leave Shared Ride (Smart Taxi Search & Conversion to Private)
 */
export const leaveSharedRide = async (req, res) => {
  try {
    const { id } = req.params;
    const passengerId = req.auth?.userId || req.body?.passengerId;
    const io = req.app.get("io");

    const currentRide = await Ride.findById(id);
    if (!currentRide) {
      return res.status(404).json({ success: false, message: "Ride not found" });
    }

    // SECURITY: Validate passenger ownership
    const passenger = currentRide.passengers?.find(
      (p) => p.userId === passengerId || String(p.userId) === String(passengerId)
    );

    if (!passenger && currentRide.passengers?.length > 0) {
      return res.status(403).json({
        success: false,
        message: "Security Error: You must be a passenger in this ride to request transfer.",
      });
    }

    const passengerName = passenger?.name || "Passenger";

    // 1. Get current driver live location or origin coords
    const currentDriverLoc = await LiveLocation.findOne({
      userId: currentRide.driverId,
      role: "Driver",
    }).sort({ updatedAt: -1 });

    const currentLat = currentDriverLoc?.latitude || currentRide.originCoords?.lat || 12.9716;
    const currentLng = currentDriverLoc?.longitude || currentRide.originCoords?.lng || 77.5946;
    const destLat = currentRide.destinationCoords?.lat || 12.9352;
    const destLng = currentRide.destinationCoords?.lng || 77.6245;

    const remainingDistMeters = calculateDistanceMeters(currentLat, currentLng, destLat, destLng);
    const currentETA = Math.max(15, Math.round((remainingDistMeters / 1000 / 20) * 60)); // Traffic speed ~20 km/h

    // 2. SMART TAXI SEARCH
    // Conditions: Available Seat >= 1, Same Destination / Direction, Within 2 KM, Route Similarity > 80%, ETA Better than Current Ride
    const candidateRides = await Ride.find({
      _id: { $ne: currentRide._id },
      status: { $in: ["active", "scheduled"] },
      seatsAvailable: { $gte: 1 },
      sharingEnabled: { $ne: false },
    });

    let bestCandidate = null;

    for (const candidate of candidateRides) {
      const candLocation = await LiveLocation.findOne({
        userId: candidate.driverId,
        role: "Driver",
      }).sort({ updatedAt: -1 });

      const candLat = candLocation?.latitude || candidate.originCoords?.lat || currentLat + 0.005;
      const candLng = candLocation?.longitude || candidate.originCoords?.lng || currentLng + 0.005;

      // Condition: Within 2 KM (2000 meters)
      const proximityMeters = calculateDistanceMeters(currentLat, currentLng, candLat, candLng);

      if (proximityMeters <= 2000) {
        // Condition: Route Similarity > 80%
        const candDestLat = candidate.destinationCoords?.lat || destLat;
        const candDestLng = candidate.destinationCoords?.lng || destLng;

        const similarity = calculateRouteSimilarity(
          { lat: currentLat, lng: currentLng },
          { lat: destLat, lng: destLng },
          { lat: candLat, lng: candLng },
          { lat: candDestLat, lng: candDestLng }
        );

        if (similarity >= 80) {
          const candDistToDest = calculateDistanceMeters(candLat, candLng, destLat, destLng);
          const newETA = Math.max(5, Math.round((candDistToDest / 1000 / 45) * 60)); // Express speed ~45 km/h
          const timeSaved = currentETA - newETA;

          // Condition: ETA Better than Current Ride (New ETA < Current ETA)
          if (newETA < currentETA && timeSaved > 0) {
            bestCandidate = {
              candidateRide: candidate,
              currentETA,
              newETA,
              timeSaved,
              proximityMeters,
              routeSimilarity: similarity,
            };
            break; // Found suitable candidate
          }
        }
      }
    }

    // IF SUITABLE TAXI EXISTS
    if (bestCandidate) {
      const { candidateRide, currentETA: cETA, newETA: nETA, timeSaved: tSaved } = bestCandidate;

      const rideSwitchLog = await RideSwitch.create({
        rideId: currentRide._id,
        passengerId,
        currentTaxiId: currentRide.driverId || "current_driver",
        newTaxiId: candidateRide.driverId || "new_driver",
        currentETA: cETA,
        newETA: nETA,
        timeSaved: tSaved,
        status: "pending",
      });

      currentRide.dynamicSwitchSuggested = true;
      currentRide.switchDetails = {
        passengerId,
        passengerName,
        targetRideId: candidateRide._id.toString(),
        targetDriverId: candidateRide.driverId,
        targetTaxiDriverName: candidateRide.driverName,
        targetVehiclePlate: candidateRide.vehicleDetails?.plate || "RT-9900",
        etaSavedMinutes: tSaved,
        status: "pending",
      };
      await currentRide.save();

      if (io) {
        // Driver receives: "Passenger transfer requested. Proceed to designated transfer point."
        io.to(`ride_${currentRide._id}`).emit("driverNotification", {
          type: "TRANSFER_REQUESTED",
          message: "Passenger transfer requested. Proceed to designated transfer point.",
          passengerName,
          timestamp: new Date().toISOString(),
        });

        io.to(`ride_${currentRide._id}`).emit("switchSuggested", {
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
        });
      }

      return res.status(200).json({
        success: true,
        taxiAvailable: true,
        message: "A Better Ride Found",
        currentETA: cETA,
        newETA: nETA,
        timeSaved: tSaved,
        targetRide: {
          id: candidateRide._id,
          driverName: candidateRide.driverName,
          vehiclePlate: candidateRide.vehicleDetails?.plate,
        },
        switchId: rideSwitchLog._id,
      });
    }

    // IF NO TAXI IS AVAILABLE -> AUTOMATICALLY CONVERT TO PRIVATE RIDE
    currentRide.sharingEnabled = false;
    currentRide.rideType = "private";
    currentRide.lockedForNewPassengers = true;
    currentRide.seatsAvailable = 0; // Lock from accepting new passengers
    currentRide.dynamicSwitchSuggested = false;
    await currentRide.save();

    if (io) {
      io.to(`ride_${currentRide._id}`).emit("rideConvertedToPrivate", {
        rideId: currentRide._id.toString(),
        message: "No nearby RouteMate taxi is currently available. Your shared ride has now been converted into a Private Ride for your comfort.",
        timestamp: new Date().toISOString(),
      });

      io.to(`ride_${currentRide._id}`).emit("driverNotification", {
        type: "RIDE_CONVERTED_PRIVATE",
        message: "Shared ride converted to Private Ride. Route locked for current passenger only.",
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      success: true,
      taxiAvailable: false,
      convertedToPrivate: true,
      message: "No nearby RouteMate taxi is currently available.\nYour shared ride has now been converted into a Private Ride for your comfort.",
      ride: currentRide,
    });
  } catch (error) {
    console.error("Leave Shared Ride Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process leave shared ride request",
      error: error.message,
    });
  }
};

/**
 * FEATURE 4: Emergency SOS
 */
export const triggerSOS = async (req, res) => {
  try {
    const { id } = req.params;
    const passengerId = req.auth?.userId || req.body?.passengerId;
    const { location, emergencyContact } = req.body;

    const ride = await Ride.findById(id);
    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found" });
    }

    // SECURITY: Validate ride ownership
    const isPassengerInRide = ride.passengers?.some(
      (p) => p.userId === passengerId || String(p.userId) === String(passengerId)
    );

    if (!isPassengerInRide && ride.driverId !== passengerId) {
      return res.status(403).json({
        success: false,
        message: "Security Error: Only active passengers in this ride can trigger SOS.",
      });
    }

    // SECURITY: Prevent duplicate SOS requests (within 30 seconds)
    const existingSOS = await SOS.findOne({
      rideId: ride._id,
      passengerId,
      status: "active",
      createdAt: { $gte: new Date(Date.now() - 30000) },
    });

    if (existingSOS) {
      return res.status(200).json({
        success: true,
        message: "Emergency alert sent successfully.",
        sos: existingSOS,
        alreadyDispatched: true,
      });
    }

    const passenger = ride.passengers?.find(
      (p) => p.userId === passengerId || String(p.userId) === String(passengerId)
    );

    // Fetch driver phone if user model has it
    const driverUser = await User.findOne({ clerkId: ride.driverId });

    const sosPayload = {
      rideId: ride._id,
      passengerId: passengerId || "passenger_demo",
      passengerName: passenger?.name || "Passenger",
      driverId: ride.driverId || "driver_demo",
      driverDetails: {
        name: ride.driverName || "Driver",
        phone: driverUser?.phone || "+1 (555) 019-2834",
      },
      vehicleDetails: ride.vehicleDetails || {
        make: "Toyota",
        model: "Camry",
        plate: "RT-8842",
        color: "Silver",
      },
      location: location || {
        lat: ride.originCoords?.lat || 12.9716,
        lng: ride.originCoords?.lng || 77.5946,
        address: `${ride.origin} (En-route)`,
      },
      currentRoute: {
        origin: ride.origin,
        destination: ride.destination,
      },
      destination: ride.destination,
      emergencyContact: emergencyContact || {
        name: "Emergency Contact",
        phone: "+1 (555) 911-0000",
      },
      time: new Date(),
      status: "active",
    };

    const sosRecord = await SOS.create(sosPayload);

    const io = req.app.get("io");
    if (io) {
      // Broadcast emergency SOS event to Admin Dashboard, Support Team, Emergency Contact listeners
      io.emit("sosTriggered", {
        sos: sosRecord,
        rideId: ride._id.toString(),
        timestamp: new Date().toISOString(),
      });

      io.to(`ride_${ride._id}`).emit("driverNotification", {
        type: "SOS_ALERT",
        message: "EMERGENCY SOS DISPATCHED: RouteMate Support and Emergency Team notified.",
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(201).json({
      success: true,
      message: "Emergency alert sent successfully.",
      sos: sosRecord,
    });
  } catch (error) {
    console.error("Trigger SOS Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to dispatch SOS alert",
      error: error.message,
    });
  }
};

/**
 * ADMIN / SUPPORT: Get Discomfort Complaints
 */
export const getComplaints = async (req, res) => {
  try {
    const complaints = await RideComplaint.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: complaints.length, complaints });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error fetching complaints", error: error.message });
  }
};

/**
 * ADMIN / SUPPORT: Get SOS Alerts
 */
export const getSOSAlerts = async (req, res) => {
  try {
    const alerts = await SOS.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: alerts.length, alerts });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error fetching SOS alerts", error: error.message });
  }
};

/**
 * SMART RIDE EXIT & LIVE TAXI ALTERNATIVES: Get Live Nearby Candidate Taxis
 */
export const getLiveTaxiAlternatives = async (req, res) => {
  try {
    const { id } = req.params;
    const radiusKm = Number(req.query.radius) || 2.0;

    const currentRide = await Ride.findById(id);
    if (!currentRide) {
      return res.status(404).json({ success: false, message: "Ride not found" });
    }

    const currentDriverLoc = await LiveLocation.findOne({
      userId: currentRide.driverId,
      role: "Driver",
    }).sort({ updatedAt: -1 });

    const currentLat = currentDriverLoc?.latitude || currentRide.originCoords?.lat || 12.9716;
    const currentLng = currentDriverLoc?.longitude || currentRide.originCoords?.lng || 77.5946;
    const destLat = currentRide.destinationCoords?.lat || 12.9352;
    const destLng = currentRide.destinationCoords?.lng || 77.6245;

    const remainingDistMeters = calculateDistanceMeters(currentLat, currentLng, destLat, destLng);
    const currentETA = Math.max(12, Math.round((remainingDistMeters / 1000 / 25) * 60));

    // Find online active taxis
    const candidateRides = await Ride.find({
      _id: { $ne: currentRide._id },
      status: { $in: ["active", "scheduled"] },
      seatsAvailable: { $gte: 1 },
      sharingEnabled: { $ne: false },
    });

    const alternatives = [];

    for (const candidate of candidateRides) {
      const candLocation = await LiveLocation.findOne({
        userId: candidate.driverId,
        role: "Driver",
      }).sort({ updatedAt: -1 });

      const candLat = candLocation?.latitude || candidate.originCoords?.lat || currentLat + 0.004;
      const candLng = candLocation?.longitude || candidate.originCoords?.lng || currentLng + 0.004;

      const proximityMeters = calculateDistanceMeters(currentLat, currentLng, candLat, candLng);
      const distanceKm = Number((proximityMeters / 1000).toFixed(2));

      // Rule: Distance within configurable radius (default 2 km)
      if (distanceKm <= radiusKm) {
        const candDestLat = candidate.destinationCoords?.lat || destLat;
        const candDestLng = candidate.destinationCoords?.lng || destLng;

        const similarity = calculateRouteSimilarity(
          { lat: currentLat, lng: currentLng },
          { lat: destLat, lng: destLng },
          { lat: candLat, lng: candLng },
          { lat: candDestLat, lng: candDestLng }
        );

        // Rule: Route similarity >= 80%
        if (similarity >= 80) {
          const candDistToDest = calculateDistanceMeters(candLat, candLng, destLat, destLng);
          const newETA = Math.max(4, Math.round((candDistToDest / 1000 / 40) * 60));

          // Rule: Improves or maintains passenger's ETA
          if (newETA <= currentETA + 2) {
            alternatives.push({
              _id: candidate._id,
              driverId: candidate.driverId,
              driverName: candidate.driverName || "RouteMate Driver",
              driverRating: 4.8,
              taxiNumber: candidate.vehicleDetails?.plate || "RT-9942",
              vehicleDetails: candidate.vehicleDetails || { make: "Toyota", model: "Prius", color: "White" },
              distanceKm,
              etaMinutes: newETA,
              seatsAvailable: candidate.seatsAvailable,
              estimatedFare: Math.max(10, Math.round(candidate.pricePerSeat || 15)),
              routeMatchPercentage: similarity,
              origin: candidate.origin,
              destination: candidate.destination,
              originCoords: candidate.originCoords,
              destinationCoords: candidate.destinationCoords,
            });
          }
        }
      }
    }

    // Sort by best route match & proximity
    alternatives.sort((a, b) => b.routeMatchPercentage - a.routeMatchPercentage || a.distanceKm - b.distanceKm);

    return res.status(200).json({
      success: true,
      count: alternatives.length,
      currentETA,
      alternatives,
    });
  } catch (error) {
    console.error("Get Live Taxi Alternatives Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch live taxi alternatives",
      error: error.message,
    });
  }
};

/**
 * SMART RIDE EXIT: Switch to Selected Candidate Taxi
 */
export const switchToCandidateTaxi = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetRideId, passengerId } = req.body;
    const io = req.app.get("io");

    const currentRide = await Ride.findById(id);
    const targetRide = await Ride.findById(targetRideId);

    if (!currentRide || !targetRide) {
      return res.status(404).json({ success: false, message: "Current or Target ride not found" });
    }

    if (targetRide.seatsAvailable < 1) {
      return res.status(400).json({ success: false, message: "Target taxi has no available seats left." });
    }

    // Find passenger info
    const passenger = currentRide.passengers?.find(
      (p) => p.userId === passengerId || String(p.userId) === String(passengerId)
    ) || { userId: passengerId, name: "Passenger" };

    // Remove passenger from current ride
    currentRide.passengers = currentRide.passengers?.filter(
      (p) => p.userId !== passengerId && String(p.userId) !== String(passengerId)
    );
    currentRide.seatsAvailable = (currentRide.seatsAvailable || 0) + 1;
    currentRide.dynamicSwitchSuggested = false;
    await currentRide.save();

    // Add passenger to target ride
    if (!targetRide.passengers) targetRide.passengers = [];
    targetRide.passengers.push({
      userId: passenger.userId,
      name: passenger.name,
      pickup: currentRide.origin,
      dropoff: currentRide.destination,
      seatsBooked: 1,
      status: "accepted",
    });
    targetRide.seatsAvailable = Math.max(0, targetRide.seatsAvailable - 1);
    await targetRide.save();

    // Generate safe midpoint transfer point
    const transferPoint = {
      name: `Transfer Point at ${currentRide.origin} Junction`,
      lat: (currentRide.originCoords?.lat || 12.9716) + 0.002,
      lng: (currentRide.originCoords?.lng || 77.5946) + 0.002,
    };

    // Socket Notifications
    if (io) {
      // 1. Notify Current Driver
      io.to(`ride_${currentRide._id}`).emit("driverNotification", {
        type: "PASSENGER_TRANSFERRED_OUT",
        message: `Passenger ${passenger.name} has transferred to Taxi ${targetRide.vehicleDetails?.plate || ""}. Proceeding with remaining route.`,
        timestamp: new Date().toISOString(),
      });

      // 2. Notify New Driver
      io.to(`ride_${targetRide._id}`).emit("driverNotification", {
        type: "PASSENGER_TRANSFERRED_IN",
        message: `New passenger ${passenger.name} assigned to your taxi at ${transferPoint.name}.`,
        timestamp: new Date().toISOString(),
      });

      io.to(`ride_${currentRide._id}`).emit("switchAccepted", {
        sourceRideId: currentRide._id.toString(),
        targetRideId: targetRide._id.toString(),
        passengerId: passenger.userId,
        passengerName: passenger.name,
        transferPoint,
        message: `Taxi switch executed. Transferring ${passenger.name} to ${targetRide.driverName}'s vehicle.`,
      });

      io.to(`ride_${targetRide._id}`).emit("switchAccepted", {
        sourceRideId: currentRide._id.toString(),
        targetRideId: targetRide._id.toString(),
        passengerId: passenger.userId,
        passengerName: passenger.name,
        transferPoint,
        message: `New passenger ${passenger.name} transferring into your taxi.`,
      });

      io.to(`ride_${currentRide._id}`).emit("rideUpdated", { rideId: currentRide._id.toString(), ride: currentRide });
      io.to(`ride_${targetRide._id}`).emit("rideUpdated", { rideId: targetRide._id.toString(), ride: targetRide });
    }

    return res.status(200).json({
      success: true,
      message: `Successfully switched to ${targetRide.driverName}'s taxi!`,
      transferPoint,
      targetRide,
      currentRide,
    });
  } catch (error) {
    console.error("Switch to Candidate Taxi Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to switch to candidate taxi",
      error: error.message,
    });
  }
};

/**
 * SMART RIDE EXIT: Cancel Shared Ride
 */
export const cancelSharedRide = async (req, res) => {
  try {
    const { id } = req.params;
    const { passengerId, reason } = req.body;
    const io = req.app.get("io");

    const ride = await Ride.findById(id);
    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found" });
    }

    // Remove passenger
    const initialCount = ride.passengers?.length || 0;
    ride.passengers = ride.passengers?.filter(
      (p) => p.userId !== passengerId && String(p.userId) !== String(passengerId)
    );

    if (ride.passengers?.length < initialCount) {
      ride.seatsAvailable = (ride.seatsAvailable || 0) + 1;
    }

    if (ride.passengers?.length === 0) {
      ride.status = "cancelled";
    }

    await ride.save();

    if (io) {
      io.to(`ride_${ride._id}`).emit("passengerCancelledRide", {
        rideId: ride._id.toString(),
        passengerId,
        message: "Passenger has cancelled their shared ride portion.",
        timestamp: new Date().toISOString(),
      });

      io.to(`ride_${ride._id}`).emit("driverNotification", {
        type: "PASSENGER_CANCELLED",
        message: `Passenger cancelled ride portion (${reason || "User requested cancellation"}).`,
        timestamp: new Date().toISOString(),
      });

      io.to(`ride_${ride._id}`).emit("rideUpdated", { rideId: ride._id.toString(), ride });
    }

    return res.status(200).json({
      success: true,
      message: "Shared ride cancelled successfully.",
      ride,
    });
  } catch (error) {
    console.error("Cancel Shared Ride Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel shared ride",
      error: error.message,
    });
  }
};

