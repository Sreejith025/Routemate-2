import React from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

const userLocationIcon = L.divIcon({
  className: "custom-user-marker",
  html: `
    <div class="relative flex items-center justify-center w-10 h-10">
      <div class="absolute w-10 h-10 bg-indigo-500/40 rounded-full animate-ping"></div>
      <div class="w-6 h-6 bg-indigo-600 border-2 border-white rounded-full shadow-xl flex items-center justify-center text-white">
        <div class="w-2.5 h-2.5 bg-white rounded-full"></div>
      </div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const CurrentLocationMarker = ({ position }) => {
  if (!position || !position.lat || !position.lng) return null;

  return (
    <Marker position={[position.lat, position.lng]} icon={userLocationIcon}>
      <Popup className="custom-leaflet-popup">
        <div className="p-2 text-center space-y-1">
          <p className="font-bold text-slate-900 text-sm">📍 Your Current Location</p>
          <p className="text-xs text-slate-500">
            {position.address || `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`}
          </p>
        </div>
      </Popup>
    </Marker>
  );
};

export default CurrentLocationMarker;
