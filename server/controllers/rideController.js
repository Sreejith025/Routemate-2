import Ride from "../models/Ride.js";
import User from "../models/User.js";

/**
 * Get all available rides or search with filters from MongoDB Atlas
 */
export const getAvailableRides = async (req, res) => {
  try {
    const { origin, destination } = req.query;
    let query = { status: { $in: ["scheduled", "active"] } };

    if (origin) {
      query.origin = { $regex: origin, $options: "i" };
    }
    if (destination) {
      query.destination = { $regex: destination, $options: "i" };
    }

    const rides = await Ride.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: rides.length,
      rides,
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
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized. Please sign in." });
    }

    const { origin, destination, originCoords, destinationCoords, departureTime, seatsAvailable, pricePerSeat, vehicleDetails } = req.body;
    
    // Fetch driver details from MongoDB
    const mongoUser = await User.findOne({ clerkId: userId });
    const driverName = mongoUser?.fullName || "Verified Driver";

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
    const { seats = 1, pickup, dropoff } = req.body;
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized. Please sign in." });
    }

    const mongoUser = await User.findOne({ clerkId: userId });
    const passengerName = mongoUser?.fullName || "RouteMate Passenger";

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
    const { passengerName, reason, etaSavedMinutes, targetTaxiDriverName, targetVehiclePlate } = req.body;

    const ride = await Ride.findById(id);
    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found in database" });
    }

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
 * Respond to Dynamic Taxi Switch (Accept / Decline) in MongoDB
 */
export const respondToSwitch = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // "accept" or "decline"

    const ride = await Ride.findById(id);
    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found in database" });
    }

    if (ride.switchDetails) {
      ride.switchDetails.status = action === "accept" ? "accepted" : "declined";
      if (action === "accept") {
        ride.dynamicSwitchSuggested = false;
      }
    }

    await ride.save();

    return res.status(200).json({
      success: true,
      message: action === "accept" ? "Taxi switch accepted! Updated in database." : "Taxi switch declined.",
      ride,
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
