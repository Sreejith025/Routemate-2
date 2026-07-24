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
} from "lucide-react";
import LiveMap from "../components/LiveMap";
import TaxiSwitchCard from "../components/TaxiSwitchCard";
import { getAvailableRidesApi } from "../services/api";

const Dashboard = () => {
  const { dbUser, clerkUser, role } = useAuthContext();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [switchAlertActive, setSwitchAlertActive] = useState(true);

  useEffect(() => {
    fetchRides();
  }, []);

  const fetchRides = async () => {
    try {
      setLoading(true);
      const res = await getAvailableRidesApi();
      if (res.data?.rides) {
        setRides(res.data.rides);
      }
    } catch (err) {
      console.error("Dashboard fetch rides error:", err);
    } finally {
      setLoading(false);
    }
  };

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
                {dbUser?.email || clerkUser?.primaryEmailAddress?.emailAddress} • Account Status: Active
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

      {/* Dynamic Taxi Switch Live Recommendation Banner */}
      {switchAlertActive && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Zap className="w-4 h-4 fill-current animate-pulse" />
              <span>Live Active Trip Monitor</span>
            </h3>
            <button
              onClick={() => setSwitchAlertActive(false)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Dismiss
            </button>
          </div>
          <TaxiSwitchCard
            passengerName={dbUser?.fullName || "Sarah Connor"}
            currentTaxi="Taxi A (Toyota Prius • RT-8842)"
            targetTaxi="Taxi B (Tesla Model 3 • EV-9901)"
            driverBName="Marcus Vance"
            delayReason="Expressway Gridlock (+18m delay)"
            timeSaved={14}
            onAccept={() => console.log("Switch accepted")}
          />
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Trip</span>
            <Clock className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">1</p>
          <p className="text-xs text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> En-route to Airport
          </p>
        </div>

        <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Time Saved</span>
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-amber-400 font-mono">42 Mins</p>
          <p className="text-xs text-slate-400">Via 3 Intelligent Taxi Switches</p>
        </div>

        <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed Rides</span>
            <Car className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">8</p>
          <p className="text-xs text-slate-400">Shared Commutes</p>
        </div>

        <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Account Status</span>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-lg font-bold text-emerald-400 flex items-center gap-1.5 pt-1">
            <Award className="w-5 h-5" /> Verified
          </p>
          <p className="text-xs text-slate-500">Clerk Auth Synced</p>
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
            <span className="text-xs text-slate-400 font-mono">Live Sync</span>
          </div>

          <LiveMap
            height="420px"
            center={{ lat: 12.9716, lng: 77.5946 }}
            zoom={13}
            drivers={rides.map((r, i) => ({
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
            <button onClick={fetchRides} className="text-xs text-indigo-400 hover:underline flex items-center gap-1">
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
