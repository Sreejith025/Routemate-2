import React from "react";
import { Users, DollarSign, Clock, MapPin, TrendingDown, CheckCircle2, ShieldCheck } from "lucide-react";

/**
 * FEATURE 8 & 9: Second Passenger Ride Summary & Fare Breakdown Card
 */
const SecondPassengerCard = ({ ride, passengers = [], sharedFareTotal = 300 }) => {
  if (!passengers || passengers.length < 2) {
    return null;
  }

  const p1 = passengers[0];
  const p2 = passengers[1];

  return (
    <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl space-y-6 text-white">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                Active Shared Commute
              </span>
              <span className="text-xs font-mono text-indigo-400 font-bold">2 PASSENGERS JOINED</span>
            </div>
            <h3 className="text-lg font-black text-white mt-0.5">Dual Passenger Fare & Route Summary</h3>
          </div>
        </div>

        <div className="bg-emerald-950/60 border border-emerald-500/40 px-4 py-2 rounded-2xl text-right shrink-0">
          <span className="text-[10px] text-emerald-300 font-bold uppercase block">Total Shared Commute Fare</span>
          <span className="text-xl font-black text-emerald-400 font-mono">₹{sharedFareTotal || (p1.fare + p2.fare)}</span>
        </div>
      </div>

      {/* Passenger Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PASSENGER 1 CARD */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-emerald-500/30 space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></span>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Passenger 1</span>
            </div>
            <span className="text-xs font-bold text-white bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              {p1.name || "Passenger 1"}
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-300">
            <p className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Pickup: <strong className="text-white">{p1.pickup}</strong></span>
            </p>
            <p className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>Drop: <strong className="text-white">{p1.dropoff}</strong></span>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-[11px]">
            <div>
              <span className="text-slate-500 block font-semibold">Distance</span>
              <strong className="text-white font-mono text-xs">{p1.distanceKm || 10} km</strong>
            </div>
            <div>
              <span className="text-slate-500 block font-semibold">Private Fare</span>
              <span className="text-slate-400 line-through font-mono">₹{p1.originalPrivateFare || 220}</span>
            </div>
            <div>
              <span className="text-emerald-400 block font-bold">Shared Fare</span>
              <strong className="text-emerald-400 font-mono text-sm">₹{p1.fare || 170}</strong>
            </div>
          </div>

          <div className="bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/30 text-xs flex items-center justify-between text-emerald-300 font-bold">
            <span className="flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-emerald-400" /> Total Savings:
            </span>
            <span className="font-mono text-emerald-400">₹{p1.savings || 50} Saved</span>
          </div>
        </div>

        {/* PASSENGER 2 CARD */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-amber-500/30 space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 shadow-lg shadow-amber-500/50"></span>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Passenger 2</span>
            </div>
            <span className="text-xs font-bold text-white bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
              {p2.name || "Passenger 2"}
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-300">
            <p className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Pickup: <strong className="text-white">{p2.pickup}</strong></span>
            </p>
            <p className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>Drop: <strong className="text-white">{p2.dropoff}</strong></span>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-[11px]">
            <div>
              <span className="text-slate-500 block font-semibold">Distance</span>
              <strong className="text-white font-mono text-xs">{p2.distanceKm || 8} km</strong>
            </div>
            <div>
              <span className="text-slate-500 block font-semibold">Private Fare</span>
              <span className="text-slate-400 line-through font-mono">₹{p2.originalPrivateFare || 180}</span>
            </div>
            <div>
              <span className="text-amber-400 block font-bold">Shared Fare</span>
              <strong className="text-amber-400 font-mono text-sm">₹{p2.fare || 130}</strong>
            </div>
          </div>

          <div className="bg-amber-950/40 p-2.5 rounded-xl border border-amber-500/30 text-xs flex items-center justify-between text-amber-300 font-bold">
            <span className="flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-amber-400" /> Total Savings:
            </span>
            <span className="font-mono text-amber-400">₹{p2.savings || 50} Saved</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecondPassengerCard;
