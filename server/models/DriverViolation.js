import mongoose from "mongoose";

const driverViolationSchema = new mongoose.Schema(
  {
    driverId: {
      type: String,
      required: true,
    },
    driverName: {
      type: String,
      default: "RouteMate Driver",
    },
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
    },
    violationType: {
      type: String,
      enum: ["OFF_APP_OVERCHARGING_ATTEMPT", "ANTI_STALLING_TELEMETRY", "ROUTE_DEVIATION"],
      required: true,
    },
    lockedFare: Number,
    demandedAmount: Number,
    stationarySeconds: Number,
    penaltyStrikes: {
      type: Number,
      default: 1,
    },
    actionTaken: {
      type: String,
      default: "DRIVER_APP_LOCKED_PENALTY_STRIKE_ISSUED",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("DriverViolation", driverViolationSchema);
