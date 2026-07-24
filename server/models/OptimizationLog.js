import mongoose from "mongoose";

const optimizationLogSchema = new mongoose.Schema(
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
    candidateRideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
    },
    candidateDriverName: {
      type: String,
      default: "Driver",
    },
    candidateVehiclePlate: {
      type: String,
      default: "RT-9900",
    },
    optimizationScore: {
      type: Number, // 0 to 100
      required: true,
    },
    fairnessScore: {
      type: Number, // 0 to 100
      required: true,
    },
    maxPassengerDelayMinutes: {
      type: Number, // Delay caused to target taxi passengers (must be <= 5)
      default: 0,
    },
    trafficDelayMinutes: {
      type: Number,
      default: 0,
    },
    etaSavedMinutes: {
      type: Number,
      default: 0,
    },
    routeSimilarityPercentage: {
      type: Number, // Must be >= 80%
      default: 0,
    },
    status: {
      type: String,
      enum: ["recommended", "accepted", "rejected", "rejected_by_fairness"],
      default: "recommended",
    },
    recommendedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const OptimizationLog =
  mongoose.models.OptimizationLog ||
  mongoose.model("OptimizationLog", optimizationLogSchema);

export default OptimizationLog;
