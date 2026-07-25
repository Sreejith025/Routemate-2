import { useState, useEffect, useRef, useCallback } from "react";
import socket from "../services/socket";
import { updateLocationApi, getRideLocationsApi } from "../services/locationService";

/**
 * Calculates Haversine distance in meters between two lat/lng points
 */
export const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

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
  const [gpsStatus, setGpsStatus] = useState("Initializing GPS..."); // 'Tracking', 'Permission Denied', 'Unavailable', etc.
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

  // 2. Fetch OSRM Route & ETA from Driver location to Destination
  const fetchOSRMRoute = useCallback(async (startLat, startLng, destLat, destLng) => {
    if (!startLat || !startLng || !destLat || !destLng) return;
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map((c) => [c[1], c[0]]); // GeoJSON is [lng, lat] -> Leaflet expects [lat, lng]
        setRouteGeometry(coordinates);
        setDistanceRemaining(Number((route.distance / 1000).toFixed(2))); // convert meters to km
        setEtaMinutes(Math.max(1, Math.round(route.duration / 60))); // convert seconds to minutes
      }
    } catch (err) {
      console.warn("OSRM Route fetch error:", err?.message);
      // Fallback calculation using straight-line distance
      const distMeters = calculateDistanceMeters(startLat, startLng, destLat, destLng);
      setDistanceRemaining(Number((distMeters / 1000).toFixed(2)));
      setEtaMinutes(Math.max(1, Math.round(distMeters / 500))); // Rough estimate (~30 km/h)
    }
  }, []);

  // 3. Update route and ETA whenever driver location, current location, or destination changes
  useEffect(() => {
    const startPoint =
      role === "Driver"
        ? currentLocation
        : driverLocation || currentLocation;

    const startLat = startPoint?.latitude || startPoint?.lat;
    const startLng = startPoint?.longitude || startPoint?.lng;

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
    };

    const handleDisconnect = () => {
      setSocketConnected(false);
      setGpsStatus("Network Disconnected. Reconnecting...");
    };

    const handleDriverUpdate = (data) => {
      if (data.rideId === rideId) {
        setDriverLocation(data);
      }
    };

    const handlePassengerUpdate = (data) => {
      if (data.rideId === rideId) {
        setPassengerLocations((prev) => {
          const idx = prev.findIndex((p) => p.userId === data.passengerId);
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
      if (data.rideId === rideId) {
        setRideStatus("active");
      }
    };

    const handleRideEnded = (data) => {
      if (data.rideId === rideId) {
        setRideStatus("completed");
      }
    };

    const handleTaxiSwitchSuggested = (data) => {
      if (data.rideId === rideId || data.passengerId === userId) {
        setSwitchSuggestion(data);
      }
    };

    const handleTaxiSwitchAccepted = (data) => {
      if (data.sourceRideId === rideId || data.targetRideId === rideId || data.passengerId === userId) {
        setSwitchSuggestion(null);
        fetchInitialLocations();
      }
    };

    const handleRouteUpdated = (data) => {
      if (data.rideId === rideId) {
        fetchInitialLocations();
      }
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
    socket.on("taxi-switch-suggested", handleTaxiSwitchSuggested);
    socket.on("trigger_taxi_switch", handleTaxiSwitchSuggested);
    socket.on("taxi-switch-accepted", handleTaxiSwitchAccepted);
    socket.on("route-updated", handleRouteUpdated);

    fetchInitialLocations();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("driver-location-update", handleDriverUpdate);
      socket.off("passenger-location-update", handlePassengerUpdate);
      socket.off("ride-started", handleRideStarted);
      socket.off("ride-ended", handleRideEnded);
      socket.off("taxi-switch-suggested", handleTaxiSwitchSuggested);
      socket.off("trigger_taxi_switch", handleTaxiSwitchSuggested);
      socket.off("taxi-switch-accepted", handleTaxiSwitchAccepted);
      socket.off("route-updated", handleRouteUpdated);
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
        latitude,
        longitude,
        speed: speed || 0,
        heading: heading || 0,
        accuracy: accuracy || 0,
        updatedAt: new Date(position.timestamp).toISOString(),
      };

      setCurrentLocation(newLocation);
      setGpsStatus("GPS Signal Active");

      // Check distance moved from last point
      let distanceMoved = 0;
      if (lastLocationRef.current) {
        distanceMoved = calculateDistanceMeters(
          lastLocationRef.current.latitude,
          lastLocationRef.current.longitude,
          latitude,
          longitude
        );
      }

      // 10. Performance optimization: filter movements < 5 meters and throttle to every 2-3 seconds
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
          latitude,
          longitude,
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

        // Persist location update to MongoDB database
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

  // Helper actions to broadcast ride status changes
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
