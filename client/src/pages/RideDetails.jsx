import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Car, MapPin, Clock, Users, ShieldCheck, Zap, ArrowLeft, CheckCircle2, Phone, Mail, AlertTriangle, LogOut, SlidersHorizontal } from "lucide-react";
import { getRideByIdApi } from "../services/api";
import LiveMap from "../components/LiveMap";
import TaxiSwitchCard from "../components/TaxiSwitchCard";
import SmartSwitchModal from "../components/SmartSwitchModal";

const RideDetails = () => {
  const { id } = useParams();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showExitModal, setShowExitModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRide();
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

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-xs text-indigo-400 glass-card rounded-3xl animate-pulse">
        Fetching ride details from MongoDB Atlas...
      </div>
    );
  }

  if (error || !ride) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center space-y-4 glass-card rounded-3xl">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
        <h3 className="text-xl font-bold text-white">Ride Not Found</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">{error || "The requested ride does not exist in database."}</p>
        <Link
          to="/dashboard"
          className="inline-block px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

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
            <span className="uppercase tracking-wider">Ride Status: {ride.status}</span>
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

      {/* Ride Controls Section (Part 3) */}
      {(ride.status === "active" || ride.status === "scheduled") && (
        <div className="glass-card border border-amber-500/30 rounded-3xl p-6 space-y-4 bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-950">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <SlidersHorizontal className="w-4 h-4 text-amber-400" />
              <span>Ride Controls</span>
            </h3>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              Active Control
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Leave Shared Ride</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Leave the current shared ride and continue your journey using another RouteMate taxi if available.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowExitModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 shadow-md shadow-amber-500/20 shrink-0 transition-all"
            >
              Leave Shared Ride
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Switch Alert overlay if present */}
      {ride.dynamicSwitchSuggested && (
        <TaxiSwitchCard
          rideId={ride._id}
          passengerName={ride.switchDetails?.passengerName || "Passenger"}
          currentTaxi={`Taxi A (${ride.driverName})`}
          targetTaxi={ride.switchDetails?.targetVehiclePlate || "Taxi B"}
          driverBName={ride.switchDetails?.targetTaxiDriverName || "Nearby Driver"}
          timeSaved={ride.switchDetails?.etaSavedMinutes || 12}
          onAccept={fetchRide}
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
          <h3 className="text-lg font-bold text-white">Live OpenStreetMap Rerouting View</h3>
          <LiveMap
            height="440px"
            center={{ lat: ride.originCoords?.lat || 12.9716, lng: ride.originCoords?.lng || 77.5946 }}
            zoom={13}
            drivers={[{ name: ride.driverName, vehicle: `${ride.vehicleDetails?.make} ${ride.vehicleDetails?.model}` }]}
            switchAlert={ride.dynamicSwitchSuggested}
          />
        </div>
      </div>

      {/* Smart Switch Modal */}
      {showExitModal && (
        <SmartSwitchModal
          rideId={ride._id}
          onClose={() => setShowExitModal(false)}
          onSwitchCompleted={fetchRide}
        />
      )}
    </div>
  );
};

export default RideDetails;
