import React, { useState } from "react";
import {
  LogOut,
  Zap,
  Clock,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Car,
  MapPin,
  RefreshCw,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { smartSwitchSearchApi, acceptSmartSwitchApi } from "../services/api";
import toast from "react-hot-toast";

const SmartSwitchModal = ({ rideId, onClose, onSwitchCompleted }) => {
  const [step, setStep] = useState("confirm"); // "confirm" | "searching" | "found" | "success"
  const [switchDetails, setSwitchDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleStartSearch = async () => {
    try {
      setStep("searching");
      setLoading(true);

      const res = await smartSwitchSearchApi({ rideId });

      if (res.data?.success && res.data?.switchDetails) {
        setSwitchDetails(res.data.switchDetails);
        setStep("found");
      } else {
        toast.error("No nearby RouteMate taxis found matching transfer criteria.");
        onClose();
      }
    } catch (err) {
      console.error("Smart switch search error:", err);
      toast.error(err.response?.data?.message || "Unable to find nearby taxi for switch.");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      setLoading(true);
      const res = await acceptSmartSwitchApi({
        switchId: switchDetails?.switchId,
        rideId,
      });

      if (res.data?.success) {
        setStep("success");
        toast.success("Taxi Switch Accepted! Route updated.");
        setTimeout(() => {
          if (onSwitchCompleted) onSwitchCompleted(res.data);
          onClose();
        }, 2200);
      }
    } catch (err) {
      console.error("Accept switch error:", err);
      toast.error("Failed to accept taxi switch.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-card border border-indigo-500/30 rounded-3xl p-6 md:p-8 max-w-lg w-full bg-gradient-to-b from-indigo-950/90 via-slate-900 to-slate-950 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Step 1: Initial Confirmation Modal */}
        {step === "confirm" && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <LogOut className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Leave Shared Ride?</h3>
                <span className="text-xs text-amber-400 font-medium">Smart Shared Ride Exit</span>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Would you like to continue your journey in another RouteMate taxi? We'll search for nearby taxis travelling towards your destination.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartSearch}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
              >
                Find Another Taxi
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Animated Searching State */}
        {step === "searching" && (
          <div className="py-8 text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 shadow-xl relative z-10">
                <RefreshCw className="w-8 h-8 animate-spin" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Searching Nearby Taxis...</h3>
              <p className="text-xs text-slate-400 mt-1">
                Evaluating ETAs, seat availability, and safe transfer points...
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Match Found Modal ("A Better Ride Found!") */}
        {step === "found" && switchDetails && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                <h3 className="text-xl font-black text-white">A Better Ride Found!</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Match Verified
              </span>
            </div>

            {/* Metrics Comparison Card */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Current ETA</span>
                <p className="text-lg font-extrabold text-slate-300 font-mono">{switchDetails.currentETA}</p>
              </div>
              <div className="space-y-1 border-x border-slate-800">
                <span className="text-[10px] text-emerald-400 uppercase font-semibold">New ETA</span>
                <p className="text-lg font-extrabold text-emerald-400 font-mono">{switchDetails.newETA}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-amber-400 uppercase font-semibold">You Save</span>
                <p className="text-lg font-extrabold text-amber-400 font-mono">{switchDetails.timeSaved}</p>
              </div>
            </div>

            {/* Transfer Point & Driver Details */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs text-slate-300">
              <div className="flex items-center space-x-2 text-indigo-400 font-bold">
                <Car className="w-4 h-4" />
                <span>Target Taxi: {switchDetails.targetVehicle} ({switchDetails.targetDriver})</span>
              </div>
              <div className="flex items-start space-x-2 text-slate-400 pt-1">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Transfer Point: <strong>{switchDetails.transferPoint?.name}</strong></span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between space-x-3 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                Stay In Current Ride
              </button>
              <button
                onClick={handleAccept}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
              >
                {loading ? "Processing..." : "Accept Switch"}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success Animation State */}
        {step === "success" && (
          <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 shadow-xl">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Taxi Switch Confirmed! 🎉</h3>
              <p className="text-xs text-emerald-300 mt-1">
                Fare updated automatically. Head to the rendezvous transfer point!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartSwitchModal;
