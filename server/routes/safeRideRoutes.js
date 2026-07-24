import express from "express";
import {
  reportDiscomfort,
  leaveSharedRide,
  triggerSOS,
  getComplaints,
  getSOSAlerts,
  getLiveTaxiAlternatives,
  switchToCandidateTaxi,
  cancelSharedRide,
} from "../controllers/safeRideController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// SafeRide & Smart Exit Action Endpoints
router.post("/:id/report-discomfort", reportDiscomfort);
router.post("/:id/leave-shared-ride", leaveSharedRide);
router.post("/:id/sos", triggerSOS);
router.get("/:id/live-alternatives", getLiveTaxiAlternatives);
router.post("/:id/switch-to-taxi", switchToCandidateTaxi);
router.post("/:id/cancel-ride", cancelSharedRide);

// Administrative / Support Safety Log Endpoints
router.get("/complaints", getComplaints);
router.get("/sos-alerts", getSOSAlerts);

export default router;
