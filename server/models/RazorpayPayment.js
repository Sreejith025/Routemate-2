import mongoose from "mongoose";

const razorpayPaymentSchema = new mongoose.Schema(
  {
    rideId: {
      type: String,
      default: null,
    },
    offlineBookingId: {
      type: String,
      default: null,
    },
    orderId: {
      type: String,
      required: true,
    },
    paymentId: {
      type: String,
      default: null,
    },
    signature: {
      type: String,
      default: null,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    method: {
      type: String,
      default: "UPI",
    },
    status: {
      type: String,
      enum: ["created", "captured", "failed"],
      default: "created",
    },
    receiptDetails: {
      baseFare: Number,
      distanceCharge: Number,
      waitingCharge: Number,
      taxes: Number,
      totalFare: Number,
      receiptNumber: String,
    },
  },
  { timestamps: true }
);

const RazorpayPayment = mongoose.model("RazorpayPayment", razorpayPaymentSchema);
export default RazorpayPayment;
