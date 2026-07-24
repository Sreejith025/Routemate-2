import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import {
  Car,
  Users,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Navigation,
  Clock,
  MapPin,
  Radio,
  Gauge,
} from "lucide-react";
import { getRideByIdApi } from "../services/api";
import LiveMap from "../components/LiveMap";
import TaxiSwitchCard from "../components/TaxiSwitchCard";
import SafeRideButton from "../components/SafeRideButton";
import { useLiveLocation } from "../hooks/useLiveLocation";

import socket from "../services/socket";

const RideDetails = () => {
  const { id } = useParams();
  const { dbUser, clerkUser } = useAuthContext();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userId = dbUser?.clerkId || dbUser?._id || clerkUser?.id;

  useEffect(() => {
    if (id) {
      fetchRide();

      socket.emit("joinRide", { rideId: id });

      const handleRideUpdated = () => fetchRide();
      const handleBookingAccepted = () => fetchRide();

      socket.on("rideUpdated", handleRideUpdated);
      socket.on("bookingAccepted", handleBookingAccepted);

      return () => {
        socket.off("rideUpdated", handleRideUpdated);
        socket.off("bookingAccepted", handleBookingAccepted);
      };
    }
  }, [id]);

  const fetchRide = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getRideByIdApi(id);
      if (res.data?.ride) {
        setRide(res.data.ride);
      } else {
        setError("Ride record not found in database.");
      }
    } catch (err) {
      console.error("Fetch ride details error:", err);
      setError(err.response?.data?.message || "Failed to fetch ride details from database.");
    } finally {
      setLoading(false);
    }
  };

  // Live Location hook for Passenger
  const {
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
  } = useLiveLocation({
    rideId: ride?._id,
    userId: userId,
    role: "Passenger",
    isTrackingActive: ride?.status !== "completed",
    destinationCoords: ride?.destinationCoords,
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-xs text-indigo-400 glass-card rounded-3xl animate-pulse">
        Fetching ride details & connecting live telemetry...
      </div>
    );
  }

  if (error || !ride) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center space-y-4 glass-card rounded-3xl">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
        <h3 className="text-xl font-bold text-white">Ride Not Found</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {error || "The requested ride does not exist in database."}
        </p>
        <Link
          to="/dashboard"
          className="inline-block px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const activeStatus = rideStatus || ride.status;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Link
        to="/dashboard"
        className="inline-flex items-center space-x-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </Link>

      {/* Header Banner */}
      <div className="p-8 rounded-3xl glass-card border border-indigo-500/20 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="uppercase tracking-wider">Driver Live Status: {activeStatus}</span>
          </div>
          <h1 className="text-3xl font-black text-white">
            {ride.origin} ➔ {ride.destination}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Driver: {ride.driverName} • Vehicle: {ride.vehicleDetails?.make} {ride.vehicleDetails?.model} ({ride.vehicleDetails?.plate})
          </p>
        </div>

        <div className="text-right">
          <span className="text-3xl font-black text-emerald-400 font-mono">${ride.pricePerSeat}</span>
          <p className="text-[11px] text-slate-400">Fare per seat</p>
        </div>
      </div>

      {/* Real-time Passenger Telemetry Bar (Req 8) */}
      <div className="p-6 rounded-3xl glass-card border border-indigo-500/30 bg-slate-950/80 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Driver Live Telemetry & ETA</h3>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400">
            {socketConnected ? "● SOCKET CONNECTED" : "○ RECONNECTING"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold block">Driver Status</span>
            <span className="text-base font-bold text-emerald-400 uppercase">
              {activeStatus}
            </span>
          </div>

          <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold block">Estimated Arrival (ETA)</span>
            <span className="text-base font-bold text-amber-400 font-mono flex items-center gap-1">
              <Clock className="w-4 h-4" /> ~{etaMinutes} mins
            </span>
          </div>

          <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold block">Distance Remaining</span>
            <span className="text-base font-bold text-indigo-400 font-mono">
              {distanceRemaining} km
            </span>
          </div>

          <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold block">Driver Speed</span>
            <span className="text-base font-bold text-purple-400 font-mono flex items-center gap-1">
              <Gauge className="w-4 h-4" />
              {Math.round((driverLocation?.speed || 0) * 3.6)} km/h
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Switch Alert overlay if present via Socket or DB */}
      {(switchSuggestion || ride.dynamicSwitchSuggested) && (
        <TaxiSwitchCard
          rideId={ride._id}
          passengerName={switchSuggestion?.passengerName || ride.switchDetails?.passengerName || "Passenger"}
          currentTaxi={`Taxi A (${ride.driverName})`}
          targetTaxi={switchSuggestion?.targetTaxiDriverName ? `${switchSuggestion.targetTaxiDriverName}'s Taxi (${switchSuggestion.targetVehiclePlate})` : (ride.switchDetails?.targetVehiclePlate || "Taxi B")}
          driverBName={switchSuggestion?.targetTaxiDriverName || ride.switchDetails?.targetTaxiDriverName || "Nearby Driver"}
          delayReason={switchSuggestion?.reason || ride.switchDetails?.reason || "Traffic congestion detected on expressway"}
          timeSaved={switchSuggestion?.etaSavedMinutes || ride.switchDetails?.etaSavedMinutes || 12}
          onAccept={fetchRide}
          onDecline={fetchRide}
        />
      )}

      {/* Grid Details & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          {/* Driver & Vehicle Specs Card */}
          <div className="glass-card border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Car className="w-5 h-5 text-indigo-400" />
              <span>Driver Specification</span>
            </h3>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs text-slate-300">
              <p><strong>Host:</strong> {ride.driverName}</p>
              <p><strong>Vehicle:</strong> {ride.vehicleDetails?.color} {ride.vehicleDetails?.make} {ride.vehicleDetails?.model}</p>
              <p><strong>Plate Registration:</strong> <span className="font-mono text-indigo-400">{ride.vehicleDetails?.plate}</span></p>
              <p><strong>Seats Available:</strong> {ride.seatsAvailable}</p>
              <p><strong>Passenger GPS Status:</strong> <span className="text-emerald-400">{gpsStatus}</span></p>
            </div>
          </div>

          {/* Passenger List */}
          <div className="glass-card border border-slate-800 rounded-3xl p-6 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              <span>Confirmed Passengers ({ride.passengers?.length || 0})</span>
            </h3>

            {ride.passengers?.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-2">No passengers booked yet.</p>
            ) : (
              ride.passengers?.map((p, idx) => (
                <div key={idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                  <p className="font-bold text-white">{p.name}</p>
                  <p className="text-slate-400">Pickup: {p.pickup} ➔ Dropoff: {p.dropoff}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Telemetry Map */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Navigation className="w-5 h-5 text-indigo-400" />
              <span>Driver & Passenger Live GPS Map</span>
            </h3>
          </div>
          <LiveMap
            height="460px"
            center={
              driverLocation?.latitude && driverLocation?.longitude
                ? { lat: driverLocation.latitude, lng: driverLocation.longitude }
                : { lat: ride.originCoords?.lat || 12.9716, lng: ride.originCoords?.lng || 77.5946 }
            }
            zoom={14}
            driverLocation={driverLocation}
            driverName={ride.driverName}
            vehicleDetails={ride.vehicleDetails}
            passengerLocations={passengerLocations}
            passengers={ride.passengers || []}
            pickupCoords={ride.originCoords}
            pickupName={ride.origin}
            destinationCoords={ride.destinationCoords}
            destinationName={ride.destination}
            routeGeometry={routeGeometry}
            isRideActive={activeStatus !== "completed"}
          />
        </div>
      </div>

      {/* Floating SafeRide AI Safety Button */}
      <SafeRideButton ride={ride} passengerId={userId} onRideUpdated={fetchRide} />
    </div>
  );
};

export default RideDetails;
