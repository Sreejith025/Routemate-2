import express from "express";
import {
  createEmergencyBooking,
  respondEmergencyRequest,
  getEmergencyRideStatus,
  getAdminEmergencyDashboardData,
  reoptimizeEmergencyRide,
} from "../controllers/emergencyController.js";

const router = express.Router();

// Public / Guest Emergency Booking & Live Telemetry Tracking
router.post("/book", createEmergencyBooking);
router.get("/admin/dashboard", getAdminEmergencyDashboardData);
router.get("/:id", getEmergencyRideStatus);
router.post("/:id/respond", respondEmergencyRequest);
router.post("/:id/reoptimize", reoptimizeEmergencyRide);

export default router;
