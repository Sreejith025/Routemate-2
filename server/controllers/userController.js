import User from "../models/User.js";

/**
 * Synchronize Clerk authenticated user with MongoDB.
 * Creates user on first login or updates profile details.
 */
export const syncUser = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { fullName, email, profileImage, phone, role } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let user = await User.findOne({ clerkId: userId });

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
      role: role || "Passenger",
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
    const { userId } = req.auth;
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
