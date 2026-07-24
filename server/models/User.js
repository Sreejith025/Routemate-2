import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: ["Passenger", "Driver", "Admin"],
      default: "Passenger",
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    profileImage: {
      type: String,
      default: "",
    },
    // Ride Preferences & Safety Options
    ridePreference: {
      type: String,
      enum: ["shared", "private", "safety"],
      default: "shared",
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer_not_to_say"],
      default: "prefer_not_to_say",
    },
    safetyPreference: {
      type: String,
      enum: [
        "femalePassengersOnly",
        "femaleDriverOnly",
        "femaleDriverAndPassengers",
        "noPreference",
      ],
      default: "noPreference",
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
