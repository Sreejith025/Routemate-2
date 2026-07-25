import {
  verifyOfflineCashPayment,
  verifyDriverLockoutPin,
  executeInstantOnlinePayout,
  monitorAntiStallingTelemetry,
} from "../services/AntiExtortionEngine.js";

/**
 * CORE FUNCTION 1: Verify Offline Cash Amount & Trigger Overcharging Alert if inflated
 */
export const verifyCashAmount = async (req, res) => {
  try {
    const { rideId, cashCollected } = req.body;
    const io = req.app.get("io");

    const result = await verifyOfflineCashPayment(rideId, cashCollected, io);

    return res.status(200).json({
      success: result.success,
      isOvercharging: result.isOvercharging || false,
      message: result.message,
      data: result,
    });
  } catch (error) {
    console.error("Controller Error - verifyCashAmount:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to verify cash payment",
    });
  }
};

/**
 * CORE FUNCTION 1: Unlock Driver App with 4-Digit Passenger PIN
 */
export const unlockDriverPin = async (req, res) => {
  try {
    const { rideId, enteredPin } = req.body;
    const io = req.app.get("io");

    const result = await verifyDriverLockoutPin(rideId, enteredPin, io);

    return res.status(200).json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    console.error("Controller Error - unlockDriverPin:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to unlock driver app",
    });
  }
};

/**
 * CORE FUNCTION 2: 60-Second Instant Online UPI Payout
 */
export const triggerInstantPayout = async (req, res) => {
  try {
    const { rideId, totalFareAmount, driverId, driverUpiId } = req.body;
    const io = req.app.get("io");

    const result = await executeInstantOnlinePayout(
      rideId,
      totalFareAmount,
      driverId,
      driverUpiId,
      io
    );

    return res.status(200).json({
      success: true,
      message: result.message,
      transaction: result.transaction,
    });
  } catch (error) {
    console.error("Controller Error - triggerInstantPayout:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to execute instant payout",
    });
  }
};

/**
 * CORE FUNCTION 3: 180-Second Anti-Stalling Telemetry Engine Check
 */
export const checkStallingTelemetry = async (req, res) => {
  try {
    const { rideId, driverId, currentLat, currentLng, speedMps, stationarySeconds } = req.body;
    const io = req.app.get("io");

    const result = await monitorAntiStallingTelemetry(
      rideId,
      driverId,
      currentLat,
      currentLng,
      speedMps || 0,
      stationarySeconds || 185,
      io
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Controller Error - checkStallingTelemetry:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to check anti-stalling telemetry",
    });
  }
};
