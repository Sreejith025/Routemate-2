import mongoose from "mongoose";

const payoutTransactionSchema = new mongoose.Schema(
  {
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
    },
    driverId: {
      type: String,
      required: true,
    },
    driverUpiId: {
      type: String,
      default: "driver@upi",
    },
    totalFare: {
      type: Number,
      required: true,
    },
    platformCommission: {
      type: Number,
      required: true,
    },
    driverNetEarnings: {
      type: Number,
      required: true,
    },
    gatewayTxnId: {
      type: String,
      default: () => `PAYOUT_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
    },
    payoutStatus: {
      type: String,
      enum: ["PENDING", "PROCESSING", "SUCCESS", "FAILED"],
      default: "SUCCESS",
    },
    settlementTimeSeconds: {
      type: Number,
      default: 45, // Routed within 60s
    },
    settledAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("PayoutTransaction", payoutTransactionSchema);
