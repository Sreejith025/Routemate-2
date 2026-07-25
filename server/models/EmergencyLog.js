import mongoose from "mongoose";

const emergencyLogSchema = new mongoose.Schema(
  {
    emergencyRideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmergencyRide",
    },
    eventType: {
      type: String,
      enum: [
        "EMERGENCY_BOOKING_CREATED",
        "AI_DISPATCH_EVALUATED",
        "DRIVER_ASSIGNED",
        "DRIVER_ACCEPTED",
        "COUNTDOWN_EXPIRED_AUTO_REASSIGN",
        "TRAFFIC_REOPTIMIZED",
        "EMERGENCY_ARRIVED",
        "EMERGENCY_COMPLETED",
        "EMERGENCY_CANCELLED",
      ],
      required: true,
    },
    driverId: String,
    driverName: String,
    etaMinutes: Number,
    distanceKm: Number,
    aiScore: Number,
    details: String,
    location: {
      lat: Number,
      lng: Number,
      address: String,
    },
  },
  { timestamps: true }
);

const EmergencyLog = mongoose.model("EmergencyLog", emergencyLogSchema);
export default EmergencyLog;
