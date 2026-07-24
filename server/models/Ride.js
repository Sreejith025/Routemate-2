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
    dynamicSwitchSuggested: {
      type: Boolean,
      default: false,
    },
    switchDetails: {
      passengerName: String,
      reason: String,
      etaSavedMinutes: Number,
      targetTaxiDriverName: String,
      targetVehiclePlate: String,
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
