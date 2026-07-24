import React from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

/**
 * Creates custom driver Leaflet divIcon with live speed and heading indicator
 */
const createDriverIcon = (speed = 0, heading = 0, driverName = "Driver") => {
  const speedKmh = Math.round(speed * 3.6); // convert m/s to km/h if needed or display speed directly
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
      ">
        <!-- Pulse animation when active -->
        <div style="
          position: absolute;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.3);
          animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <div style="
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #047857);
          border: 2px solid white;
          box-shadow: 0 4px 14px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          transform: rotate(${heading}deg);
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
                padding: 1px 4px;
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
  if (!driverLocation || driverLocation.latitude === undefined || driverLocation.longitude === undefined) {
    return null;
  }

  const { latitude, longitude, speed, heading, accuracy } = driverLocation;

  return (
    <Marker
      position={[latitude, longitude]}
      icon={createDriverIcon(speed, heading, driverName)}
    >
      <Popup className="custom-leaflet-popup">
        <div className="p-2 space-y-1.5 text-slate-900 text-xs">
          <div className="font-bold text-sm text-emerald-950 flex items-center justify-between gap-2">
            <span>🚕 {driverName || "Driver"}</span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
              LIVE GPS
            </span>
          </div>

          {vehicleDetails && (
            <p className="text-slate-600 text-xs">
              {vehicleDetails.make} {vehicleDetails.model} • <strong className="text-slate-800">{vehicleDetails.plate}</strong>
            </p>
          )}

          <div className="pt-1.5 border-t border-slate-200 grid grid-cols-2 gap-1 text-[11px]">
            <div>
              <span className="text-slate-500 block">Speed</span>
              <strong className="text-slate-800 font-mono">{Math.round((speed || 0) * 3.6)} km/h</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Accuracy</span>
              <strong className="text-slate-800 font-mono">±{Math.round(accuracy || 0)}m</strong>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default DriverMarker;
