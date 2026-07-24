import mongoose from "mongoose";

const sosSchema = new mongoose.Schema(
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
    driverId: {
      type: String,
      required: true,
    },
    driverDetails: {
      name: { type: String, default: "Driver" },
      phone: { type: String, default: "" },
    },
    vehicleDetails: {
      make: { type: String, default: "" },
      model: { type: String, default: "" },
      plate: { type: String, default: "" },
      color: { type: String, default: "" },
    },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      address: { type: String, default: "Live GPS Location" },
    },
    currentRoute: {
      origin: { type: String, default: "" },
      destination: { type: String, default: "" },
    },
    destination: {
      type: String,
      default: "",
    },
    emergencyContact: {
      name: { type: String, default: "Emergency Contact" },
      phone: { type: String, default: "" },
    },
    time: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["active", "investigating", "resolved"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

const SOS = mongoose.models.SOS || mongoose.model("SOS", sosSchema);

export default SOS;
