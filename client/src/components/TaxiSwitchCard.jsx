import React, { useState } from "react";
import { Zap, Clock, ShieldCheck, ArrowRight, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { respondSwitchApi } from "../services/api";
import toast from "react-hot-toast";

const TaxiSwitchCard = ({
  rideId,
  passengerName = "Passenger",
  currentTaxi = "Taxi A (Toyota Prius • RT-8842)",
  targetTaxi = "Taxi B (Tesla Model 3 • EV-9901)",
  driverBName = "Marcus Vance",
  delayReason = "Heavy multi-vehicle crash on Expressway (+18m delay)",
  timeSaved = 14,
  onAccept,
  onDecline,
}) => {
  const [status, setStatus] = useState("pending"); // pending, accepting, accepted, declined

  const handleAccept = async () => {
    setStatus("accepting");
    try {
      if (rideId) {
        await respondSwitchApi(rideId, { action: "accept" });
      }
      setStatus("accepted");
      toast.success("Taxi switch accepted! Updated in database.");
      if (onAccept) onAccept();
    } catch (err) {
      console.error("Switch error:", err);
      toast.error("Failed to execute taxi switch");
      setStatus("pending");
    }
  };

  const handleDecline = async () => {
    try {
      if (rideId) {
        await respondSwitchApi(rideId, { action: "decline" });
      }
      setStatus("declined");
      toast("Taxi switch declined.");
      if (onDecline) onDecline();
    } catch (err) {
      console.error("Switch error:", err);
      setStatus("declined");
    }
  };

  if (status === "accepted") {
    return (
      <div className="bg-gradient-to-r from-emerald-950/90 to-slate-900 border border-emerald-500/40 rounded-2xl p-6 shadow-2xl animate-fade-in text-white">
        <div className="flex items-center space-x-3 text-emerald-400 font-semibold mb-2">
          <CheckCircle2 className="w-6 h-6" />
          <span className="text-lg">Taxi Switch Successfully Executed!</span>
        </div>
        <p className="text-sm text-slate-300">
          Passenger <strong className="text-white">{passengerName}</strong> is transferring to{" "}
          <strong className="text-emerald-300">{targetTaxi}</strong> with driver{" "}
          <strong className="text-white">{driverBName}</strong>.
        </p>
        <div className="mt-4 flex items-center gap-4 bg-emerald-900/30 p-3 rounded-xl border border-emerald-500/20 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-300">
            <Clock className="w-4 h-4" />
            <span>ETA Revised: -{timeSaved} minutes faster</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-300">
            <ShieldCheck className="w-4 h-4" />
            <span>No disruption to original Passenger A</span>
          </div>
        </div>
      </div>
    );
  }

  if (status === "declined") {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 text-slate-400 text-sm flex items-center justify-between">
        <span>Taxi switch declined. Continuing on current route with Taxi A.</span>
        <button
          onClick={() => setStatus("pending")}
          className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Re-evaluate
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/95 border-2 border-amber-500/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Header Banner */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                AI Recommendation
              </span>
              <span className="text-xs text-slate-400 font-mono">LIVE MATCH</span>
            </div>
            <h3 className="text-lg font-bold text-white mt-0.5">Intelligent Taxi Switch Available</h3>
          </div>
        </div>

        <div className="text-right">
          <span className="text-2xl font-black text-emerald-400 font-mono">-{timeSaved} MIN</span>
          <p className="text-[11px] text-slate-400">ETA Time Savings</p>
        </div>
      </div>

      {/* Reason Card */}
      <div className="my-4 bg-slate-950/70 rounded-xl p-3.5 border border-slate-800/80 flex items-start space-x-3 text-xs text-slate-300">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white">Traffic Alert Trigger:</span> {delayReason}
        </div>
      </div>

      {/* Workflow Switch Visualiser Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4 items-center">
        {/* Current Vehicle */}
        <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
          <p className="text-[11px] text-slate-400 uppercase font-semibold">Current Ride</p>
          <p className="text-sm font-bold text-white truncate">{currentTaxi}</p>
          <p className="text-xs text-slate-400">Passenger: {passengerName}</p>
        </div>

        {/* Switch Connector Icon */}
        <div className="flex flex-col items-center justify-center text-amber-400">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30 mb-1">
            <ArrowRight className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold tracking-wide uppercase text-amber-300">Mid-Ride Switch</span>
        </div>

        {/* Target Vehicle */}
        <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/30">
          <p className="text-[11px] text-emerald-400 uppercase font-semibold">Recommended Nearby Taxi</p>
          <p className="text-sm font-bold text-white truncate">{targetTaxi}</p>
          <p className="text-xs text-emerald-300">Driver: {driverBName}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center text-xs text-slate-400 space-x-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Passenger fare guaranteed unchanged</span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleDecline}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Decline
          </button>

          <button
            onClick={handleAccept}
            disabled={status === "accepting"}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 shadow-lg shadow-emerald-600/30 transition-all hover:scale-105"
          >
            {status === "accepting" ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Switching Taxis...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-current" />
                <span>Accept Taxi Switch</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaxiSwitchCard;
