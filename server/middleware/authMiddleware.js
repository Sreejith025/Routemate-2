import { getAuth } from "@clerk/express";
import User from "../models/User.js";

// Middleware to enforce authentication and attach current MongoDB user
export const requireAuthUser = async (req, res, next) => {
  try {
    let auth = null;
    try {
      auth = getAuth(req);
    } catch (err) {
      console.warn("Clerk getAuth warning:", err.message);
    }

    const userId = auth?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Please sign in with Clerk",
      });
    }

    // Attach Clerk auth object
    req.auth = auth;

    // Fetch user from MongoDB
    const mongoUser = await User.findOne({ clerkId: userId });
    req.mongoUser = mongoUser;

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// Export requireAuth as alias for requireAuthUser
export const requireAuth = requireAuthUser;

// Middleware to restrict access based on roles
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.mongoUser) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not found in database",
      });
    }

    if (!roles.includes(req.mongoUser.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to ${roles.join(", ")}`,
      });
    }

    next();
  };
};
