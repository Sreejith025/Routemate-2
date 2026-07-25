import Ride from "../models/Ride.js";
import LiveLocation from "../models/LiveLocation.js";

// Helper: Haversine distance in km
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * FEATURE 1: Detect Eligible Active Shared Ride
 * Configurable radius (default 2 km) & >= 80% route similarity
 */
export const detectEligibleSharedRides = async (pickupCoords, dropoffCoords, maxRadiusKm = 2.0) => {
  try {
    const pLat = Number(pickupCoords?.lat || 12.9716);
    const pLng = Number(pickupCoords?.lng || 77.5946);
    const dLat = Number(dropoffCoords?.lat || 12.9352);
    const dLng = Number(dropoffCoords?.lng || 77.6245);

    // Fetch active shared rides with at least 1 available seat
    const activeRides = await Ride.find({
      status: { $in: ["active", "scheduled"] },
      rideType: "shared",
      seatsAvailable: { $gte: 1 },
    });

    const eligibleRides = [];

    for (const ride of activeRides) {
      // 1. Get driver live position or origin coords
      const driverLoc = await LiveLocation.findOne({ userId: ride.driverId, role: "Driver" })
        .sort({ updatedAt: -1 });

      const currentLat = driverLoc?.latitude || ride.originCoords?.lat || 12.9716;
      const currentLng = driverLoc?.longitude || ride.originCoords?.lng || 77.5946;

      // 2. Pickup distance check (Must be within configurable radius default 2 km)
      const pickupDistKm = calculateDistanceKm(currentLat, currentLng, pLat, pLng);

      // 3. Destination Route Similarity check (Must be >= 80%)
      const destDistKm = calculateDistanceKm(
        ride.destinationCoords?.lat || 12.9352,
        ride.destinationCoords?.lng || 77.6245,
        dLat,
        dLng
      );

      const totalDist = calculateDistanceKm(pLat, pLng, dLat, dLng);
      // Similarity percentage: inverse ratio of deviation distance to total trip distance
      const similarityPercent = Math.min(
        99,
        Math.max(60, Math.round(100 - (destDistKm / (totalDist || 1)) * 30))
      );

      if (pickupDistKm <= maxRadiusKm && similarityPercent >= 80) {
        eligibleRides.push({
          rideId: ride._id.toString(),
          ride,
          driverName: ride.driverName,
          vehicleDetails: ride.vehicleDetails,
          pickupDistanceKm: Number(pickupDistKm.toFixed(2)),
          routeSimilarity: similarityPercent,
          seatsAvailable: ride.seatsAvailable,
          estimatedFareSavings: 75, // ₹75 average savings
        });
      }
    }

    return eligibleRides.sort((a, b) => b.routeSimilarity - a.routeSimilarity);
  } catch (err) {
    console.error("Error detecting eligible shared rides:", err);
    return [];
  }
};

/**
 * FEATURE 3 & 8: Join Second Passenger & Distance-Proportional Fare Calculation
 */
export const joinSecondPassengerToRide = async (io, rideId, passengerData) => {
  try {
    const ride = await Ride.findById(rideId);
    if (!ride) throw new Error("Shared ride not found");

    if (ride.seatsAvailable < 1) {
      throw new Error("No available seats on this shared ride");
    }

    const {
      userId,
      name,
      pickup,
      dropoff,
      pickupCoords,
      dropoffCoords,
      seatsBooked = 1,
    } = passengerData;

    // Calculate individual distances
    const p2PickupLat = Number(pickupCoords?.lat || 12.9716);
    const p2PickupLng = Number(pickupCoords?.lng || 77.5946);
    const p2DropLat = Number(dropoffCoords?.lat || 12.9352);
    const p2DropLng = Number(dropoffCoords?.lng || 77.6245);

    const p2DistanceKm = Number(
      calculateDistanceKm(p2PickupLat, p2PickupLng, p2DropLat, p2DropLng).toFixed(1)
    );

    // Existing Passenger 1 distance
    const p1 = ride.passengers[0] || {};
    const p1DistanceKm = p1.distanceKm || 10;

    // FEATURE 8: Distance-based proportional fare calculation
    // Base rate ₹15 per km, combined total fare discount 20%
    const totalKm = p1DistanceKm + p2DistanceKm;
    const baseTotalFare = totalKm * 18; // Base rate
    const sharedFareTotal = Math.round(baseTotalFare * 0.8); // 20% discount for shared commute

    // Proportional division: farther passenger pays proportionally more
    const p1Fare = Math.round((p1DistanceKm / totalKm) * sharedFareTotal);
    const p2Fare = Math.max(80, sharedFareTotal - p1Fare);

    const p1PrivateFare = Math.round(p1DistanceKm * 22);
    const p2PrivateFare = Math.round(p2DistanceKm * 22);

    const p1Savings = Math.max(30, p1PrivateFare - p1Fare);
    const p2Savings = Math.max(30, p2PrivateFare - p2Fare);

    // Update Passenger 1 fare details
    if (ride.passengers[0]) {
      ride.passengers[0].distanceKm = p1DistanceKm;
      ride.passengers[0].fare = p1Fare;
      ride.passengers[0].originalPrivateFare = p1PrivateFare;
      ride.passengers[0].savings = p1Savings;
    }

    // Add Passenger 2 to Ride
    const newPassenger = {
      userId,
      name: name || "Passenger 2",
      pickup: pickup || "Passenger 2 Pickup",
      dropoff: dropoff || "Passenger 2 Destination",
      pickupCoords: { lat: p2PickupLat, lng: p2PickupLng },
      dropoffCoords: { lat: p2DropLat, lng: p2DropLng },
      seatsBooked: Number(seatsBooked) || 1,
      distanceKm: p2DistanceKm,
      fare: p2Fare,
      originalPrivateFare: p2PrivateFare,
      savings: p2Savings,
      status: "accepted",
    };

    ride.passengers.push(newPassenger);
    ride.seatsAvailable = Math.max(0, ride.seatsAvailable - Number(seatsBooked));
    ride.sharedFareTotal = sharedFareTotal;

    // FEATURE 4: Multi-Stop Timeline & Sequences
    ride.pickupSequence = [
      { passengerId: p1.userId || "p1", name: p1.name || "Passenger 1", pickupName: p1.pickup, lat: ride.originCoords?.lat, lng: ride.originCoords?.lng },
      { passengerId: userId, name: newPassenger.name, pickupName: newPassenger.pickup, lat: p2PickupLat, lng: p2PickupLng },
    ];

    ride.dropSequence = [
      { passengerId: p1.userId || "p1", name: p1.name || "Passenger 1", dropoffName: p1.dropoff, lat: ride.destinationCoords?.lat, lng: ride.destinationCoords?.lng },
      { passengerId: userId, name: newPassenger.name, dropoffName: newPassenger.dropoff, lat: p2DropLat, lng: p2DropLng },
    ];

    if (!ride.timeline) ride.timeline = [];
    ride.timeline.push({
      stage: "Additional Passenger Joined",
      timestamp: new Date(),
      completed: true,
    });
    ride.currentStage = "Additional Passenger Joined";

    await ride.save();

    // FEATURE 5 & 11: Real-time Socket.IO broadcasts
    if (io) {
      const roomName = `ride_${ride._id.toString()}`;

      // Emit to Passenger 1: "A second passenger has joined your shared ride."
      io.to(roomName).emit("second-passenger-confirmed", {
        message: "A second passenger has joined your shared ride.",
        rideId: ride._id.toString(),
        passengers: ride.passengers,
        sharedFareTotal,
        p1Fare,
        p1Savings,
        p2Fare,
        p2Savings,
        timestamp: new Date().toISOString(),
      });

      io.to(roomName).emit("route-updated", {
        rideId: ride._id.toString(),
        passengers: ride.passengers,
        pickupSequence: ride.pickupSequence,
        dropSequence: ride.dropSequence,
      });

      io.to(roomName).emit("fare-updated", {
        rideId: ride._id.toString(),
        sharedFareTotal,
        passengers: ride.passengers,
      });

      io.to(roomName).emit("ride-updated", ride);
    }

    return {
      success: true,
      message: "Second passenger joined shared ride successfully",
      ride,
      p1Fare,
      p2Fare,
      p1Savings,
      p2Savings,
    };
  } catch (err) {
    console.error("Error joining second passenger to ride:", err);
    throw err;
  }
};
