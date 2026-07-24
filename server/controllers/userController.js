import User from "../models/User.js";
import { isAdminEmail } from "../config/adminEmails.js";

/**
 * Synchronize Clerk authenticated user with MongoDB.
 * Creates user on first login or updates profile details.
 */
export const syncUser = async (req, res) => {
  try {
    const { fullName, email, profileImage, phone, role } = req.body;
    const userId = req.auth?.userId || req.body?.clerkId || req.body?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let user = await User.findOne({ clerkId: userId });
    const userEmail = email || user?.email || "";
    const isAuthorizedAdmin = isAdminEmail(userEmail);

    if (user) {
      // Update existing user details if changed
      let isModified = false;
      if (fullName && user.fullName !== fullName) {
        user.fullName = fullName;
        isModified = true;
      }
      if (email && user.email !== email) {
        user.email = email;
        isModified = true;
      }
      if (profileImage && user.profileImage !== profileImage) {
        user.profileImage = profileImage;
        isModified = true;
      }

      // Automatically grant Admin role if email matches authorized admin list
      if (isAuthorizedAdmin) {
        if (!user.isAdmin || user.role !== "Admin") {
          user.isAdmin = true;
          user.role = "Admin";
          isModified = true;
        }
      } else {
        if (user.isAdmin) {
          user.isAdmin = false;
          if (user.role === "Admin") user.role = "Passenger";
          isModified = true;
        }
      }

      if (isModified) {
        await user.save();
      }

      return res.status(200).json({
        success: true,
        message: "User synchronized successfully",
        user,
      });
    }

    // Create new user in MongoDB on first login
    user = await User.create({
      clerkId: userId,
      fullName: fullName || "RouteMate User",
      email: email || "",
      profileImage: profileImage || "",
      phone: phone || "",
      role: isAuthorizedAdmin ? "Admin" : (role || "Passenger"),
      isAdmin: isAuthorizedAdmin,
    });

    return res.status(201).json({
      success: true,
      message: "User created and synchronized successfully",
      user,
    });
  } catch (error) {
    console.error("Sync User Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to sync user with database",
      error: error.message,
    });
  }
};

/**
 * Get current authenticated user profile
 */
export const getCurrentUser = async (req, res) => {
  try {
    if (!req.mongoUser) {
      return res.status(404).json({
        success: false,
        message: "User record not found in MongoDB",
      });
    }

    return res.status(200).json({
      success: true,
      user: req.mongoUser,
    });
  } catch (error) {
    console.error("Get Current User Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching user profile",
      error: error.message,
    });
  }
};

/**
 * Update current user profile (fullName, phone, role)
 */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.auth?.userId || req.body?.clerkId || req.body?.userId;
    const { fullName, phone, role } = req.body;

    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (fullName) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;
    if (role && ["Passenger", "Driver", "Admin"].includes(role)) {
      user.role = role;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
};

/**
 * Update passenger ride preferences, gender, and safety preference
 */
export const updateUserPreferences = async (req, res) => {
  try {
    const userId = req.auth?.userId || req.body?.clerkId || req.body?.userId || "demo_passenger_id";
    const { ridePreference, gender, safetyPreference } = req.body;

    let user = await User.findOne({ clerkId: userId });

    if (!user) {
      // Find any existing user or create a fallback record
      const existingUser = await User.findOne({});
      user = existingUser || new User({
        clerkId: userId,
        fullName: req.body?.fullName || "RouteMate Passenger",
        email: req.body?.email || "passenger@routemate.com",
      });
    }

    if (ridePreference && ["shared", "private", "safety"].includes(ridePreference)) {
      user.ridePreference = ridePreference;
    }

    if (gender && ["male", "female", "other", "prefer_not_to_say"].includes(gender)) {
      user.gender = gender;
    }

    if (
      safetyPreference &&
      ["femalePassengersOnly", "femaleDriverOnly", "femaleDriverAndPassengers", "noPreference"].includes(
        safetyPreference
      )
    ) {
      user.safetyPreference = safetyPreference;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Ride preferences updated successfully",
      preferences: {
        ridePreference: user.ridePreference,
        gender: user.gender,
        safetyPreference: user.safetyPreference,
      },
      user,
    });
  } catch (error) {
    console.error("Update User Preferences Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update preferences",
      error: error.message,
    });
  }
};

/**
 * Get all users (Admin only)
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get All Users Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
};
