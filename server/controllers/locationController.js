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

/**
 * GET /api/location/nearby-drivers
 * Returns all active real driver locations for map display
 */
export const getNearbyDrivers = async (req, res) => {
  try {
    const liveLocations = await LiveLocation.find({ role: "Driver" })
      .sort({ updatedAt: -1 })
      .limit(50);

    const activeRides = await Ride.find({
      status: { $in: ["active", "scheduled"] },
    }).limit(50);

    const driversMap = new Map();

    for (const loc of liveLocations) {
      if (loc.latitude && loc.longitude) {
        driversMap.set(loc.userId, {
          driverId: loc.userId,
          name: "RouteMate Driver",
          lat: loc.latitude,
          lng: loc.longitude,
          vehicle: "RouteMate Taxi",
          rating: 4.8,
          updatedAt: loc.updatedAt,
        });
      }
    }

    for (const r of activeRides) {
      if (r.driverId && r.originCoords?.lat && r.originCoords?.lng) {
        const existing = driversMap.get(r.driverId);
        driversMap.set(r.driverId, {
          driverId: r.driverId,
          name: r.driverName || existing?.name || "RouteMate Driver",
          lat: existing?.lat || r.originCoords.lat,
          lng: existing?.lng || r.originCoords.lng,
          vehicle: r.vehicleDetails ? `${r.vehicleDetails.make} ${r.vehicleDetails.model} (${r.vehicleDetails.plate})` : "RouteMate Taxi",
          rating: r.driverRating || 4.8,
          updatedAt: new Date(),
        });
      }
    }

    const drivers = Array.from(driversMap.values());

    return res.status(200).json({
      success: true,
      count: drivers.length,
      drivers,
    });
  } catch (error) {
    console.error("Error fetching nearby drivers:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch nearby drivers",
      error: error.message,
    });
  }
};

