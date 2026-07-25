import mongoose from "mongoose";

const fareDisputeSchema = new mongoose.Schema(
  {
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
    },
    customerUserId: {
      type: String,
      required: true,
    },
    customerName: {
      type: String,
      default: "Passenger",
    },
    driverUserId: {
      type: String,
      required: true,
    },
    driverName: {
      type: String,
      default: "Driver",
    },
    lockedFareAmount: {
      type: Number,
      required: true,
    },
    demandedFareAmount: {
      type: Number,
      required: true,
    },
    disputeCategory: {
      type: String,
      enum: [
        "OVERCHARGING",
        "ROUTE_DEVIATION",
        "PAYMENT_DISPUTE",
        "DRIVER_MISCONDUCT",
        "FAKE_COMPLETION",
        "OTHER",
      ],
      default: "OVERCHARGING",
    },
    evidenceNotes: {
      type: String,
      default: "",
    },
    evidenceUrls: [String],
    aiAnalysis: {
      isValidOvercharge: { type: Boolean, default: false },
      aiConfidence: { type: Number, default: 92 },
      trafficDelayMins: { type: Number, default: 0 },
      routeDeviationKm: { type: Number, default: 0 },
      recommendedAction: { type: String, default: "FLAG_DRIVER_WARNING" },
      driverFlagged: { type: Boolean, default: true },
      penaltyPoints: { type: Number, default: 10 },
      analysisSummary: String,
    },
    status: {
      type: String,
      enum: ["PENDING_REVIEW", "RESOLVED_REFUNDED", "DRIVER_WARNED", "REJECTED"],
      default: "PENDING_REVIEW",
    },
  },
  { timestamps: true }
);

const FareDispute = mongoose.model("FareDispute", fareDisputeSchema);
export default FareDispute;
