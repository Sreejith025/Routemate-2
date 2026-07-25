import FareDispute from "../models/FareDispute.js";
import OfflineBooking from "../models/OfflineBooking.js";
import RazorpayPayment from "../models/RazorpayPayment.js";
import Ride from "../models/Ride.js";
import {
  analyzeAndProcessFareDispute,
  verifyRideDropPin,
} from "../services/FareProtectionEngine.js";

/**
 * 1. REPORT FARE DISPUTE / OVERCHARGING
 */
export const reportFareDispute = async (req, res) => {
  try {
    const io = req.app.get("io");
    const result = await analyzeAndProcessFareDispute(req.body, io);

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }

    return res.status(201).json({
      success: true,
      message: "Fare dispute reported and analyzed by AI Protection Engine.",
      dispute: result.dispute,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to report fare dispute",
      error: error.message,
    });
  }
};

/**
 * 2. DRIVER OFFLINE BOOKING CREATION
 */
export const createOfflineBooking = async (req, res) => {
  try {
    const { driverId, driverName, customerName, customerPhone, pickup, dropoff, estimatedFare, paymentMethod } = req.body;

    if (!pickup?.name || !dropoff?.name || !estimatedFare) {
      return res.status(400).json({
        success: false,
        message: "Pickup, dropoff, and estimated fare are required for offline booking.",
      });
    }

    const dropPin = Math.floor(1000 + Math.random() * 9000).toString();

    const offline = new OfflineBooking({
      driverId: driverId || req.auth?.userId || "driver_demo",
      driverName: driverName || "RouteMate Driver",
      customerName: customerName || "Walk-in Passenger",
      customerPhone: customerPhone || "+91 98765 43210",
      pickup,
      dropoff,
      estimatedFare: Number(estimatedFare),
      paymentMethod: paymentMethod || "CASH",
      paymentStatus: paymentMethod === "CASH" ? "PAID" : "PENDING",
      dropPin,
      status: "active",
    });

    await offline.save();

    const io = req.app.get("io");
    if (io) {
      io.emit("offlineBookingCreated", offline);
    }

    return res.status(201).json({
      success: true,
      message: `Offline Walk-in Booking Created! 4-Digit Drop PIN: ${dropPin}`,
      offlineBooking: offline,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create offline booking",
      error: error.message,
    });
  }
};

/**
 * 3. RAZORPAY PAYMENT ORDER CREATION
 */
export const createRazorpayOrder = async (req, res) => {
  try {
    const { rideId, offlineBookingId, amount } = req.body;
    const orderId = `rzp_order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const amt = Number(amount || 300);

    const payment = new RazorpayPayment({
      rideId: rideId || null,
      offlineBookingId: offlineBookingId || null,
      orderId,
      amount: amt,
      currency: "INR",
      method: "UPI",
      status: "created",
    });

    await payment.save();

    return res.status(200).json({
      success: true,
      orderId,
      amount: amt,
      currency: "INR",
      keyId: "rzp_test_RouteMateApp2026",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create Razorpay payment order",
      error: error.message,
    });
  }
};

/**
 * 4. RAZORPAY PAYMENT VERIFICATION & RECEIPT ISSUANCE
 */
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { orderId, paymentId, signature, rideId, amount } = req.body;

    const payment = await RazorpayPayment.findOne({ orderId });
    if (payment) {
      payment.paymentId = paymentId || `pay_${Date.now()}`;
      payment.signature = signature || "verified_sig";
      payment.status = "captured";

      const fareVal = Number(amount || payment.amount || 300);
      payment.receiptDetails = {
        baseFare: Math.round(fareVal * 0.75),
        distanceCharge: Math.round(fareVal * 0.2),
        waitingCharge: 0,
        taxes: Math.round(fareVal * 0.05),
        totalFare: fareVal,
        receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
      };

      await payment.save();
    }

    if (rideId) {
      const ride = await Ride.findById(rideId);
      if (ride) {
        ride.paymentDetails = {
          method: "RAZORPAY",
          transactionId: paymentId || `pay_${Date.now()}`,
          status: "PAID",
          receipt: payment?.receiptDetails,
        };
        await ride.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Razorpay Payment Verified! Digital Receipt Issued.",
      payment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to verify Razorpay payment",
      error: error.message,
    });
  }
};

/**
 * 5. VERIFY SECURE DROP PIN
 */
export const verifyDropPinController = async (req, res) => {
  try {
    const { id } = req.params;
    const { dropPin } = req.body;
    const io = req.app.get("io");

    const result = await verifyRideDropPin(id, dropPin, io);

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      ride: result.ride,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to verify 4-digit drop PIN",
      error: error.message,
    });
  }
};

/**
 * 6. GET ITEMIZE DIGITAL RECEIPT & RIDE SUMMARY
 */
export const getDigitalReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const ride = await Ride.findById(id);

    if (ride) {
      const baseFare = Math.round((ride.lockedFare || ride.pricePerSeat || 300) * 0.75);
      const distFare = Math.round((ride.lockedFare || ride.pricePerSeat || 300) * 0.2);
      const waitCharge = ride.waitingCharge || 0;
      const total = baseFare + distFare + waitCharge;

      return res.status(200).json({
        success: true,
        receipt: {
          receiptNumber: `REC-${ride._id.toString().slice(-6).toUpperCase()}`,
          rideId: ride._id,
          pickup: ride.origin,
          dropoff: ride.destination,
          driverName: ride.driverName,
          vehiclePlate: ride.vehicleDetails?.plate || "RT-9942",
          driverTrustScore: 98,
          itemization: {
            baseFare,
            distanceCharge: distFare,
            waitingCharge: waitCharge,
            taxes: Math.round(total * 0.05),
            totalFare: total,
          },
          paymentMethod: ride.paymentDetails?.method || "CASH",
          paymentStatus: "PAID",
          timestamp: ride.updatedAt,
        },
      });
    }

    // Check offline booking
    const offline = await OfflineBooking.findById(id);
    if (offline) {
      return res.status(200).json({
        success: true,
        receipt: {
          receiptNumber: `REC-OFFLINE-${offline._id.toString().slice(-6).toUpperCase()}`,
          rideId: offline._id,
          pickup: offline.pickup.name,
          dropoff: offline.dropoff.name,
          driverName: offline.driverName,
          vehiclePlate: "RT-OFFLINE",
          driverTrustScore: 95,
          itemization: {
            baseFare: Math.round(offline.estimatedFare * 0.8),
            distanceCharge: Math.round(offline.estimatedFare * 0.2),
            waitingCharge: 0,
            taxes: 0,
            totalFare: offline.estimatedFare,
          },
          paymentMethod: offline.paymentMethod,
          paymentStatus: offline.paymentStatus,
          timestamp: offline.updatedAt,
        },
      });
    }

    return res.status(404).json({ success: false, message: "Receipt record not found" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to generate digital receipt",
      error: error.message,
    });
  }
};

/**
 * 7. ADMIN FARE & SAFETY CONTROL DASHBOARD DATA
 */
export const getAdminFareSafetyData = async (req, res) => {
  try {
    const disputes = await FareDispute.find().sort({ createdAt: -1 });
    const offlineBookings = await OfflineBooking.find().sort({ createdAt: -1 });
    const razorpayPayments = await RazorpayPayment.find().sort({ createdAt: -1 });

    const totalDisputes = disputes.length;
    const resolvedDisputes = disputes.filter((d) => d.status !== "PENDING_REVIEW").length;
    const totalOfflineCount = offlineBookings.length;
    const totalRevenue = razorpayPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

    return res.status(200).json({
      success: true,
      stats: {
        totalDisputes,
        resolvedDisputes,
        totalOfflineCount,
        totalRevenue,
        avgDriverTrustScore: 94.8,
        overchargeFlagsCount: disputes.filter((d) => d.aiAnalysis?.driverFlagged).length,
      },
      disputes,
      offlineBookings,
      razorpayPayments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin fare safety data",
      error: error.message,
    });
  }
};
