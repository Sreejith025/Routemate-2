import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import {
  Car,
  Users,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Navigation,
  Clock,
  MapPin,
  Radio,
  Gauge,
  Phone,
  MessageSquare,
  ShieldCheck,
  Zap,
  Star,
  RefreshCw,
  X,
  Send,
  Lock,
  Compass,
  Cpu,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import {
  getRideByIdApi,
  updateRideStageApi,
  sendRideChatMessageApi,
  getRideChatHistoryApi,
  runOptimizationApi,
  getLiveTaxiAlternativesApi,
  switchToCandidateTaxiApi,
  cancelSharedRideApi,
} from "../services/api";
import LiveMap from "../components/LiveMap";
import TaxiSwitchCard from "../components/TaxiSwitchCard";
import SafeRideModal from "../components/SafeRideModal";
import { useLiveLocation } from "../hooks/useLiveLocation";
import socket from "../services/socket";
import toast from "react-hot-toast";

const TIMELINE_STAGES = [
  "Ride Booked",
  "Driver Accepted",
  "Driver On The Way",
  "Driver Reached Pickup",
  "Passenger Picked Up",
  "Shared Ride Started",
  "Additional Passenger Joined",
  "Ride In Progress",
  "Passenger Dropped",
  "Ride Completed",
];

const ActiveRideTracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dbUser, clerkUser } = useAuthContext();

  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals & Drawers state
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [showNearbyTaxisModal, setShowNearbyTaxisModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Chat state
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [sendingChat, setSendingChat] = useState(false);
  const chatEndRef = useRef(null);

  // AI & Candidate search state
  const [optRecommendation, setOptRecommendation] = useState(null);
  const [candidateTaxis, setCandidateTaxis] = useState([]);
  const [fetchingCandidateTaxis, setFetchingCandidateTaxis] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const userId = dbUser?.clerkId || dbUser?._id || clerkUser?.id;

  useEffect(() => {
    if (id) {
      fetchRideDetails();
      fetchChatHistory();

      socket.emit("joinRide", { rideId: id });

      // SOCKET LISTENERS FOR ALL 11 EVENTS
      const handleRideConfirmed = (data) => {
        toast.success(data.message || "✅ Ride Confirmed! Driver assigned.");
        fetchRideDetails();
      };

      const handleRideStatusUpdated = (data) => {
        toast("📍 Ride Status Updated: " + data.stage, { icon: "🚗" });
        fetchRideDetails();
      };

      const handleTrafficDetected = (data) => {
        toast.error(`⚠️ Traffic Delay Detected (+${data.trafficDelayMinutes || 8} mins)`, { icon: "🚦" });
        fetchRideDetails();
      };

      const handleOptimizationSuggested = (data) => {
        toast("🚀 Better Ride Available via AI Optimization!", { icon: "⚡" });
        setOptRecommendation(data);
      };

      const handleSwitchAccepted = (data) => {
        toast.success(data.message || "Taxi switch executed successfully.");
        fetchRideDetails();
      };

      const handleSwitchRejected = () => {
        toast("Taxi switch declined.");
        setOptRecommendation(null);
      };

      const handleNearbyTaxiUpdated = (data) => {
        if (data.alternatives) setCandidateTaxis(data.alternatives);
      };

      const handleRideCancelled = () => {
        toast.error("Shared ride portion cancelled.");
        fetchRideDetails();
      };

      const handleRideConvertedToPrivate = (data) => {
        toast.success(data.message || "Ride converted to Private Ride.");
        fetchRideDetails();
      };

      const handleSOSActivated = (data) => {
        toast.error("🆘 EMERGENCY SOS DISPATCHED TO SUPPORT & EMERGENCY CONTACTS", { duration: 6000 });
      };

      const handleNewChatMessage = (data) => {
        if (data.rideId === id && data.message) {
          setChatMessages((prev) => [...prev, data.message]);
        }
      };

      const handleRideUpdated = () => fetchRideDetails();

      socket.on("rideConfirmed", handleRideConfirmed);
      socket.on("rideStatusUpdated", handleRideStatusUpdated);
      socket.on("trafficDetected", handleTrafficDetected);
      socket.on("optimizationSuggested", handleOptimizationSuggested);
      socket.on("rideOptimized", handleOptimizationSuggested);
      socket.on("switchRecommended", handleOptimizationSuggested);
      socket.on("switchAccepted", handleSwitchAccepted);
      socket.on("switchRejected", handleSwitchRejected);
      socket.on("nearbyTaxiUpdated", handleNearbyTaxiUpdated);
      socket.on("rideCancelled", handleRideCancelled);
      socket.on("passengerCancelledRide", handleRideCancelled);
      socket.on("rideConvertedToPrivate", handleRideConvertedToPrivate);
      socket.on("SOSActivated", handleSOSActivated);
      socket.on("newRideChatMessage", handleNewChatMessage);
      socket.on("rideUpdated", handleRideUpdated);

      return () => {
        socket.off("rideConfirmed", handleRideConfirmed);
        socket.off("rideStatusUpdated", handleRideStatusUpdated);
        socket.off("trafficDetected", handleTrafficDetected);
        socket.off("optimizationSuggested", handleOptimizationSuggested);
        socket.off("rideOptimized", handleOptimizationSuggested);
        socket.off("switchRecommended", handleOptimizationSuggested);
        socket.off("switchAccepted", handleSwitchAccepted);
        socket.off("switchRejected", handleSwitchRejected);
        socket.off("nearbyTaxiUpdated", handleNearbyTaxiUpdated);
        socket.off("rideCancelled", handleRideCancelled);
        socket.off("passengerCancelledRide", handleRideCancelled);
        socket.off("rideConvertedToPrivate", handleRideConvertedToPrivate);
        socket.off("SOSActivated", handleSOSActivated);
        socket.off("newRideChatMessage", handleNewChatMessage);
        socket.off("rideUpdated", handleRideUpdated);
      };
    }
  }, [id]);

  useEffect(() => {
    let interval = null;
    if (showNearbyTaxisModal && id) {
      fetchNearbyTaxis();
      interval = setInterval(() => {
        fetchNearbyTaxis(true);
      }, 5000); // 5s Socket / polling auto-refresh
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showNearbyTaxisModal, id]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const fetchRideDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getRideByIdApi(id);
      if (res.data?.ride) {
        setRide(res.data.ride);
        if (res.data.ride.chatMessages) {
          setChatMessages(res.data.ride.chatMessages);
        }
      } else {
        setError("Ride record not found in database.");
      }
    } catch (err) {
      console.error("Fetch ride error:", err);
      setError(err.response?.data?.message || "Failed to fetch ride details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchChatHistory = async () => {
    try {
      const res = await getRideChatHistoryApi(id);
      if (res.data?.chatMessages) {
        setChatMessages(res.data.chatMessages);
      }
    } catch (err) {
      console.warn("Could not fetch chat history:", err?.message);
    }
  };

  const fetchNearbyTaxis = async (isBackground = false) => {
    try {
      if (!isBackground) setFetchingCandidateTaxis(true);
      const res = await getLiveTaxiAlternativesApi(id, { radius: 2.0 });
      if (res.data?.success) {
        setCandidateTaxis(res.data.alternatives || []);
      }
    } catch (err) {
      console.error("Fetch nearby taxis error:", err);
    } finally {
      setFetchingCandidateTaxis(false);
    }
  };

  // Live Location hook
  const {
    currentLocation,
    driverLocation,
    passengerLocations,
    routeGeometry,
    distanceRemaining,
    totalDistanceTraveled,
    etaMinutes,
    gpsStatus,
    rideStatus,
    socketConnected,
  } = useLiveLocation({
    rideId: ride?._id,
    userId,
    role: "Passenger",
    isTrackingActive: ride?.status !== "completed",
    destinationCoords: ride?.destinationCoords,
  });

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    try {
      setSendingChat(true);
      const passengerName =
        dbUser?.fullName || clerkUser?.firstName || "Passenger";

      const res = await sendRideChatMessageApi(id, {
        senderId: userId,
        senderName: passengerName,
        text: chatInput.trim(),
      });

      if (res.data?.success) {
        setChatInput("");
      }
    } catch (err) {
      toast.error("Failed to send chat message.");
    } finally {
      setSendingChat(false);
    }
  };

  const handleTriggerAIOptimization = async () => {
    try {
      setActionLoading(true);
      const res = await runOptimizationApi();
      if (res.data?.success) {
        toast.success("AI Ride Optimization Engine evaluated active ride candidates.");
        fetchRideDetails();
      }
    } catch (err) {
      toast.error("Failed to run AI Optimization Engine.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSwitchToTaxi = async (targetRideId) => {
    try {
      setActionLoading(true);
      const res = await switchToCandidateTaxiApi(id, { targetRideId, passengerId: userId });
      if (res.data?.success) {
        toast.success(res.data.message || "Successfully switched to candidate taxi!");
        setShowNearbyTaxisModal(false);
        fetchRideDetails();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to switch taxi.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRideAction = async () => {
    try {
      setActionLoading(true);
      const res = await cancelSharedRideApi(id, { passengerId: userId, reason: "Passenger cancelled ride" });
      if (res.data?.success) {
        toast.success("Ride cancelled successfully.");
        setShowCancelDialog(false);
        navigate("/dashboard");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel ride.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-xs text-indigo-400 glass-card rounded-3xl animate-pulse">
        Fetching Active Ride Telemetry & Connecting Socket.IO Engine...
      </div>
    );
  }

  if (error || !ride) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center space-y-4 glass-card rounded-3xl">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
        <h3 className="text-xl font-bold text-white">Active Ride Not Found</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">{error}</p>
        <Link to="/dashboard" className="inline-block px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const currentStageName = ride.currentStage || "Driver Assigned";
  const stageIndex = TIMELINE_STAGES.indexOf(currentStageName);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Link */}
      <Link to="/dashboard" className="inline-flex items-center space-x-2 text-xs font-bold text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </Link>

      {/* SECTION 1: RIDE STATUS HEADER */}
      <div className="p-8 rounded-3xl glass-card border border-emerald-500/30 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-950 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <img
              src={ride.driverPhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
              alt="Driver"
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-500/50 shadow-lg"
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                  ✅ Ride Confirmed
                </span>
                <span className="text-xs font-bold text-amber-400 flex items-center gap-0.5 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  <Star className="w-3.5 h-3.5 fill-current" /> {ride.driverRating || 4.8}
                </span>
              </div>

              <h1 className="text-2xl font-black text-white mt-1">{ride.driverName}</h1>
              <p className="text-xs text-slate-400">
                Vehicle: <strong className="text-slate-200">{ride.vehicleDetails?.color} {ride.vehicleDetails?.make} {ride.vehicleDetails?.model}</strong> • Plate: <span className="font-mono text-emerald-400 font-bold">{ride.vehicleDetails?.plate || "RT-8842"}</span>
              </p>
            </div>
          </div>

          {/* OTP, Drop PIN & Locked Fare Box */}
          <div className="flex flex-wrap items-center gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div className="text-center border-r border-slate-800 pr-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ride Start OTP</span>
              <span className="text-2xl font-black text-amber-400 font-mono tracking-widest">{ride.otp || "4892"}</span>
            </div>

            <div className="text-center border-r border-slate-800 pr-4">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Secure Drop PIN</span>
              <span className="text-2xl font-black text-emerald-400 font-mono tracking-widest">{ride.dropPin || "7182"}</span>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">🔒 Locked App Fare</span>
              <span className="text-xl font-black text-indigo-300 font-mono">₹{ride.lockedFare || ride.pricePerSeat || 300}</span>
              <span className="text-[10px] text-slate-400 block">Guaranteed Price</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 6 & 7: AI RIDE OPTIMIZATION LIVE RECOMMENDATION ALERT BANNER */}
      {(optRecommendation || ride.dynamicSwitchSuggested) && (
        <TaxiSwitchCard
          rideId={ride._id}
          passengerName={dbUser?.fullName || "Passenger"}
          currentTaxi={`Taxi A (${ride.driverName})`}
          targetTaxi={optRecommendation?.targetTaxiDriverName ? `${optRecommendation.targetTaxiDriverName}'s Taxi` : (ride.switchDetails?.targetVehiclePlate || "Taxi B")}
          driverBName={optRecommendation?.targetTaxiDriverName || ride.switchDetails?.targetTaxiDriverName || "Nearby Driver"}
          delayReason={optRecommendation?.reason || ride.switchDetails?.reason || "Heavy Traffic Congestion Ahead"}
          timeSaved={optRecommendation?.timeSaved || ride.switchDetails?.etaSavedMinutes || 14}
          optimizationScore={optRecommendation?.optimizationScore || 88}
          fairnessScore={optRecommendation?.fairnessScore || 94}
          onAccept={fetchRideDetails}
          onDecline={fetchRideDetails}
        />
      )}

      {/* SECTION 2: LIVE LEAFLET MAP & TELEMETRY HUD */}
      <div className="p-6 rounded-3xl glass-card border border-indigo-500/30 bg-slate-950/80 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Live OpenStreetMap GPS & Telemetry HUD</h3>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400">
            {socketConnected ? "● SOCKET CONNECTED" : "○ RECONNECTING"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold block">Estimated Arrival (ETA)</span>
            <span className="text-lg font-black text-amber-400 font-mono flex items-center gap-1">
              <Clock className="w-4 h-4" /> ~{etaMinutes} mins
            </span>
          </div>

          <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold block">Distance Remaining</span>
            <span className="text-lg font-black text-indigo-400 font-mono">
              {distanceRemaining} km
            </span>
          </div>

          <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold block">Driver Live Speed</span>
            <span className="text-lg font-black text-purple-400 font-mono flex items-center gap-1">
              <Gauge className="w-4 h-4" /> {Math.round((driverLocation?.speed || 0) * 3.6)} km/h
            </span>
          </div>

          <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold block">GPS Telemetry Status</span>
            <span className="text-xs font-bold text-emerald-300 truncate block">{gpsStatus}</span>
          </div>
        </div>

        <LiveMap
          height="450px"
          center={
            driverLocation?.latitude && driverLocation?.longitude
              ? { lat: driverLocation.latitude, lng: driverLocation.longitude }
              : { lat: ride.originCoords?.lat || 12.9716, lng: ride.originCoords?.lng || 77.5946 }
          }
          zoom={14}
          driverLocation={driverLocation}
          driverName={ride.driverName}
          vehicleDetails={ride.vehicleDetails}
          passengerLocations={passengerLocations}
          passengers={ride.passengers || []}
          pickupCoords={ride.originCoords}
          pickupName={ride.origin}
          destinationCoords={ride.destinationCoords}
          destinationName={ride.destination}
          routeGeometry={routeGeometry}
          isRideActive={ride.status !== "completed"}
        />
      </div>

      {/* MAIN GRID: SECTION 3 TIMELINE & SECTION 4 RIDE INFO & SECTION 5 CONTROLS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: SECTION 3 VERTICAL TIMELINE */}
        <div className="lg:col-span-4 glass-card border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Navigation className="w-5 h-5 text-indigo-400" />
            <span>Ride Progress Timeline</span>
          </h3>

          <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {TIMELINE_STAGES.map((stage, idx) => {
              const isCompleted = idx <= (stageIndex >= 0 ? stageIndex : 0);
              const isCurrent = idx === stageIndex;
              const timelineRecord = ride.timeline?.find((t) => t.stage === stage);
              const timestampText = timelineRecord?.timestamp
                ? new Date(timelineRecord.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : isCompleted
                ? "Done"
                : "Pending";

              return (
                <div key={idx} className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                        isCurrent
                          ? "bg-emerald-500 border-emerald-400 ring-4 ring-emerald-500/25 text-slate-950 animate-pulse scale-110"
                          : isCompleted
                          ? "bg-emerald-600 border-emerald-500 text-white"
                          : "bg-slate-900 border-slate-700 text-slate-600"
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />}
                    </div>

                    <div>
                      <p className={`text-xs font-bold ${isCurrent ? "text-emerald-400 text-sm font-extrabold" : isCompleted ? "text-slate-200" : "text-slate-500"}`}>
                        {stage}
                      </p>
                      {isCurrent && <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1">● STAGE LIVE</span>}
                    </div>
                  </div>

                  <span className={`text-[10px] font-mono font-semibold ${isCurrent ? "text-emerald-400" : isCompleted ? "text-slate-400" : "text-slate-600"}`}>
                    {timestampText}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: SECTION 4 RIDE INFO & SECTION 5 RIDE CONTROLS */}
        <div className="lg:col-span-8 space-y-6">
          {/* SECTION 4: RIDE INFORMATION */}
          <div className="glass-card border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Compass className="w-5 h-5 text-purple-400" />
              <span>Ride Information</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block font-semibold text-[10px] uppercase">Ride ID</span>
                <span className="font-mono font-bold text-indigo-400 text-sm">#{ride._id.slice(-6).toUpperCase()}</span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block font-semibold text-[10px] uppercase">Current Fare</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">${ride.pricePerSeat} / seat</span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block font-semibold text-[10px] uppercase">Ride Type</span>
                <span className="font-bold text-amber-400 capitalize text-sm">{ride.rideType || "Shared"}</span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block font-semibold text-[10px] uppercase">Passengers</span>
                <span className="font-bold text-purple-400 text-sm">{ride.passengers?.length || 1} Passenger(s)</span>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs text-slate-300">
              <p><strong>Pickup Address:</strong> <span className="text-slate-200">{ride.origin}</span></p>
              <p><strong>Destination Address:</strong> <span className="text-slate-200">{ride.destination}</span></p>
            </div>
          </div>

          {/* SECTION 5: RIDE CONTROLS (6 ACTION CARDS) */}
          <div className="glass-card border border-indigo-500/30 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="flex items-center gap-2">
                <Car className="w-5 h-5 text-indigo-400" />
                <span>Ride Controls</span>
              </span>
              <span className="text-xs text-slate-400">Interactive Commute Actions</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Card 1: Ride Safety */}
              <button
                onClick={() => setShowSafetyModal(true)}
                className="p-4 rounded-2xl glass-card border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/10 text-left transition-all group space-y-2"
              >
                <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 w-fit group-hover:scale-110 transition-transform">
                  <ShieldAlert className="w-5 h-5 animate-pulse" />
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-indigo-300">🛡 Ride Safety</h4>
                <p className="text-[11px] text-slate-400">Report Discomfort, Leave Shared Ride, SOS</p>
              </button>

              {/* Card 2: Find Better Taxi */}
              <button
                onClick={handleTriggerAIOptimization}
                disabled={actionLoading}
                className="p-4 rounded-2xl glass-card border border-slate-800 hover:border-purple-500/50 hover:bg-purple-500/10 text-left transition-all group space-y-2"
              >
                <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 w-fit group-hover:scale-110 transition-transform">
                  <Zap className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-purple-300">🔄 Find Better Taxi</h4>
                <p className="text-[11px] text-slate-400">Call AI Optimization Engine for faster route</p>
              </button>

              {/* Card 3: View Nearby Taxis */}
              <button
                onClick={() => setShowNearbyTaxisModal(true)}
                className="p-4 rounded-2xl glass-card border border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-left transition-all group space-y-2"
              >
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 w-fit group-hover:scale-110 transition-transform">
                  <Car className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-emerald-300">🚖 View Nearby Taxis</h4>
                <p className="text-[11px] text-slate-400">Real-time candidate taxis (5s refresh)</p>
              </button>

              {/* Card 4: Cancel Ride */}
              <button
                onClick={() => setShowCancelDialog(true)}
                className="p-4 rounded-2xl glass-card border border-slate-800 hover:border-rose-500/50 hover:bg-rose-500/10 text-left transition-all group space-y-2"
              >
                <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 w-fit group-hover:scale-110 transition-transform">
                  <X className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-rose-300">❌ Cancel Ride</h4>
                <p className="text-[11px] text-slate-400">Exit commute with alternative choices</p>
              </button>

              {/* Card 5: Call Driver */}
              <button
                onClick={() => setShowCallModal(true)}
                className="p-4 rounded-2xl glass-card border border-slate-800 hover:border-amber-500/50 hover:bg-amber-500/10 text-left transition-all group space-y-2"
              >
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 w-fit group-hover:scale-110 transition-transform">
                  <Phone className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-amber-300">📞 Call Driver</h4>
                <p className="text-[11px] text-slate-400">One-tap direct contact with driver</p>
              </button>

              {/* Card 6: Chat Driver */}
              <button
                onClick={() => setShowChatDrawer(true)}
                className="p-4 rounded-2xl glass-card border border-slate-800 hover:border-teal-500/50 hover:bg-teal-500/10 text-left transition-all group space-y-2 relative"
              >
                <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-400 w-fit group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-teal-300">💬 Chat Driver</h4>
                <p className="text-[11px] text-slate-400">In-ride real-time Socket.IO chat</p>
                {chatMessages.length > 0 && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold text-teal-300 bg-teal-500/20 px-2 py-0.5 rounded-full border border-teal-500/30">
                    {chatMessages.length} msg
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SAFE RIDE AI MODAL */}
      <SafeRideModal
        isOpen={showSafetyModal}
        onClose={() => setShowSafetyModal(false)}
        ride={ride}
        passengerId={userId}
        onRideUpdated={fetchRideDetails}
      />

      {/* CALL DRIVER MODAL */}
      {showCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-sm glass-card border border-amber-500/30 rounded-3xl p-6 space-y-4 text-center">
            <Phone className="w-10 h-10 text-amber-400 mx-auto animate-bounce" />
            <h3 className="text-lg font-bold text-white">Call Driver</h3>
            <p className="text-xs text-slate-300 font-bold">{ride.driverName}</p>
            <p className="text-sm font-mono font-bold text-emerald-400">+1 (555) 019-2834</p>
            <div className="flex justify-center space-x-2 pt-2">
              <button onClick={() => setShowCallModal(false)} className="px-3 py-2 rounded-xl text-xs font-bold text-slate-400 glass-card">
                Close
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText("+15550192834");
                  toast.success("Phone number copied to clipboard!");
                }}
                className="px-3 py-2 rounded-xl text-xs font-bold text-amber-300 bg-amber-950/40 border border-amber-500/40"
              >
                Copy Number
              </button>
              <a href="tel:+15550192834" className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500">
                Dial Now
              </a>
            </div>
          </div>
        </div>
      )}

      {/* CHAT DRIVER DRAWER */}
      {showChatDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 p-6 flex flex-col justify-between shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <MessageSquare className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-white">Chat with {ride.driverName}</h3>
              </div>
              <button onClick={() => setShowChatDrawer(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto my-4 space-y-3 pr-1">
              {chatMessages.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-8">No messages yet. Send a message to your driver.</p>
              ) : (
                chatMessages.map((msg, idx) => {
                  const isMe = msg.senderId === userId || msg.senderName === dbUser?.fullName;
                  return (
                    <div key={idx} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                      <span className="text-[10px] text-slate-400 font-semibold mb-0.5">{msg.senderName}</span>
                      <div className={`p-3 rounded-2xl text-xs max-w-[80%] ${isMe ? "bg-teal-600 text-white rounded-tr-none" : "bg-slate-800 text-slate-200 rounded-tl-none"}`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendChat} className="flex items-center space-x-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type message to driver..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
              <button
                type="submit"
                disabled={sendingChat || !chatInput.trim()}
                className="p-2.5 rounded-xl text-white bg-teal-600 hover:bg-teal-500 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VIEW NEARBY TAXIS MODAL (5s Socket Auto-Refresh) */}
      {showNearbyTaxisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-xl glass-card border border-emerald-500/30 bg-slate-900/95 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Car className="w-5 h-5 text-emerald-400" />
                <span>Nearby Available Taxis ({candidateTaxis.length})</span>
              </h3>
              <button onClick={() => setShowNearbyTaxisModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {fetchingCandidateTaxis && candidateTaxis.length === 0 ? (
              <div className="p-8 text-center text-xs text-indigo-400 glass-card rounded-2xl animate-pulse">
                Fetching live nearby candidate taxis...
              </div>
            ) : candidateTaxis.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No nearby candidate taxis found matching route vector (≥80% match).</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {candidateTaxis.map((t) => (
                  <div key={t._id} className="p-4 rounded-2xl glass-card border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">🚖 {t.driverName} <span className="text-amber-400 text-[11px]">★ {t.driverRating}</span></p>
                      <p className="text-slate-400 font-mono">Plate: {t.taxiNumber} • {t.distanceKm} km away</p>
                      <p className="text-emerald-400 font-mono text-[11px]">ETA: ~{t.etaMinutes} mins • Fare: ${t.estimatedFare} • Match: {t.routeMatchPercentage}%</p>
                    </div>
                    <button
                      onClick={() => handleSwitchToTaxi(t._id)}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md"
                    >
                      Switch
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CANCEL RIDE DIALOG */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md glass-card border border-rose-500/30 bg-slate-900 rounded-3xl p-6 space-y-4 text-center">
            <X className="w-10 h-10 text-rose-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Cancel Shared Ride Portion?</h3>
            <p className="text-xs text-slate-300">Before cancelling, would you like to continue your journey using another RouteMate taxi?</p>
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setShowCancelDialog(false);
                  setShowNearbyTaxisModal(true);
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500"
              >
                View Available Taxis
              </button>
              <button
                onClick={() => setShowCancelDialog(false)}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700"
              >
                Continue Ride
              </button>
              <button
                onClick={handleCancelRideAction}
                disabled={actionLoading}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-rose-300 bg-rose-950/40 border border-rose-500/40"
              >
                Cancel Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveRideTracking;
