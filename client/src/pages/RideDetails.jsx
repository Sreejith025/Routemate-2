import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Car, MapPin, Clock, Users, ShieldCheck, Zap, ArrowLeft, CheckCircle2, Phone, Mail } from "lucide-react";
import { getRideByIdApi } from "../services/api";
import LiveMap from "../components/LiveMap";
import TaxiSwitchCard from "../components/TaxiSwitchCard";

const RideDetails = () => {
  const { id } = useParams();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchRide();
    }
  }, [id]);

  const fetchRide = async () => {
    try {
      setLoading(true);
      const res = await getRideByIdApi(id);
      if (res.data?.ride) {
        setRide(res.data.ride);
      }
    } catch (err) {
      console.error("Fetch ride details error:", err);
    } finally {
      setLoading(false);
    }
  };

  const defaultRide = ride || {
    driverName: "Alex Rivera",
    vehicleDetails: { make: "Toyota", model: "Prius", plate: "RT-8842", color: "Silver" },
    origin: "Downtown Technology Hub",
    destination: "Airport Terminal 2",
    departureTime: "Immediate",
    seatsAvailable: 2,
    pricePerSeat: 18,
    status: "active",
    dynamicSwitchSuggested: true,
    passengers: [{ name: "Sarah Connor", pickup: "Tech Hub", dropoff: "Airport T2" }],
  };

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
            <span className="uppercase tracking-wider">Ride Status: {defaultRide.status}</span>
          </div>
          <h1 className="text-3xl font-black text-white">
            {defaultRide.origin} ➔ {defaultRide.destination}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Driver: {defaultRide.driverName} • Vehicle: {defaultRide.vehicleDetails?.make} {defaultRide.vehicleDetails?.model} ({defaultRide.vehicleDetails?.plate})
          </p>
        </div>

        <div className="text-right">
          <span className="text-3xl font-black text-emerald-400 font-mono">${defaultRide.pricePerSeat}</span>
          <p className="text-[11px] text-slate-400">Fare per seat</p>
        </div>
      </div>

      {/* Dynamic Switch Alert overlay if present */}
      {defaultRide.dynamicSwitchSuggested && (
        <TaxiSwitchCard
          passengerName="Sarah Connor"
          currentTaxi="Taxi A (Toyota Prius • RT-8842)"
          targetTaxi="Taxi B (Tesla Model 3 • EV-9901)"
          driverBName="Marcus Vance"
          timeSaved={14}
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
              <p><strong>Host:</strong> {defaultRide.driverName}</p>
              <p><strong>Vehicle:</strong> {defaultRide.vehicleDetails?.color} {defaultRide.vehicleDetails?.make} {defaultRide.vehicleDetails?.model}</p>
              <p><strong>Plate Registration:</strong> <span className="font-mono text-indigo-400">{defaultRide.vehicleDetails?.plate}</span></p>
              <p><strong>Seats Available:</strong> {defaultRide.seatsAvailable}</p>
            </div>
          </div>

          {/* Passenger List */}
          <div className="glass-card border border-slate-800 rounded-3xl p-6 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              <span>Confirmed Passengers</span>
            </h3>

            {defaultRide.passengers?.map((p, idx) => (
              <div key={idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                <p className="font-bold text-white">{p.name}</p>
                <p className="text-slate-400">Pickup: {p.pickup} ➔ Dropoff: {p.dropoff}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Live Telemetry Map */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-lg font-bold text-white">Live OpenStreetMap Rerouting View</h3>
          <LiveMap
            height="440px"
            center={{ lat: 12.9716, lng: 77.5946 }}
            zoom={13}
            drivers={[{ name: defaultRide.driverName, vehicle: `${defaultRide.vehicleDetails?.make} ${defaultRide.vehicleDetails?.model}` }]}
            switchAlert={defaultRide.dynamicSwitchSuggested}
          />
        </div>
      </div>
    </div>
  );
};

export default RideDetails;
