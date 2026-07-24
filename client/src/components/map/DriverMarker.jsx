import React from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

const createDriverIcon = (isAvailable, rating) =>
  L.divIcon({
    className: "custom-driver-marker",
    html: `
      <div class="relative flex items-center justify-center w-10 h-10 group cursor-pointer">
        <div class="w-9 h-9 ${
          isAvailable
            ? "bg-gradient-to-tr from-amber-400 to-yellow-500"
            : "bg-slate-700"
        } rounded-xl border-2 border-white shadow-xl flex items-center justify-center text-slate-950 font-bold hover:scale-110 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 1 12.5V16c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
        </div>
        <span class="absolute -top-2 -right-1 bg-indigo-600 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full border border-white">
          ${rating || "4.9"}
        </span>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

const DriverMarker = ({ driver, onSelect }) => {
  if (!driver || !driver.location) return null;

  return (
    <Marker
      position={[driver.location.lat, driver.location.lng]}
      icon={createDriverIcon(driver.isAvailable, driver.rating)}
      eventHandlers={{
        click: () => {
          if (onSelect) onSelect(driver);
        },
      }}
    >
      <Popup className="custom-leaflet-popup">
        <div className="p-2 space-y-1 text-slate-900 text-xs">
          <div className="font-bold text-sm text-indigo-950 flex items-center justify-between gap-2">
            <span>{driver.name}</span>
            <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[10px] font-semibold">
              ★ {driver.rating}
            </span>
          </div>
          <p className="text-slate-600">🚕 {driver.vehicleNumber} ({driver.vehicleModel})</p>
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200">
            <span className="text-emerald-700 font-semibold">{driver.availableSeats} seats left</span>
            <span className="text-indigo-700 font-bold">{driver.eta} ETA</span>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default DriverMarker;
