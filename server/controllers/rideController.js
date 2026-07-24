import Ride from "../models/Ride.js";

// Mock initial rides for fallback or initial seeding
const MOCK_RIDES = [
  {
    driverName: "Alex Rivera",
    vehicleDetails: { make: "Tesla", model: "Model 3", plate: "EV-9901", color: "White" },
    origin: "Downtown Tech Hub",
    destination: "Airport Terminal 2",
    originCoords: { lat: 12.9716, lng: 77.5946 },
    destinationCoords: { lat: 13.1986, lng: 77.7066 },
    seatsAvailable: 2,
    pricePerSeat: 18,
    status: "active",
    departureTime: "In 10 mins",
    dynamicSwitchSuggested: true,
    switchDetails: {
      passengerName: "Sarah Connor",
      reason: "Traffic jam on Expressway ahead (+18m delay)",
      etaSavedMinutes: 14,
      targetTaxiDriverName: "Marcus Vance",
      targetVehiclePlate: "TX-4042",
      status: "pending",
    },
  },
  {
    driverName: "Elena Rostova",
    vehicleDetails: { make: "Toyota", model: "Camry Hybrid", plate: "HY-3321", color: "Black" },
    origin: "Central Plaza Station",
    destination: "Innovation University Campus",
    originCoords: { lat: 12.925, lng: 77.585 },
    destinationCoords: { lat: 12.985, lng: 77.645 },
    seatsAvailable: 3,
    pricePerSeat: 12,
    status: "scheduled",
    departureTime: "In 25 mins",
  },
  {
    driverName: "David Chen",
    vehicleDetails: { make: "Honda", model: "Civic", plate: "HC-7712", color: "Blue" },
    origin: "Metro Business Park",
    destination: "Westside Waterfront Mall",
    originCoords: { lat: 12.95, lng: 77.56 },
    destinationCoords: { lat: 12.91, lng: 77.6 },
    seatsAvailable: 1,
    pricePerSeat: 15,
    status: "active",
    departureTime: "Immediate",
  },
];

/**
 * Get all available rides or search with filters
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

    let rides = await Ride.find(query).sort({ createdAt: -1 });

    // Seed mock data if empty database
    if (rides.length === 0) {
      await Ride.insertMany(MOCK_RIDES);
      rides = await Ride.find(query).sort({ createdAt: -1 });
    }

    return res.status(200).json({
      success: true,
      count: rides.length,
      rides,
    });
  } catch (error) {
    console.error("Get Available Rides Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch rides",
      error: error.message,
    });
  }
};

/**
 * Get single ride details by ID
 */
export const getRideById = async (req, res) => {
  try {
    const { id } = req.params;
    const ride = await Ride.findById(id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    return res.status(200).json({
      success: true,
      ride,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching ride details",
      error: error.message,
    });
  }
};

/**
 * Create a new ride offer (Driver)
 */
export const createRide = async (req, res) => {
  try {
    const { origin, destination, originCoords, destinationCoords, departureTime, seatsAvailable, pricePerSeat, vehicleDetails } = req.body;
    const userId = req.auth?.userId || "driver_mock_id";
    const driverName = req.mongoUser?.fullName || "Verified Driver";

    const newRide = await Ride.create({
      driverId: userId,
      driverName,
      vehicleDetails: vehicleDetails || { make: "Toyota", model: "Corolla", plate: "RT-1002", color: "Dark Gray" },
      origin,
      destination,
      originCoords: originCoords || { lat: 12.9716, lng: 77.5946 },
      destinationCoords: destinationCoords || { lat: 12.9352, lng: 77.6245 },
      departureTime: departureTime || "Immediate",
      seatsAvailable: seatsAvailable || 3,
      pricePerSeat: pricePerSeat || 15,
      status: "scheduled",
    });

    return res.status(201).json({
      success: true,
      message: "Ride created successfully",
      ride: newRide,
    });
  } catch (error) {
    console.error("Create Ride Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create ride",
      error: error.message,
    });
  }
};

/**
 * Book / Join a ride (Passenger)
 */
export const bookRide = async (req, res) => {
  try {
    const { id } = req.params;
    const { seats = 1, pickup, dropoff } = req.body;
    const userId = req.auth?.userId || "passenger_mock_id";
    const passengerName = req.mongoUser?.fullName || "RouteMate Passenger";

    const ride = await Ride.findById(id);

    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found" });
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
      message: "Ride booked successfully! Seat confirmed.",
      ride,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error booking ride",
      error: error.message,
    });
  }
};

/**
 * Trigger Dynamic Taxi Switch Recommendation
 */
export const triggerDynamicSwitch = async (req, res) => {
  try {
    const { id } = req.params;
    const { passengerName, reason, etaSavedMinutes, targetTaxiDriverName, targetVehiclePlate } = req.body;

    const ride = await Ride.findById(id);
    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found" });
    }

    ride.dynamicSwitchSuggested = true;
    ride.switchDetails = {
      passengerName: passengerName || "Sarah Connor",
      reason: reason || "Heavy congestion on Express Hwy (+15m delay)",
      etaSavedMinutes: etaSavedMinutes || 12,
      targetTaxiDriverName: targetTaxiDriverName || "Marcus Vance",
      targetVehiclePlate: targetVehiclePlate || "TX-4042",
      status: "pending",
    };

    await ride.save();

    return res.status(200).json({
      success: true,
      message: "Dynamic Taxi Switch recommendation triggered!",
      ride,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to trigger taxi switch",
      error: error.message,
    });
  }
};

/**
 * Respond to Dynamic Taxi Switch (Accept / Decline)
 */
export const respondToSwitch = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // "accept" or "decline"

    const ride = await Ride.findById(id);
    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found" });
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
      message: action === "accept" ? "Taxi switch accepted! Rerouting passenger..." : "Taxi switch declined.",
      ride,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error responding to taxi switch",
      error: error.message,
    });
  }
};

/**
 * Get user ride history (driver or passenger)
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
      message: "Error fetching user history",
      error: error.message,
    });
  }
};
