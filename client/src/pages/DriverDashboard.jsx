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
} from "lucide-react";

const DriverDashboard = () => {
  const { dbUser, clerkUser, role } = useAuthContext();
  const [isAvailable, setIsAvailable] = useState(true);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Driver Welcome Header */}
      <div className="p-8 rounded-3xl glass-card border border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <img
              src={clerkUser?.imageUrl || dbUser?.profileImage || "https://via.placeholder.com/150"}
              alt="Profile"
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-500/50 shadow-lg"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-white">
                  Driver Hub: {dbUser?.fullName || clerkUser?.firstName || "Driver"} 🚗
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {role}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                {dbUser?.email || clerkUser?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Availability Toggle */}
            <button
              onClick={() => setIsAvailable(!isAvailable)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                isAvailable
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
            >
              {isAvailable ? (
                <ToggleRight className="w-5 h-5 text-emerald-400" />
              ) : (
                <ToggleLeft className="w-5 h-5 text-slate-400" />
              )}
              <span>{isAvailable ? "Available to Host" : "Offline"}</span>
            </button>

            <Link
              to="/offer-ride"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/30 flex items-center space-x-2 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Offer a Ride</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-sm font-medium">Active Ride Offers</span>
            <Car className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">0</p>
          <p className="text-xs text-slate-500">Scheduled driver routes</p>
        </div>

        <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-sm font-medium">Passengers Hosted</span>
            <Users className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">0</p>
          <p className="text-xs text-slate-500">Total commuters served</p>
        </div>

        <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-sm font-medium">Fuel Expenses Saved</span>
            <DollarSign className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">$0.00</p>
          <p className="text-xs text-slate-500">Shared commute contribution</p>
        </div>
      </div>

      {/* Driver Instructions */}
      <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          Driver Onboarding & Verification Complete
        </h3>
        <p className="text-sm text-slate-300">
          Your account is synced with MongoDB as a registered Driver. You can now publish routes for passengers to request seats.
        </p>
        <div className="pt-2">
          <Link
            to="/offer-ride"
            className="inline-flex items-center space-x-2 text-sm font-semibold text-emerald-400 hover:text-emerald-300"
          >
            <span>Publish New Route Listing</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
