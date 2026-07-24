import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  MapPin,
  Search,
  Navigation,
  Car,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Users,
  RefreshCcw,
  ChevronRight,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { getAvailableRidesApi, bookRideApi, getCurrentUserApi } from "../services/api";
import LiveMap from "../components/LiveMap";
import TaxiSwitchCard from "../components/TaxiSwitchCard";
import RidePreferencesCard from "../components/RidePreferencesCard";
import toast from "react-hot-toast";

const FindRide = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pickupInput, setPickupInput] = useState("");
  const [destInput, setDestInput] = useState("");
  const [selectedRide, setSelectedRide] = useState(null);
  const [bookingSeats, setBookingSeats] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showPreferencesCard, setShowPreferencesCard] = useState(false);
  const [userPreferences, setUserPreferences] = useState(null);

  useEffect(() => {
    fetchRides();
    fetchUserPrefs();
  }, []);

  const fetchUserPrefs = async () => {
    try {
      const res = await getCurrentUserApi();
      if (res.data?.user) {
        setUserPreferences({
          ridePreference: res.data.user.ridePreference,
          gender: res.data.user.gender,
          safetyPreference: res.data.user.safetyPreference,
        });
      }
    } catch (err) {
      console.error("Fetch user prefs error:", err);
    }
  };

  const fetchRides = async (origin, destination) => {
    try {
      setLoading(true);
      const res = await getAvailableRidesApi({
        origin: origin || pickupInput,
        destination: destination || destInput,
      });
      if (res.data?.rides) {
        setRides(res.data.rides);
      } else {
        setRides([]);
      }
    } catch (err) {
      console.error("Fetch rides error:", err);
      toast.error("Failed to load available rides from database");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRides(pickupInput, destInput);
  };

  const handleBookRide = async () => {
    if (!selectedRide) return;
    try {
      setBookingLoading(true);
      await bookRideApi(selectedRide._id, { seats: bookingSeats });
      toast.success("Seat booked successfully! View details on your Passenger Dashboard.");
      setSelectedRide(null);
      fetchRides();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error booking ride");
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-extrabold text-white">Find a Shared Ride</h1>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              MongoDB Atlas Live
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Locate nearby verified RouteMate drivers and experience real-time dynamic taxi switching.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowPreferencesCard(!showPreferencesCard)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 flex items-center space-x-2 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4 text-amber-400" />
            <span>Customize Ride Preferences</span>
          </button>

          <button
            onClick={() => fetchRides()}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center space-x-2 transition-colors"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Ride Preferences Drawer / Card (Part 1) */}
      {showPreferencesCard && (
        <RidePreferencesCard
          initialPreferences={userPreferences}
          onSavePreferences={(newPrefs) => {
            setUserPreferences(newPrefs);
            setShowPreferencesCard(false);
          }}
        />
      )}

      {/* Main Grid Layout: Inputs & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Route Search Form & Available Rides List */}
        <div className="lg:col-span-6 space-y-6">
          {/* Location Search Card */}
          <div className="glass-card border border-slate-800 rounded-3xl p-6 space-y-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Navigation className="w-5 h-5 text-indigo-400" />
              Search Database Routes
            </h2>

            <form onSubmit={handleSearchSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Origin Location
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={pickupInput}
                    onChange={(e) => setPickupInput(e.target.value)}
                    placeholder="Leaving from..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Destination Target
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-rose-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={destInput}
                    onChange={(e) => setDestInput(e.target.value)}
                    placeholder="Going to..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all"
              >
                <Search className="w-4 h-4" />
                <span>{loading ? "Querying Database..." : "Search Available Rides"}</span>
              </button>
            </form>
          </div>

          {/* Available Rides List */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center justify-between">
              <span>Database Available Rides ({rides.length})</span>
            </h3>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {rides.length === 0 ? (
                <div className="p-10 text-center text-slate-400 glass-card rounded-3xl space-y-3">
                  <Car className="w-10 h-10 text-slate-500 mx-auto" />
                  <p className="text-sm font-semibold">No active rides found in database.</p>
                  <p className="text-xs text-slate-500">Drivers can offer a ride on the Offer Ride page!</p>
                </div>
              ) : (
                rides.map((ride) => (
                  <div
                    key={ride._id}
                    className="p-5 rounded-3xl glass-card border border-slate-800 hover:border-indigo-500/40 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white">{ride.driverName}</h4>
                        <p className="text-xs text-slate-400">
                          {ride.vehicleDetails?.make} {ride.vehicleDetails?.model} ({ride.vehicleDetails?.plate})
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xl font-black text-emerald-400 font-mono">${ride.pricePerSeat}</span>
                        <p className="text-[10px] text-slate-400 font-semibold">Per seat</p>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs space-y-1.5">
                      <p className="text-slate-200 font-medium flex items-center gap-1">
                        <span>{ride.origin}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{ride.destination}</span>
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                        <span>Schedule: {ride.departureTime}</span>
                        <span className="text-purple-400 font-bold">{ride.seatsAvailable} seats available</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => setSelectedRide(ride)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all"
                      >
                        Book Seat
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live OpenStreetMap Telemetry */}
        <div className="lg:col-span-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center justify-between">
            <span>Live OpenStreetMap Telemetry</span>
            <span className="text-xs text-emerald-400 font-mono font-bold">MONGODB CONNECTED</span>
          </h3>

          <LiveMap
            height="550px"
            center={{ lat: 12.9716, lng: 77.5946 }}
            zoom={12}
            drivers={rides.map((r) => ({
              name: r.driverName,
              vehicle: `${r.vehicleDetails?.make} ${r.vehicleDetails?.model}`,
              lat: r.originCoords?.lat,
              lng: r.originCoords?.lng,
            }))}
            switchAlert={true}
          />
        </div>
      </div>

      {/* Booking Modal */}
      {selectedRide && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedRide(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Book Seat in Database</h3>
                <p className="text-xs text-slate-400">Driver: {selectedRide.driverName}</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs text-slate-300">
              <p><strong>Route:</strong> {selectedRide.origin} ➔ {selectedRide.destination}</p>
              <p><strong>Vehicle:</strong> {selectedRide.vehicleDetails?.make} {selectedRide.vehicleDetails?.model}</p>
              <p><strong>Price per seat:</strong> ${selectedRide.pricePerSeat}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">Number of Seats</label>
              <select
                value={bookingSeats}
                onChange={(e) => setBookingSeats(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {[...Array(selectedRide.seatsAvailable || 1)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} Seat{i > 0 ? "s" : ""} (${(i + 1) * selectedRide.pricePerSeat})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <div>
                <span className="text-xs text-slate-400">Total Price:</span>
                <p className="text-xl font-black text-emerald-400 font-mono">
                  ${bookingSeats * selectedRide.pricePerSeat}
                </p>
              </div>

              <button
                onClick={handleBookRide}
                disabled={bookingLoading}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 flex items-center space-x-2"
              >
                {bookingLoading ? "Confirming..." : "Confirm & Book"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindRide;
