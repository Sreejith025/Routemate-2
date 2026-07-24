import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";

// Custom Leaflet Icons using SVG divIcon
const createCustomIcon = (color, emoji) => {
  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `
      <div style="
        background: ${color};
        width: 38px;
        height: 38px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 14px rgba(0,0,0,0.5);
        border: 2px solid white;
        font-size: 18px;
      ">
        ${emoji}
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20],
  });
};

const userIcon = createCustomIcon("linear-gradient(135deg, #3b82f6, #1d4ed8)", "📍");
const driverIcon = createCustomIcon("linear-gradient(135deg, #10b981, #047857)", "🚕");
const passengerIcon = createCustomIcon("linear-gradient(135deg, #8b5cf6, #6d28d9)", "🧍");
const switchIcon = createCustomIcon("linear-gradient(135deg, #f59e0b, #b45309)", "⚡");
const destIcon = createCustomIcon("linear-gradient(135deg, #ef4444, #b91c1c)", "🏁");

// Auto-recenter component when center prop changes
const RecenterMap = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center.lat && center.lng) {
      map.setView([center.lat, center.lng], zoom || 13);
    }
  }, [center, zoom, map]);
  return null;
};

const LiveMap = ({
  center = { lat: 12.9716, lng: 77.5946 },
  zoom = 13,
  drivers = [],
  passengers = [],
  route = null, // array of lat/lng pairs or object { origin, destination }
  switchAlert = null,
  height = "420px",
}) => {
  const [mapCenter, setMapCenter] = useState([center.lat, center.lng]);

  useEffect(() => {
    if (center?.lat && center?.lng) {
      setMapCenter([center.lat, center.lng]);
    }
  }, [center]);

  // Build route polyline points
  const polylinePositions =
    route?.origin && route?.destination
      ? [
          [route.origin.lat, route.origin.lng],
          [
            (route.origin.lat + route.destination.lat) / 2 + 0.01,
            (route.origin.lng + route.destination.lng) / 2 - 0.01,
          ],
          [route.destination.lat, route.destination.lng],
        ]
      : [
          [12.9716, 77.5946],
          [12.955, 77.61],
          [12.9352, 77.6245],
        ];

  // Optional switch detour path
  const switchPolyline = switchAlert
    ? [
        [12.955, 77.61],
        [12.948, 77.62],
        [12.9352, 77.6245],
      ]
    : null;

  return (
    <div style={{ height }} className="w-full rounded-2xl overflow-hidden shadow-2xl relative dark-leaflet-map border border-slate-800">
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <RecenterMap center={{ lat: mapCenter[0], lng: mapCenter[1] }} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Current User Location Marker */}
        <Marker position={mapCenter} icon={userIcon}>
          <Popup>
            <div className="text-slate-900 font-semibold p-1">
              <p className="text-xs uppercase text-indigo-600 font-bold">Your Location</p>
              <p className="text-sm font-bold">Active User Position</p>
            </div>
          </Popup>
        </Marker>

        {/* Nearby Drivers Markers */}
        {drivers.map((drv, idx) => (
          <Marker
            key={idx}
            position={[drv.lat || 12.975 + idx * 0.01, drv.lng || 77.595 + idx * 0.01]}
            icon={driverIcon}
          >
            <Popup>
              <div className="text-slate-900 p-1">
                <p className="text-xs font-bold text-emerald-600">RouteMate Taxi #{idx + 1}</p>
                <p className="text-sm font-semibold">{drv.name || "Alex Rivera"}</p>
                <p className="text-xs text-slate-600">{drv.vehicle || "Toyota Prius • RT-8842"}</p>
                <span className="inline-block mt-1 bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold">
                  Available for Switch
                </span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Passenger Pickup Points */}
        {passengers.map((p, idx) => (
          <Marker
            key={idx}
            position={[p.lat || 12.96 + idx * 0.008, p.lng || 77.6 + idx * 0.008]}
            icon={passengerIcon}
          >
            <Popup>
              <div className="text-slate-900 p-1">
                <p className="text-xs font-bold text-purple-600">Passenger Pickup</p>
                <p className="text-sm font-semibold">{p.name || "Sarah C."}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Destination Marker */}
        {route?.destination && (
          <Marker
            position={[route.destination.lat, route.destination.lng]}
            icon={destIcon}
          >
            <Popup>
              <div className="text-slate-900 p-1">
                <p className="text-xs font-bold text-red-600">Destination</p>
                <p className="text-sm font-semibold">{route.destinationName || "Drop-off Point"}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Dynamic Switch Highlight Marker */}
        {switchAlert && (
          <Marker position={[12.955, 77.61]} icon={switchIcon}>
            <Popup>
              <div className="text-slate-900 p-1">
                <p className="text-xs font-bold text-amber-600">⚡ Dynamic Switch Point</p>
                <p className="text-sm font-bold">Traffic Congestion Ahead</p>
                <p className="text-xs text-slate-600">ETA Savings: -14 mins via Taxi B</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Primary Route Line */}
        <Polyline
          positions={polylinePositions}
          color="#6366f1"
          weight={5}
          opacity={0.8}
          dashArray="1, 8"
        />

        {/* Switched Faster Route Line */}
        {switchPolyline && (
          <Polyline
            positions={switchPolyline}
            color="#10b981"
            weight={6}
            opacity={0.9}
          />
        )}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 shadow-xl text-xs flex flex-wrap gap-3 z-[400] text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
          <span>Your Location</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>RouteMate Taxi</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
          <span>Switch Node</span>
        </div>
      </div>
    </div>
  );
};

export default LiveMap;
