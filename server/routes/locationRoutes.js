import express from "express";
import {
  updateLocation,
  getRideLocations,
  getDriverLocation,
  getNearbyDrivers,
} from "../controllers/locationController.js";
import { requireAuthUser } from "../middleware/authMiddleware.js";

const router = express.Router();

// Require authentication for location routes
router.use(requireAuthUser);

// Routes
router.get("/nearby-drivers", getNearbyDrivers);
router.post("/update", updateLocation);
router.get("/:rideId", getRideLocations);
router.get("/driver/:driverId", getDriverLocation);

export default router;
