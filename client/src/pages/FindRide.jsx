import React from "react";
import { Search, MapPin, Calendar, Clock, Filter, Car } from "lucide-react";

const FindRide = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-3xl font-extrabold text-white">Find a Ride</h1>
        <p className="text-slate-400 text-sm mt-1">
          Search upcoming rides posted by verified RouteMate drivers.
        </p>
      </div>

      {/* Search Filter Bar */}
      <div className="glass-card border border-slate-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">Origin</label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-indigo-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Leaving from..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">Destination</label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Going to..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">Travel Date</label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-violet-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="date"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-end">
          <button className="w-full py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center space-x-2 transition-colors">
            <Search className="w-4 h-4" />
            <span>Search Rides</span>
          </button>
        </div>
      </div>

      {/* Empty State / Coming Soon Banner */}
      <div className="glass-card border border-slate-800 rounded-2xl p-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mx-auto flex items-center justify-center">
          <Car className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white">Ride Booking Module Ready</h3>
        <p className="text-slate-400 max-w-md mx-auto text-sm">
          Authentication & profile sync are active. Ride creation and real-time seat booking will connect in the next phase!
        </p>
      </div>
    </div>
  );
};

export default FindRide;
