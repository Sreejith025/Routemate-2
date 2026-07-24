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
    passengerName: {
      type: String,
      default: "Passenger",
    },
    currentTaxiId: {
      type: String,
      default: "",
    },
    newTaxiId: {
      type: String,
      default: "",
    },
    transferPoint: {
      name: { type: String, default: "Rendezvous Transfer Point - Exit 14 Intersection" },
      lat: { type: Number, default: 12.955 },
      lng: { type: Number, default: 77.61 },
    },
    currentETA: {
      type: Number,
      default: 45,
    },
    newETA: {
      type: Number,
      default: 28,
    },
    timeSaved: {
      type: Number,
      default: 17,
    },
    status: {
      type: String,
      enum: ["requested", "found", "accepted", "rejected", "completed"],
      default: "requested",
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

const RideSwitch = mongoose.models.RideSwitch || mongoose.model("RideSwitch", rideSwitchSchema);

export default RideSwitch;
