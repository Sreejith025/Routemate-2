import React from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

/**
 * Creates custom passenger Leaflet divIcon
 */
const createPassengerIcon = (name = "Passenger") => {
  return L.divIcon({
    className: "custom-passenger-live-marker",
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
      ">
        <div style="
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6, #6d28d9);
          border: 2px solid white;
          box-shadow: 0 4px 14px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        ">
          🧍
        </div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -19],
  });
};

const PassengerMarker = ({ passengerLocation, name, pickupLocation }) => {
  if (!passengerLocation || passengerLocation.latitude === undefined || passengerLocation.longitude === undefined) {
    return null;
  }

  const { latitude, longitude, accuracy } = passengerLocation;

  return (
    <Marker
      position={[latitude, longitude]}
      icon={createPassengerIcon(name)}
    >
      <Popup className="custom-leaflet-popup">
        <div className="p-2 space-y-1 text-slate-900 text-xs">
          <div className="font-bold text-sm text-purple-950 flex items-center justify-between gap-2">
            <span>🧍 {name || "Passenger"}</span>
            <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded">
              Passenger Location
            </span>
          </div>

          {pickupLocation && (
            <p className="text-slate-600 text-xs">
              Pickup Point: <strong>{pickupLocation}</strong>
            </p>
          )}

          <div className="pt-1 border-t border-slate-200 text-[11px] text-slate-500">
            GPS Accuracy: <strong className="text-slate-800 font-mono">±{Math.round(accuracy || 0)}m</strong>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default PassengerMarker;
