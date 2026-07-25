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
const pickupIcon = createCustomIcon("linear-gradient(135deg, #10b981, #047857)", "📍");
const destIcon = createCustomIcon("linear-gradient(135deg, #ef4444, #b91c1c)", "🏁");
const switchIcon = createCustomIcon("linear-gradient(135deg, #f59e0b, #b45309)", "⚡");

// FEATURE 2: Color-Coded Multi-Passenger Pins
const p1PickupIcon = createCustomIcon("linear-gradient(135deg, #10b981, #047857)", "📍"); // Green Pin
const p2PickupIcon = createCustomIcon("linear-gradient(135deg, #f59e0b, #b45309)", "📍"); // Orange Pin
const p1DestIcon = createCustomIcon("linear-gradient(135deg, #ef4444, #b91c1c)", "🏁");   // Red Pin
const p2DestIcon = createCustomIcon("linear-gradient(135deg, #8b5cf6, #6d28d9)", "🏁");   // Purple Pin

// Auto-recenter / Auto-fit bounds component
const MapBoundsFitter = ({ points, center, zoom, isAutoCenterActive }) => {
  const map = useMap();
  useEffect(() => {
    const validPoints = (points || []).filter(
      (pt) => pt && pt[0] != null && pt[1] != null && !isNaN(pt[0]) && !isNaN(pt[1])
    );
    if (isAutoCenterActive && validPoints.length > 1) {
      const bounds = L.latLngBounds(validPoints);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true });
    } else if (isAutoCenterActive && validPoints.length === 1) {
      map.setView(validPoints[0], zoom || 14, { animate: true });
    } else if (isAutoCenterActive && center && center[0] != null && center[1] != null) {
      map.setView([center[0], center[1]], zoom || 14, { animate: true });
    }
  }, [points, center, zoom, isAutoCenterActive, map]);
  return null;
};

const LiveMap = ({
  center = null,
  zoom = 13,
  driverLocation = null,
  driverName = "",
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
  currentStage = "Driver Assigned",
  rideStatus = "scheduled",
  height = "450px",
}) => {
  const [userGpsLocation, setUserGpsLocation] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(true);
  const [gpsError, setGpsError] = useState(null);
  const [followDriver, setFollowDriver] = useState(false);
  const [trafficLayer, setTrafficLayer] = useState(false);
  const [osrmRoadPolyline, setOsrmRoadPolyline] = useState([]);
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

    const options = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000,
    };

    const handleSuccess = (position) => {
      const { latitude, longitude, accuracy, speed, heading } = position.coords;
      const fix = {
        lat: Number(latitude),
        lng: Number(longitude),
        accuracy: accuracy || 0,
        speed: speed || 0,
        heading: heading || 0,
      };
      console.log("📍 [LiveMap User GPS Fix]", fix);
      setUserGpsLocation(fix);
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

  useEffect(() => {
    startGpsTracking();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [startGpsTracking]);

  // Extract driver lat/lng safely whether property is latitude/longitude or lat/lng
  const driverLat = driverLocation?.latitude ?? driverLocation?.lat;
  const driverLng = driverLocation?.longitude ?? driverLocation?.lng;

  // STEP 7: DYNAMIC ROUTE START & END COORDINATES
  // Before pickup: Driver -> Pickup
  // After pickup: Driver -> Destination
  const routeStartCoords = useMemo(() => {
    if (driverLat != null && driverLng != null) {
      return { lat: Number(driverLat), lng: Number(driverLng) };
    }
    if (pickupCoords?.lat && pickupCoords?.lng) {
      return { lat: Number(pickupCoords.lat), lng: Number(pickupCoords.lng) };
    }
    if (userGpsLocation?.lat && userGpsLocation?.lng) {
      return { lat: Number(userGpsLocation.lat), lng: Number(userGpsLocation.lng) };
    }
    return null;
  }, [driverLat, driverLng, pickupCoords, userGpsLocation]);

  const routeEndCoords = useMemo(() => {
    const isPassengerPickedUp =
      currentStage === "Passenger Picked Up" ||
      currentStage === "Shared Ride Started" ||
      currentStage === "Ride In Progress" ||
      currentStage === "Additional Passenger Joined" ||
      rideStatus === "active";

    if (!isPassengerPickedUp && pickupCoords?.lat && pickupCoords?.lng) {
      return { lat: Number(pickupCoords.lat), lng: Number(pickupCoords.lng) };
    }
    if (destinationCoords?.lat && destinationCoords?.lng) {
      return { lat: Number(destinationCoords.lat), lng: Number(destinationCoords.lng) };
    }
    return null;
  }, [pickupCoords, destinationCoords, currentStage, rideStatus]);

  // Fetch OSRM road geometry connecting routeStartCoords to routeEndCoords
  useEffect(() => {
    if (!routeStartCoords?.lat || !routeStartCoords?.lng || !routeEndCoords?.lat || !routeEndCoords?.lng) {
      return;
    }

    const sLat = routeStartCoords.lat;
    const sLng = routeStartCoords.lng;
    const eLat = routeEndCoords.lat;
    const eLng = routeEndCoords.lng;

    // OSRM URL format: lng,lat;lng,lat
    const url = `https://router.project-osrm.org/route/v1/driving/${sLng},${sLat};${eLng},${eLat}?overview=full&geometries=geojson`;
    console.log("🌐 [LiveMap OSRM Fetch]", { sLat, sLng, eLat, eLng, url });

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.routes && data.routes[0]?.geometry?.coordinates) {
          // GeoJSON is [lng, lat] -> Convert to Leaflet [lat, lng]
          const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
          setOsrmRoadPolyline(coords);
          console.log("✅ [LiveMap Polyline Updated]", coords.length, "points");
        }
      })
      .catch((err) => console.warn("LiveMap OSRM road fetch error:", err));
  }, [routeStartCoords, routeEndCoords]);

  // Final Polyline points
  const polylinePositions = useMemo(() => {
    if (routeGeometry && routeGeometry.length > 0) return routeGeometry;
    if (osrmRoadPolyline && osrmRoadPolyline.length > 0) return osrmRoadPolyline;
    return [];
  }, [routeGeometry, osrmRoadPolyline]);

  // Points for auto-fitting bounds (Driver, User, Pickup, Destination)
  const mapPoints = useMemo(() => {
    const pts = [];
    if (driverLat != null && driverLng != null) pts.push([Number(driverLat), Number(driverLng)]);
    if (userGpsLocation?.lat != null && userGpsLocation?.lng != null) pts.push([userGpsLocation.lat, userGpsLocation.lng]);
    if (pickupCoords?.lat != null && pickupCoords?.lng != null) pts.push([pickupCoords.lat, pickupCoords.lng]);
    if (destinationCoords?.lat != null && destinationCoords?.lng != null) pts.push([destinationCoords.lat, destinationCoords.lng]);
    return pts;
  }, [driverLat, driverLng, userGpsLocation, pickupCoords, destinationCoords]);

  const effectiveCenter = useMemo(() => {
    if (driverLat != null && driverLng != null) return [Number(driverLat), Number(driverLng)];
    if (pickupCoords?.lat && pickupCoords?.lng) return [pickupCoords.lat, pickupCoords.lng];
    if (userGpsLocation?.lat && userGpsLocation?.lng) return [userGpsLocation.lat, userGpsLocation.lng];
    if (center?.lat && center?.lng) return [center.lat, center.lng];
    return [12.9716, 77.5946];
  }, [driverLat, driverLng, pickupCoords, userGpsLocation, center]);

  return (
    <div
      style={{ height }}
      className="w-full rounded-3xl overflow-hidden shadow-2xl relative border border-slate-800 bg-slate-950"
    >
      {/* STEP 12: RIDE STATUS HEADER BANNER */}
      <div className="absolute top-3 left-3 right-16 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl px-4 py-2 flex items-center justify-between text-xs text-white shadow-xl">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-bold text-slate-300">Ride Status:</span>
          <span className="font-extrabold text-emerald-400 uppercase tracking-wider">
            {currentStage || (isRideActive ? "Driver Assigned & Active" : "Map Standing By")}
          </span>
        </div>
        {(distanceKm || durationMins) && (
          <div className="hidden sm:flex items-center space-x-3 font-mono font-bold text-slate-200 text-[11px]">
            <span>Dist: <strong className="text-indigo-400">{distanceKm} km</strong></span>
            <span>ETA: <strong className="text-amber-400">{durationMins} mins</strong></span>
          </div>
        )}
      </div>

      {/* Map Element */}
      <MapContainer
        center={effectiveCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <MapBoundsFitter
          points={mapPoints}
          center={followDriver && driverLat != null ? [driverLat, driverLng] : effectiveCenter}
          zoom={zoom}
          isAutoCenterActive={isRideActive || followDriver}
        />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={trafficLayer ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
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
        {driverLocation && driverLat != null && driverLng != null && (
          <DriverMarker
            driverLocation={driverLocation}
            driverName={driverName}
            vehicleDetails={vehicleDetails}
          />
        )}

        {/* Real nearby drivers */}
        {drivers.filter(drv => drv && (drv.lat != null || drv.latitude != null)).map((drv, idx) => {
          const lat = drv.lat ?? drv.latitude;
          const lng = drv.lng ?? drv.longitude;
          return (
            <Marker
              key={idx}
              position={[Number(lat), Number(lng)]}
              icon={createCustomIcon("linear-gradient(135deg, #10b981, #047857)", "🚕")}
            >
              <Popup>
                <div className="text-slate-900 p-2 text-xs space-y-1 min-w-[180px]">
                  <div className="flex items-center justify-between border-b pb-1">
                    <span className="font-bold text-emerald-700 text-sm">{drv.driverName || drv.name || "RouteMate Driver"}</span>
                    <span className="font-bold text-amber-500">★ {drv.driverRating || drv.rating || 4.9}</span>
                  </div>
                  <p className="text-[11px] text-slate-700 font-semibold">Taxi: {drv.taxiNumber || drv.plate || "RT-8842"}</p>
                  <p className="text-[11px] text-slate-600">Model: {drv.vehicleModel || drv.vehicle || "Toyota Prius Hybrid"}</p>
                  <div className="flex items-center justify-between pt-1 text-[10px] font-bold">
                    <span className="text-indigo-600">Seats: {drv.availableSeats || 3} Available</span>
                    <span className={`px-1.5 py-0.5 rounded text-white ${drv.status === "Busy" ? "bg-amber-600" : "bg-emerald-600"}`}>
                      {drv.status || "Available"}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 3. Live Passenger Markers */}
        {passengerLocations.map((pLoc, idx) => (
          <PassengerMarker
            key={pLoc.userId || idx}
            passengerLocation={pLoc}
            name={pLoc.name || passengers[idx]?.name || `Passenger ${idx + 1}`}
            pickupLocation={passengers[idx]?.pickup}
          />
        ))}

        {/* FEATURE 2: Multi-Passenger Color-Coded Markers */}
        {/* Passenger 1 Pickup (Green Pin) */}
        {passengers?.[0]?.pickupCoords?.lat ? (
          <Marker position={[Number(passengers[0].pickupCoords.lat), Number(passengers[0].pickupCoords.lng)]} icon={p1PickupIcon}>
            <Popup>
              <div className="text-slate-900 p-1">
                <p className="text-xs font-bold text-emerald-600">🟢 Passenger 1 Pickup</p>
                <p className="text-sm font-semibold">{passengers[0].name || "Passenger 1"}: {passengers[0].pickup}</p>
              </div>
            </Popup>
          </Marker>
        ) : pickupCoords && pickupCoords.lat != null && (
          <Marker position={[Number(pickupCoords.lat), Number(pickupCoords.lng)]} icon={p1PickupIcon}>
            <Popup>
              <div className="text-slate-900 p-1">
                <p className="text-xs font-bold text-emerald-600">🟢 Passenger 1 Pickup</p>
                <p className="text-sm font-semibold">{pickupName}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Passenger 2 Pickup (Orange Pin) */}
        {passengers?.[1]?.pickupCoords?.lat && (
          <Marker position={[Number(passengers[1].pickupCoords.lat), Number(passengers[1].pickupCoords.lng)]} icon={p2PickupIcon}>
            <Popup>
              <div className="text-slate-900 p-1">
                <p className="text-xs font-bold text-amber-600">🟧 Passenger 2 Pickup</p>
                <p className="text-sm font-semibold">{passengers[1].name || "Passenger 2"}: {passengers[1].pickup}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Passenger 1 Destination (Red Pin) */}
        {passengers?.[0]?.dropoffCoords?.lat ? (
          <Marker position={[Number(passengers[0].dropoffCoords.lat), Number(passengers[0].dropoffCoords.lng)]} icon={p1DestIcon}>
            <Popup>
              <div className="text-slate-900 p-1">
                <p className="text-xs font-bold text-red-600">🔴 Passenger 1 Destination</p>
                <p className="text-sm font-semibold">{passengers[0].name || "Passenger 1"}: {passengers[0].dropoff}</p>
              </div>
            </Popup>
          </Marker>
        ) : destinationCoords && destinationCoords.lat != null && (
          <Marker position={[Number(destinationCoords.lat), Number(destinationCoords.lng)]} icon={p1DestIcon}>
            <Popup>
              <div className="text-slate-900 p-1">
                <p className="text-xs font-bold text-red-600">🔴 Passenger 1 Destination</p>
                <p className="text-sm font-semibold">{destinationName}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Passenger 2 Destination (Purple Pin) */}
        {passengers?.[1]?.dropoffCoords?.lat && (
          <Marker position={[Number(passengers[1].dropoffCoords.lat), Number(passengers[1].dropoffCoords.lng)]} icon={p2DestIcon}>
            <Popup>
              <div className="text-slate-900 p-1">
                <p className="text-xs font-bold text-purple-600">🟪 Passenger 2 Destination</p>
                <p className="text-sm font-semibold">{passengers[1].name || "Passenger 2"}: {passengers[1].dropoff}</p>
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

        {/* STEP 8: OSRM LIVE ROUTE POLYLINE (Driver -> Pickup or Driver -> Destination) */}
        {polylinePositions.length > 0 && (
          <Polyline
            positions={polylinePositions}
            color="#3b82f6"
            weight={6}
            opacity={0.85}
          />
        )}
      </MapContainer>

      {/* MAP CONTROLS TOOLBAR */}
      <div className="absolute top-16 right-3 z-[400] flex flex-col space-y-2">
        <button
          onClick={startGpsTracking}
          className="p-2.5 rounded-xl bg-slate-900/90 text-indigo-400 border border-slate-700 hover:bg-slate-800 shadow-xl font-bold text-xs"
          title="Locate Me"
        >
          <LocateFixed className="w-4 h-4" />
        </button>

        <button
          onClick={() => setFollowDriver(!followDriver)}
          className={`p-2.5 rounded-xl border text-xs font-bold shadow-xl transition-all ${
            followDriver ? "bg-emerald-600 text-white border-emerald-400" : "bg-slate-900/90 text-slate-300 border-slate-700"
          }`}
          title="Follow Driver Mode"
        >
          🚗
        </button>

        <button
          onClick={() => setTrafficLayer(!trafficLayer)}
          className={`p-2.5 rounded-xl border text-xs font-bold shadow-xl transition-all ${
            trafficLayer ? "bg-amber-600 text-white border-amber-400" : "bg-slate-900/90 text-slate-300 border-slate-700"
          }`}
          title="Toggle Traffic Layer"
        >
          🚦
        </button>
      </div>

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

      {/* Live GPS Footer Badge */}
      <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-1.5 shadow-xl text-xs flex items-center gap-2 z-[400] text-slate-200">
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            userGpsLocation ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
          }`}
        ></span>
        <span className="font-bold">
          {userGpsLocation ? "Live GPS Connected" : "GPS Pending..."}
        </span>
      </div>
    </div>
  );
};

export default LiveMap;
