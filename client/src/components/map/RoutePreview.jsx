import React, { useEffect, useState } from "react";
import { Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import axios from "axios";

// Custom Pickup Icon (Green Pin)
const pickupIcon = L.divIcon({
  className: "custom-pickup-marker",
  html: `
    <div class="flex items-center justify-center w-9 h-9 bg-emerald-600 border-2 border-white rounded-full shadow-xl text-white">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

// Custom Destination Icon (Rose/Red Pin)
const destinationIcon = L.divIcon({
  className: "custom-dest-marker",
  html: `
    <div class="flex items-center justify-center w-9 h-9 bg-rose-600 border-2 border-white rounded-full shadow-xl text-white">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

const RoutePreview = ({ pickup, destination, onRouteFetched }) => {
  const [routePositions, setRoutePositions] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);

  useEffect(() => {
    if (!pickup || !destination) {
      setRoutePositions([]);
      setRouteInfo(null);
      return;
    }

    const fetchOSRMRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
        const response = await axios.get(url);

        if (response.data?.routes?.[0]) {
          const route = response.data.routes[0];
          // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
          const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
          const distanceKm = (route.distance / 1000).toFixed(1);
          const durationMins = Math.round(route.duration / 60);

          setRoutePositions(coords);
          const info = { distanceKm, durationMins };
          setRouteInfo(info);
          if (onRouteFetched) onRouteFetched(info);
        } else {
          // Fallback straight line
          setRoutePositions([
            [pickup.lat, pickup.lng],
            [destination.lat, destination.lng],
          ]);
        }
      } catch (error) {
        console.warn("OSRM routing API fallback to straight line:", error);
        setRoutePositions([
          [pickup.lat, pickup.lng],
          [destination.lat, destination.lng],
        ]);
      }
    };

    fetchOSRMRoute();
  }, [pickup, destination]);

  return (
    <>
      {pickup && (
        <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
          <Popup className="custom-leaflet-popup">
            <div className="p-1 text-slate-900 font-semibold text-xs">
              🟢 Pickup: {pickup.address || "Selected Pickup"}
            </div>
          </Popup>
        </Marker>
      )}

      {destination && (
        <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
          <Popup className="custom-leaflet-popup">
            <div className="p-1 text-slate-900 font-semibold text-xs">
              🔴 Destination: {destination.address || "Selected Destination"}
            </div>
          </Popup>
        </Marker>
      )}

      {routePositions.length > 0 && (
        <Polyline
          positions={routePositions}
          pathOptions={{
            color: "#6366f1",
            weight: 5,
            opacity: 0.85,
            dashArray: "10, 5",
          }}
        />
      )}
    </>
  );
};

export default RoutePreview;
