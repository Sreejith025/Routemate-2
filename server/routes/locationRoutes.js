import express from "express";
import {
  getNearbyDrivers,
  getRideLocations,
  updateLocation,
  getRideETA,
  getRideDistance,
} from "../controllers/driverLocationController.js";

const router = express.Router();

// Public / Guest & Authenticated Driver Location Routes
router.get("/nearby-drivers", getNearbyDrivers);
router.get("/drivers/nearby", getNearbyDrivers);
router.post("/update", updateLocation);
router.get("/:rideId/location", getRideLocations);
router.get("/:rideId/eta", getRideETA);
router.get("/:rideId/distance", getRideDistance);
router.get("/:rideId", getRideLocations);

export default router;
