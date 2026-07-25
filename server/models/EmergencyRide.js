import mongoose from "mongoose";

const emergencyRideSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
      default: "Emergency Customer",
    },
    customerPhone: {
      type: String,
      default: "+1 (555) 911-0000",
    },
    customerUserId: {
      type: String,
      default: "guest_emergency_user",
    },
    pickup: {
      name: { type: String, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    destination: {
      name: { type: String, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    emergencyType: {
      type: String,
      enum: ["MEDICAL", "SAFETY", "URGENT_COMMUTE", "ACCIDENT", "OTHER"],
      default: "MEDICAL",
    },
    priorityLevel: {
      type: String,
      enum: ["CRITICAL", "URGENT", "HIGH"],
      default: "CRITICAL",
    },
    status: {
      type: String,
      enum: [
        "pending_dispatch",
        "driver_assigned",
        "driver_en_route",
        "arrived",
        "in_transit",
        "completed",
        "cancelled",
      ],
      default: "pending_dispatch",
    },
    assignedDriverId: {
      type: String,
      default: null,
    },
    assignedDriverName: {
      type: String,
      default: null,
    },
    assignedTaxiPlate: {
      type: String,
      default: null,
    },
    vehicleDetails: {
      make: { type: String, default: "Toyota" },
      model: { type: String, default: "Camry Hybrid" },
      color: { type: String, default: "Red/White Emergency" },
      plate: { type: String, default: "EMG-9110" },
    },
    candidateQueue: [
      {
        driverId: String,
        driverName: String,
        driverRating: Number,
        taxiPlate: String,
        etaMinutes: Number,
        distanceKm: Number,
        aiScore: Number,
        status: {
          type: String,
          enum: ["pending", "assigned", "accepted", "declined", "expired"],
          default: "pending",
        },
        assignedAt: Date,
        respondedAt: Date,
      },
    ],
    aiInsights: {
      selectedDriverName: String,
      etaSavedMinutes: Number,
      trafficCondition: { type: String, default: "Normal" },
      reason: String,
      aiScoreFormula: String,
      routeMatchScore: Number,
    },
    countdownSeconds: {
      type: Number,
      default: 15,
    },
    telemetry: {
      liveLat: Number,
      liveLng: Number,
      currentSpeed: { type: Number, default: 45 },
      distanceRemainingKm: Number,
      etaMinutes: Number,
      updatedAt: { type: Date, default: Date.now },
    },
    logs: [
      {
        event: String,
        timestamp: { type: Date, default: Date.now },
        details: String,
      },
    ],
  },
  { timestamps: true }
);

const EmergencyRide = mongoose.model("EmergencyRide", emergencyRideSchema);
export default EmergencyRide;
