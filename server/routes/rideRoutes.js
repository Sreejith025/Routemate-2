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
  updateRideStage,
  sendRideChatMessage,
  getRideChatHistory,
} from "../controllers/rideController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

import {
  verifyPickupPin,
  verifyDropPin,
  reportOvercharge,
  unfreezeDriver,
} from "../controllers/pinController.js";

import {
  getClients,
  createClient,
  getClientAnalytics,
} from "../controllers/clientController.js";

const router = express.Router();

// Public / Guest searchable ride routes
router.get("/", getAvailableRides);
router.get("/eligible-shared", getEligibleSharedRides);
router.get("/history/all", getUserRideHistory);
router.get("/clients", getClients);
router.get("/clients/:id/analytics", getClientAnalytics);
router.get("/:id", getRideById);
router.get("/:id/chat", getRideChatHistory);

// Protected ride operations
router.post("/", createRide);
router.post("/clients", createClient);
router.post("/:id/book", bookRide);
router.post("/:id/join-second", joinSecondPassenger);
router.post("/:id/confirm-booking", confirmBooking);
router.post("/:id/update-stage", updateRideStage);
router.post("/:id/chat", sendRideChatMessage);
router.post("/:id/trigger-switch", triggerDynamicSwitch);
router.post("/:id/respond-switch", respondToSwitch);
router.post("/:id/leave-shared-ride", leaveSharedRide);

// Anti-Extortion Core Operations
router.post("/verify-cash", verifyCashAmount);
router.post("/unlock-driver-pin", unlockDriverPin);
router.post("/instant-payout", triggerInstantPayout);
router.post("/check-stalling", checkStallingTelemetry);

// PIN Verification & Driver Freeze/Unfreeze Operations (Features 1-5)
router.post("/pins/verify-pickup", verifyPickupPin);
router.post("/pins/verify-drop", verifyDropPin);
router.post("/pins/report-overcharge", reportOvercharge);
router.post("/pins/unfreeze-driver", unfreezeDriver);

export default router;
