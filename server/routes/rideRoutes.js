import express from "express";
import {
  getAvailableRides,
  getRideById,
  createRide,
  bookRide,
  smartSwitchSearch,
  acceptSmartSwitch,
  triggerDynamicSwitch,
  respondToSwitch,
  getUserRideHistory,
} from "../controllers/rideController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public / Guest searchable ride routes
router.get("/", getAvailableRides);
router.get("/history/all", getUserRideHistory);

// Smart Shared Ride Exit & Switching routes
router.post("/smart-switch-search", smartSwitchSearch);
router.post("/switch/accept", acceptSmartSwitch);

router.get("/:id", getRideById);

// Protected ride operations
router.post("/", createRide);
router.post("/:id/book", bookRide);
router.post("/:id/trigger-switch", triggerDynamicSwitch);
router.post("/:id/respond-switch", respondToSwitch);

export default router;
