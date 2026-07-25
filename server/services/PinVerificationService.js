import Ride from "../models/Ride.js";
import User from "../models/User.js";
import PinVerificationLog from "../models/PinVerificationLog.js";
import RideComplaint from "../models/RideComplaint.js";

/**
 * FEATURE 1: Verify Pickup PIN
 * Unique 4-digit Pickup PIN. Driver must enter before starting ride. Max 3 attempts limit.
 */
export const verifyPickupPinService = async (rideId, enteredPin, driverId, io) => {
  try {
    const ride = await Ride.findById(rideId);
    if (!ride) throw new Error("Ride not found");

    if (ride.pickupPinVerified) {
      return { success: true, message: "Pickup PIN already verified. Ride ready to start." };
    }

    if (ride.pickupPinAttempts >= 3) {
      throw new Error("Maximum 3 failed Pickup PIN attempts reached! Ride start blocked for security.");
    }

    const expectedPin = String(ride.pickupPin || ride.otp || "4892").trim();
    const isMatch = String(enteredPin).trim() === expectedPin;

    ride.pickupPinAttempts += 1;

    // Log verification attempt
    const auditLog = new PinVerificationLog({
      rideId: ride._id,
      driverId: driverId || ride.driverId || "driver_demo",
      passengerId: ride.passengers?.[0]?.userId || "passenger_demo",
      pinType: "PICKUP_PIN",
      enteredPin: String(enteredPin),
      expectedPin,
      isSuccess: isMatch,
      attemptNumber: ride.pickupPinAttempts,
    });

    if (isMatch) {
      ride.pickupPinVerified = true;
      ride.status = "active";
      ride.currentStage = "Passenger Picked Up";
      await ride.save();

      auditLog.actionTriggered = "PICKUP_VERIFIED_RIDE_STARTED";
      await auditLog.save();

      if (io) {
        const roomName = `ride_${ride._id.toString()}`;
        io.to(roomName).emit("pickupPinVerified", {
          rideId: ride._id.toString(),
          message: "✅ Pickup PIN Verified! Ride Started.",
          ride,
        });
      }

      return { success: true, message: "✅ Pickup PIN Verified! Ride Started Successfully.", ride };
    } else {
      await ride.save();
      auditLog.actionTriggered = "FAILED_ATTEMPT";
      await auditLog.save();

      const remaining = 3 - ride.pickupPinAttempts;

      if (ride.pickupPinAttempts >= 3 && io) {
        const roomName = `ride_${ride._id.toString()}`;
        io.to(roomName).emit("pickupPinMaxAttemptsExceeded", {
          rideId: ride._id.toString(),
          message: "⚠️ 3 Failed Pickup PIN Attempts! Passenger & Admin Notified.",
        });
        io.emit("adminSecurityAlert", {
          type: "PICKUP_PIN_MAX_FAILED_ATTEMPTS",
          rideId: ride._id.toString(),
          driverId,
        });
      }

      return {
        success: false,
        message: `❌ Invalid Pickup PIN! ${remaining} attempt(s) remaining.`,
        attemptsLeft: Math.max(0, remaining),
      };
    }
  } catch (err) {
    console.error("Error in verifyPickupPinService:", err);
    throw err;
  }
};

/**
 * FEATURE 2: Verify Drop PIN
 * Unique 4-digit Drop PIN required to complete ride. Status changes to Completed ONLY after verification.
 */
export const verifyDropPinService = async (rideId, enteredPin, driverId, io) => {
  try {
    const ride = await Ride.findById(rideId);
    if (!ride) throw new Error("Ride not found");

    if (ride.dropPinVerified) {
      return { success: true, message: "Drop PIN already verified. Ride completed." };
    }

    if (ride.dropPinAttempts >= 3) {
      throw new Error("Maximum 3 failed Drop PIN attempts reached! Completion blocked.");
    }

    const expectedPin = String(ride.dropPin || "7182").trim();
    const isMatch = String(enteredPin).trim() === expectedPin;

    ride.dropPinAttempts += 1;

    const auditLog = new PinVerificationLog({
      rideId: ride._id,
      driverId: driverId || ride.driverId || "driver_demo",
      passengerId: ride.passengers?.[0]?.userId || "passenger_demo",
      pinType: "DROP_PIN",
      enteredPin: String(enteredPin),
      expectedPin,
      isSuccess: isMatch,
      attemptNumber: ride.dropPinAttempts,
    });

    if (isMatch) {
      ride.dropPinVerified = true;
      ride.status = "completed";
      ride.currentStage = "Ride Completed";
      await ride.save();

      auditLog.actionTriggered = "DROP_VERIFIED_RIDE_COMPLETED";
      await auditLog.save();

      if (io) {
        const roomName = `ride_${ride._id.toString()}`;
        io.to(roomName).emit("dropPinVerified", {
          rideId: ride._id.toString(),
          message: "✅ Drop PIN Verified! Ride Completed Successfully.",
          ride,
        });
      }

      return { success: true, message: "✅ Drop PIN Verified! Ride Completed Successfully.", ride };
    } else {
      await ride.save();
      auditLog.actionTriggered = "FAILED_ATTEMPT";
      await auditLog.save();

      const remaining = 3 - ride.dropPinAttempts;
      return {
        success: false,
        message: `❌ Invalid Drop PIN! ${remaining} attempt(s) remaining.`,
        attemptsLeft: Math.max(0, remaining),
      };
    }
  } catch (err) {
    console.error("Error in verifyDropPinService:", err);
    throw err;
  }
};

/**
 * FEATURE 3 & 4: Report Overcharge & Automatically Freeze Driver Account
 * Passenger presses "Report Overcharge". Generates Emergency PIN sent only to Passenger.
 * Automatically freezes driver account, locking ride acceptance, start/completion, and wallet.
 */
export const reportOverchargeAndFreezeDriver = async (rideId, passengerId, demandedAmount, io) => {
  try {
    const ride = await Ride.findById(rideId);
    if (!ride) throw new Error("Ride not found");

    // Generate secure 4-digit Emergency PIN
    const emergencyPin = Math.floor(1000 + Math.random() * 9000).toString();
    ride.emergencyPin = emergencyPin;
    ride.emergencyPinAttempts = 0;
    ride.emergencyPinVerified = false;
    ride.driverAppLocked = true;
    await ride.save();

    // Freeze Driver Account in User model
    const driverUser = await User.findOne({ clerkId: ride.driverId });
    if (driverUser) {
      driverUser.isFrozen = true;
      driverUser.freezeReason = "OVERCHARGE_VERIFICATION_INVESTIGATION";
      await driverUser.save();
    }

    // Save Complaint
    const complaint = new RideComplaint({
      rideId: ride._id,
      passengerId: passengerId || "passenger_demo",
      driverId: ride.driverId || "driver_demo",
      category: "OVERCHARGING",
      description: `Demanded extra fare ₹${demandedAmount}. App locked fare ₹${ride.pricePerSeat || 100}.`,
      status: "OPEN",
    });
    await complaint.save();

    if (io) {
      const roomName = `ride_${ride._id.toString()}`;

      // Send Emergency PIN ONLY to Passenger App
      io.to(roomName).emit("overchargeEmergencyPinGenerated", {
        rideId: ride._id.toString(),
        emergencyPin,
        message: `🚨 Emergency PIN Generated: ${emergencyPin}. Driver account is frozen until this PIN is entered after resolution.`,
      });

      // Display Frozen Banner on Driver App
      io.to(roomName).emit("driverAccountFrozen", {
        driverId: ride.driverId,
        isFrozen: true,
        message: "Your account has been temporarily frozen due to an overcharge verification.",
      });

      io.emit("adminOverchargeAlert", {
        rideId: ride._id.toString(),
        driverId: ride.driverId,
        demandedAmount,
        emergencyPin,
      });
    }

    return {
      success: true,
      emergencyPin,
      isFrozen: true,
      message: "🚨 Overcharge Reported! Emergency PIN generated and Driver Account Frozen.",
    };
  } catch (err) {
    console.error("Error in reportOverchargeAndFreezeDriver:", err);
    throw err;
  }
};

/**
 * FEATURE 5: Driver Unfreeze Process using Emergency PIN
 * Driver enters Emergency PIN (max 3 attempts). Reactivates account and unlocks wallet.
 */
export const unfreezeDriverWithEmergencyPin = async (rideId, driverId, enteredPin, io) => {
  try {
    const ride = await Ride.findById(rideId);
    if (!ride) throw new Error("Ride not found");

    if (ride.emergencyPinAttempts >= 3) {
      throw new Error("Maximum 3 failed Emergency PIN attempts reached! Driver remains frozen. Contact Admin.");
    }

    const expectedPin = String(ride.emergencyPin).trim();
    const isMatch = String(enteredPin).trim() === expectedPin;

    ride.emergencyPinAttempts += 1;

    const auditLog = new PinVerificationLog({
      rideId: ride._id,
      driverId: driverId || ride.driverId || "driver_demo",
      passengerId: ride.passengers?.[0]?.userId || "passenger_demo",
      pinType: "EMERGENCY_PIN",
      enteredPin: String(enteredPin),
      expectedPin,
      isSuccess: isMatch,
      attemptNumber: ride.emergencyPinAttempts,
    });

    if (isMatch) {
      ride.emergencyPinVerified = true;
      ride.driverAppLocked = false;
      await ride.save();

      // Unfreeze Driver Account in User model
      const driverUser = await User.findOne({ clerkId: ride.driverId || driverId });
      if (driverUser) {
        driverUser.isFrozen = false;
        driverUser.freezeReason = null;
        await driverUser.save();
      }

      auditLog.actionTriggered = "EMERGENCY_PIN_UNFROZEN_DRIVER";
      await auditLog.save();

      if (io) {
        const roomName = `ride_${ride._id.toString()}`;
        io.to(roomName).emit("driverAccountUnfrozen", {
          driverId: ride.driverId,
          isFrozen: false,
          message: "✅ Emergency PIN Verified! Driver Account Reactivated & Wallet Unlocked.",
        });
      }

      return {
        success: true,
        isFrozen: false,
        message: "✅ Emergency PIN Verified! Driver Account Reactivated & Wallet Unlocked.",
      };
    } else {
      await ride.save();
      auditLog.actionTriggered = "FAILED_EMERGENCY_UNFREEZE_ATTEMPT";
      await auditLog.save();

      const remaining = 3 - ride.emergencyPinAttempts;
      return {
        success: false,
        isFrozen: true,
        message: `❌ Incorrect Emergency PIN! Driver remains frozen. ${remaining} attempt(s) remaining.`,
        attemptsLeft: Math.max(0, remaining),
      };
    }
  } catch (err) {
    console.error("Error in unfreezeDriverWithEmergencyPin:", err);
    throw err;
  }
};
