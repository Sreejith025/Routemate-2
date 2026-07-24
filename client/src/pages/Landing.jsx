import React from "react";
import { Link } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import {
  Car,
  Search,
  PlusCircle,
  ShieldCheck,
  Zap,
  Users,
  MapPin,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

const Landing = () => {
  const { isSignedIn, role, dbUser } = useAuthContext();

  const getDashboardPath = () => {
    if (role === "Driver") return "/driver";
    if (role === "Admin") return "/admin";
    return "/dashboard";
  };

  return (
    <div className="relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full glass-card border border-indigo-500/30 text-indigo-400 text-xs font-semibold tracking-wide uppercase shadow-lg shadow-indigo-500/10 animate-pulse">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Next-Gen Community Ride Sharing</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight">
            Smarter Rides, <br className="hidden sm:block" />
            <span className="gradient-text">Shared Journeys</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Connect with verified drivers and passengers. Lower travel costs, reduce your carbon footprint, and enjoy seamless daily commutes with RouteMate.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {isSignedIn ? (
              <>
                <Link
                  to={getDashboardPath()}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all hover:scale-105"
                >
                  <Car className="w-5 h-5" />
                  <span>Go to My Dashboard ({role})</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/find-ride"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold text-slate-200 glass-card hover:bg-slate-800 border border-slate-700 flex items-center justify-center space-x-2 transition-all"
                >
                  <Search className="w-5 h-5 text-indigo-400" />
                  <span>Find a Ride</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/sign-up"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all hover:scale-105"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/sign-in"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold text-slate-200 glass-card hover:bg-slate-800 border border-slate-700 flex items-center justify-center space-x-2 transition-all"
                >
                  <span>Sign In to Account</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <div className="p-8 rounded-2xl glass-card border border-slate-800 hover:border-indigo-500/40 transition-all duration-300 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Instant Route Search</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Find rides matching your exact destination, schedule, and preferences in seconds.
            </p>
          </div>

          <div className="p-8 rounded-2xl glass-card border border-slate-800 hover:border-indigo-500/40 transition-all duration-300 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Clerk Verified Profiles</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Every driver and passenger profile is authenticated via Clerk and synced with secure MongoDB records.
            </p>
          </div>

          <div className="p-8 rounded-2xl glass-card border border-slate-800 hover:border-indigo-500/40 transition-all duration-300 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <PlusCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Offer Rides & Earn</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Drivers can list available seats on daily routes and offset commuting fuel expenses seamlessly.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
