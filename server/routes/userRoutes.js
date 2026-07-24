import express from "express";
import {
  syncUser,
  getCurrentUser,
  updateProfile,
  updateUserPreferences,
  getAllUsers,
} from "../controllers/userController.js";
import { requireAuthUser, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// Synchronize Clerk User with MongoDB
router.post("/sync", requireAuthUser, syncUser);

// Get current user profile
router.get("/me", requireAuthUser, getCurrentUser);

// Update user profile details / role
router.put("/profile", requireAuthUser, updateProfile);

// Update user ride preferences
router.put("/preferences", updateUserPreferences);

// Get all users (Admin only)
router.get("/", requireAuthUser, requireRole("Admin"), getAllUsers);

export default router;
