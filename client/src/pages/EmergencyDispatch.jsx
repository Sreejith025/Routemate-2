import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  AlertTriangle,
  Siren,
  Car,
  Clock,
  Navigation,
  Gauge,
  Phone,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Zap,
  Star,
  MapPin,
  ArrowLeft,
  X,
  Compass,
  Cpu,
  Radio,
  Send,
  Lock,
} from "lucide-react";
import {
  createEmergencyBookingApi,
  getEmergencyRideStatusApi,
  respondEmergencyRequestApi,
  reoptimizeEmergencyRideApi,
} from "../services/api";
import LiveMap from "../components/LiveMap";
import LocationAutocompleteInput from "../components/LocationAutocompleteInput";
import { useAuthContext } from "../context/AuthContext";
import socket from "../services/socket";
import toast from "react-hot-toast";

const EMERGENCY_TYPES = [
  { id: "MEDICAL", label: "🚑 Medical Emergency", priority: "CRITICAL", desc: "Fastest dispatch for urgent hospital transport." },
  { id: "SAFETY", label: "🛡️ Safety / Threat Alert", priority: "CRITICAL", desc: "Priority extraction from unsafe situations." },
  { id: "ACCIDENT", label: "⚠️ Roadside Vehicle Break", priority: "URGENT", desc: "Immediate pickup for stranded passengers." },
  { id: "URGENT_COMMUTE", label: "⚡ Flight / Critical Commute", priority: "HIGH", desc: "Shortest ETA route for time-sensitive travel." },
];

const EmergencyDispatch = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dbUser, clerkUser } = useAuthContext();

  const [bookingMode, setBookingMode] = useState(!id);
  const [emergencyRide, setEmergencyRide] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));

  // Form State
  const [selectedType, setSelectedType] = useState("MEDICAL");
  const [pickupInput, setPickupInput] = useState("");
  const [destInput, setDestInput] = useState("");
  const [pickupCoords, setPickupCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [customerName, setCustomerName] = useState(dbUser?.fullName || clerkUser?.firstName || "Emergency Passenger");
  const [customerPhone, setCustomerPhone] = useState("+1 (555) 911-0000");
  const [bookingLoading, setBookingLoading] = useState(false);

  // Live countdown state
  const [countdown, setCountdown] = useState(15);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      setBookingMode(false);
      fetchEmergencyRideDetails();

      socket.emit("joinEmergency", { emergencyRideId: id });

      const handleEmergencyDispatchAssigned = (data) => {
        if (data.emergencyRide) setEmergencyRide(data.emergencyRide);
      };

      const handleEmergencyCountdownTick = (data) => {
        if (data.countdownSeconds !== undefined) {
          setCountdown(data.countdownSeconds);
        }
      };

      const handleEmergencyDriverAccepted = (data) => {
        toast.success(data.message || "✅ Driver accepted emergency dispatch!", { duration: 5000 });
        fetchEmergencyRideDetails();
      };

      const handleEmergencyDriverReassigned = (data) => {
        toast.error(data.message || "🚨 15s Timer Expired! AI auto-reassigned next driver.", { duration: 5000 });
        fetchEmergencyRideDetails();
      };

      const handleEmergencyRideUpdated = (data) => {
        fetchEmergencyRideDetails();
      };

      socket.on("emergencyDispatchAssigned", handleEmergencyDispatchAssigned);
      socket.on("emergencyCountdownTick", handleEmergencyCountdownTick);
      socket.on("emergencyDriverAccepted", handleEmergencyDriverAccepted);
      socket.on("emergencyDriverReassigned", handleEmergencyDriverReassigned);
      socket.on("emergencyRideUpdated", handleEmergencyRideUpdated);

      return () => {
        socket.off("emergencyDispatchAssigned", handleEmergencyDispatchAssigned);
        socket.off("emergencyCountdownTick", handleEmergencyCountdownTick);
        socket.off("emergencyDriverAccepted", handleEmergencyDriverAccepted);
        socket.off("emergencyDriverReassigned", handleEmergencyDriverReassigned);
        socket.off("emergencyRideUpdated", handleEmergencyRideUpdated);
      };
    }
  }, [id]);

  const fetchEmergencyRideDetails = async () => {
    try {
      setLoading(true);
      const res = await getEmergencyRideStatusApi(id);
      if (res.data?.emergencyRide) {
        setEmergencyRide(res.data.emergencyRide);
        if (res.data.emergencyRide.countdownSeconds !== undefined) {
          setCountdown(res.data.emergencyRide.countdownSeconds);
        }
      }
    } catch (err) {
      toast.error("Failed to fetch emergency ride details.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmergencyBooking = async (e) => {
    e.preventDefault();
    const pLoc = pickupCoords || { name: pickupInput || "Current Location", lat: 12.9716, lng: 77.5946 };
    const dLoc = destCoords || { name: destInput || "City General Hospital", lat: 12.9925, lng: 77.6145 };

    try {
      setBookingLoading(true);
      const typeObj = EMERGENCY_TYPES.find((t) => t.id === selectedType);

      const res = await createEmergencyBookingApi({
        customerName,
        customerPhone,
        pickup: pLoc,
        destination: dLoc,
        emergencyType: selectedType,
        priorityLevel: typeObj?.priority || "CRITICAL",
      });

      if (res.data?.success && res.data?.emergencyRide?._id) {
        toast.success("🚀 Emergency Request Dispatched via AI Dispatch Engine!");
        navigate(`/emergency/track/${res.data.emergencyRide._id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to dispatch emergency ride.");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleDriverSimulateAccept = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      const res = await respondEmergencyRequestApi(id, {
        driverId: emergencyRide?.assignedDriverId || "emg_driver_1",
        action: "accept",
      });
      if (res.data?.success) {
        toast.success("✅ Driver Accepted Dispatch!");
        fetchEmergencyRideDetails();
      }
    } catch (err) {
      toast.error("Failed to simulate driver acceptance.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReoptimizeEmergency = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      const res = await reoptimizeEmergencyRideApi(id);
      if (res.data?.success) {
        toast.success("AI Emergency Dispatch Engine re-evaluated route and driver ranking.");
        fetchEmergencyRideDetails();
      }
    } catch (err) {
      toast.error("Failed to re-optimize emergency ride.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-slate-950 min-h-screen text-slate-100">
      {/* Top Banner */}
      <div className="flex items-center justify-between p-6 rounded-3xl bg-gradient-to-r from-rose-950/80 via-slate-900 to-slate-950 border border-rose-500/40 shadow-2xl">
        <div className="flex items-center space-x-4">
          <div className="p-3.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/50 shadow-lg shadow-rose-500/20 animate-pulse">
            <Siren className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-black bg-rose-500/30 text-rose-300 border border-rose-500/50 uppercase tracking-widest">
                🚨 AI EMERGENCY DISPATCH MODULE
              </span>
              <span className="text-xs font-mono text-slate-400">INDEPENDENT HIGH-PRIORITY FLEET</span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">Shortest-ETA Emergency Priority Dispatch</h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/admin/emergency"
            className="px-4 py-2.5 rounded-xl text-xs font-extrabold text-rose-300 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/40 transition-all flex items-center gap-2"
          >
            <Cpu className="w-4 h-4 text-rose-400" />
            <span>Admin Control Room</span>
          </Link>
        </div>
      </div>

      {/* BOOKING MODE FORM */}
      {bookingMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 glass-card border border-rose-500/30 rounded-3xl p-8 space-y-6 bg-slate-900/90 shadow-2xl">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-rose-400 animate-bounce" />
                <span>Instant Emergency Booking</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Submitting an emergency request bypasses normal queues. AI instantly dispatches the fastest available taxi.
              </p>
            </div>

            <form onSubmit={handleCreateEmergencyBooking} className="space-y-6">
              {/* Emergency Category */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Select Emergency Category
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {EMERGENCY_TYPES.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSelectedType(type.id)}
                      className={`p-4 rounded-2xl text-left border transition-all ${
                        selectedType === type.id
                          ? "border-rose-500 bg-rose-950/40 text-white shadow-lg shadow-rose-500/10 ring-2 ring-rose-500/30"
                          : "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <span className="text-sm font-bold block text-white">{type.label}</span>
                      <span className="text-[11px] text-slate-400 block mt-1 leading-snug">{type.desc}</span>
                      <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {type.priority} PRIORITY
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Location Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                    📍 Emergency Pickup Location
                  </label>
                  <LocationAutocompleteInput
                    placeholder="Enter current pickup address..."
                    value={pickupInput}
                    onChange={(val) => setPickupInput(val)}
                    onSelectLocation={(loc) => {
                      setPickupInput(loc.name);
                      setPickupCoords(loc);
                    }}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                    🏁 Emergency Destination (e.g. Hospital, Safe Zone)
                  </label>
                  <LocationAutocompleteInput
                    placeholder="Enter destination hospital or address..."
                    value={destInput}
                    onChange={(val) => setDestInput(val)}
                    onSelectLocation={(loc) => {
                      setDestInput(loc.name);
                      setDestCoords(loc);
                    }}
                  />
                </div>
              </div>

              {/* Customer Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Passenger Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Emergency Phone</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={bookingLoading}
                className="w-full py-4 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 shadow-xl shadow-rose-600/30 flex items-center justify-center space-x-2 transition-all hover:scale-[1.01]"
              >
                {bookingLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Evaluating AI Priority Dispatch...</span>
                  </>
                ) : (
                  <>
                    <Siren className="w-5 h-5 animate-pulse" />
                    <span>DISPATCH AI EMERGENCY TAXI NOW</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: AI Dispatch Principles */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-card border border-slate-800 rounded-3xl p-6 space-y-4 bg-slate-900/60">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
                <Cpu className="w-5 h-5 text-rose-400" />
                <span>How AI Emergency Dispatch Works</span>
              </h3>

              <div className="space-y-4 text-xs text-slate-300">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-bold text-rose-400 block">⚡ Shortest-ETA Priority Ranking</span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Instead of assigning taxis strictly by straight-line distance, AI evaluates real driving ETA using OpenStreetMap road routing, live traffic, and vehicle speed.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-bold text-amber-400 block">⏱️ 15-Second Auto-Reassign Countdown</span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    The dispatched driver gets 15 seconds to accept. If the timer expires, the AI automatically assigns the next best driver without requiring customer intervention.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-bold text-emerald-400 block">🚦 Dynamic Traffic Optimization</span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Continuous background monitoring re-evaluates active emergency rides. If traffic degrades, the AI re-dispatches a faster taxi automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* LIVE TRACKING VIEW MODE */
        <div className="space-y-8">
          {/* SECTION 1: DRIVER PROFILE & 15S COUNTDOWN HEADER */}
          <div className="p-8 rounded-3xl glass-card border border-rose-500/40 bg-gradient-to-r from-rose-950/70 via-slate-900 to-slate-950 shadow-2xl space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 font-bold text-2xl shadow-lg">
                  🚑
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/30 text-rose-300 border border-rose-500/50 uppercase">
                      🚨 EMERGENCY RIDE DISPATCHED
                    </span>
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-0.5 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      <Star className="w-3.5 h-3.5 fill-current" /> {emergencyRide?.candidateQueue?.[0]?.driverRating || 4.9}
                    </span>
                  </div>

                  <h2 className="text-2xl font-black text-white mt-1">
                    {emergencyRide?.assignedDriverName || "AI Emergency Driver"}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Vehicle: <strong className="text-slate-200">{emergencyRide?.vehicleDetails?.make} {emergencyRide?.vehicleDetails?.model}</strong> • Plate: <span className="font-mono text-rose-400 font-bold">{emergencyRide?.assignedTaxiPlate || "EMG-9110"}</span>
                  </p>
                </div>
              </div>

              {/* 15s Acceptance Timer Box */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-rose-500/40 text-center min-w-[200px]">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">15s Driver Accept Timer</span>
                <div className="text-3xl font-black text-amber-400 font-mono my-1 flex items-center justify-center gap-2">
                  <Clock className="w-6 h-6 animate-spin text-amber-400" />
                  <span>{countdown}s</span>
                </div>
                <span className="text-[10px] text-slate-400 block">Auto-reassigns next driver if expired</span>
              </div>
            </div>

            {/* AI Insights Card */}
            {emergencyRide?.aiInsights && (
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center space-x-2 text-rose-400 font-bold">
                  <Cpu className="w-4 h-4" />
                  <span>AI Dispatch Insights & Rationale</span>
                </div>
                <p className="text-slate-300 leading-relaxed font-mono">{emergencyRide.aiInsights.reason}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                  <span>{emergencyRide.aiInsights.aiScoreFormula}</span>
                  <span className="text-emerald-400 font-bold">ETA SAVED: ~{emergencyRide.aiInsights.etaSavedMinutes || 4} Mins</span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: LIVE MAP & TELEMETRY HUD */}
          <div className="p-6 rounded-3xl glass-card border border-rose-500/30 bg-slate-950/80 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Radio className="w-5 h-5 text-rose-400 animate-pulse" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Live OpenStreetMap Emergency Telemetry HUD</h3>
              </div>
              <span className="text-xs font-mono font-bold text-rose-400">● PRIORITY CHANNEL</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Est. Arrival Countdown</span>
                <span className="text-lg font-black text-amber-400 font-mono flex items-center gap-1">
                  <Clock className="w-4 h-4" /> ~{emergencyRide?.telemetry?.etaMinutes || 3} mins
                </span>
              </div>

              <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Distance Remaining</span>
                <span className="text-lg font-black text-indigo-400 font-mono">
                  {emergencyRide?.telemetry?.distanceRemainingKm || 1.2} km
                </span>
              </div>

              <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Emergency Driver Speed</span>
                <span className="text-lg font-black text-rose-400 font-mono flex items-center gap-1">
                  <Gauge className="w-4 h-4" /> {emergencyRide?.telemetry?.currentSpeed || 52} km/h
                </span>
              </div>

              <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Emergency Priority</span>
                <span className="text-xs font-bold text-rose-300 uppercase block">{emergencyRide?.priorityLevel || "CRITICAL"}</span>
              </div>
            </div>

            <LiveMap
              height="450px"
              center={
                emergencyRide?.pickup?.lat && emergencyRide?.pickup?.lng
                  ? { lat: emergencyRide.pickup.lat, lng: emergencyRide.pickup.lng }
                  : { lat: 12.9716, lng: 77.5946 }
              }
              zoom={14}
              pickupCoords={emergencyRide?.pickup}
              pickupName={emergencyRide?.pickup?.name}
              destinationCoords={emergencyRide?.destination}
              destinationName={emergencyRide?.destination?.name}
              driverLocation={
                emergencyRide?.telemetry?.liveLat && emergencyRide?.telemetry?.liveLng
                  ? { latitude: emergencyRide.telemetry.liveLat, longitude: emergencyRide.telemetry.liveLng, speed: emergencyRide.telemetry.currentSpeed || 0 }
                  : null
              }
              driverName={emergencyRide?.assignedDriverName}
              vehicleDetails={emergencyRide?.vehicleDetails}
            />
          </div>

          {/* ACTION BUTTONS & SIMULATION CONTROLS */}
          <div className="glass-card border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
              Emergency Action Controls
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <a
                href="tel:+15550192834"
                className="p-4 rounded-2xl glass-card border border-amber-500/30 hover:bg-amber-500/10 text-amber-300 flex items-center space-x-3 font-bold text-xs"
              >
                <Phone className="w-5 h-5 text-amber-400" />
                <span>Call Emergency Driver</span>
              </a>

              <button
                onClick={handleDriverSimulateAccept}
                disabled={actionLoading}
                className="p-4 rounded-2xl glass-card border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-300 flex items-center space-x-3 font-bold text-xs"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Simulate Driver Accept</span>
              </button>

              <button
                onClick={handleReoptimizeEmergency}
                disabled={actionLoading}
                className="p-4 rounded-2xl glass-card border border-purple-500/30 hover:bg-purple-500/10 text-purple-300 flex items-center space-x-3 font-bold text-xs"
              >
                <Zap className="w-5 h-5 text-purple-400" />
                <span>Trigger AI Re-Dispatch</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyDispatch;
