import mongoose from "mongoose";

const pinVerificationLogSchema = new mongoose.Schema(
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
    passengerId: {
      type: String,
      required: true,
    },
    pinType: {
      type: String,
      enum: ["PICKUP_PIN", "DROP_PIN", "EMERGENCY_PIN"],
      required: true,
    },
    enteredPin: {
      type: String,
      required: true,
    },
    expectedPin: {
      type: String,
      required: true,
    },
    isSuccess: {
      type: Boolean,
      required: true,
    },
    attemptNumber: {
      type: Number,
      default: 1,
    },
    actionTriggered: {
      type: String,
      default: "LOGGED",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("PinVerificationLog", pinVerificationLogSchema);
