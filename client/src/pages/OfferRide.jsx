import React, { useState } from "react";
import { PlusCircle, MapPin, Calendar, Clock, DollarSign, Users, Car, CheckCircle2 } from "lucide-react";
import { useAuthContext } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { createRideApi } from "../services/api";
import LiveMap from "../components/LiveMap";
import toast from "react-hot-toast";

const OfferRide = () => {
  const { role, dbUser } = useAuthContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    origin: "Downtown Technology District",
    destination: "International Airport Terminal 2",
    departureTime: "In 15 minutes",
    seatsAvailable: 3,
    pricePerSeat: 18,
    vehicleMake: "Tesla",
    vehicleModel: "Model 3",
    plate: "EV-9901",
    color: "White",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await createRideApi({
        origin: formData.origin,
        destination: formData.destination,
        departureTime: formData.departureTime,
        seatsAvailable: Number(formData.seatsAvailable),
        pricePerSeat: Number(formData.pricePerSeat),
        vehicleDetails: {
          make: formData.vehicleMake,
          model: formData.vehicleModel,
          plate: formData.plate,
          color: formData.color,
        },
      });
      toast.success("Ride offer published successfully!");
      navigate("/driver");
    } catch (err) {
      console.error("Create ride error:", err);
      toast.error(err.response?.data?.message || "Failed to publish ride");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-3xl font-black text-white">Offer a Shared Ride</h1>
        <p className="text-slate-400 text-sm mt-1">
          Publish your upcoming commuting route for passengers to book empty seats and monetize fuel expenses.
        </p>
      </div>

      {role !== "Driver" && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
          <span>You are currently registered as a Passenger. Switch role to Driver in your Profile to unlock full hosting features.</span>
          <Link to="/profile" className="font-bold text-amber-400 hover:underline shrink-0 ml-2">Update Profile Role →</Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Creation Form */}
        <div className="lg:col-span-7 glass-card border border-slate-800 rounded-3xl p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Car className="w-5 h-5 text-emerald-400" />
              <span>Route & Vehicle Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">Departure Location</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">Destination Target</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">Departure Schedule</label>
                <input
                  type="text"
                  required
                  value={formData.departureTime}
                  onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">Seats Offered</label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  required
                  value={formData.seatsAvailable}
                  onChange={(e) => setFormData({ ...formData, seatsAvailable: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">Price Per Seat ($)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.pricePerSeat}
                  onChange={(e) => setFormData({ ...formData, pricePerSeat: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            {/* Vehicle Details Sub-Section */}
            <div className="pt-4 border-t border-slate-800 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Vehicle Specification</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Make"
                  value={formData.vehicleMake}
                  onChange={(e) => setFormData({ ...formData, vehicleMake: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Model"
                  value={formData.vehicleModel}
                  onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Plate No"
                  value={formData.plate}
                  onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase"
                />
                <input
                  type="text"
                  placeholder="Color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all hover:scale-105"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{loading ? "Publishing Listing..." : "Publish Route Offer"}</span>
            </button>
          </form>
        </div>

        {/* Live Route Map Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Route Preview Map</h3>
            <span className="text-xs text-slate-400">OpenStreetMap</span>
          </div>

          <LiveMap
            height="460px"
            center={{ lat: 12.9716, lng: 77.5946 }}
            zoom={12}
            route={{
              origin: { lat: 12.9716, lng: 77.5946 },
              destination: { lat: 12.9352, lng: 77.6245 },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default OfferRide;
