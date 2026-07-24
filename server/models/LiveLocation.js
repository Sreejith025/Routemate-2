import mongoose from "mongoose";

const liveLocationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["Driver", "Passenger"],
      required: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    speed: {
      type: Number,
      default: 0,
    },
    heading: {
      type: Number,
      default: 0,
    },
    accuracy: {
      type: Number,
      default: 0,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast location queries per user per ride
liveLocationSchema.index({ rideId: 1, userId: 1 }, { unique: true });

const LiveLocation =
  mongoose.models.LiveLocation ||
  mongoose.model("LiveLocation", liveLocationSchema);

export default LiveLocation;
