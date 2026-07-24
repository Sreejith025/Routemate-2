import Ride from "../models/Ride.js";
import User from "../models/User.js";
import {
  evaluateAndTriggerTaxiSwitch,
  processTaxiSwitchResponse,
  requestLeaveSharedRide,
} from "../services/switchService.js";

// Helper to calculate distance in kilometers using Haversine formula
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
 * Get all available rides or search with filters/coordinates from MongoDB Atlas
 */
export const getAvailableRides = async (req, res) => {
  try {
    const { origin, destination, originLat, originLng, destLat, destLng, radius } = req.query;
    const searchRadiusKm = parseFloat(radius) || 10; // Default 10km configurable radius

    const searchOriginLat = originLat ? parseFloat(originLat) : null;
    const searchOriginLng = originLng ? parseFloat(originLng) : null;
    const searchDestLat = destLat ? parseFloat(destLat) : null;
    const searchDestLng = destLng ? parseFloat(destLng) : null;

    // Fetch all active or scheduled rides
    const allRides = await Ride.find({ status: { $in: ["scheduled", "active"] } }).sort({ createdAt: -1 });

    let filteredRides = allRides;

    // 1. Text Regex Filter if text is provided
    if (origin || destination) {
      filteredRides = allRides.filter((ride) => {
        let matchOrigin = true;
        let matchDest = true;

        if (origin) {
          matchOrigin = ride.origin.toLowerCase().includes(origin.toLowerCase());
        }
        if (destination) {
          matchDest = ride.destination.toLowerCase().includes(destination.toLowerCase());
        }

        return matchOrigin && matchDest;
      });
    }

    // 2. Geographic Radius Filter if text match was empty OR if coordinates were explicitly passed
    const hasOriginCoords = searchOriginLat !== null && searchOriginLng !== null;
    const hasDestCoords = searchDestLat !== null && searchDestLng !== null;

    if ((filteredRides.length === 0 || hasOriginCoords || hasDestCoords) && (hasOriginCoords || hasDestCoords)) {
      const radiusMatches = allRides.filter((ride) => {
        let originDist = Infinity;
        let destDist = Infinity;

        if (hasOriginCoords && ride.originCoords?.lat && ride.originCoords?.lng) {
          originDist = calculateDistanceKm(
            searchOriginLat,
            searchOriginLng,
            ride.originCoords.lat,
            ride.originCoords.lng
          );
        }

        if (hasDestCoords && ride.destinationCoords?.lat && ride.destinationCoords?.lng) {
          destDist = calculateDistanceKm(
            searchDestLat,
            searchDestLng,
            ride.destinationCoords.lat,
            ride.destinationCoords.lng
          );
        }

        const matchOriginRadius = !hasOriginCoords || originDist <= searchRadiusKm;
        const matchDestRadius = !hasDestCoords || destDist <= searchRadiusKm;

        return matchOriginRadius && matchDestRadius;
      });

      // If radius matches found, use radius matches
      if (radiusMatches.length > 0) {
        filteredRides = radiusMatches;
      }
    }

    // Attach proximity metadata to returned ride objects
    const resultRides = filteredRides.map((ride) => {
      const rideObj = ride.toObject();
      if (hasOriginCoords && ride.originCoords?.lat && ride.originCoords?.lng) {
        const originDist = calculateDistanceKm(
          searchOriginLat,
          searchOriginLng,
          ride.originCoords.lat,
          ride.originCoords.lng
        );
        rideObj.distanceFromOriginKm = parseFloat(originDist.toFixed(1));
      }
      if (hasDestCoords && ride.destinationCoords?.lat && ride.destinationCoords?.lng) {
        const destDist = calculateDistanceKm(
          searchDestLat,
          searchDestLng,
          ride.destinationCoords.lat,
          ride.destinationCoords.lng
        );
        rideObj.distanceFromDestKm = parseFloat(destDist.toFixed(1));
      }
      return rideObj;
    });

    return res.status(200).json({
      success: true,
      count: resultRides.length,
      rides: resultRides,
    });
  } catch (error) {
    console.error("Get Available Rides Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch rides from database",
      error: error.message,
    });
  }
};

/**
 * Get single ride details by ID from MongoDB Atlas
 */
export const getRideById = async (req, res) => {
  try {
    const { id } = req.params;
    const ride = await Ride.findById(id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found in database",
      });
    }

    return res.status(200).json({
      success: true,
      ride,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching ride details from database",
      error: error.message,
    });
  }
};

/**
 * Create a new ride offer in MongoDB (Driver)
 */
export const createRide = async (req, res) => {
  try {
    const userId = req.auth?.userId || req.body?.driverId || "driver_demo_id";
    const { origin, destination, originCoords, destinationCoords, departureTime, seatsAvailable, pricePerSeat, vehicleDetails, driverName: bodyDriverName } = req.body;
    
    // Fetch driver details from MongoDB
    const mongoUser = userId ? await User.findOne({ clerkId: userId }) : null;
    const driverName = bodyDriverName || mongoUser?.fullName || "Verified Driver";

    const newRide = await Ride.create({
      driverId: userId,
      driverName,
      vehicleDetails: vehicleDetails || {
        make: "Toyota",
        model: "Camry",
        plate: "RT-1002",
        color: "Dark Gray",
      },
      origin,
      destination,
      originCoords: originCoords || { lat: 12.9716, lng: 77.5946 },
      destinationCoords: destinationCoords || { lat: 12.9352, lng: 77.6245 },
      departureTime: departureTime || "Immediate",
      seatsAvailable: Number(seatsAvailable) || 3,
      pricePerSeat: Number(pricePerSeat) || 15,
      status: "scheduled",
    });

    return res.status(201).json({
      success: true,
      message: "Ride offer published successfully to database",
      ride: newRide,
    });
  } catch (error) {
    console.error("Create Ride Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create ride in database",
      error: error.message,
    });
  }
};

/**
 * Book / Join a ride in MongoDB (Passenger)
 */
export const bookRide = async (req, res) => {
  try {
    const { id } = req.params;
    const { seats = 1, pickup, dropoff, passengerName: bodyPassengerName, userId: bodyUserId } = req.body;
    const userId = req.auth?.userId || bodyUserId || "passenger_demo_id";

    const mongoUser = userId ? await User.findOne({ clerkId: userId }) : null;
    const passengerName = bodyPassengerName || mongoUser?.fullName || "RouteMate Passenger";

    const ride = await Ride.findById(id);

    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found in database" });
    }

    if (ride.seatsAvailable < seats) {
      return res.status(400).json({ success: false, message: "Not enough seats available" });
    }

    ride.seatsAvailable -= seats;
    ride.passengers.push({
      userId,
      name: passengerName,
      pickup: pickup || ride.origin,
      dropoff: dropoff || ride.destination,
      seatsBooked: seats,
    });

    if (ride.status === "scheduled") {
      ride.status = "active";
    }

    await ride.save();

    return res.status(200).json({
      success: true,
      message: "Ride booked successfully in database! Seat confirmed.",
      ride,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error booking ride in database",
      error: error.message,
    });
  }
};

/**
 * Trigger Dynamic Taxi Switch Recommendation in MongoDB
 */
export const triggerDynamicSwitch = async (req, res) => {
  try {
    const { id } = req.params;
    const { passengerName, reason, etaSavedMinutes, targetTaxiDriverName, targetVehiclePlate, latitude, longitude, speed } = req.body;

    // Evaluate dynamic switch using intelligent algorithm or manual parameters
    const evaluated = await evaluateAndTriggerTaxiSwitch(null, id, null, latitude || 12.9716, longitude || 77.5946, speed || 10);

    const ride = await Ride.findById(id);
    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found in database" });
    }

    if (!evaluated) {
      ride.dynamicSwitchSuggested = true;
      ride.switchDetails = {
        passengerName: passengerName || "Passenger",
        reason: reason || "Heavy traffic congestion detected on expressway",
        etaSavedMinutes: etaSavedMinutes || 12,
        targetTaxiDriverName: targetTaxiDriverName || "Nearby RouteMate Taxi",
        targetVehiclePlate: targetVehiclePlate || "TX-4042",
        status: "pending",
      };
      await ride.save();
    }

    return res.status(200).json({
      success: true,
      message: "Dynamic Taxi Switch recommendation updated in database!",
      ride,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to trigger taxi switch in database",
      error: error.message,
    });
  }
};

/**
 * Respond to Dynamic Taxi Switch (Accept / Decline) in MongoDB & Update Routes
 */
export const respondToSwitch = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // "accept" or "decline"

    const result = await processTaxiSwitchResponse(null, id, action);

    return res.status(200).json({
      success: true,
      message: action === "accept" ? "Taxi switch accepted! Both driver routes updated." : "Taxi switch declined.",
      ride: result.sourceRide || result.targetRide,
      result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error responding to taxi switch in database",
      error: error.message,
    });
  }
};

/**
 * Get user ride history (driver or passenger) from MongoDB Atlas
 */
export const getUserRideHistory = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    let query = {};
    if (userId) {
      query = {
        $or: [{ driverId: userId }, { "passengers.userId": userId }],
      };
    }

    const history = await Ride.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching ride history from database",
      error: error.message,
    });
  }
};

/**
 * Passenger requests to Leave Shared Ride and search nearby candidate taxis
 */
export const leaveSharedRide = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth?.userId || req.body?.passengerId || "passenger_demo_id";
    const io = req.app.get("io");

    const result = await requestLeaveSharedRide(io, id, userId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.reason || "Unable to process leave shared ride request",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Searched nearby candidate taxis for ride transfer",
      switchData: result.switchData,
      switchLog: result.switchLog,
    });
  } catch (error) {
    console.error("Leave Shared Ride Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error processing leave shared ride request",
      error: error.message,
    });
  }
};
