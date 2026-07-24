import express from "express";
import {
  runOptimization,
  getOptimizationLogs,
  getOptimizationStats,
} from "../controllers/optimizationController.js";

const router = express.Router();

router.post("/run", runOptimization);
router.get("/logs", getOptimizationLogs);
router.get("/stats", getOptimizationStats);

export default router;
