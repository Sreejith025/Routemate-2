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
    const authObj = typeof req.auth === "function" ? req.auth() : req.auth;
    const rawUserId = authObj?.userId || req.body?.driverId || req.mongoUser?.clerkId || "driver_demo_id";
    const userId = typeof rawUserId === "string" ? rawUserId : "driver_demo_id";

    const {
      origin,
      destination,
      originCoords,
      destinationCoords,
      departureTime,
      seatsAvailable,
      pricePerSeat,
      vehicleDetails,
      driverName: bodyDriverName,
      driverPhoto,
    } = req.body;

    const finalOrigin = (origin && String(origin).trim()) || "Departure Location";
    const finalDestination = (destination && String(destination).trim()) || "Destination Target";

    // Fetch driver details from MongoDB User collection
    let mongoUser = null;
    if (userId && userId !== "driver_demo_id") {
      try {
        mongoUser = await User.findOne({ clerkId: userId });
      } catch (err) {
        console.warn("User lookup in createRide warning:", err.message);
      }
    }

    const driverName = bodyDriverName || mongoUser?.fullName || "Verified Driver";
    const photo =
      driverPhoto ||
      mongoUser?.profileImage ||
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80";

    const pPrice = Number(pricePerSeat) || 15;
    const seats = Number(seatsAvailable) || 3;
    const dropPin = Math.floor(1000 + Math.random() * 9000).toString();

    const newRide = await Ride.create({
      driverId: userId,
      driverName,
      driverPhoto: photo,
      vehicleDetails: vehicleDetails || {
        make: "Toyota",
        model: "Camry",
        plate: "RT-1002",
        color: "Dark Gray",
      },
      origin: finalOrigin,
      destination: finalDestination,
      originCoords: {
        lat: Number(originCoords?.lat) || 12.9716,
        lng: Number(originCoords?.lng) || 77.5946,
      },
      destinationCoords: {
        lat: Number(destinationCoords?.lat) || 12.9352,
        lng: Number(destinationCoords?.lng) || 77.6245,
      },
      departureTime: departureTime || "Immediate",
      seatsAvailable: seats,
      pricePerSeat: pPrice,
      lockedFare: pPrice,
      dropPin,
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
      message: error.message || "Failed to create ride in database",
      error: error.message,
    });
  }
};

/**
 * Book / Join a ride in MongoDB (Passenger Manual Driver Confirmation Flow)
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

    // Check if user already has a pending or accepted booking request
    const existingReq = ride.bookingRequests?.find(
      (r) => (r.userId === userId || String(r.userId) === String(userId)) && r.status === "pending"
    );

    if (existingReq) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending booking request for this ride. Please wait for driver confirmation.",
      });
    }

    const newRequest = {
      userId,
      name: passengerName,
      pickup: pickup || ride.origin,
      dropoff: dropoff || ride.destination,
      seatsBooked: Number(seats) || 1,
      status: "pending",
      requestedAt: new Date(),
    };

    if (!ride.bookingRequests) {
      ride.bookingRequests = [];
    }
    ride.bookingRequests.push(newRequest);
    await ride.save();

    // Broadcast Socket event to Driver
    const io = req.app.get("io");
    if (io) {
      io.to(`ride_${ride._id}`).emit("driverNotification", {
        type: "BOOKING_REQUEST",
        message: `New booking request from ${passengerName}. Driver confirmation required.`,
        rideId: ride._id.toString(),
        request: newRequest,
        timestamp: new Date().toISOString(),
      });

      io.to(`ride_${ride._id}`).emit("bookingRequested", {
        rideId: ride._id.toString(),
        request: newRequest,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Ride booking request submitted! Waiting for driver confirmation.",
      status: "pending",
      bookingRequest: newRequest,
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
 * Confirm or Reject a Ride Booking Request (Driver Manual Action)
 */
export const confirmBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { requestId, action } = req.body; // action: "accept" or "reject"

    const ride = await Ride.findById(id);
    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found in database" });
    }

    const reqIndex = ride.bookingRequests?.findIndex(
      (r) => r._id?.toString() === requestId || String(r._id) === String(requestId) || r.userId === requestId
    );

    if (reqIndex === -1 || reqIndex === undefined) {
      return res.status(404).json({ success: false, message: "Booking request not found" });
    }

    const targetReq = ride.bookingRequests[reqIndex];

    if (action === "accept") {
      if (ride.seatsAvailable < targetReq.seatsBooked) {
        return res.status(400).json({ success: false, message: "Not enough seats available to accept booking" });
      }

      targetReq.status = "accepted";
      ride.seatsAvailable = Math.max(0, ride.seatsAvailable - targetReq.seatsBooked);

      // Add to confirmed passengers list if not already there
      const isAlreadyPassenger = ride.passengers?.some(
        (p) => p.userId === targetReq.userId || String(p.userId) === String(targetReq.userId)
      );

      if (!isAlreadyPassenger) {
        ride.passengers.push({
          userId: targetReq.userId,
          name: targetReq.name,
          pickup: targetReq.pickup,
          dropoff: targetReq.dropoff,
          seatsBooked: targetReq.seatsBooked,
          status: "accepted",
        });
      }

      if (ride.status === "scheduled") {
        ride.status = "active";
      }

      await ride.save();

      const io = req.app.get("io");
      if (io) {
        io.to(`ride_${ride._id}`).emit("bookingAccepted", {
          rideId: ride._id.toString(),
          passengerId: targetReq.userId,
          passengerName: targetReq.name,
          message: `Driver accepted booking for ${targetReq.name}! Seat confirmed.`,
          timestamp: new Date().toISOString(),
        });
        io.to(`ride_${ride._id}`).emit("rideConfirmed", {
          rideId: ride._id.toString(),
          passengerId: targetReq.userId,
          passengerName: targetReq.name,
          driverName: ride.driverName,
          vehiclePlate: ride.vehicleDetails?.plate,
          message: "✅ Ride Confirmed! Driver assigned.",
          timestamp: new Date().toISOString(),
        });
        io.emit("rideConfirmed", {
          rideId: ride._id.toString(),
          passengerId: targetReq.userId,
        });
        io.to(`ride_${ride._id}`).emit("rideUpdated", { rideId: ride._id.toString(), ride });
      }

      return res.status(200).json({
        success: true,
        message: `Booking request accepted for ${targetReq.name}! Seat confirmed.`,
        ride,
      });
    } else {
      // Reject request
      targetReq.status = "rejected";
      await ride.save();

      const io = req.app.get("io");
      if (io) {
        io.to(`ride_${ride._id}`).emit("bookingRejected", {
          rideId: ride._id.toString(),
          passengerId: targetReq.userId,
          passengerName: targetReq.name,
          message: `Driver declined booking request.`,
          timestamp: new Date().toISOString(),
        });
        io.to(`ride_${ride._id}`).emit("rideUpdated", { rideId: ride._id.toString(), ride });
      }

      return res.status(200).json({
        success: true,
        message: `Booking request declined for ${targetReq.name}.`,
        ride,
      });
    }
  } catch (error) {
    console.error("Confirm Booking Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to confirm booking request",
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
        $or: [
          { driverId: userId },
          { "passengers.userId": userId },
          { "bookingRequests.userId": userId },
        ],
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

/**
 * ACTIVE RIDE TRACKING: Update Ride Stage Timeline
 */
export const updateRideStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;

    const ride = await Ride.findById(id);
    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found" });
    }

    ride.currentStage = stage;
    if (!ride.timeline) ride.timeline = [];

    // Push stage if not duplicate
    const exists = ride.timeline.some((t) => t.stage === stage);
    if (!exists) {
      ride.timeline.push({ stage, timestamp: new Date(), completed: true });
    }

    if (stage === "Ride Completed") {
      ride.status = "completed";
    }

    await ride.save();

    const io = req.app.get("io");
    if (io) {
      io.to(`ride_${ride._id}`).emit("rideStatusUpdated", {
        rideId: ride._id.toString(),
        stage,
        status: ride.status,
        timeline: ride.timeline,
        timestamp: new Date().toISOString(),
      });
      io.to(`ride_${ride._id}`).emit("rideUpdated", { rideId: ride._id.toString(), ride });
    }

    return res.status(200).json({
      success: true,
      message: `Ride stage updated to '${stage}'`,
      ride,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update ride stage timeline",
      error: error.message,
    });
  }
};

/**
 * ACTIVE RIDE TRACKING: Real-Time Driver-Passenger In-Ride Chat
 */
export const sendRideChatMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { senderId, senderName, text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Message text is required" });
    }

    const ride = await Ride.findById(id);
    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found" });
    }

    const msgObj = {
      senderId: senderId || req.auth?.userId || "user_demo",
      senderName: senderName || "Passenger",
      text: text.trim(),
      timestamp: new Date(),
    };

    if (!ride.chatMessages) ride.chatMessages = [];
    ride.chatMessages.push(msgObj);
    await ride.save();

    const io = req.app.get("io");
    if (io) {
      io.to(`ride_${ride._id}`).emit("newRideChatMessage", {
        rideId: ride._id.toString(),
        message: msgObj,
      });
    }

    return res.status(201).json({
      success: true,
      message: msgObj,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to send in-ride chat message",
      error: error.message,
    });
  }
};

/**
 * ACTIVE RIDE TRACKING: Get In-Ride Chat History
 */
export const getRideChatHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const ride = await Ride.findById(id);
    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found" });
    }

    return res.status(200).json({
      success: true,
      chatMessages: ride.chatMessages || [],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch in-ride chat history",
      error: error.message,
    });
  }
};
