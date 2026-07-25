import React, { useState } from "react";
import { Lock, AlertTriangle, ShieldCheck, CheckCircle2, DollarSign, Key, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

/**
 * CORE FUNCTION 1: Offline Cash Verification & Driver App Lockout Modal
 */
const OfflineCashModal = ({
  rideId,
  appLockedFare = 100,
  isDriver = false,
  dropPin = "7182",
  onVerifyCash,
  onUnlockPin,
  isLocked = false,
  overchargingAlertData = null,
}) => {
  const [cashInput, setCashInput] = useState(appLockedFare);
  const [pinInput, setPinInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmitCash = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onVerifyCash(Number(cashInput));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onUnlockPin(pinInput);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // PASSENGER OVERCHARGING ALERT MODAL
  if (!isDriver && overchargingAlertData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
        <div className="bg-slate-900 border-2 border-rose-500/80 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 text-white">
          <div className="flex items-center space-x-3 text-rose-400">
            <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase tracking-wider">
                Extortion Protection Triggered
              </span>
              <h3 className="text-xl font-black text-white mt-1">🚨 OVERCHARGING ALERT!</h3>
            </div>
          </div>

          <p className="text-xs text-slate-300">
            Driver entered <strong className="text-rose-400 font-mono">₹{overchargingAlertData.inputAmount}</strong>, which exceeds your App Locked Guaranteed Fare of <strong className="text-emerald-400 font-mono">₹{overchargingAlertData.lockedFare}</strong>!
          </p>

          <div className="bg-rose-950/40 p-4 rounded-2xl border border-rose-500/30 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">App Confirmed Fare:</span>
              <strong className="text-emerald-400 font-mono">₹{overchargingAlertData.lockedFare}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Driver Demanded Input:</span>
              <strong className="text-rose-400 font-mono">₹{overchargingAlertData.inputAmount}</strong>
            </div>
            <div className="flex justify-between border-t border-rose-500/30 pt-2 font-bold text-rose-300">
              <span>Unapproved Overcharge Extra:</span>
              <span className="font-mono text-rose-400">+₹{overchargingAlertData.extraDemanded}</span>
            </div>
          </div>

          <div className="bg-emerald-950/40 p-4 rounded-2xl border border-emerald-500/30 text-center space-y-2">
            <span className="text-[10px] text-emerald-300 font-bold uppercase block">Your 4-Digit Passenger Verification PIN</span>
            <span className="text-3xl font-black tracking-widest font-mono text-emerald-400">{dropPin || overchargingAlertData?.dropPin || "9365"}</span>
            <p className="text-[11px] text-slate-300 mt-1">
              Read this PIN <strong className="text-emerald-400">({dropPin || overchargingAlertData?.dropPin || "9365"})</strong> aloud to the driver. The driver must enter this 4-digit PIN on their <strong className="text-white">Driver App / Driver Dashboard</strong> to unlock their app.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-800 text-xs">
            <a
              href="/driver"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md flex items-center gap-1"
            >
              Open Driver Screen to Enter PIN →
            </a>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="text-xs text-slate-400 hover:text-white underline"
            >
              Dismiss Alert
            </button>
          </div>
        </div>
      </div>
    );
  }

  // DRIVER APP LOCKED SCREEN
  if (isDriver && isLocked) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg animate-fade-in">
        <div className="bg-slate-900 border-2 border-rose-600 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 text-white">
          <div className="flex items-center space-x-3 text-rose-500">
            <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40">
              <Lock className="w-8 h-8 animate-bounce" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase">
                DRIVER APP LOCKED
              </span>
              <h3 className="text-xl font-black text-white mt-1">Overcharging Penalty Lock</h3>
            </div>
          </div>

          <p className="text-xs text-slate-300">
            Your entered cash amount exceeded the App Locked Fare (₹{appLockedFare}). You cannot accept new rides until you enter the passenger's 4-digit verification PIN.
          </p>

          <form onSubmit={handleVerifyPin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Enter Passenger 4-Digit PIN
              </label>
              <div className="relative">
                <Key className="w-5 h-5 text-indigo-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter 4-digit PIN..."
                  className="w-full bg-slate-950 border border-indigo-500/40 rounded-xl pl-11 pr-4 py-2.5 text-center text-xl font-mono tracking-widest font-black text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || pinInput.length < 4}
              className="w-full py-3 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-lg shadow-emerald-500/30 flex items-center justify-center space-x-2 transition-all"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>Verify PIN & Unlock Driver App</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // DRIVER DESTINATION CASH INPUT MODAL
  if (isDriver) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-white">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <span>Destination Offline Cash Collection</span>
          </h4>
          <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/30">
            APP LOCKED: ₹{appLockedFare}
          </span>
        </div>

        <form onSubmit={handleSubmitCash} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
              Exact Cash Collected from Passenger (₹)
            </label>
            <input
              type="number"
              value={cashInput}
              onChange={(e) => setCashInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-lg font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/30 transition-all"
          >
            {loading ? "Verifying Cash..." : "Submit Cash Collected"}
          </button>
        </form>
      </div>
    );
  }

  return null;
};

export default OfflineCashModal;
