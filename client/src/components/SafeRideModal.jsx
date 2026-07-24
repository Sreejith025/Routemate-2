import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Frown,
  Car,
  AlertTriangle,
  X,
  CheckCircle2,
  Lock,
  ArrowRight,
  Clock,
  Send,
  RefreshCw,
  Zap,
  Star,
  Users,
  MapPin,
} from "lucide-react";
import {
  reportDiscomfortApi,
  safeLeaveSharedRideApi,
  triggerSOSApi,
  respondSwitchApi,
  getLiveTaxiAlternativesApi,
  switchToCandidateTaxiApi,
  cancelSharedRideApi,
} from "../services/api";
import socket from "../services/socket";
import toast from "react-hot-toast";

const DISCOMFORT_REASONS = [
  "Passenger is behaving aggressively",
  "Harassment",
  "Smoking",
  "Loud Behaviour",
  "Hygiene Issue",
  "Personal Reason",
  "Other",
];

const SafeRideModal = ({ isOpen, onClose, ride, passengerId, onRideUpdated }) => {
  const [activeStep, setActiveStep] = useState("MENU"); // MENU, REPORT, CANCEL_DIALOG, LIVE_TAXIS, TAXI_FOUND, NO_TAXI, SOS_CONFIRM, SOS_SUCCESS
  const [selectedReason, setSelectedReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  // Live candidate taxis state
  const [candidateTaxis, setCandidateTaxis] = useState([]);
  const [fetchingTaxis, setFetchingTaxis] = useState(false);
  const [switchingTaxiId, setSwitchingTaxiId] = useState(null);

  // Switch search result state
  const [switchResult, setSwitchResult] = useState(null);

  useEffect(() => {
    let interval = null;
    if (isOpen && activeStep === "LIVE_TAXIS" && ride?._id) {
      fetchCandidateTaxis();
      interval = setInterval(() => {
        fetchCandidateTaxis(true);
      }, 7000); // 7s live Socket / polling refresh
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, activeStep, ride?._id]);

  if (!isOpen || !ride) return null;

  const resetModal = () => {
    setActiveStep("MENU");
    setSelectedReason("");
    setDescription("");
    setSwitchResult(null);
    setCandidateTaxis([]);
    setLoading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  // Fetch Live Candidate Taxis (2 km radius, >=80% route match)
  const fetchCandidateTaxis = async (isBackground = false) => {
    try {
      if (!isBackground) setFetchingTaxis(true);
      const res = await getLiveTaxiAlternativesApi(ride._id, { radius: 2.0 });
      if (res.data?.success) {
        setCandidateTaxis(res.data.alternatives || []);
        if (res.data.alternatives?.length === 0 && !isBackground) {
          setActiveStep("NO_TAXI");
        }
      }
    } catch (err) {
      console.error("Error fetching candidate taxis:", err);
    } finally {
      setFetchingTaxis(false);
    }
  };

  // Switch to selected candidate taxi
  const handleSelectCandidateTaxi = async (candidateRideId) => {
    try {
      setSwitchingTaxiId(candidateRideId);
      const res = await switchToCandidateTaxiApi(ride._id, {
        targetRideId: candidateRideId,
        passengerId,
      });

      if (res.data?.success) {
        toast.success(res.data.message || "Successfully switched to new taxi!");
        if (onRideUpdated) onRideUpdated();
        handleClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to switch to candidate taxi.");
    } finally {
      setSwitchingTaxiId(null);
    }
  };

  // Cancel Shared Ride action
  const handleConfirmCancelRide = async () => {
    try {
      setLoading(true);
      const res = await cancelSharedRideApi(ride._id, { passengerId, reason: "Passenger cancelled shared ride" });
      if (res.data?.success) {
        toast.success("Shared ride cancelled successfully.");
        if (onRideUpdated) onRideUpdated();
        handleClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel shared ride.");
    } finally {
      setLoading(false);
    }
  };

  // Convert to Private Ride action
  const handleConvertToPrivateRide = async () => {
    try {
      setLoading(true);
      const res = await safeLeaveSharedRideApi(ride._id, { passengerId });
      if (res.data?.success) {
        toast.success("Shared ride converted to Private Ride.");
        if (onRideUpdated) onRideUpdated();
        handleClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to convert to private ride.");
    } finally {
      setLoading(false);
    }
  };

  // Submit Discomfort Report
  const handleSubmitReport = async () => {
    if (!selectedReason) {
      toast.error("Please select a reason for reporting discomfort.");
      return;
    }

    try {
      setLoading(true);
      const res = await reportDiscomfortApi(ride._id, {
        passengerId,
        reason: selectedReason,
        description,
      });

      if (res.data?.success) {
        toast.success("Report submitted discretely to RouteMate Support.");
        handleClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit discomfort report.");
    } finally {
      setLoading(false);
    }
  };

  // Emergency SOS
  const handleConfirmSOS = async () => {
    try {
      setLoading(true);
      const userGeo = navigator.geolocation;
      let coords = ride.originCoords || { lat: 12.9716, lng: 77.5946 };

      const sendSosRequest = async (locationCoords) => {
        const res = await triggerSOSApi(ride._id, {
          passengerId,
          location: {
            lat: locationCoords.lat,
            lng: locationCoords.lng,
            address: `${ride.origin} ➔ ${ride.destination} (Live GPS)`,
          },
          emergencyContact: {
            name: "Emergency Contact",
            phone: "+1 (555) 911-0000",
          },
        });

        if (res.data?.success) {
          setActiveStep("SOS_SUCCESS");
          toast.success("Emergency SOS sent successfully.");
        }
      };

      if (userGeo) {
        userGeo.getCurrentPosition(
          (pos) => sendSosRequest({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => sendSosRequest(coords),
          { timeout: 4000 }
        );
      } else {
        await sendSosRequest(coords);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send emergency SOS.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl glass-card border border-indigo-500/30 bg-slate-900/95 shadow-2xl transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-950">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-lg">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide">Ride Options & Safety</h2>
              <p className="text-[11px] text-slate-400">Smart Ride Exit & Live Taxi Alternatives</p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* STEP 1: 4 RIDE OPTIONS MENU */}
          {activeStep === "MENU" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300 font-medium">
                Select a ride action below. Your safety, comfort, and control are prioritized.
              </p>

              <div className="space-y-3">
                {/* Option 1: Report Discomfort */}
                <button
                  onClick={() => setActiveStep("REPORT")}
                  className="w-full p-4 text-left rounded-2xl glass-card border border-slate-800 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group flex items-start space-x-4"
                >
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
                    <Frown className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                      😟 Report Discomfort
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      "Report aggressive behaviour, noise, or discomfort discretely."
                    </p>
                  </div>
                </button>

                {/* Option 2: Switch to Another RouteMate Taxi */}
                <button
                  onClick={() => setActiveStep("LIVE_TAXIS")}
                  className="w-full p-4 text-left rounded-2xl glass-card border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group flex items-start space-x-4"
                >
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                      🚖 Switch to Another RouteMate Taxi
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      "View nearby active taxis with ≥80% route match and instant transfer."
                    </p>
                  </div>
                </button>

                {/* Option 3: Cancel Shared Ride */}
                <button
                  onClick={() => setActiveStep("CANCEL_DIALOG")}
                  className="w-full p-4 text-left rounded-2xl glass-card border border-slate-800 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group flex items-start space-x-4"
                >
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                    <X className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                      ❌ Cancel Shared Ride
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      "Exit shared ride and view available taxis or cancel ride."
                    </p>
                  </div>
                </button>

                {/* Option 4: Emergency SOS */}
                <button
                  onClick={() => setActiveStep("SOS_CONFIRM")}
                  className="w-full p-4 text-left rounded-2xl glass-card border border-red-500/30 bg-red-950/10 hover:border-red-500/60 hover:bg-red-950/20 transition-all group flex items-start space-x-4"
                >
                  <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 group-hover:scale-110 transition-transform">
                    <AlertTriangle className="w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-red-300 group-hover:text-red-200 transition-colors">
                      🆘 Emergency SOS
                    </h3>
                    <p className="text-xs text-red-300/70 mt-0.5">
                      "Immediately alert emergency contacts and RouteMate Support."
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CANCEL SHARED RIDE CONFIRMATION DIALOG */}
          {activeStep === "CANCEL_DIALOG" && (
            <div className="space-y-5 py-2">
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center space-x-3 text-purple-300">
                <Car className="w-6 h-6 shrink-0 text-purple-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Cancel Shared Ride Portion?</h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    How would you like to proceed with your commute?
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setActiveStep("LIVE_TAXIS")}
                  className="w-full py-3.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all hover:scale-105"
                >
                  <Car className="w-4 h-4" />
                  <span>View Available Taxis (2 km Radius)</span>
                </button>

                <button
                  onClick={handleConfirmCancelRide}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 flex items-center justify-center space-x-2 transition-colors"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                  <span>Cancel Ride Anyway</span>
                </button>

                <button
                  onClick={() => setActiveStep("MENU")}
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold text-slate-400 glass-card hover:bg-slate-800 transition-colors"
                >
                  Continue Current Ride
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: LIVE TAXI ALTERNATIVES LIST VIEW (Socket 5-10s Auto-Refresh) */}
          {activeStep === "LIVE_TAXIS" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Car className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Nearby RouteMate Taxis ({candidateTaxis.length})
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> LIVE 7s REFRESH
                  </span>
                </div>
              </div>

              {fetchingTaxis && candidateTaxis.length === 0 ? (
                <div className="p-8 text-center text-xs text-indigo-400 glass-card rounded-2xl animate-pulse">
                  Searching live RouteMate taxis within 2 km radius...
                </div>
              ) : candidateTaxis.length === 0 ? (
                <div className="p-6 text-center space-y-3 glass-card rounded-2xl">
                  <p className="text-sm font-bold text-white">No Nearby Taxis Found</p>
                  <p className="text-xs text-slate-400">
                    No active candidate taxis matching your route vector (≥80% match) were found within 2 km.
                  </p>
                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      onClick={() => setActiveStep("MENU")}
                      className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700"
                    >
                      Continue Current Ride
                    </button>
                    <button
                      onClick={handleConvertToPrivateRide}
                      className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500"
                    >
                      Convert to Private Ride
                    </button>
                    <button
                      onClick={handleConfirmCancelRide}
                      className="w-full py-2.5 rounded-xl text-xs font-bold text-rose-300 bg-rose-950/40 border border-rose-500/40"
                    >
                      Cancel Ride
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {candidateTaxis.map((taxi) => (
                    <div
                      key={taxi._id}
                      className="p-4 rounded-2xl glass-card border border-slate-800 hover:border-indigo-500/40 transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <span>🚖 {taxi.driverName}</span>
                            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-0.5 bg-amber-500/10 px-1.5 py-0.5 rounded">
                              <Star className="w-3 h-3 fill-current" /> {taxi.driverRating}
                            </span>
                          </h4>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">
                            Plate: <span className="text-indigo-400">{taxi.taxiNumber}</span> • {taxi.vehicleDetails?.make} {taxi.vehicleDetails?.model}
                          </p>
                        </div>

                        <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                          {taxi.routeMatchPercentage}% MATCH
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-[11px] text-slate-300 text-center bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono">
                        <div>
                          <span className="text-slate-400 block text-[10px]">DISTANCE</span>
                          <span className="font-bold text-indigo-300">{taxi.distanceKm} km</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">ETA PICKUP</span>
                          <span className="font-bold text-amber-300">~{taxi.etaMinutes} mins</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">SEATS</span>
                          <span className="font-bold text-purple-300">{taxi.seatsAvailable} Free</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">EST. FARE</span>
                          <span className="font-bold text-emerald-300">${taxi.estimatedFare}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSelectCandidateTaxi(taxi._id)}
                        disabled={switchingTaxiId === taxi._id}
                        className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 flex items-center justify-center space-x-2 shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02]"
                      >
                        {switchingTaxiId === taxi._id ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Transferring Passenger...</span>
                          </>
                        ) : (
                          <>
                            <Car className="w-3.5 h-3.5" />
                            <span>Switch to this Taxi</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setActiveStep("MENU")}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Back to Menu
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: REPORT DISCOMFORT */}
          {activeStep === "REPORT" && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-amber-400 text-sm font-bold border-b border-slate-800 pb-3">
                <Frown className="w-5 h-5" />
                <span>Report Discomfort</span>
              </div>

              <p className="text-xs text-slate-300">
                Select the primary reason for your discomfort. This report will be sent directly to RouteMate Support.
              </p>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {DISCOMFORT_REASONS.map((reason, idx) => (
                  <label
                    key={idx}
                    className={`flex items-center space-x-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedReason === reason
                        ? "border-amber-500/60 bg-amber-500/10 text-white"
                        : "border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="discomfortReason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="text-amber-500 focus:ring-amber-500"
                    />
                    <span className="font-semibold">{reason}</span>
                  </label>
                ))}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Optional Details
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide additional details if needed..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  onClick={() => setActiveStep("MENU")}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmitReport}
                  disabled={loading || !selectedReason}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 flex items-center space-x-2 shadow-lg shadow-amber-600/20"
                >
                  {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Submit Report</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: NO TAXIS AVAILABLE -> PRIVATE RIDE CONVERTED */}
          {activeStep === "NO_TAXI" && (
            <div className="space-y-4 text-center py-2">
              <div className="w-14 h-14 rounded-3xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">No Nearby Taxis Available</h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  "No nearby RouteMate taxi matching your route vector within 2 km is currently available."
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  onClick={() => setActiveStep("MENU")}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700"
                >
                  Continue Current Ride
                </button>
                <button
                  onClick={handleConvertToPrivateRide}
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500"
                >
                  Convert to Private Ride
                </button>
                <button
                  onClick={handleConfirmCancelRide}
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-rose-300 bg-rose-950/40 border border-rose-500/40"
                >
                  Cancel Ride
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: EMERGENCY SOS CONFIRMATION */}
          {activeStep === "SOS_CONFIRM" && (
            <div className="space-y-4 text-center py-2">
              <div className="w-14 h-14 rounded-3xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto animate-pulse">
                <AlertTriangle className="w-8 h-8" />
              </div>

              <h3 className="text-xl font-extrabold text-red-400">Emergency SOS</h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">
                This will immediately broadcast your live GPS location, driver details, and taxi registration to Emergency Contacts & RouteMate Support.
              </p>

              <div className="flex items-center justify-center space-x-3 pt-4">
                <button
                  onClick={() => setActiveStep("MENU")}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 glass-card hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSOS}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/40 flex items-center space-x-2"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Send SOS</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 7: SOS DISPATCHED SUCCESS */}
          {activeStep === "SOS_SUCCESS" && (
            <div className="space-y-4 text-center py-2">
              <div className="w-14 h-14 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h3 className="text-xl font-extrabold text-emerald-400">Emergency Alert Sent</h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto bg-slate-950 p-4 rounded-2xl border border-slate-800">
                "Emergency alert sent successfully."
              </p>

              <p className="text-[11px] text-slate-400">
                RouteMate Support & Emergency Response Teams have received your live location and telemetry.
              </p>

              <div className="pt-2">
                <button
                  onClick={handleClose}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500"
                >
                  Close SafeRide AI
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SafeRideModal;
