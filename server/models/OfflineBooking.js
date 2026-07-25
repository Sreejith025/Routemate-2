import mongoose from "mongoose";

const offlineBookingSchema = new mongoose.Schema(
  {
    driverId: {
      type: String,
      required: true,
    },
    driverName: {
      type: String,
      required: true,
    },
    customerName: {
      type: String,
      required: true,
      default: "Walk-in Passenger",
    },
    customerPhone: {
      type: String,
      required: true,
      default: "+91 98765 43210",
    },
    pickup: {
      name: { type: String, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    dropoff: {
      name: { type: String, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    estimatedFare: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["CASH", "RAZORPAY_QR", "UPI"],
      default: "CASH",
    },
    paymentStatus: {
      type: String,
      enum: ["PAID", "PENDING"],
      default: "PENDING",
    },
    dropPin: {
      type: String,
      required: true,
      default: "7182",
    },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
  },
  { timestamps: true }
);

const OfflineBooking = mongoose.model("OfflineBooking", offlineBookingSchema);
export default OfflineBooking;
