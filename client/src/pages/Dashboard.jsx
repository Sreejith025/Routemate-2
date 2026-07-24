import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  LogOut,
  SlidersHorizontal,
} from "lucide-react";
import LiveMap from "../components/LiveMap";
import TaxiSwitchCard from "../components/TaxiSwitchCard";
import SmartSwitchModal from "../components/SmartSwitchModal";
import { getAvailableRidesApi, getUserRideHistoryApi } from "../services/api";

const Dashboard = () => {
  const { dbUser, clerkUser, role } = useAuthContext();
  const [rides, setRides] = useState([]);
  const [userHistory, setUserHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRideForExit, setActiveRideForExit] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [ridesRes, historyRes] = await Promise.allSettled([
        getAvailableRidesApi(),
        getUserRideHistoryApi(),
      ]);

      if (ridesRes.status === "fulfilled" && ridesRes.value.data?.rides) {
        setRides(ridesRes.value.data.rides);
      }
      if (historyRes.status === "fulfilled" && historyRes.value.data?.history) {
        setUserHistory(historyRes.value.data.history);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const activeRides = userHistory.filter((r) => r.status === "active" || r.status === "scheduled");
  const completedRides = userHistory.filter((r) => r.status === "completed");
  const activeSwitchRide = userHistory.find((r) => r.dynamicSwitchSuggested || r.switchDetails?.status === "pending");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner Card */}
      <div className="relative overflow-hidden p-8 rounded-3xl glass-card border border-indigo-500/20 bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-950 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center space-x-4">
            <img
              src={clerkUser?.imageUrl || dbUser?.profileImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
              alt="Profile"
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500/50 shadow-lg"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-black text-white">
                  Welcome back, {dbUser?.fullName || clerkUser?.firstName || "Passenger"}! 👋
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {role || "Passenger"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {dbUser?.email || clerkUser?.primaryEmailAddress?.emailAddress} • MongoDB Synced
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/find-ride"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all hover:scale-105"
            >
              <Search className="w-4 h-4" />
              <span>Book New Ride</span>
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

      {/* Ride Controls Section (Part 3 - Active Ride Controls) */}
      {activeRides.length > 0 && (
        <div className="glass-card border border-amber-500/30 rounded-3xl p-6 space-y-4 bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-950">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <SlidersHorizontal className="w-5 h-5 text-amber-400" />
              <span>Ride Controls</span>
            </h3>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
              Active Ride Controls
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start space-x-4">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 shrink-0">
                <LogOut className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Leave Shared Ride</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                  Leave the current shared ride and continue your journey using another RouteMate taxi if available.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveRideForExit(activeRides[0])}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 shadow-lg shadow-amber-500/20 shrink-0 transition-all hover:scale-105"
            >
              Leave Shared Ride
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Taxi Switch Live Alert Banner (If triggered on an active ride) */}
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
            <span className="text-xs font-semibold uppercase tracking-wider">Completed Trips</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-400 font-mono">{completedRides.length}</p>
          <p className="text-xs text-slate-400">Safely Arrived</p>
        </div>

        <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Account Status</span>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-lg font-bold text-emerald-400 flex items-center gap-1.5 pt-1">
            <Award className="w-5 h-5" /> Verified
          </p>
          <p className="text-xs text-slate-500">Clerk & MongoDB Synced</p>
        </div>
      </div>

      {/* Live Map & Nearby Drivers Section */}
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
            drivers={rides.map((r) => ({
              name: r.driverName,
              vehicle: `${r.vehicleDetails?.make} ${r.vehicleDetails?.model}`,
              lat: r.originCoords?.lat,
              lng: r.originCoords?.lng,
            }))}
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

      {/* Smart Switch Modal (Part 3 & 4) */}
      {activeRideForExit && (
        <SmartSwitchModal
          rideId={activeRideForExit._id}
          onClose={() => setActiveRideForExit(null)}
          onSwitchCompleted={fetchDashboardData}
        />
      )}
    </div>
  );
};

export default Dashboard;
