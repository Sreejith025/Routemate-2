import express from "express";
import {
  reportFareDispute,
  createOfflineBooking,
  createRazorpayOrder,
  verifyRazorpayPayment,
  verifyDropPinController,
  getDigitalReceipt,
  getAdminFareSafetyData,
} from "../controllers/fareProtectionController.js";

const router = express.Router();

router.post("/report-dispute", reportFareDispute);
router.post("/offline-booking", createOfflineBooking);
router.post("/razorpay/create-order", createRazorpayOrder);
router.post("/razorpay/verify", verifyRazorpayPayment);
router.post("/verify-drop-pin/:id", verifyDropPinController);
router.get("/receipt/:id", getDigitalReceipt);
router.get("/admin/dashboard", getAdminFareSafetyData);

export default router;
