import mongoose from "mongoose";

const rideSwitchSchema = new mongoose.Schema(
  {
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
    },
    passengerId: {
      type: String,
      required: true,
    },
    currentTaxiId: {
      type: String,
      required: true,
    },
    newTaxiId: {
      type: String,
      required: true,
    },
    transferPoint: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
      address: { type: String, default: "Mid-Route Safe Transfer Intersection" },
    },
    currentETA: {
      type: Number,
      default: 0,
    },
    newETA: {
      type: Number,
      default: 0,
    },
    timeSaved: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed"],
      default: "pending",
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    acceptedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const RideSwitch =
  mongoose.models.RideSwitch || mongoose.model("RideSwitch", rideSwitchSchema);

export default RideSwitch;
