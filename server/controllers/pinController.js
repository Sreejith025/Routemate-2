import {
  verifyPickupPinService,
  verifyDropPinService,
  reportOverchargeAndFreezeDriver,
  unfreezeDriverWithEmergencyPin,
} from "../services/PinVerificationService.js";

/**
 * FEATURE 1: Verify Pickup PIN
 */
export const verifyPickupPin = async (req, res) => {
  try {
    const { rideId, enteredPin, driverId } = req.body;
    const io = req.app.get("io");

    const result = await verifyPickupPinService(rideId, enteredPin, driverId, io);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Controller Error - verifyPickupPin:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to verify Pickup PIN",
    });
  }
};

/**
 * FEATURE 2: Verify Drop PIN
 */
export const verifyDropPin = async (req, res) => {
  try {
    const { rideId, enteredPin, driverId } = req.body;
    const io = req.app.get("io");

    const result = await verifyDropPinService(rideId, enteredPin, driverId, io);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Controller Error - verifyDropPin:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to verify Drop PIN",
    });
  }
};

/**
 * FEATURE 3 & 4: Report Overcharge & Freeze Driver
 */
export const reportOvercharge = async (req, res) => {
  try {
    const { rideId, passengerId, demandedAmount } = req.body;
    const io = req.app.get("io");

    const result = await reportOverchargeAndFreezeDriver(rideId, passengerId, demandedAmount, io);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Controller Error - reportOvercharge:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to report overcharge",
    });
  }
};

/**
 * FEATURE 5: Unfreeze Driver with Emergency PIN
 */
export const unfreezeDriver = async (req, res) => {
  try {
    const { rideId, driverId, enteredPin } = req.body;
    const io = req.app.get("io");

    const result = await unfreezeDriverWithEmergencyPin(rideId, driverId, enteredPin, io);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Controller Error - unfreezeDriver:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to unfreeze driver",
    });
  }
};
