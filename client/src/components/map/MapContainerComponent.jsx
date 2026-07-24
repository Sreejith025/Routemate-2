import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import CurrentLocationMarker from "./CurrentLocationMarker";
import DriverMarker from "./DriverMarker";
import RoutePreview from "./RoutePreview";
import DriverInfoCard from "./DriverInfoCard";
import {
  LocateFixed,
  Plus,
  Minus,
  Car,
  Eye,
  EyeOff,
  Navigation,
  MapPin,
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
  userLocation,
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
  const [mapZoom, setMapZoom] = useState(13);
  const mapRef = useRef(null);

  const defaultCenter = userLocation || { lat: 37.7749, lng: -122.4194 };

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
        center={[defaultCenter.lat, defaultCenter.lng]}
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

        <RecenterMap center={userLocation} />
        <MapClickHandler onMapClick={onMapClick} />

        {/* User Location Marker */}
        {userLocation && <CurrentLocationMarker position={userLocation} />}

        {/* Route Preview (Pickup -> Destination Polyline & Markers) */}
        <RoutePreview pickup={pickup} destination={destination} />

        {/* Nearby Drivers Markers */}
        {showDrivers &&
          drivers.map((driver) => (
            <DriverMarker
              key={driver.id}
              driver={driver}
              onSelect={(d) => setSelectedDriver(d)}
            />
          ))}
      </MapContainer>

      {/* Floating Map Controls Bar */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col space-y-2">
        {/* Recenter Button */}
        <button
          onClick={onRecenter}
          className="p-3 rounded-xl glass-panel text-slate-200 hover:text-white border border-slate-700 hover:bg-slate-800 shadow-xl transition-all hover:scale-105"
          title="Recenter to My Location"
        >
          <LocateFixed className="w-5 h-5 text-indigo-400" />
        </button>

        {/* Zoom In */}
        <button
          onClick={handleZoomIn}
          className="p-3 rounded-xl glass-panel text-slate-200 hover:text-white border border-slate-700 hover:bg-slate-800 shadow-xl transition-all hover:scale-105"
          title="Zoom In"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={handleZoomOut}
          className="p-3 rounded-xl glass-panel text-slate-200 hover:text-white border border-slate-700 hover:bg-slate-800 shadow-xl transition-all hover:scale-105"
          title="Zoom Out"
        >
          <Minus className="w-5 h-5" />
        </button>

        {/* Toggle Nearby Drivers */}
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
      <div className="absolute top-4 left-4 z-[400] glass-panel px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 flex items-center space-x-2 shadow-lg">
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
