import React, { useState, useEffect } from "react";
import { Zap, ShieldCheck, AlertCircle, RefreshCw, Car } from "lucide-react";

/**
 * CORE FUNCTION 3: Anti-Stalling Telemetry Countdown & Backup Vehicle Reassignment Banner
 */
const AntiStallingBanner = ({
  stationarySeconds = 0,
  driverName = "Driver",
  onTriggerReassign,
  isReassigned = false,
  newDriverName = null,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(Math.max(0, 180 - stationarySeconds));

  useEffect(() => {
    if (isReassigned) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onTriggerReassign) onTriggerReassign();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isReassigned, onTriggerReassign]);

  if (isReassigned) {
    return (
      <div className="bg-gradient-to-r from-emerald-950/90 to-slate-900 border-2 border-emerald-500/50 rounded-3xl p-5 shadow-2xl text-white space-y-2 animate-fade-in">
        <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Anti-Stalling Telemetry Protection Activated!</span>
        </div>
        <p className="text-xs text-slate-300">
          Original driver remained stationary for &gt;180 seconds. The ride was stripped away with <strong className="text-emerald-400 font-bold">ZERO PENALTY FEE</strong> to you and reassigned to backup driver <strong className="text-white">{newDriverName || "Backup Driver"}</strong>!
        </p>
      </div>
    );
  }

  // Warning countdown banner
  if (stationarySeconds < 60 && secondsLeft > 120) {
    return null; // Normal movement
  }

  return (
    <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/90 border border-amber-500/40 rounded-3xl p-4 shadow-xl text-white space-y-2 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-amber-400 animate-spin" />
          <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wider">
            Anti-Stalling Telemetry Watch Active
          </span>
        </div>
        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/20 px-3 py-0.5 rounded-full border border-amber-500/30">
          {secondsLeft}s UNTIL AUTO-REASSIGNMENT
        </span>
      </div>

      <p className="text-xs text-slate-300">
        Driver <strong className="text-white">{driverName}</strong> has been stationary. If movement does not resume within <strong className="text-amber-400 font-mono">{secondsLeft} seconds</strong>, the ride will be automatically reassigned with <strong className="text-emerald-400">₹0 Penalty Fee</strong>.
      </p>
    </div>
  );
};

export default AntiStallingBanner;
