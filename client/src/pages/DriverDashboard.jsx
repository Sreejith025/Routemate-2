import React, { useState } from "react";
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
} from "lucide-react";
import LiveMap from "../components/LiveMap";
import toast from "react-hot-toast";

const MOCK_REQUESTS = [
  {
    id: "req-1",
    passengerName: "Michael Chang",
    pickup: "Central Station Gate 3",
    dropoff: "Innovation Hub",
    seatsRequested: 1,
    fare: 14,
    distance: "3.2 miles away",
  },
  {
    id: "req-2",
    passengerName: "Jessica Alba",
    pickup: "Suburban Plaza",
    dropoff: "Downtown Tech Park",
    seatsRequested: 2,
    fare: 26,
    distance: "1.8 miles away",
  },
];

const DriverDashboard = () => {
  const { dbUser, clerkUser, role } = useAuthContext();
  const [isAvailable, setIsAvailable] = useState(true);
  const [requests, setRequests] = useState(MOCK_REQUESTS);
  const [activePassengers, setActivePassengers] = useState([
    { name: "Sarah Connor (Taxi Switch Candidate)", pickup: "Expressway Exit 14", dropoff: "Airport T2" },
  ]);

  const handleAcceptRequest = (id, name) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    toast.success(`Accepted ride request from ${name}!`);
  };

  const handleDeclineRequest = (id) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    toast("Ride request declined.");
  };

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
                  Driver Hub: {dbUser?.fullName || clerkUser?.firstName || "Alex Rivera"} 🚗
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {role || "Driver"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Vehicle: Tesla Model 3 • Plate: EV-9901 • RouteMate Verified
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
            <span className="text-xs font-semibold uppercase tracking-wider">Weekly Earnings</span>
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-400 font-mono">$248.50</p>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> +18% vs last week
          </p>
        </div>

        <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Trips Completed</span>
            <Car className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">14</p>
          <p className="text-xs text-slate-400">Rating: 4.98 ★ (120 reviews)</p>
        </div>

        <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Taxi Switch Detours</span>
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-amber-400 font-mono">6</p>
          <p className="text-xs text-slate-400">+$42.00 Bonus earned for mid-ride pick-ups</p>
        </div>

        <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Seats Available</span>
            <Users className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">2 / 4</p>
          <p className="text-xs text-emerald-400">Active passenger on board</p>
        </div>
      </div>

      {/* Main Grid: Incoming Requests & Active Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Requests & Active Passengers */}
        <div className="lg:col-span-5 space-y-6">
          {/* Incoming Ride Requests Queue */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <span>Incoming Ride Requests</span>
              </h3>
              <span className="text-xs font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {requests.length} PENDING
              </span>
            </div>

            {requests.length === 0 ? (
              <div className="p-6 rounded-2xl glass-card text-center text-xs text-slate-400">
                No pending ride requests right now. Sitting ready!
              </div>
            ) : (
              requests.map((req) => (
                <div
                  key={req.id}
                  className="p-5 rounded-2xl glass-card border border-amber-500/30 space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{req.passengerName}</span>
                    <span className="text-sm font-black text-emerald-400 font-mono">+${req.fare}</span>
                  </div>

                  <div className="text-xs space-y-1 text-slate-300">
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>Pickup: <strong>{req.pickup}</strong> ({req.distance})</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Dropoff: <strong>{req.dropoff}</strong></span>
                    </p>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => handleDeclineRequest(req.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleAcceptRequest(req.id, req.passengerName)}
                      className="flex items-center space-x-1 px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/30"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Accept Request</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Active Passenger List */}
          <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Current On-Board Passengers</span>
            </h3>

            {activePassengers.map((p, idx) => (
              <div key={idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1 text-xs">
                <div className="flex items-center justify-between font-bold text-white">
                  <span>{p.name}</span>
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">Rendezvous Transfer</span>
                </div>
                <p className="text-slate-400">Drop-off target: {p.dropoff}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Live OSM Route Navigation Map */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Navigation className="w-5 h-5 text-emerald-400" />
              <span>Active Route Navigation Map</span>
            </h3>
            <span className="text-xs text-emerald-400 font-mono font-bold">GPS ACTIVE</span>
          </div>

          <LiveMap
            height="460px"
            center={{ lat: 12.955, lng: 77.61 }}
            zoom={13}
            drivers={[{ name: "Your Vehicle (Tesla Model 3)", vehicle: "EV-9901", lat: 12.955, lng: 77.61 }]}
            passengers={[{ name: "Sarah C. (Switch Node)", lat: 12.96, lng: 77.6 }]}
            switchAlert={true}
          />
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
