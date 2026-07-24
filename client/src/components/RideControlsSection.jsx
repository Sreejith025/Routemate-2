import React, { useState, useEffect } from "react";
import {
  LogOut,
  Car,
  Clock,
  Zap,
  Navigation,
  CheckCircle2,
  X,
  AlertTriangle,
  Loader2,
  MapPin,
  Sparkles,
} from "lucide-react";
import { leaveSharedRideApi, respondSwitchApi } from "../services/api";
import socket from "../services/socket";
import toast from "react-hot-toast";

const RideControlsSection = ({ ride, passengerId, onRideUpdated }) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [searching, setSearching] = useState(false);
  const [switchProposal, setSwitchProposal] = useState(null);
  const [switchSuccess, setSwitchSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [driverNotification, setDriverNotification] = useState(null);

  // Listen to Socket.IO driver notifications and switch events
  useEffect(() => {
    if (!ride?._id) return;

    socket.emit("joinRide", { rideId: ride._id });

    const handleDriverNotification = (data) => {
      setDriverNotification(data);
      toast(data.message || "🚕 Driver Transfer Alert!", { icon: "🔔" });
    };

    const handleSwitchSuggestion = (data) => {
      setSwitchProposal(data);
      setSearching(false);
      setShowConfirmModal(false);
    };

    const handleSwitchAccepted = () => {
      setSwitchSuccess(true);
      setSwitchProposal(null);
      toast.success("Taxi switch completed successfully!");
      if (onRideUpdated) onRideUpdated();
    };

    socket.on("driverTransferNotification", handleDriverNotification);
    socket.on("switchSuggestion", handleSwitchSuggestion);
    socket.on("switchAccepted", handleSwitchAccepted);

    return () => {
      socket.off("driverTransferNotification", handleDriverNotification);
      socket.off("switchSuggestion", handleSwitchSuggestion);
      socket.off("switchAccepted", handleSwitchAccepted);
    };
  }, [ride?._id, onRideUpdated]);

  const handleStartSearch = async () => {
    try {
      setSearching(true);
      setErrorMsg(null);

      const res = await leaveSharedRideApi(ride._id, { passengerId });

      if (res.data?.success && res.data?.switchData) {
        setSwitchProposal(res.data.switchData);
        setShowConfirmModal(false);
      } else {
        setErrorMsg(res.data?.message || "No suitable nearby taxi found within 2 km.");
      }
    } catch (err) {
      console.error("Leave shared ride error:", err);
      const msg =
        err.response?.data?.message ||
        "No nearby RouteMate taxis found within 2 km matching your route.";
      setErrorMsg(msg);
    } finally {
      setSearching(false);
    }
  };

  const handleAcceptSwitch = async () => {
    try {
      setSearching(true);
      await respondSwitchApi(ride._id, { action: "accept" });
      setSwitchSuccess(true);
      setSwitchProposal(null);
      toast.success("Accepted switch! Transfer point set.");
      if (onRideUpdated) onRideUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error confirming switch");
    } finally {
      setSearching(false);
    }
  };

  const handleDeclineSwitch = async () => {
    try {
      await respondSwitchApi(ride._id, { action: "decline" });
      setSwitchProposal(null);
      setShowConfirmModal(false);
      toast("Staying in current ride", { icon: "🚕" });
    } catch (err) {
      console.error("Decline switch error:", err);
      setSwitchProposal(null);
      setShowConfirmModal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Ride Controls Section Card */}
      <div className="glass-card border border-slate-800 rounded-3xl p-6 space-y-4 bg-slate-900/90 backdrop-blur-xl">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Navigation className="w-5 h-5 text-indigo-400" />
          <span>Ride Controls</span>
        </h3>

        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Leave Shared Ride</h4>
              <p className="text-xs text-slate-400 mt-0.5 max-w-md">
                Leave the current shared ride and continue your journey using another RouteMate taxi if available.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 flex items-center justify-center space-x-2 transition-all hover:scale-105 shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span>Leave Shared Ride</span>
          </button>
        </div>
      </div>

      {/* Driver Notification Live Alert Card */}
      {driverNotification && (
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 space-y-1.5 animate-fadeIn">
          <div className="flex items-center space-x-2 font-bold text-xs">
            <Zap className="w-4 h-4 text-indigo-400 fill-current animate-pulse" />
            <span>Driver Transfer Alert Notification</span>
          </div>
          <p className="text-xs text-slate-200">{driverNotification.message}</p>
          {driverNotification.transferPoint?.address && (
            <p className="text-[11px] text-indigo-300 font-mono">
              📍 Location: {driverNotification.transferPoint.address}
            </p>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl relative animate-scaleUp">
            <button
              type="button"
              onClick={() => setShowConfirmModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <LogOut className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Leave Shared Ride?</h3>
                <p className="text-xs text-slate-400">RouteMate Smart Taxi Switching</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Would you like to continue your journey in another RouteMate taxi? We'll search for nearby taxis travelling towards your destination.
            </p>

            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartSearch}
                disabled={searching}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all hover:scale-105"
              >
                {searching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Searching Taxis...</span>
                  </>
                ) : (
                  <>
                    <Car className="w-4 h-4" />
                    <span>Find Another Taxi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* "A Better Ride Found!" Switch Proposal Modal */}
      {switchProposal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative animate-scaleUp">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">A Better Ride Found!</h3>
                <p className="text-xs text-slate-400">
                  Target Driver: <strong className="text-emerald-400">{switchProposal.targetDriverName}</strong> ({switchProposal.targetVehiclePlate})
                </p>
              </div>
            </div>

            {/* ETA Comparison Metrics */}
            <div className="grid grid-cols-3 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Current ETA</p>
                <p className="text-lg font-black text-rose-400 font-mono mt-1">
                  {switchProposal.currentETA || 45} mins
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">New ETA</p>
                <p className="text-lg font-black text-emerald-400 font-mono mt-1">
                  {switchProposal.newETA || 28} mins
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">You Save</p>
                <p className="text-lg font-black text-indigo-400 font-mono mt-1">
                  {switchProposal.timeSaved || 17} mins
                </p>
              </div>
            </div>

            {/* Transfer Point Info */}
            {switchProposal.transferPoint && (
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-indigo-500/30 text-xs space-y-1">
                <p className="text-indigo-400 font-bold flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> Transfer Point Rendezvous
                </p>
                <p className="text-slate-300 font-medium">
                  {switchProposal.transferPoint.address}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleDeclineSwitch}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Stay In Current Ride
              </button>
              <button
                type="button"
                onClick={handleAcceptSwitch}
                disabled={searching}
                className="px-6 py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition-all hover:scale-105"
              >
                {searching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Accept Switch</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {switchSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-2 animate-fadeIn">
          <div className="flex items-center space-x-2 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Taxi Switch Successfully Confirmed!</span>
          </div>
          <p className="text-xs text-slate-300">
            Proceed to the transfer point on your live map to board your new RouteMate taxi.
          </p>
        </div>
      )}
    </div>
  );
};

export default RideControlsSection;
