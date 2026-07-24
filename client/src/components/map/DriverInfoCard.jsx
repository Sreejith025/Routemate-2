import React from "react";
import {
  Car,
  Star,
  Users,
  Clock,
  Phone,
  ShieldCheck,
  X,
  CheckCircle2,
  Navigation,
} from "lucide-react";

const DriverInfoCard = ({ driver, onClose, onBookRide }) => {
  if (!driver) return null;

  return (
    <div className="absolute bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 z-[400] glass-panel border border-slate-700/80 shadow-2xl rounded-2xl p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header & Close Button */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <img
            src={driver.avatar || "https://via.placeholder.com/100"}
            alt={driver.name}
            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-amber-400/50 shadow-md"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-white">{driver.name}</h3>
              <span className="flex items-center text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                <Star className="w-3 h-3 fill-amber-400 mr-1" />
                {driver.rating}
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Verified RouteMate Driver
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
            <Car className="w-3.5 h-3.5 text-amber-400" />
            Vehicle Info
          </span>
          <p className="text-xs font-bold text-white">{driver.vehicleModel}</p>
          <p className="text-[10px] font-mono text-slate-400">{driver.vehicleNumber}</p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            Available Seats
          </span>
          <p className="text-xs font-bold text-emerald-400">
            {driver.availableSeats} {driver.availableSeats === 1 ? "seat" : "seats"} left
          </p>
          <p className="text-[10px] text-slate-400">Capacity: 4 max</p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            Estimated Pickup
          </span>
          <p className="text-xs font-bold text-indigo-300">{driver.eta}</p>
          <p className="text-[10px] text-slate-400">Distance: {driver.distance || "0.8 km"}</p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
            <Navigation className="w-3.5 h-3.5 text-violet-400" />
            Heading Towards
          </span>
          <p className="text-xs font-bold text-white truncate">{driver.destination || "City Center"}</p>
          <p className="text-[10px] text-slate-400">Shared Route</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-3 pt-2">
        <button
          onClick={() => alert(`Calling driver ${driver.name} at ${driver.phone || '+1 (555) 234-5678'}`)}
          className="p-3 rounded-xl glass-card text-slate-300 hover:text-white border border-slate-700 hover:bg-slate-800 transition-colors"
          title="Contact Driver"
        >
          <Phone className="w-5 h-5" />
        </button>

        <button
          onClick={() => onBookRide(driver)}
          className="flex-1 py-3 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition-all hover:scale-[1.02]"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Request Ride with Driver</span>
        </button>
      </div>
    </div>
  );
};

export default DriverInfoCard;
