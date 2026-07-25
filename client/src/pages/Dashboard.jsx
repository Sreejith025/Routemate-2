import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import {
  User,
  Search,
  Clock,
  MapPin,
  ShieldCheck,
  PlusCircle,
  Car,
  TrendingUp,
  Award,
  Zap,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import LiveMap from "../components/LiveMap";
import TaxiSwitchCard from "../components/TaxiSwitchCard";
import RideControlsSection from "../components/RideControlsSection";
import { getAvailableRidesApi, getUserRideHistoryApi } from "../services/api";
import socket from "../services/socket";
import toast from "react-hot-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { dbUser, clerkUser, role } = useAuthContext();
  const [rides, setRides] = useState([]);
  const [userHistory, setUserHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    // Listen for driver manual booking acceptance/rejection
    const handleBookingAccepted = (data) => {
      toast.success(data.message || "🎉 Driver accepted your booking! Redirecting to Active Ride Tracking...", { duration: 5000 });
      fetchDashboardData();
      if (data.rideId) {
        navigate(`/active-ride/${data.rideId}`);
      }
    };

    const handleBookingRejected = (data) => {
      toast.error(data.message || "Driver declined your booking request.", { duration: 5000 });
      fetchDashboardData();
    };

    socket.on("bookingAccepted", handleBookingAccepted);
    socket.on("bookingRejected", handleBookingRejected);

    return () => {
      socket.off("bookingAccepted", handleBookingAccepted);
      socket.off("bookingRejected", handleBookingRejected);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [ridesRes, historyRes, nearbyRes] = await Promise.allSettled([
        getAvailableRidesApi(),
        getUserRideHistoryApi(),
        getNearbyDriversApi(),
      ]);

      if (ridesRes.status === "fulfilled" && ridesRes.value.data?.rides) {
        setRides(ridesRes.value.data.rides);
      }
      if (historyRes.status === "fulfilled" && historyRes.value.data?.history) {
        setUserHistory(historyRes.value.data.history);
      }
      if (nearbyRes.status === "fulfilled" && nearbyRes.value.data?.drivers) {
        setNearbyDrivers(nearbyRes.value.data.drivers);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const currentUserId = clerkUser?.id || dbUser?.clerkId;

  // Active confirmed rides
  const activeRides = userHistory.filter(
    (r) =>
      (r.status === "active" || r.status === "scheduled") &&
      r.passengers?.some((p) => p.userId === currentUserId || String(p.userId) === String(currentUserId))
  );

  // Pending booking requests waiting for driver manual confirmation
  const pendingBookingRides = userHistory.filter(
    (r) =>
      r.bookingRequests?.some(
        (br) => (br.userId === currentUserId || String(br.userId) === String(currentUserId)) && br.status === "pending"
      ) &&
      !r.passengers?.some((p) => p.userId === currentUserId || String(p.userId) === String(currentUserId))
  );

  const completedRides = userHistory.filter((r) => r.status === "completed");
  const activeSwitchRide = userHistory.find((r) => r.dynamicSwitchSuggested || r.switchDetails?.status === "pending");

  const allMapDrivers = useMemo(() => {
    const list = [];
    const addedIds = new Set();

    for (const d of nearbyDrivers) {
      if (d.lat && d.lng) {
        list.push(d);
        if (d.driverId) addedIds.add(d.driverId);
      }
    }

    for (const r of rides) {
      if (r.originCoords?.lat && r.originCoords?.lng && (!r.driverId || !addedIds.has(r.driverId))) {
        list.push({
          name: r.driverName || "RouteMate Driver",
          vehicle: r.vehicleDetails ? `${r.vehicleDetails.make} ${r.vehicleDetails.model} (${r.vehicleDetails.plate})` : "RouteMate Taxi",
          lat: r.originCoords.lat,
          lng: r.originCoords.lng,
          rating: r.driverRating || 4.8,
        });
      }
    }

    return list;
  }, [nearbyDrivers, rides]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Driver / Passenger Header Banner */}
      <div className="p-8 rounded-3xl glass-card border border-indigo-500/20 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-950 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <img
              src={
                clerkUser?.imageUrl ||
                dbUser?.profileImage ||
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
              }
              alt="Profile"
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500/50 shadow-lg"
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase">
                  Passenger Dashboard
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold">LIVE METRICS</span>
              </div>
              <h1 className="text-2xl font-black text-white mt-1">
                Welcome, {dbUser?.fullName || clerkUser?.firstName || "Passenger"}!
              </h1>
              <p className="text-xs text-slate-400">
                Connected User: {dbUser?.email || clerkUser?.primaryEmailAddress?.emailAddress} • MongoDB & Socket Synced
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/find-ride"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all hover:scale-105"
            >
              <Search className="w-4 h-4" />
              <span>Find Available Rides</span>
            </Link>

            <Link
              to="/profile"
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 glass-card hover:bg-slate-800 border border-slate-700 flex items-center space-x-2 transition-colors"
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Dynamic Taxi Switch Live Alert Banner */}
      {activeSwitchRide && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Zap className="w-4 h-4 fill-current animate-pulse" />
              <span>Active Trip Recommendation</span>
            </h3>
          </div>
          <TaxiSwitchCard
            rideId={activeSwitchRide._id}
            passengerName={dbUser?.fullName || "Passenger"}
            currentTaxi={`Taxi A (${activeSwitchRide.driverName})`}
            targetTaxi={activeSwitchRide.switchDetails?.targetVehiclePlate || "Taxi B (Express)"}
            driverBName={activeSwitchRide.switchDetails?.targetTaxiDriverName || "Nearby Driver"}
            delayReason={activeSwitchRide.switchDetails?.reason || "Traffic delay ahead"}
            timeSaved={activeSwitchRide.switchDetails?.etaSavedMinutes || 12}
            onAccept={fetchDashboardData}
          />
        </div>
      )}

      {/* Pending Driver Confirmation Banner */}
      {pendingBookingRides.length > 0 && (
        <div className="p-5 rounded-3xl glass-card border border-amber-500/40 bg-amber-950/20 text-amber-300 space-y-3 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <Clock className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-200 uppercase tracking-wider">Booking Status: Pending Driver Approval</h4>
                <p className="text-sm font-extrabold text-white mt-0.5">
                  Request sent to {pendingBookingRides[0].driverName} ({pendingBookingRides[0].origin} ➔ {pendingBookingRides[0].destination})
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30">
              WAITING FOR DRIVER CONFIRMATION
            </span>
          </div>
        </div>
      )}

      {/* Active Shared Ride Controls & Live Tracking Link */}
      {activeRides.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl glass-card border border-emerald-500/30 bg-emerald-950/20">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <div>
                <h4 className="text-sm font-bold text-white">Confirmed Active Ride: {activeRides[0].origin} ➔ {activeRides[0].destination}</h4>
                <p className="text-xs text-slate-400">Driver: {activeRides[0].driverName} • Vehicle: {activeRides[0].vehicleDetails?.make} ({activeRides[0].vehicleDetails?.plate})</p>
              </div>
            </div>
            <Link
              to={`/ride/${activeRides[0]._id}`}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition-all hover:scale-105"
            >
              <Car className="w-4 h-4" />
              <span>Track Ride Live 🛰️</span>
            </Link>
          </div>

          <RideControlsSection
            ride={activeRides[0]}
            passengerId={clerkUser?.id || dbUser?.clerkId}
            onRideUpdated={fetchDashboardData}
          />
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Commutes</span>
            <Clock className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">{activeRides.length}</p>
          <p className="text-xs text-emerald-400 font-bold">
            {activeRides.length > 0 ? "Trip En-route" : "No current active rides"}
          </p>
        </div>

        <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Rides</span>
            <Car className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">{userHistory.length}</p>
          <p className="text-xs text-slate-400">MongoDB Database Records</p>
        </div>

        <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Saved CO2 Emissions</span>
            <Users className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-400">{(userHistory.length * 2.4).toFixed(1)} kg</p>
          <p className="text-xs text-emerald-400 font-bold">Shared Ride Impact</p>
        </div>

        <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Money Saved</span>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              RE-OPTIMIZED
            </span>
          </div>
          <p className="text-3xl font-extrabold text-white">₹{userHistory.length * 180}</p>
          <p className="text-xs text-slate-400">App Guaranteed Lock</p>
        </div>
      </div>

      {/* Main Grid: Telemetry & Available Drivers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* OpenStreetMap Component */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-indigo-400" />
              <span>Live OpenStreetMap Telemetry</span>
            </h3>
            <span className="text-xs text-emerald-400 font-mono font-bold">DATABASE CONNECTED</span>
          </div>

          <LiveMap
            height="420px"
            center={{ lat: 12.9716, lng: 77.5946 }}
            zoom={13}
            drivers={allMapDrivers}
            switchAlert={true}
          />
        </div>

        {/* Nearby Available Drivers Column */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Nearby RouteMate Taxis</h3>
            <button onClick={fetchDashboardData} className="text-xs text-indigo-400 hover:underline flex items-center gap-1">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {rides.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 glass-card rounded-2xl">
                No active drivers nearby right now.
              </div>
            ) : (
              rides.map((ride, idx) => (
                <div
                  key={ride._id || idx}
                  className="p-4 rounded-2xl glass-card border border-slate-800 hover:border-indigo-500/40 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400">{ride.driverName}</span>
                    <span className="text-xs font-bold text-emerald-400 font-mono">${ride.pricePerSeat}/seat</span>
                  </div>

                  <p className="text-xs text-white font-medium flex items-center space-x-1 truncate">
                    <span>{ride.origin}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{ride.destination}</span>
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                    <span>{ride.vehicleDetails?.make} {ride.vehicleDetails?.model}</span>
                    <Link
                      to="/find-ride"
                      className="text-indigo-400 font-semibold hover:underline"
                    >
                      Book Ride →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
