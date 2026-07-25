import React from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

/**
 * Creates custom driver Leaflet divIcon with live speed and heading indicator
 */
const createDriverIcon = (speed = 0, heading = 0, driverName = "Driver") => {
  const speedKmh = Math.round((speed || 0) * 3.6);
  return L.divIcon({
    className: "custom-driver-live-marker",
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        transition: transform 0.5s ease-out;
      ">
        <!-- Pulse animation when active -->
        <div style="
          position: absolute;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.35);
          animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <div style="
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #047857);
          border: 2.5px solid white;
          box-shadow: 0 4px 14px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          transform: rotate(${heading || 0}deg);
          transition: transform 0.5s ease-out;
        ">
          🚕
        </div>
        ${
          speedKmh > 0
            ? `<span style="
                position: absolute;
                bottom: -6px;
                background: #064e3b;
                color: #34d399;
                font-size: 9px;
                font-weight: 800;
                padding: 1px 5px;
                border-radius: 6px;
                border: 1px solid #10b981;
                white-space: nowrap;
              ">${speedKmh} km/h</span>`
            : ""
        }
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
};

const DriverMarker = ({ driverLocation, driverName, vehicleDetails }) => {
  if (!driverLocation) return null;

  const latitude = driverLocation.latitude ?? driverLocation.lat;
  const longitude = driverLocation.longitude ?? driverLocation.lng;

  if (latitude == null || longitude == null || isNaN(latitude) || isNaN(longitude)) {
    return null;
  }

  const speed = driverLocation.speed || 0;
  const heading = driverLocation.heading || 0;
  const accuracy = driverLocation.accuracy || 0;

  console.log("🚕 [DriverMarker Render]", { latitude, longitude, speed, heading, accuracy, driverName });

  return (
    <Marker
      position={[Number(latitude), Number(longitude)]}
      icon={createDriverIcon(speed, heading, driverName)}
    >
      <Popup className="custom-leaflet-popup">
        <div className="p-2 space-y-1.5 text-slate-900 text-xs">
          <div className="font-bold text-sm text-emerald-950 flex items-center justify-between gap-2">
            <span>🚕 {driverName || "RouteMate Driver"}</span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
              LIVE GPS
            </span>
          </div>

          {vehicleDetails && (
            <p className="text-slate-600 text-xs font-medium">
              {vehicleDetails.make} {vehicleDetails.model} • <strong className="text-slate-800">{vehicleDetails.plate}</strong>
            </p>
          )}

          <div className="pt-1.5 border-t border-slate-200 grid grid-cols-2 gap-1 text-[11px]">
            <div>
              <span className="text-slate-500 block font-semibold">Live Speed</span>
              <strong className="text-slate-800 font-mono">{Math.round((speed || 0) * 3.6)} km/h</strong>
            </div>
            <div>
              <span className="text-slate-500 block font-semibold">GPS Accuracy</span>
              <strong className="text-slate-800 font-mono">±{Math.round(accuracy || 0)}m</strong>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default DriverMarker;
