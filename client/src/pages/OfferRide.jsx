import React from "react";
import { PlusCircle, MapPin, Calendar, Clock, DollarSign, Users, Car } from "lucide-react";
import { useAuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";

const OfferRide = () => {
  const { role } = useAuthContext();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-3xl font-extrabold text-white">Offer a Ride</h1>
        <p className="text-slate-400 text-sm mt-1">
          Publish your upcoming commuting route for passengers to book empty seats.
        </p>
      </div>

      {role !== "Driver" && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm flex items-center justify-between">
          <span>You are currently registered as a Passenger. Switch role to Driver in your profile to publish rides.</span>
          <Link to="/profile" className="font-bold underline ml-2">Update Profile →</Link>
        </div>
      )}

      {/* Ride Creation Form Mockup */}
      <div className="glass-card border border-slate-800 rounded-2xl p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Departure Location</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. San Francisco Financial District"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Destination Location</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. San Jose Downtown"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Departure Date & Time</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-violet-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="datetime-local"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Available Seats & Price</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="1"
                  max="6"
                  placeholder="3 seats"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  placeholder="Price / seat"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Publish Ride Listing</span>
        </button>
      </div>
    </div>
  );
};

export default OfferRide;
