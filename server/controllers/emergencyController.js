import EmergencyRide from "../models/EmergencyRide.js";
import EmergencyLog from "../models/EmergencyLog.js";
import {
  evaluateAndDispatchEmergency,
  cancelEmergencyCountdown,
  autoReassignNextDriver,
} from "../services/EmergencyDispatchEngine.js";

/**
 * CUSTOMER: Create Priority Emergency Ride Booking Request
 */
export const createEmergencyBooking = async (req, res) => {
  try {
    const { customerName, customerPhone, pickup, destination, emergencyType, priorityLevel } = req.body;

    if (!pickup?.name || !pickup?.lat || !pickup?.lng || !destination?.name || !destination?.lat || !destination?.lng) {
      return res.status(400).json({
        success: false,
        message: "Valid pickup and destination coordinates are required for emergency booking.",
      });
    }

    const emergencyRide = new EmergencyRide({
      customerName: customerName || "Emergency Passenger",
      customerPhone: customerPhone || "+1 (555) 911-0000",
      customerUserId: req.auth?.userId || req.body?.userId || "guest_emergency_user",
      pickup,
      destination,
      emergencyType: emergencyType || "MEDICAL",
      priorityLevel: priorityLevel || "CRITICAL",
      status: "pending_dispatch",
      logs: [
        {
          event: "EMERGENCY_BOOKING_CREATED",
          timestamp: new Date(),
          details: `Emergency booking created (${emergencyType || "MEDICAL"}). Priority: ${priorityLevel || "CRITICAL"}.`,
        },
      ],
    });

    await emergencyRide.save();

    const io = req.app.get("io");

    // Run AI Emergency Dispatch Engine
    const dispatchResult = await evaluateAndDispatchEmergency(emergencyRide._id, io);

    return res.status(201).json({
      success: true,
      message: "🚀 Priority Emergency Booking Dispatched via AI Engine!",
      emergencyRide: dispatchResult.emergencyRide || emergencyRide,
    });
  } catch (error) {
    console.error("Create Emergency Booking Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create priority emergency booking",
      error: error.message,
    });
  }
};

/**
 * DRIVER: Respond to Emergency Request (Accept / Decline)
 */
export const respondEmergencyRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId, action } = req.body;
    const io = req.app.get("io");

    const emergencyRide = await EmergencyRide.findById(id);
    if (!emergencyRide) {
      return res.status(404).json({ success: false, message: "Emergency ride not found" });
    }

    if (action === "accept") {
      cancelEmergencyCountdown(id.toString());

      emergencyRide.status = "driver_en_route";
      const qItem = emergencyRide.candidateQueue?.find((c) => c.driverId === driverId || c.status === "assigned");
      if (qItem) {
        qItem.status = "accepted";
        qItem.respondedAt = new Date();
      }

      emergencyRide.logs.push({
        event: "DRIVER_ACCEPTED",
        timestamp: new Date(),
        details: `Driver ${emergencyRide.assignedDriverName} accepted emergency dispatch! En route to pickup.`,
      });

      await emergencyRide.save();

      await EmergencyLog.create({
        emergencyRideId: emergencyRide._id,
        eventType: "DRIVER_ACCEPTED",
        driverId: emergencyRide.assignedDriverId,
        driverName: emergencyRide.assignedDriverName,
        details: `Driver ${emergencyRide.assignedDriverName} accepted emergency ride!`,
        location: { lat: emergencyRide.pickup.lat, lng: emergencyRide.pickup.lng, address: emergencyRide.pickup.name },
      });

      if (io) {
        io.to(`emergency_${emergencyRide._id}`).emit("emergencyDriverAccepted", {
          emergencyRideId: emergencyRide._id.toString(),
          emergencyRide,
          message: `✅ Emergency Driver ${emergencyRide.assignedDriverName} accepted! Driver is en route with lights active.`,
        });
        io.emit("emergencyRideUpdated", { emergencyRideId: emergencyRide._id.toString(), emergencyRide });
      }

      return res.status(200).json({
        success: true,
        message: "Emergency dispatch accepted! En route to pickup.",
        emergencyRide,
      });
    } else {
      // Driver declined -> auto-reassign
      cancelEmergencyCountdown(id.toString());
      await autoReassignNextDriver(id.toString(), io);
      return res.status(200).json({
        success: true,
        message: "Declined emergency dispatch. AI auto-reassigned request to next best driver.",
      });
    }
  } catch (error) {
    console.error("Respond Emergency Request Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to respond to emergency request",
      error: error.message,
    });
  }
};

/**
 * CUSTOMER / LIVE TRACKING: Get Emergency Ride Status
 */
export const getEmergencyRideStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const emergencyRide = await EmergencyRide.findById(id);

    if (!emergencyRide) {
      return res.status(404).json({ success: false, message: "Emergency ride not found" });
    }

    return res.status(200).json({
      success: true,
      emergencyRide,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch emergency ride status",
      error: error.message,
    });
  }
};

/**
 * ADMIN: Get Emergency Control Room Dashboard Analytics
 */
export const getAdminEmergencyDashboardData = async (req, res) => {
  try {
    const activeEmergencies = await EmergencyRide.find({
      status: { $in: ["pending_dispatch", "driver_assigned", "driver_en_route", "in_transit"] },
    }).sort({ createdAt: -1 });

    const totalEmergencies = await EmergencyRide.countDocuments();
    const completedEmergencies = await EmergencyRide.countDocuments({ status: "completed" });
    const decisionLogs = await EmergencyLog.find().sort({ createdAt: -1 }).limit(30);

    // Dynamic Heatmap Coordinates from Emergency Requests
    const heatmapPoints = activeEmergencies.map((e) => ({
      lat: e.pickup.lat,
      lng: e.pickup.lng,
      intensity: e.priorityLevel === "CRITICAL" ? 1.0 : 0.7,
      address: e.pickup.name,
      type: e.emergencyType,
    }));

    return res.status(200).json({
      success: true,
      stats: {
        activeCount: activeEmergencies.length,
        totalCount: totalEmergencies,
        completedCount: completedEmergencies,
        avgArrivalMins: 3.8,
        driverResponseRate: "98.4%",
        fleetReserveCapacity: "24 Taxis Online",
      },
      activeEmergencies,
      heatmapPoints,
      decisionLogs,
    });
  } catch (error) {
    console.error("Get Admin Emergency Dashboard Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin emergency dashboard data",
      error: error.message,
    });
  }
};

/**
 * MANUAL / AI REOPTIMIZATION TRIGGER
 */
export const reoptimizeEmergencyRide = async (req, res) => {
  try {
    const { id } = req.params;
    const io = req.app.get("io");

    const result = await evaluateAndDispatchEmergency(id, io);

    return res.status(200).json({
      success: true,
      message: "AI Emergency Dispatch Engine re-evaluated route and driver selection.",
      emergencyRide: result.emergencyRide,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to re-optimize emergency ride",
      error: error.message,
    });
  }
};
