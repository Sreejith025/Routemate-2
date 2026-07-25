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
        pickupCoords: {
          lat: { type: Number, default: 12.9716 },
          lng: { type: Number, default: 77.5946 },
        },
        dropoffCoords: {
          lat: { type: Number, default: 12.9352 },
          lng: { type: Number, default: 77.6245 },
        },
        seatsBooked: { type: Number, default: 1 },
        distanceKm: { type: Number, default: 10 },
        fare: { type: Number, default: 150 },
        originalPrivateFare: { type: Number, default: 220 },
        savings: { type: Number, default: 70 },
        switchedTaxi: { type: Boolean, default: false },
        originalDriverId: { type: String },
        status: { type: String, enum: ["pending", "accepted", "rejected"], default: "accepted" },
      },
    ],
    pickupSequence: [
      {
        passengerId: String,
        name: String,
        pickupName: String,
        lat: Number,
        lng: Number,
      },
    ],
    dropSequence: [
      {
        passengerId: String,
        name: String,
        dropoffName: String,
        lat: Number,
        lng: Number,
      },
    ],
    sharedFareTotal: {
      type: Number,
      default: 300,
    },
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
    lockedFare: {
      type: Number,
      default: null,
    },
    pickupPin: {
      type: String,
      default: "4892",
    },
    pickupPinAttempts: {
      type: Number,
      default: 0,
    },
    pickupPinVerified: {
      type: Boolean,
      default: false,
    },
    dropPin: {
      type: String,
      default: "7182",
    },
    dropPinAttempts: {
      type: Number,
      default: 0,
    },
    dropPinVerified: {
      type: Boolean,
      default: false,
    },
    emergencyPin: {
      type: String,
      default: null,
    },
    emergencyPinAttempts: {
      type: Number,
      default: 0,
    },
    emergencyPinVerified: {
      type: Boolean,
      default: false,
    },
    clientId: {
      type: String,
      default: "default_org",
    },
    waitingTimeMins: {
      type: Number,
      default: 0,
    },
    waitingCharge: {
      type: Number,
      default: 0,
    },
    routeDeviationAlert: {
      isDeviated: { type: Boolean, default: false },
      distanceKm: { type: Number, default: 0 },
      reason: { type: String, default: "" },
    },
    isOfflineBooking: {
      type: Boolean,
      default: false,
    },
    paymentDetails: {
      method: { type: String, default: "CASH" },
      transactionId: { type: String, default: "" },
      status: { type: String, default: "PENDING" },
      receipt: { type: Object, default: null },
    },
    otp: {
      type: String,
      default: "4892",
    },
    driverPhoto: {
      type: String,
      default: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    },
    driverRating: {
      type: Number,
      default: 4.8,
    },
    currentStage: {
      type: String,
      enum: [
        "Driver Assigned",
        "Driver Arriving",
        "Driver Reached Pickup",
        "Passenger Picked Up",
        "Shared Ride Started",
        "Additional Passenger Joined",
        "Ride In Progress",
        "Passenger Dropped",
        "Ride Completed",
      ],
      default: "Driver Assigned",
    },
    timeline: [
      {
        stage: String,
        timestamp: { type: Date, default: Date.now },
        completed: { type: Boolean, default: true },
      },
    ],
    chatMessages: [
      {
        senderId: String,
        senderName: String,
        text: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
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
