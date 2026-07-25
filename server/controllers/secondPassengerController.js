import {
  detectEligibleSharedRides,
  joinSecondPassengerToRide,
} from "../services/secondPassengerService.js";

/**
 * FEATURE 1 & 16: GET /api/shared-rides/eligible
 * Detect eligible active shared rides within 2 km radius & >= 80% route similarity
 */
export const getEligibleSharedRides = async (req, res) => {
  try {
    const { pickupLat, pickupLng, dropoffLat, dropoffLng, radius } = req.query;
    const maxRadiusKm = radius ? parseFloat(radius) : 2.0;

    const pickupCoords = {
      lat: pickupLat ? parseFloat(pickupLat) : 12.9716,
      lng: pickupLng ? parseFloat(pickupLng) : 77.5946,
    };
    const dropoffCoords = {
      lat: dropoffLat ? parseFloat(dropoffLat) : 12.9352,
      lng: dropoffLng ? parseFloat(dropoffLng) : 77.6245,
    };

    const eligibleRides = await detectEligibleSharedRides(pickupCoords, dropoffCoords, maxRadiusKm);

    return res.status(200).json({
      success: true,
      count: eligibleRides.length,
      maxRadiusKm,
      eligibleRides,
    });
  } catch (error) {
    console.error("Error getting eligible shared rides:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to detect eligible shared rides",
      error: error.message,
    });
  }
};

/**
 * FEATURE 2, 5 & 8: POST /api/shared-rides/:rideId/join-second
 * Join second passenger to active shared ride, update fares, route & emit socket events
 */
export const joinSecondPassenger = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { userId: bodyUserId, name, pickup, dropoff, pickupCoords, dropoffCoords, seatsBooked } = req.body;
    const userId = req.auth?.userId || bodyUserId || "passenger_2_demo";

    const io = req.app.get("io");

    const result = await joinSecondPassengerToRide(io, rideId, {
      userId,
      name: name || "Passenger 2",
      pickup: pickup || "Passenger 2 Pickup",
      dropoff: dropoff || "Passenger 2 Destination",
      pickupCoords: pickupCoords || { lat: 12.9716, lng: 77.5946 },
      dropoffCoords: dropoffCoords || { lat: 12.9352, lng: 77.6245 },
      seatsBooked: Number(seatsBooked) || 1,
    });

    return res.status(200).json({
      success: true,
      message: "Successfully joined shared ride as Passenger 2!",
      ride: result.ride,
      fareDetails: {
        p1Fare: result.p1Fare,
        p2Fare: result.p2Fare,
        p1Savings: result.p1Savings,
        p2Savings: result.p2Savings,
      },
    });
  } catch (error) {
    console.error("Error joining second passenger:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to join shared ride",
      error: error.message,
    });
  }
};
