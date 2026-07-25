import React, { useState } from "react";
import { Key, ShieldCheck, AlertTriangle, Lock, Unlock, CheckCircle2, RefreshCw } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

/**
 * FEATURES 1-5: PIN Verification, Overcharge Reporting & Driver Freeze/Unfreeze Modal
 */
const PinVerificationModal = ({
  rideId,
  isDriver = false,
  pickupPin = "4892",
  dropPin = "7182",
  emergencyPin = null,
  isFrozen = false,
  pickupPinVerified = false,
  dropPinVerified = false,
  onRefresh,
}) => {
  const [pinInput, setPinInput] = useState("");
  const [demandedAmount, setDemandedAmount] = useState(150);
  const [loading, setLoading] = useState(false);
  const [showOverchargeDialog, setShowOverchargeDialog] = useState(false);

  // FEATURE 1: Verify Pickup PIN
  const handleVerifyPickupPin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/api/rides/pins/verify-pickup", {
        rideId,
        enteredPin: pinInput,
      });

      if (res.data.success) {
        toast.success(res.data.message);
        setPinInput("");
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to verify Pickup PIN");
    } finally {
      setLoading(false);
    }
  };

  // FEATURE 2: Verify Drop PIN
  const handleVerifyDropPin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/api/rides/pins/verify-drop", {
        rideId,
        enteredPin: pinInput,
      });

      if (res.data.success) {
        toast.success(res.data.message);
        setPinInput("");
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to verify Drop PIN");
    } finally {
      setLoading(false);
    }
  };

  // FEATURE 3 & 4: Report Overcharge & Freeze Driver
  const handleReportOvercharge = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/api/rides/pins/report-overcharge", {
        rideId,
        demandedAmount,
      });

      if (res.data.success) {
        toast.error("🚨 Overcharge Reported! Driver Account Frozen & Emergency PIN Generated.", { duration: 6000 });
        setShowOverchargeDialog(false);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to report overcharge");
    } finally {
      setLoading(false);
    }
  };

  // FEATURE 5: Unfreeze Driver with Emergency PIN
  const handleUnfreezeDriver = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/api/rides/pins/unfreeze-driver", {
        rideId,
        enteredPin: pinInput,
      });

      if (res.data.success) {
        toast.success("✅ Driver Account Reactivated & Wallet Unlocked!");
        setPinInput("");
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to unfreeze driver");
    } finally {
      setLoading(false);
    }
  };

  // PASSENGER VIEW: SHOW PICKUP PIN, DROP PIN & REPORT OVERCHARGE BUTTON
  if (!isDriver) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 text-white">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Passenger Verification PINs</span>
          </h4>
          <button
            type="button"
            onClick={() => setShowOverchargeDialog(true)}
            className="text-[11px] font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1 rounded-lg border border-rose-500/30 transition-colors"
          >
            🚨 Report Overcharge
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-slate-950 p-3 rounded-2xl border border-amber-500/30">
            <span className="text-[10px] text-amber-300 font-bold uppercase block">Feature 1: Pickup PIN</span>
            <span className="text-2xl font-black font-mono text-amber-400 tracking-widest">{pickupPin}</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">
              {pickupPinVerified ? "✓ Verified" : "Share with driver at pickup"}
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-emerald-500/30">
            <span className="text-[10px] text-emerald-300 font-bold uppercase block">Feature 2: Drop PIN</span>
            <span className="text-2xl font-black font-mono text-emerald-400 tracking-widest">{dropPin}</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">
              {dropPinVerified ? "✓ Verified" : "Share at destination"}
            </span>
          </div>
        </div>

        {emergencyPin && (
          <div className="bg-rose-950/40 p-3.5 rounded-2xl border border-rose-500/40 text-center space-y-1">
            <span className="text-[10px] text-rose-300 font-bold uppercase block">Feature 3: Emergency PIN (Overcharge Investigation)</span>
            <span className="text-3xl font-black font-mono text-rose-400 tracking-widest">{emergencyPin}</span>
            <p className="text-[10px] text-slate-300">
              Share with driver ONLY after overcharge dispute is resolved to unfreeze driver app.
            </p>
          </div>
        )}

        {/* OVERCHARGE REPORT DIALOG */}
        {showOverchargeDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border-2 border-rose-500 rounded-3xl p-6 max-w-md w-full space-y-4">
              <div className="flex items-center space-x-3 text-rose-400">
                <AlertTriangle className="w-7 h-7" />
                <h4 className="text-base font-bold text-white">Report Driver Overcharging</h4>
              </div>
              <p className="text-xs text-slate-300">
                Submitting an overcharge complaint will generate an Emergency PIN and **freeze the driver's account** immediately until resolved.
              </p>
              <form onSubmit={handleReportOvercharge} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Demanded Cash Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={demandedAmount}
                    onChange={(e) => setDemandedAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500"
                  >
                    {loading ? "Freezing Driver..." : "Submit Complaint & Freeze Driver"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOverchargeDialog(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // DRIVER VIEW: FROZEN ACCOUNT BANNER & PIN ENTRY FORMS
  return (
    <div className="space-y-4">
      {/* FEATURE 4 & 5: DRIVER FROZEN BANNER */}
      {isFrozen && (
        <div className="bg-gradient-to-r from-rose-950/90 via-slate-900 to-slate-950 border-2 border-rose-600 rounded-3xl p-5 text-white space-y-3">
          <div className="flex items-center space-x-3 text-rose-400">
            <Lock className="w-6 h-6 animate-bounce" />
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/30 text-rose-200 border border-rose-500/50 uppercase">
                FEATURE 4: ACCOUNT FROZEN
              </span>
              <h4 className="text-sm font-black text-white mt-0.5">
                Your account has been temporarily frozen due to an overcharge verification.
              </h4>
            </div>
          </div>

          <p className="text-xs text-slate-300">
            Wallet withdrawals, new ride requests, and ride completion are blocked. Enter the 4-digit Emergency PIN provided by the passenger to unfreeze.
          </p>

          <form onSubmit={handleUnfreezeDriver} className="flex items-center space-x-2">
            <input
              type="text"
              maxLength={4}
              placeholder="Enter Emergency PIN..."
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-rose-500/50 rounded-xl px-3 py-2 text-center font-mono font-bold text-white text-sm focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || pinInput.length < 4}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-md"
            >
              {loading ? "Unfreezing..." : "Verify Emergency PIN 🔓"}
            </button>
          </form>
        </div>
      )}

      {/* DRIVER PIN ENTRY FORM (PICKUP & DROP) */}
      {!isFrozen && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 text-white">
          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
            Driver Verification PIN Controls
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* FEATURE 1: ENTER PICKUP PIN */}
            <form onSubmit={handleVerifyPickupPin} className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-[11px] font-bold text-amber-300 block">Feature 1: Enter Pickup PIN to Start</span>
              <input
                type="text"
                maxLength={4}
                placeholder="4-digit Pickup PIN..."
                disabled={pickupPinVerified}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-center font-mono text-sm text-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={pickupPinVerified || loading}
                className="w-full py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 shadow-md"
              >
                {pickupPinVerified ? "✓ Pickup Verified" : "Verify Pickup PIN & Start Ride"}
              </button>
            </form>

            {/* FEATURE 2: ENTER DROP PIN */}
            <form onSubmit={handleVerifyDropPin} className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-[11px] font-bold text-emerald-300 block">Feature 2: Enter Drop PIN to Complete</span>
              <input
                type="text"
                maxLength={4}
                placeholder="4-digit Drop PIN..."
                disabled={dropPinVerified}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-center font-mono text-sm text-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={dropPinVerified || loading}
                className="w-full py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-md"
              >
                {dropPinVerified ? "✓ Drop Verified" : "Verify Drop PIN & Complete Ride"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PinVerificationModal;
