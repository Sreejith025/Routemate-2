import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import {
  Car,
  PlusCircle,
  Users,
  DollarSign,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  MapPin,
  Clock,
  Zap,
  CheckCircle2,
  XCircle,
  TrendingUp,
  AlertCircle,
  Navigation,
  RefreshCw,
} from "lucide-react";
import LiveMap from "../components/LiveMap";
import { getUserRideHistoryApi } from "../services/api";
import toast from "react-hot-toast";

const DriverDashboard = () => {
  const { dbUser, clerkUser, role } = useAuthContext();
  const [isAvailable, setIsAvailable] = useState(true);
  const [driverRides, setDriverRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDriverRides();
  }, []);

  const fetchDriverRides = async () => {
    try {
      setLoading(true);
      const res = await getUserRideHistoryApi();
      if (res.data?.history) {
        setDriverRides(res.data.history);
      }
    } catch (err) {
      console.error("Fetch driver rides error:", err);
    } finally {
      setLoading(false);
    }
  };

  const activeRides = driverRides.filter((r) => r.status === "active" || r.status === "scheduled");
  const completedRides = driverRides.filter((r) => r.status === "completed");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Driver Welcome Banner */}
      <div className="p-8 rounded-3xl glass-card border border-emerald-500/20 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-950 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <img
              src={clerkUser?.imageUrl || dbUser?.profileImage || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"}
              alt="Profile"
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-500/50 shadow-lg"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-black text-white">
                  Driver Hub: {dbUser?.fullName || clerkUser?.firstName || "Driver"} 🚗
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {role || "Driver"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Driver Email: {dbUser?.email || clerkUser?.primaryEmailAddress?.emailAddress} • MongoDB Synced
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Availability Toggle */}
            <button
              onClick={() => {
                setIsAvailable(!isAvailable);
                toast(isAvailable ? "Status set to Offline." : "Status set to Online & Ready for Rides!");
              }}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                isAvailable
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-500/10"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
            >
              {isAvailable ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
              <span>{isAvailable ? "Status: ONLINE (Accepting Rides)" : "Status: OFFLINE"}</span>
            </button>

            <Link
              to="/offer-ride"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition-all hover:scale-105"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Offer New Route</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Driver Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Hosted Trips</span>
            <Car className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-400 font-mono">{driverRides.length}</p>
          <p className="text-xs text-slate-400">Published MongoDB Routes</p>
        </div>

        <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Offers</span>
            <Clock className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">{activeRides.length}</p>
          <p className="text-xs text-slate-400">En-route / Scheduled</p>
        </div>

        <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed Trips</span>
            <CheckCircle2 className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">{completedRides.length}</p>
          <p className="text-xs text-slate-400">Successfully Served</p>
        </div>

        <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Account Verification</span>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-lg font-bold text-emerald-400 flex items-center gap-1.5 pt-1">
            Verified Host
          </p>
          <p className="text-xs text-slate-500">Clerk & MongoDB Synced</p>
        </div>
      </div>

      {/* Main Grid: Active Driver Routes & Navigation Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Active Published Routes */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Car className="w-5 h-5 text-emerald-400" />
                <span>Your Published Route Listings ({driverRides.length})</span>
              </h3>
              <button onClick={fetchDriverRides} className="text-xs text-indigo-400 hover:underline flex items-center gap-1">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-indigo-400 glass-card rounded-2xl animate-pulse">
                Loading driver routes from database...
              </div>
            ) : driverRides.length === 0 ? (
              <div className="p-8 rounded-2xl glass-card text-center text-xs text-slate-400 space-y-3">
                <Car className="w-10 h-10 text-slate-500 mx-auto" />
                <p className="text-sm font-bold text-white">No published routes yet</p>
                <p className="text-xs text-slate-500">Click "Offer New Route" to list your available car seats.</p>
                <Link
                  to="/offer-ride"
                  className="inline-block mt-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500"
                >
                  Offer a Ride Now
                </Link>
              </div>
            ) : (
              driverRides.map((ride) => (
                <div
                  key={ride._id}
                  className="p-5 rounded-2xl glass-card border border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {ride.status}
                    </span>
                    <span className="text-sm font-black text-emerald-400 font-mono">${ride.pricePerSeat} / seat</span>
                  </div>

                  <div className="text-xs space-y-1 text-slate-300 font-medium">
                    <p>Origin: <strong>{ride.origin}</strong></p>
                    <p>Destination: <strong>{ride.destination}</strong></p>
                    <p className="text-slate-400 text-[11px]">
                      Vehicle: {ride.vehicleDetails?.make} {ride.vehicleDetails?.model} ({ride.vehicleDetails?.plate})
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>Seats Available: {ride.seatsAvailable}</span>
                    <span>Passengers: {ride.passengers?.length || 0}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Live OSM Route Navigation Map */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Navigation className="w-5 h-5 text-emerald-400" />
              <span>Live Navigation & Route Telemetry</span>
            </h3>
            <span className="text-xs text-emerald-400 font-mono font-bold">DATABASE TELEMETRY</span>
          </div>

          <LiveMap
            height="480px"
            center={{ lat: 12.9716, lng: 77.5946 }}
            zoom={13}
            drivers={driverRides.map((r) => ({
              name: r.driverName,
              vehicle: `${r.vehicleDetails?.make} ${r.vehicleDetails?.model}`,
              lat: r.originCoords?.lat,
              lng: r.originCoords?.lng,
            }))}
            switchAlert={true}
          />
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
