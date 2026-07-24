import React, { useState, useEffect } from "react";
import { Search, MapPin, Calendar, Clock, Filter, Car, Zap, CheckCircle2, ChevronRight, X } from "lucide-react";
import { getAvailableRidesApi, bookRideApi } from "../services/api";
import LiveMap from "../components/LiveMap";
import toast from "react-hot-toast";

const FindRide = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [originQuery, setOriginQuery] = useState("");
  const [destinationQuery, setDestinationQuery] = useState("");
  const [selectedRide, setSelectedRide] = useState(null);
  const [bookingSeats, setBookingSeats] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchRides();
  }, []);

  const fetchRides = async () => {
    try {
      setLoading(true);
      const res = await getAvailableRidesApi({
        origin: originQuery,
        destination: destinationQuery,
      });
      if (res.data?.rides) {
        setRides(res.data.rides);
      }
    } catch (err) {
      console.error("Fetch rides error:", err);
      toast.error("Failed to load available rides");
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
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
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
          <Zap className="w-4 h-4 fill-current" />
          <span>Dynamic Rerouting Enabled</span>
        </div>
        <h1 className="text-3xl font-black text-white">Find a Shared Ride</h1>
        <p className="text-slate-400 text-sm mt-1">
          Search verified RouteMate driver offerings with real-time OpenStreetMap route previews.
        </p>
      </div>

      {/* Search Filter Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          fetchRides();
        }}
        className="glass-card border border-slate-800 rounded-3xl p-6 grid grid-cols-1 md:grid-cols-4 gap-4 shadow-xl"
      >
        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Origin Location</label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-indigo-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Leaving from (e.g. Downtown)"
              value={originQuery}
              onChange={(e) => setOriginQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Destination Target</label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Going to (e.g. Airport)"
              value={destinationQuery}
              onChange={(e) => setDestinationQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Schedule</label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-violet-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Today / Immediate"
              readOnly
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-400 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all"
          >
            <Search className="w-4 h-4" />
            <span>Search Available Rides</span>
          </button>
        </div>
      </form>

      {/* Main Grid: Ride List & Interactive OSM Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Ride Cards List */}
        <div className="lg:col-span-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center justify-between">
            <span>Available Route Listings ({rides.length})</span>
            {loading && <span className="text-xs text-indigo-400 animate-pulse">Updating...</span>}
          </h2>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {rides.length === 0 ? (
              <div className="p-12 text-center text-slate-400 glass-card rounded-3xl space-y-3">
                <Car className="w-10 h-10 text-slate-500 mx-auto" />
                <p className="text-sm font-semibold">No matching rides found.</p>
                <p className="text-xs text-slate-500">Try clearing search filters or offering a ride yourself!</p>
              </div>
            ) : (
              rides.map((ride) => (
                <div
                  key={ride._id}
                  className="p-6 rounded-3xl glass-card border border-slate-800 hover:border-indigo-500/40 transition-all space-y-4 group relative"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">
                        {ride.driverName?.charAt(0) || "D"}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{ride.driverName}</h4>
                        <p className="text-xs text-slate-400">
                          {ride.vehicleDetails?.make} {ride.vehicleDetails?.model} ({ride.vehicleDetails?.color})
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xl font-black text-emerald-400 font-mono">${ride.pricePerSeat}</span>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Per Seat</p>
                    </div>
                  </div>

                  {/* Route Summary */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center space-x-2 text-slate-200 font-semibold">
                      <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="truncate">{ride.origin}</span>
                      <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
                      <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="truncate">{ride.destination}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400" /> Departure: {ride.departureTime}
                      </span>
                      <span className="text-purple-400 font-semibold">
                        {ride.seatsAvailable} seat(s) available
                      </span>
                    </div>
                  </div>

                  {/* Dynamic Switch Badge if feature triggered */}
                  {ride.dynamicSwitchSuggested && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 flex items-center justify-between text-xs text-amber-300">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Zap className="w-4 h-4 text-amber-400 fill-current animate-pulse" />
                        Mid-Ride Taxi Switch Eligible
                      </span>
                      <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-500/20 px-2 py-0.5 rounded">
                        -14m ETA SAVINGS
                      </span>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="flex items-center justify-end pt-1">
                    <button
                      onClick={() => setSelectedRide(ride)}
                      className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all hover:scale-105"
                    >
                      Book Seat Now
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Route Preview Map */}
        <div className="lg:col-span-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center justify-between">
            <span>Route Preview Map (OpenStreetMap)</span>
            <span className="text-xs text-emerald-400 font-mono font-bold">LIVE TELEMETRY</span>
          </h2>

          <LiveMap
            height="560px"
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

      {/* Booking Confirmation Modal */}
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
                <h3 className="text-lg font-bold text-white">Confirm Ride Booking</h3>
                <p className="text-xs text-slate-400">Driver: {selectedRide.driverName}</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs text-slate-300">
              <p><strong>Route:</strong> {selectedRide.origin} ➔ {selectedRide.destination}</p>
              <p><strong>Vehicle:</strong> {selectedRide.vehicleDetails?.make} {selectedRide.vehicleDetails?.model}</p>
              <p><strong>Fare per seat:</strong> ${selectedRide.pricePerSeat}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">Number of Seats</label>
              <select
                value={bookingSeats}
                onChange={(e) => setBookingSeats(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
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
                onClick={handleBook}
                disabled={bookingLoading}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/30 flex items-center space-x-2"
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
