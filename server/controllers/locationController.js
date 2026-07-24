import LiveLocation from "../models/LiveLocation.js";
import Ride from "../models/Ride.js";

/**
 * Helper to check if a user is participating in a ride
 */
const isUserInRide = (ride, userId) => {
  if (!ride || !userId) return false;
  const isDriver = ride.driverId === userId || String(ride.driverId) === String(userId);
  const isPassenger = ride.passengers?.some(
    (p) => p.userId === userId || String(p.userId) === String(userId)
  );
  return isDriver || isPassenger;
};

/**
 * POST /api/location/update
 * Body: { rideId, role, latitude, longitude, speed, heading, accuracy }
 */
export const updateLocation = async (req, res) => {
  try {
    const { rideId, role, latitude, longitude, speed, heading, accuracy } = req.body;
    const userId = req.mongoUser?.clerkId || req.mongoUser?._id?.toString();

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized user." });
    }

    if (!rideId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: rideId, latitude, longitude.",
      });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found." });
    }

    // Security check: validate user ride participation
    if (!isUserInRide(ride, userId) && req.mongoUser?.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not a participant in this ride.",
      });
    }

    const userRole = role || (ride.driverId === userId ? "Driver" : "Passenger");

    const locationDoc = await LiveLocation.findOneAndUpdate(
      { rideId, userId },
      {
        userId,
        rideId,
        role: userRole,
        latitude,
        longitude,
        speed: speed || 0,
        heading: heading || 0,
        accuracy: accuracy || 0,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Live location updated successfully.",
      location: locationDoc,
    });
  } catch (error) {
    console.error("Error updating location:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update location.",
      error: error.message,
    });
  }
};

/**
 * GET /api/location/:rideId
 * Returns latest locations for driver and passengers in the specified ride
 */
export const getRideLocations = async (req, res) => {
  try {
    const { rideId } = req.params;
    const userId = req.mongoUser?.clerkId || req.mongoUser?._id?.toString();

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found." });
    }

    // Security check: user must be driver, passenger, or admin
    if (!isUserInRide(ride, userId) && req.mongoUser?.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Access restricted to ride participants.",
      });
    }

    const locations = await LiveLocation.find({ rideId });
    const driverLocation = locations.find((l) => l.role === "Driver") || null;
    const passengerLocations = locations.filter((l) => l.role === "Passenger");

    return res.status(200).json({
      success: true,
      rideId,
      driverLocation,
      passengerLocations,
      locations,
    });
  } catch (error) {
    console.error("Error fetching ride locations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch ride locations.",
      error: error.message,
    });
  }
};

/**
 * GET /api/location/driver/:driverId
 * Returns latest location for a specific driver
 */
export const getDriverLocation = async (req, res) => {
  try {
    const { driverId } = req.params;

    const locationDoc = await LiveLocation.findOne({ userId: driverId, role: "Driver" })
      .sort({ updatedAt: -1 });

    if (!locationDoc) {
      return res.status(404).json({
        success: false,
        message: "Driver live location not available.",
      });
    }

    return res.status(200).json({
      success: true,
      driverId,
      location: locationDoc,
    });
  } catch (error) {
    console.error("Error fetching driver location:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch driver location.",
      error: error.message,
    });
  }
};
