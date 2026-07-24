import React, { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import CurrentLocationMarker from "./CurrentLocationMarker";
import DriverMarker from "./DriverMarker";
import RoutePreview from "./RoutePreview";
import DriverInfoCard from "./DriverInfoCard";
import {
  LocateFixed,
  Plus,
  Minus,
  Eye,
  EyeOff,
  MapPin,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

// Helper component to smoothly re-center map programmatically
const RecenterMap = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center.lat && center.lng) {
      map.setView([center.lat, center.lng], zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  return null;
};

// Helper component to capture map click events for setting pickup/destination
const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
};

const MapContainerComponent = ({
  userLocation: initialUserLocation,
  pickup,
  destination,
  drivers,
  showDrivers,
  setShowDrivers,
  selectedDriver,
  setSelectedDriver,
  onMapClick,
  onBookRide,
  onRecenter,
}) => {
  const [userLocation, setUserLocation] = useState(initialUserLocation);
  const [gpsLoading, setGpsLoading] = useState(!initialUserLocation);
  const [gpsError, setGpsError] = useState(null);
  const mapRef = useRef(null);
  const watchIdRef = useRef(null);

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

    const options = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000,
    };

    const handleSuccess = (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      setUserLocation({
        lat: latitude,
        lng: longitude,
        accuracy: accuracy || 0,
      });
      setGpsLoading(false);
      setGpsError(null);
    };

    const handleError = (error) => {
      setGpsLoading(false);
      switch (error.code) {
        case error.PERMISSION_DENIED:
          setGpsError("Location Permission Denied. Please enable GPS access.");
          break;
        case error.POSITION_UNAVAILABLE:
          setGpsError("Location Position Unavailable. Check GPS settings.");
          break;
        case error.TIMEOUT:
          setGpsError("GPS Signal Timeout. Click Retry Location.");
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

  useEffect(() => {
    if (!initialUserLocation) {
      startGpsTracking();
    } else {
      setUserLocation(initialUserLocation);
      setGpsLoading(false);
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [initialUserLocation, startGpsTracking]);

  const activeCenter = userLocation || pickup || { lat: 12.9716, lng: 77.5946 };

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
      <MapContainer
        center={[activeCenter.lat, activeCenter.lng]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ width: "100%", height: "100%" }}
        ref={mapRef}
        className="dark-leaflet-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <RecenterMap center={userLocation || activeCenter} />
        <MapClickHandler onMapClick={onMapClick} />

        {/* User Location Marker */}
        {userLocation && <CurrentLocationMarker position={userLocation} />}

        {/* Route Preview (Pickup -> Destination Polyline & Markers) */}
        <RoutePreview pickup={pickup} destination={destination} />

        {/* Nearby Drivers Markers */}
        {showDrivers &&
          drivers?.map((driver) => (
            <DriverMarker
              key={driver.id}
              driver={driver}
              onSelect={(d) => setSelectedDriver(d)}
            />
          ))}
      </MapContainer>

      {/* GPS Loading Overlay */}
      {gpsLoading && !userLocation && (
        <div className="absolute top-4 left-4 z-[400] bg-slate-900/90 backdrop-blur-md border border-indigo-500/40 text-indigo-300 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xl animate-pulse">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping"></span>
          <span>Acquiring Live GPS Location...</span>
        </div>
      )}

      {/* GPS Error & Retry Button */}
      {gpsError && !userLocation && (
        <div className="absolute top-4 left-4 z-[400] bg-slate-900/95 backdrop-blur-md border border-rose-500/50 text-white p-3.5 rounded-2xl text-xs space-y-2 shadow-2xl max-w-xs">
          <div className="flex items-center space-x-2 text-rose-400 font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>GPS Location Error</span>
          </div>
          <p className="text-slate-300 text-[11px]">{gpsError}</p>
          <button
            onClick={startGpsTracking}
            className="w-full py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Location</span>
          </button>
        </div>
      )}

      {/* Floating Map Controls Bar */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col space-y-2">
        <button
          onClick={() => {
            startGpsTracking();
            if (onRecenter) onRecenter();
          }}
          className="p-3 rounded-xl glass-panel text-slate-200 hover:text-white border border-slate-700 hover:bg-slate-800 shadow-xl transition-all hover:scale-105"
          title="Recenter & Refresh Live Location"
        >
          <LocateFixed className="w-5 h-5 text-indigo-400" />
        </button>

        <button
          onClick={handleZoomIn}
          className="p-3 rounded-xl glass-panel text-slate-200 hover:text-white border border-slate-700 hover:bg-slate-800 shadow-xl transition-all hover:scale-105"
          title="Zoom In"
        >
          <Plus className="w-5 h-5" />
        </button>

        <button
          onClick={handleZoomOut}
          className="p-3 rounded-xl glass-panel text-slate-200 hover:text-white border border-slate-700 hover:bg-slate-800 shadow-xl transition-all hover:scale-105"
          title="Zoom Out"
        >
          <Minus className="w-5 h-5" />
        </button>

        <button
          onClick={() => setShowDrivers(!showDrivers)}
          className={`p-3 rounded-xl glass-panel border shadow-xl transition-all hover:scale-105 ${
            showDrivers
              ? "text-amber-400 border-amber-500/40 bg-amber-500/10"
              : "text-slate-400 border-slate-700 hover:bg-slate-800"
          }`}
          title={showDrivers ? "Hide Nearby Drivers" : "Show Nearby Drivers"}
        >
          {showDrivers ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
        </button>
      </div>

      {/* Map Hint Badge */}
      <div className="absolute top-4 left-4 z-[390] glass-panel px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 flex items-center space-x-2 shadow-lg">
        <MapPin className="w-4 h-4 text-emerald-400" />
        <span>Click map to set Pickup / Destination</span>
      </div>

      {/* Driver Info Floating Card Popup */}
      {selectedDriver && (
        <DriverInfoCard
          driver={selectedDriver}
          onClose={() => setSelectedDriver(null)}
          onBookRide={onBookRide}
        />
      )}
    </div>
  );
};

export default MapContainerComponent;
