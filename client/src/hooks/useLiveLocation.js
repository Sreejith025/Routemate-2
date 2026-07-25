import { useState, useEffect, useRef, useCallback } from "react";
import socket from "../services/socket";
import { updateLocationApi, getRideLocationsApi } from "../services/locationService";

/**
 * Calculates Haversine distance in meters between two lat/lng points
 */
export const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
  const R = 6371e3; // Earth radius in meters
  const φ1 = (Number(lat1) * Math.PI) / 180;
  const φ2 = (Number(lat2) * Math.PI) / 180;
  const Δφ = ((Number(lat2) - Number(lat1)) * Math.PI) / 180;
  const Δλ = ((Number(lon2) - Number(lon1)) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Custom hook for managing Real-Time GPS Tracking, Socket.IO streaming,
 * OSRM Route generation, distance remaining, ETA, and total distance traveled.
 */
export const useLiveLocation = ({
  rideId,
  userId,
  role = "Passenger", // 'Driver' or 'Passenger'
  isTrackingActive = true,
  destinationCoords = null,
}) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [passengerLocations, setPassengerLocations] = useState([]);
  const [routeGeometry, setRouteGeometry] = useState([]);
  const [distanceRemaining, setDistanceRemaining] = useState(0); // in km
  const [totalDistanceTraveled, setTotalDistanceTraveled] = useState(0); // in km
  const [etaMinutes, setEtaMinutes] = useState(0);
  const [gpsStatus, setGpsStatus] = useState("Initializing GPS...");
  const [rideStatus, setRideStatus] = useState("scheduled");
  const [socketConnected, setSocketConnected] = useState(socket.connected);
  const [switchSuggestion, setSwitchSuggestion] = useState(null);

  const watchIdRef = useRef(null);
  const lastLocationRef = useRef(null);
  const lastEmitTimeRef = useRef(0);
  const accumulatedDistanceRef = useRef(0);

  // 1. Fetch initial live locations from DB for this ride
  const fetchInitialLocations = useCallback(async () => {
    if (!rideId) return;
    try {
      const res = await getRideLocationsApi(rideId);
      if (res.data?.success) {
        if (res.data.driverLocation) {
          setDriverLocation(res.data.driverLocation);
        }
        if (res.data.passengerLocations) {
          setPassengerLocations(res.data.passengerLocations);
        }
      }
    } catch (err) {
      console.warn("Could not fetch initial locations from DB:", err?.message);
    }
  }, [rideId]);

  // 2. Fetch OSRM Route & ETA from Driver location to Destination (Format: lng,lat;lng,lat)
  const fetchOSRMRoute = useCallback(async (startLat, startLng, destLat, destLng) => {
    if (!startLat || !startLng || !destLat || !destLng) return;
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson`;
      console.log("🌐 [OSRM Request]", url);
      const res = await fetch(url);
      const data = await res.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map((c) => [c[1], c[0]]); // GeoJSON [lng, lat] -> Leaflet [lat, lng]
        setRouteGeometry(coordinates);
        const distKm = Number((route.distance / 1000).toFixed(2));
        const etaMins = Math.max(1, Math.round(route.duration / 60));
        setDistanceRemaining(distKm);
        setEtaMinutes(etaMins);
        console.log("✅ [OSRM Response]", { distKm, etaMins, pointsCount: coordinates.length });
      }
    } catch (err) {
      console.warn("OSRM Route fetch error:", err?.message);
      const distMeters = calculateDistanceMeters(startLat, startLng, destLat, destLng);
      const distKm = Number((distMeters / 1000).toFixed(2));
      setDistanceRemaining(distKm);
      setEtaMinutes(Math.max(1, Math.round(distMeters / 500)));
    }
  }, []);

  // 3. Update route and ETA whenever driver location or destination changes
  useEffect(() => {
    const startPoint =
      role === "Driver"
        ? currentLocation
        : driverLocation || currentLocation;

    const startLat = startPoint?.latitude ?? startPoint?.lat;
    const startLng = startPoint?.longitude ?? startPoint?.lng;

    if (startLat && startLng && destinationCoords?.lat && destinationCoords?.lng) {
      fetchOSRMRoute(
        startLat,
        startLng,
        destinationCoords.lat,
        destinationCoords.lng
      );
    }
  }, [currentLocation, driverLocation, destinationCoords, role, fetchOSRMRoute]);

  // 4. Socket.IO Listeners & Room Joining
  useEffect(() => {
    if (!rideId || !userId) return;

    const handleConnect = () => {
      setSocketConnected(true);
      setGpsStatus((prev) => (prev.includes("Disconnect") ? "Connected" : prev));
      socket.emit("join-ride", { rideId, userId, role });
      socket.emit("joinRide", { rideId, userId, role });
      console.log(`🔌 [Socket Room Joined] rideId=${rideId}, userId=${userId}, role=${role}`);
    };

    const handleDisconnect = () => {
      setSocketConnected(false);
      setGpsStatus("Network Disconnected. Reconnecting...");
    };

    const handleDriverUpdate = (data) => {
      if (data.rideId === rideId || !data.rideId) {
        console.log("📡 [Socket Received] driver-location-update:", data);
        setDriverLocation(data);
      }
    };

    const handlePassengerUpdate = (data) => {
      if (data.rideId === rideId || !data.rideId) {
        console.log("📡 [Socket Received] passenger-location-update:", data);
        setPassengerLocations((prev) => {
          const idx = prev.findIndex((p) => p.userId === (data.passengerId || data.userId));
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = data;
            return updated;
          }
          return [...prev, data];
        });
      }
    };

    const handleRideStarted = (data) => {
      if (data.rideId === rideId) setRideStatus("active");
    };

    const handleRideEnded = (data) => {
      if (data.rideId === rideId) setRideStatus("completed");
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.connect();
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("driver-location-update", handleDriverUpdate);
    socket.on("passenger-location-update", handlePassengerUpdate);
    socket.on("ride-started", handleRideStarted);
    socket.on("ride-ended", handleRideEnded);

    fetchInitialLocations();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("driver-location-update", handleDriverUpdate);
      socket.off("passenger-location-update", handlePassengerUpdate);
      socket.off("ride-started", handleRideStarted);
      socket.off("ride-ended", handleRideEnded);
    };
  }, [rideId, userId, role, fetchInitialLocations]);

  // 5. Geolocation API watchPosition & Filtering / Throttling
  useEffect(() => {
    if (!isTrackingActive) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setGpsStatus("Tracking Stopped");
      return;
    }

    if (!navigator.geolocation) {
      setGpsStatus("Geolocation not supported by browser");
      return;
    }

    setGpsStatus("Acquiring GPS Signal...");

    const handleSuccess = async (position) => {
      const { latitude, longitude, speed, heading, accuracy } = position.coords;
      const now = Date.now();

      const newLocation = {
        latitude: Number(latitude),
        longitude: Number(longitude),
        lat: Number(latitude),
        lng: Number(longitude),
        speed: speed || 0,
        heading: heading || 0,
        accuracy: accuracy || 0,
        updatedAt: new Date(position.timestamp).toISOString(),
      };

      console.log("📍 [GPS Watch Update]", {
        role,
        latitude,
        longitude,
        accuracy: `±${Math.round(accuracy || 0)}m`,
        speedKmh: Math.round((speed || 0) * 3.6) + " km/h",
        heading: (heading || 0) + "°",
        timestamp: newLocation.updatedAt,
      });

      setCurrentLocation(newLocation);
      setGpsStatus("GPS Signal Active");

      // Calculate movement
      let distanceMoved = 0;
      if (lastLocationRef.current) {
        distanceMoved = calculateDistanceMeters(
          lastLocationRef.current.latitude,
          lastLocationRef.current.longitude,
          latitude,
          longitude
        );
      }

      // Filter movements < 5m & throttle updates to every 2-3s
      const isTimeElapsed = now - lastEmitTimeRef.current >= 2000;
      const isSignificantMove = !lastLocationRef.current || distanceMoved >= 5;

      if (isTimeElapsed && isSignificantMove) {
        lastEmitTimeRef.current = now;
        lastLocationRef.current = newLocation;

        if (distanceMoved >= 5) {
          accumulatedDistanceRef.current += distanceMoved;
          setTotalDistanceTraveled(Number((accumulatedDistanceRef.current / 1000).toFixed(2)));
        }

        const payload = {
          rideId,
          role,
          latitude: Number(latitude),
          longitude: Number(longitude),
          lat: Number(latitude),
          lng: Number(longitude),
          speed: speed || 0,
          heading: heading || 0,
          accuracy: accuracy || 0,
        };

        if (role === "Driver") {
          payload.driverId = userId;
          socket.emit("driver-location-update", payload);
          setDriverLocation({ ...payload, updatedAt: newLocation.updatedAt });
        } else {
          payload.passengerId = userId;
          socket.emit("passenger-location-update", payload);
        }

        try {
          await updateLocationApi(payload);
        } catch (err) {
          console.warn("DB location sync error:", err?.message);
        }
      }
    };

    const handleError = (error) => {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          setGpsStatus("GPS Permission Denied");
          break;
        case error.POSITION_UNAVAILABLE:
          setGpsStatus("GPS Location Unavailable");
          break;
        case error.TIMEOUT:
          setGpsStatus("GPS Signal Timeout");
          break;
        default:
          setGpsStatus("GPS Tracking Error");
          break;
      }
    };

    const options = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000,
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      options
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [rideId, userId, role, isTrackingActive]);

  const startRide = useCallback(() => {
    if (rideId) {
      socket.emit("ride-started", { rideId });
      setRideStatus("active");
    }
  }, [rideId]);

  const endRide = useCallback(() => {
    if (rideId) {
      socket.emit("ride-ended", { rideId });
      setRideStatus("completed");
    }
  }, [rideId]);

  return {
    currentLocation,
    driverLocation,
    passengerLocations,
    routeGeometry,
    distanceRemaining,
    totalDistanceTraveled,
    etaMinutes,
    gpsStatus,
    rideStatus,
    socketConnected,
    switchSuggestion,
    startRide,
    endRide,
  };
};

export default useLiveLocation;
