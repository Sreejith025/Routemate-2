import mongoose from "mongoose";

const rideSchema = new mongoose.Schema(
  {
    driverId: {
      type: String, // Clerk ID or Mongo ID of driver
      ref: "User",
      required: false,
    },
    driverName: {
      type: String,
      default: "Unassigned",
    },
    vehicleDetails: {
      make: { type: String, default: "Toyota" },
      model: { type: String, default: "Prius" },
      plate: { type: String, default: "RT-8842" },
      color: { type: String, default: "Silver" },
    },
    passengers: [
      {
        userId: { type: String, required: true },
        name: { type: String, required: true },
        pickup: { type: String, required: true },
        dropoff: { type: String, required: true },
        seatsBooked: { type: Number, default: 1 },
        switchedTaxi: { type: Boolean, default: false },
        originalDriverId: { type: String },
        status: { type: String, enum: ["pending", "accepted", "rejected"], default: "accepted" },
      },
    ],
    bookingRequests: [
      {
        userId: { type: String, required: true },
        name: { type: String, required: true },
        pickup: { type: String, required: true },
        dropoff: { type: String, required: true },
        seatsBooked: { type: Number, default: 1 },
        status: {
          type: String,
          enum: ["pending", "accepted", "rejected"],
          default: "pending",
        },
        requestedAt: { type: Date, default: Date.now },
      },
    ],
    origin: {
      type: String,
      required: true,
    },
    destination: {
      type: String,
      required: true,
    },
    originCoords: {
      lat: { type: Number, required: true, default: 12.9716 },
      lng: { type: Number, required: true, default: 77.5946 },
    },
    destinationCoords: {
      lat: { type: Number, required: true, default: 12.9352 },
      lng: { type: Number, required: true, default: 77.6245 },
    },
    departureTime: {
      type: String,
      default: "Immediate",
    },
    seatsAvailable: {
      type: Number,
      required: true,
      default: 3,
    },
    pricePerSeat: {
      type: Number,
      required: true,
      default: 15,
    },
    status: {
      type: String,
      enum: ["scheduled", "active", "completed", "cancelled"],
      default: "scheduled",
    },
    sharingEnabled: {
      type: Boolean,
      default: true,
    },
    rideType: {
      type: String,
      enum: ["shared", "private"],
      default: "shared",
    },
    lockedForNewPassengers: {
      type: Boolean,
      default: false,
    },
    trafficStatus: {
      type: String,
      enum: ["Normal", "TrafficAffected", "Congested"],
      default: "Normal",
    },
    trafficDelayMinutes: {
      type: Number,
      default: 0,
    },
    optimizationHistory: [
      {
        score: Number,
        fairnessScore: Number,
        targetRideId: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    dynamicSwitchSuggested: {
      type: Boolean,
      default: false,
    },
    switchDetails: {
      passengerId: String,
      passengerName: String,
      targetRideId: String,
      targetDriverId: String,
      targetTaxiDriverName: String,
      targetVehiclePlate: String,
      etaSavedMinutes: Number,
      switchingScore: Number,
      reason: String,
      status: {
        type: String,
        enum: ["pending", "accepted", "declined", "completed"],
        default: "pending",
      },
    },
  },
  {
    timestamps: true,
  }
);

const Ride = mongoose.models.Ride || mongoose.model("Ride", rideSchema);

export default Ride;
