import mongoose from "mongoose";

const rideComplaintSchema = new mongoose.Schema(
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
    driverName: {
      type: String,
      default: "Driver",
    },
    reason: {
      type: String,
      required: true,
      enum: [
        "Passenger is behaving aggressively",
        "Harassment",
        "Smoking",
        "Loud Behaviour",
        "Hygiene Issue",
        "Personal Reason",
        "Other",
      ],
    },
    description: {
      type: String,
      default: "",
    },
    time: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "investigating", "resolved", "action_taken"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const RideComplaint =
  mongoose.models.RideComplaint ||
  mongoose.model("RideComplaint", rideComplaintSchema);

export default RideComplaint;
