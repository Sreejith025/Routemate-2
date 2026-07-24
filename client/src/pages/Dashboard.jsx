import React from "react";
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
} from "lucide-react";

const Dashboard = () => {
  const { dbUser, clerkUser, role } = useAuthContext();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden p-8 rounded-3xl glass-card border border-indigo-500/20 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-950">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-600/20 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center space-x-4">
            <img
              src={clerkUser?.imageUrl || dbUser?.profileImage || "https://via.placeholder.com/150"}
              alt="Profile"
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500/50 shadow-lg"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-white">
                  Welcome back, {dbUser?.fullName || clerkUser?.firstName || "Passenger"}! 👋
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {role || "Passenger"}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                {dbUser?.email || clerkUser?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/find-ride"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 flex items-center space-x-2 transition-all"
            >
              <Search className="w-4 h-4" />
              <span>Find a Ride</span>
            </Link>
            <Link
              to="/profile"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 glass-card hover:bg-slate-800 border border-slate-700 flex items-center space-x-2 transition-colors"
            >
              <User className="w-4 h-4" />
              <span>Edit Profile</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-sm font-medium">Upcoming Rides</span>
            <Clock className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">0</p>
          <p className="text-xs text-slate-500">No active ride reservations</p>
        </div>

        <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-sm font-medium">Total Commutes</span>
            <Car className="w-5 h-5 text-violet-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">0</p>
          <p className="text-xs text-slate-500">Completed rides through RouteMate</p>
        </div>

        <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-sm font-medium">Account Status</span>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-lg font-bold text-emerald-400 flex items-center gap-1.5 pt-1">
            <Award className="w-5 h-5" /> Verified Passenger
          </p>
          <p className="text-xs text-slate-500">Clerk & MongoDB Synced</p>
        </div>
      </div>

      {/* Quick Action Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Find Available Rides</h3>
              <p className="text-xs text-slate-400">Search rides heading to your destination</p>
            </div>
          </div>
          <p className="text-sm text-slate-300">
            Browse upcoming driver offerings across top commuting routes in real-time.
          </p>
          <Link
            to="/find-ride"
            className="inline-flex items-center text-sm font-semibold text-indigo-400 hover:text-indigo-300"
          >
            Explore Available Routes →
          </Link>
        </div>

        <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Become a Driver</h3>
              <p className="text-xs text-slate-400">Share seats on your daily commute</p>
            </div>
          </div>
          <p className="text-sm text-slate-300">
            Switch your profile role to Driver on your Profile page to start offering rides and earning.
          </p>
          <Link
            to="/profile"
            className="inline-flex items-center text-sm font-semibold text-emerald-400 hover:text-emerald-300"
          >
            Update Role in Profile →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
