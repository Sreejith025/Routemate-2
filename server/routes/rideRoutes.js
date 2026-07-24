import express from "express";
import {
  getAvailableRides,
  getRideById,
  createRide,
  bookRide,
  confirmBooking,
  triggerDynamicSwitch,
  respondToSwitch,
  leaveSharedRide,
  getUserRideHistory,
} from "../controllers/rideController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public / Guest searchable ride routes
router.get("/", getAvailableRides);
router.get("/history/all", getUserRideHistory);
router.get("/:id", getRideById);

// Protected ride operations
router.post("/", createRide);
router.post("/:id/book", bookRide);
router.post("/:id/confirm-booking", confirmBooking);
router.post("/:id/trigger-switch", triggerDynamicSwitch);
router.post("/:id/respond-switch", respondToSwitch);
router.post("/:id/leave-shared-ride", leaveSharedRide);

export default router;
