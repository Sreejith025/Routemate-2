import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import DriverMarker from "./DriverMarker";
import PassengerMarker from "./PassengerMarker";
import { AlertTriangle, RefreshCw, LocateFixed } from "lucide-react";

// Helper for custom static Leaflet markers
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
const pickupIcon = createCustomIcon("linear-gradient(135deg, #3b82f6, #1d4ed8)", "📍");
const destIcon = createCustomIcon("linear-gradient(135deg, #ef4444, #b91c1c)", "🏁");
const switchIcon = createCustomIcon("linear-gradient(135deg, #f59e0b, #b45309)", "⚡");

// Auto-recenter component when center or driver location updates
const RecenterMap = ({ center, isAutoCenterActive, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (isAutoCenterActive && center && center[0] !== undefined && center[1] !== undefined) {
      map.setView([center[0], center[1]], zoom || 14, { animate: true });
    }
  }, [center, isAutoCenterActive, zoom, map]);
  return null;
};

const LiveMap = ({
  center = null,
  zoom = 13,
  driverLocation = null,
  driverName = "Alex Rivera",
  vehicleDetails = null,
  passengerLocations = [],
  passengers = [],
  pickupCoords = null,
  pickupName = "Pickup Point",
  destinationCoords = null,
  destinationName = "Destination",
  routeGeometry = null,
  route = null,
  distanceKm = null,
  durationMins = null,
  drivers = [],
  switchAlert = null,
  isRideActive = true,
  height = "450px",
}) => {
  const [userGpsLocation, setUserGpsLocation] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(true);
  const [gpsError, setGpsError] = useState(null);
  const watchIdRef = useRef(null);

  // 1. Browser Geolocation API watchPosition
  const startGpsTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser");
      setGpsLoading(false);
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    // Required Geolocation Options
    const options = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000,
    };

    const handleSuccess = (position) => {
      const { latitude, longitude, accuracy, speed, heading } = position.coords;
      setUserGpsLocation({
        lat: latitude,
        lng: longitude,
        accuracy: accuracy || 0,
        speed: speed || 0,
        heading: heading || 0,
      });
      setGpsLoading(false);
      setGpsError(null);
    };

    const handleError = (error) => {
      setGpsLoading(false);
      switch (error.code) {
        case error.PERMISSION_DENIED:
          setGpsError("Location Permission Denied. Please allow GPS access.");
          break;
        case error.POSITION_UNAVAILABLE:
          setGpsError("Location Position Unavailable. Please check GPS settings.");
          break;
        case error.TIMEOUT:
          setGpsError("GPS Signal Timeout. Please click Retry Location.");
          break;
        default:
          setGpsError("Unable to acquire live GPS location.");
          break;
      }
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      options
    );
  }, []);

  // Auto request location permission on mount
  useEffect(() => {
    startGpsTracking();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [startGpsTracking]);

  // Determine effective dynamic map center (No hardcoded lat/lng defaults)
  const effectiveCenter = useMemo(() => {
    if (pickupCoords?.lat && pickupCoords?.lng) {
      return [pickupCoords.lat, pickupCoords.lng];
    }
    if (destinationCoords?.lat && destinationCoords?.lng) {
      return [destinationCoords.lat, destinationCoords.lng];
    }
    if (driverLocation?.latitude && driverLocation?.longitude) {
      return [driverLocation.latitude, driverLocation.longitude];
    }
    if (userGpsLocation?.lat && userGpsLocation?.lng) {
      return [userGpsLocation.lat, userGpsLocation.lng];
    }
    if (center?.lat && center?.lng) {
      return [center.lat, center.lng];
    }
    return [12.9716, 77.5946]; // Dynamic fallback if pending initial GPS fix
  }, [pickupCoords, destinationCoords, driverLocation, userGpsLocation, center]);

  // Determine polyline points
  let polylinePositions = [];
  if (routeGeometry && routeGeometry.length > 0) {
    polylinePositions = routeGeometry;
  } else if (pickupCoords && destinationCoords) {
    polylinePositions = [
      [pickupCoords.lat, pickupCoords.lng],
      [
        (pickupCoords.lat + destinationCoords.lat) / 2 + 0.005,
        (pickupCoords.lng + destinationCoords.lng) / 2 - 0.005,
      ],
      [destinationCoords.lat, destinationCoords.lng],
    ];
  } else if (route?.origin && route?.destination) {
    polylinePositions = [
      [route.origin.lat, route.origin.lng],
      [route.destination.lat, route.destination.lng],
    ];
  }

  return (
    <div
      style={{ height }}
      className="w-full rounded-3xl overflow-hidden shadow-2xl relative border border-slate-800 bg-slate-950"
    >
      {/* Map Element */}
      <MapContainer
        center={effectiveCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <RecenterMap center={effectiveCenter} isAutoCenterActive={isRideActive} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 1. Live User GPS Location Marker */}
        {userGpsLocation && (
          <Marker position={[userGpsLocation.lat, userGpsLocation.lng]} icon={userIcon}>
            <Popup>
              <div className="text-slate-900 font-semibold p-1 text-xs">
                <p className="uppercase text-indigo-600 font-bold text-[10px]">Your Live Location</p>
                <p className="font-bold text-slate-800">
                  {userGpsLocation.lat.toFixed(4)}, {userGpsLocation.lng.toFixed(4)}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  GPS Accuracy: ±{Math.round(userGpsLocation.accuracy)}m
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 2. Live Driver Marker */}
        {driverLocation && (
          <DriverMarker
            driverLocation={driverLocation}
            driverName={driverName}
            vehicleDetails={vehicleDetails}
          />
        )}

        {/* Additional nearby drivers */}
        {drivers.map((drv, idx) => (
          <Marker
            key={idx}
            position={[drv.lat || (effectiveCenter[0] + idx * 0.01), drv.lng || (effectiveCenter[1] + idx * 0.01)]}
            icon={createCustomIcon("linear-gradient(135deg, #10b981, #047857)", "🚕")}
          >
            <Popup>
              <div className="text-slate-900 p-1 text-xs">
                <p className="font-bold text-emerald-600">RouteMate Taxi #{idx + 1}</p>
                <p className="font-semibold text-slate-800">{drv.name || "Driver"}</p>
                <p className="text-slate-600">{drv.vehicle || "Vehicle"}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 3. Live Passenger Markers */}
        {passengerLocations.map((pLoc, idx) => (
          <PassengerMarker
            key={pLoc.userId || idx}
            passengerLocation={pLoc}
            name={pLoc.name || passengers[idx]?.name || `Passenger ${idx + 1}`}
            pickupLocation={passengers[idx]?.pickup}
          />
        ))}

        {/* 4. Pickup Marker */}
        {pickupCoords && (
          <Marker position={[pickupCoords.lat, pickupCoords.lng]} icon={pickupIcon}>
            <Popup>
              <div className="text-slate-900 p-1">
                <p className="text-xs font-bold text-blue-600">📍 Pickup Location</p>
                <p className="text-sm font-semibold">{pickupName}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 5. Destination Marker */}
        {destinationCoords && (
          <Marker position={[destinationCoords.lat, destinationCoords.lng]} icon={destIcon}>
            <Popup>
              <div className="text-slate-900 p-1">
                <p className="text-xs font-bold text-red-600">🏁 Destination</p>
                <p className="text-sm font-semibold">{destinationName}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Dynamic Switch Marker */}
        {switchAlert && (
          <Marker position={[effectiveCenter[0] + 0.005, effectiveCenter[1] - 0.005]} icon={switchIcon}>
            <Popup>
              <div className="text-slate-900 p-1">
                <p className="text-xs font-bold text-amber-600">⚡ Dynamic Switch Point</p>
                <p className="text-sm font-bold">Traffic Congestion Ahead</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* OSRM Route Line */}
        {polylinePositions.length > 0 && (
          <Polyline
            positions={polylinePositions}
            color="#3b82f6"
            weight={6}
            opacity={0.85}
          />
        )}
      </MapContainer>

      {/* GPS Loading Indicator Overlay */}
      {gpsLoading && !userGpsLocation && (
        <div className="absolute top-4 left-4 z-[400] bg-slate-900/90 backdrop-blur-md border border-indigo-500/40 text-indigo-300 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xl animate-pulse">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping"></span>
          <span>Acquiring Live GPS Location...</span>
        </div>
      )}

      {/* GPS Error Message & Retry Location Button Overlay */}
      {gpsError && !userGpsLocation && (
        <div className="absolute top-4 left-4 z-[400] bg-slate-900/95 backdrop-blur-md border border-rose-500/50 text-white p-3.5 rounded-2xl text-xs space-y-2.5 shadow-2xl max-w-xs">
          <div className="flex items-center space-x-2 text-rose-400 font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>GPS Location Error</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-normal">{gpsError}</p>
          <button
            onClick={startGpsTracking}
            className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Location</span>
          </button>
        </div>
      )}

      {/* OSRM Route Metrics Overlay Banner */}
      {(distanceKm || durationMins) && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-slate-900/95 backdrop-blur-md border border-indigo-500/40 text-white px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-4 shadow-2xl">
          <div className="flex items-center gap-1.5 text-indigo-400">
            <span>🗺️</span>
            <span>Distance: <strong className="text-white font-mono">{distanceKm} km</strong></span>
          </div>
          <div className="w-px h-4 bg-slate-700"></div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span>⏱️</span>
            <span>Est. Time: <strong className="text-white font-mono">{durationMins} mins</strong></span>
          </div>
        </div>
      )}

      {/* Recenter / Retry Control Button */}
      <div className="absolute top-4 right-4 z-[400]">
        <button
          onClick={startGpsTracking}
          className="p-2.5 rounded-xl bg-slate-900/90 backdrop-blur-md text-indigo-400 border border-slate-700 hover:bg-slate-800 shadow-xl transition-all hover:scale-105"
          title="Recenter & Refresh Live Location"
        >
          <LocateFixed className="w-5 h-5" />
        </button>
      </div>

      {/* Live Status Overlay */}
      <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-1.5 shadow-xl text-xs flex items-center gap-2 z-[400] text-slate-200">
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            userGpsLocation ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
          }`}
        ></span>
        <span className="font-bold text-[11px] uppercase tracking-wider">
          {userGpsLocation ? "LIVE GPS FIX ACTIVE" : gpsLoading ? "ACQUIRING GPS..." : "GPS PAUSED"}
        </span>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 shadow-xl text-xs flex flex-wrap gap-3 z-[400] text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          <span>Your Location</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Driver (Taxi)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
          <span>Passenger</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
          <span>Destination</span>
        </div>
      </div>
    </div>
  );
};

export default LiveMap;
