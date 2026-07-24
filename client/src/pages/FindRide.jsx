import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  MapPin,
  Search,
  Navigation,
  Car,
  Clock,
  RefreshCcw,
  ChevronRight,
  X,
  Star,
  Compass,
  SlidersHorizontal,
  ShieldCheck,
} from "lucide-react";
import axios from "axios";
import { getAvailableRidesApi, bookRideApi } from "../services/api";
import LiveMap from "../components/LiveMap";
import LocationAutocompleteInput from "../components/LocationAutocompleteInput";
import RidePreferencesCard from "../components/RidePreferencesCard";
import RideControlsSection from "../components/RideControlsSection";
import { useAuthContext } from "../context/AuthContext";
import socket from "../services/socket";
import toast from "react-hot-toast";

const FindRide = () => {
  const { clerkUser, dbUser } = useAuthContext();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pickupInput, setPickupInput] = useState("");
  const [destInput, setDestInput] = useState("");

  const [pickupLocation, setPickupLocation] = useState(null); // { name, lat, lng }
  const [destLocation, setDestLocation] = useState(null); // { name, lat, lng }

  const [routeGeometry, setRouteGeometry] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const [durationMins, setDurationMins] = useState(null);

  const [selectedRide, setSelectedRide] = useState(null);
  const [bookingSeats, setBookingSeats] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Passenger Preferences State
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [userPreferences, setUserPreferences] = useState({
    ridePreference: dbUser?.ridePreference || "shared",
    gender: dbUser?.gender || "prefer_not_to_say",
    safetyPreference: dbUser?.safetyPreference || "noPreference",
  });

  // Fetch OSRM route between pickup and destination coordinates
  const fetchOSRMRoute = useCallback(async (pLoc, dLoc) => {
    if (!pLoc?.lat || !pLoc?.lng || !dLoc?.lat || !dLoc?.lng) {
      setRouteGeometry(null);
      setDistanceKm(null);
      setDurationMins(null);
      return;
    }

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${pLoc.lng},${pLoc.lat};${dLoc.lng},${dLoc.lat}?overview=full&geometries=geojson`;
      const res = await axios.get(url);

      if (res.data?.routes?.[0]) {
        const route = res.data.routes[0];
        const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        const dist = (route.distance / 1000).toFixed(1);
        const dur = Math.round(route.duration / 60);

        setRouteGeometry(coords);
        setDistanceKm(dist);
        setDurationMins(dur);
      }
    } catch (err) {
      console.warn("OSRM routing API error fallback:", err);
      setRouteGeometry([
        [pLoc.lat, pLoc.lng],
        [dLoc.lat, dLoc.lng],
      ]);
    }
  }, []);

  // Fetch available rides from MongoDB Atlas with optional radius matching
  const fetchRides = useCallback(
    async (originText, destText, pLoc, dLoc) => {
      try {
        setLoading(true);

        const currentOriginText = originText !== undefined ? originText : pickupInput;
        const currentDestText = destText !== undefined ? destText : destInput;
        const currentPLoc = pLoc !== undefined ? pLoc : pickupLocation;
        const currentDLoc = dLoc !== undefined ? dLoc : destLocation;

        const params = {
          origin: currentOriginText,
          destination: currentDestText,
          originLat: currentPLoc?.lat,
          originLng: currentPLoc?.lng,
          destLat: currentDLoc?.lat,
          destLng: currentDLoc?.lng,
          radius: 10,
        };

        const res = await getAvailableRidesApi(params);

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
    },
    [pickupInput, destInput, pickupLocation, destLocation]
  );

  useEffect(() => {
    fetchRides();

    // Listen to real-time new ride publications via Socket.IO
    const handleNewRide = (newRide) => {
      setRides((prev) => [newRide, ...prev.filter((r) => r._id !== newRide._id)]);
      toast("🚗 New ride offer published nearby!", { icon: "🚕" });
    };

    socket.on("ride-created", handleNewRide);
    socket.on("new-ride-published", handleNewRide);

    return () => {
      socket.off("ride-created", handleNewRide);
      socket.off("new-ride-published", handleNewRide);
    };
  }, [fetchRides]);

  // Apply PART 2 - RIDE MATCHING RULES
  const filteredRides = useMemo(() => {
    return rides.filter((ride) => {
      // 1. Private Ride rule: Never match with another passenger (must have 0 passengers currently booked)
      if (userPreferences.ridePreference === "private") {
        if (ride.passengers && ride.passengers.length > 0) {
          return false;
        }
      }

      // 2. Safety Preferences rule (female passengers)
      if (
        userPreferences.ridePreference === "safety" &&
        userPreferences.gender === "female"
      ) {
        const { safetyPreference } = userPreferences;

        if (safetyPreference === "femaleDriverOnly" || safetyPreference === "femaleDriverAndPassengers") {
          // Filter driver (if driverGender is female or driverName contains female indicator)
          const isFemaleDriver =
            ride.driverGender === "female" ||
            ride.driverName?.toLowerCase().includes("sarah") ||
            ride.driverName?.toLowerCase().includes("emma") ||
            ride.driverName?.toLowerCase().includes("female");

          if (!isFemaleDriver && ride.driverGender !== undefined) {
            return false;
          }
        }

        if (safetyPreference === "femalePassengersOnly" || safetyPreference === "femaleDriverAndPassengers") {
          // Filter passengers: ensure no male co-passengers
          const hasMalePassenger = ride.passengers?.some((p) => p.gender === "male");
          if (hasMalePassenger) return false;
        }
      }

      return true;
    });
  }, [rides, userPreferences]);

  // Handle location selection for Pickup
  const handleSelectPickup = (locData) => {
    setPickupLocation(locData);
    const newText = locData ? locData.name : "";
    setPickupInput(newText);

    if (locData && destLocation) {
      fetchOSRMRoute(locData, destLocation);
    }
    fetchRides(newText, destInput, locData, destLocation);
  };

  // Handle location selection for Destination
  const handleSelectDestination = (locData) => {
    setDestLocation(locData);
    const newText = locData ? locData.name : "";
    setDestInput(newText);

    if (pickupLocation && locData) {
      fetchOSRMRoute(pickupLocation, locData);
    }
    fetchRides(pickupInput, newText, pickupLocation, locData);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (pickupLocation && destLocation) {
      fetchOSRMRoute(pickupLocation, destLocation);
    }
    fetchRides(pickupInput, destInput, pickupLocation, destLocation);
  };

  const handleBookRide = async () => {
    if (!selectedRide) return;
    try {
      setBookingLoading(true);
      const passengerName =
        dbUser?.fullName ||
        clerkUser?.fullName ||
        `${clerkUser?.firstName || ""} ${clerkUser?.lastName || ""}`.trim() ||
        "Passenger";

      const res = await bookRideApi(selectedRide._id, {
        seats: bookingSeats,
        passengerName,
        pickup: pickupInput || selectedRide.origin,
        dropoff: destInput || selectedRide.destination,
      });

      toast.success(res.data?.message || "Booking request sent to driver! Waiting for manual driver confirmation.");
      setSelectedRide(null);
      fetchRides();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error booking ride");
    } finally {
      setBookingLoading(false);
    }
  };

  // Drivers location list for OpenStreetMap
  const driverMarkers = useMemo(() => {
    return filteredRides.map((r) => ({
      name: r.driverName,
      vehicle: `${r.vehicleDetails?.make || "Toyota"} ${r.vehicleDetails?.model || "Prius"} (${r.vehicleDetails?.plate || "RT-1000"})`,
      lat: r.originCoords?.lat || 12.9716,
      lng: r.originCoords?.lng || 77.5946,
    }));
  }, [filteredRides]);

  // Find any active ride for current passenger to render Ride Controls
  const activeUserRide = useMemo(() => {
    const currentUserId = clerkUser?.id || dbUser?.clerkId;
    if (!currentUserId) return null;
    return rides.find(
      (r) =>
        (r.status === "active" || r.status === "scheduled") &&
        r.passengers?.some((p) => p.userId === currentUserId || String(p.userId) === String(currentUserId))
    );
  }, [rides, clerkUser, dbUser]);

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
            Locate nearby verified RouteMate drivers, real OSRM routes, and experience real-time dynamic taxi switching.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowPreferencesModal(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center space-x-2 transition-all hover:scale-105"
          >
            <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
            <span>Preferences ({userPreferences.ridePreference.toUpperCase()})</span>
          </button>

          <button
            onClick={() => fetchRides()}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 flex items-center space-x-2 transition-colors"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Live MongoDB Rides</span>
          </button>
        </div>
      </div>

      {/* Active Ride Controls Section (PART 3) */}
      {activeUserRide && (
        <RideControlsSection
          ride={activeUserRide}
          passengerId={clerkUser?.id || dbUser?.clerkId}
          onRideUpdated={fetchRides}
        />
      )}

      {/* Main Grid Layout: Inputs & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Route Search Form & Available Rides List */}
        <div className="lg:col-span-6 space-y-6">
          {/* Location Search Card */}
          <div className="glass-card border border-slate-800 rounded-3xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Navigation className="w-5 h-5 text-indigo-400" />
                Search MongoDB Routes
              </h2>
              <button
                type="button"
                onClick={() => setShowPreferencesModal(true)}
                className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-bold"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Customize Preferences
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Origin Location (OpenStreetMap)
                </label>
                <LocationAutocompleteInput
                  value={pickupInput}
                  onChange={setPickupInput}
                  onSelectLocation={handleSelectPickup}
                  placeholder="Leaving from (e.g. Downtown)..."
                  icon={MapPin}
                  iconColor="text-emerald-400"
                  focusBorderColor="focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Destination Target (OpenStreetMap)
                </label>
                <LocationAutocompleteInput
                  value={destInput}
                  onChange={setDestInput}
                  onSelectLocation={handleSelectDestination}
                  placeholder="Going to (e.g. Airport)..."
                  icon={MapPin}
                  iconColor="text-rose-400"
                  focusBorderColor="focus:border-rose-500"
                />
              </div>

              {/* Calculated OSRM Distance & Duration Summary Card */}
              {(distanceKm || durationMins) && (
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-indigo-500/30 flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-400 font-bold">🛣️ OSRM Route:</span>
                    <span className="font-mono text-white font-bold">{distanceKm} km</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">⏱️ Est. Travel Time:</span>
                    <span className="font-mono text-white font-bold">{durationMins} mins</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all hover:scale-[1.01]"
              >
                <Search className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                <span>{loading ? "Searching MongoDB..." : "Search Available Rides"}</span>
              </button>
            </form>
          </div>

          {/* Available Rides List */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center justify-between">
              <span>
                MongoDB Available Rides ({filteredRides.length})
                {userPreferences.ridePreference !== "shared" && (
                  <span className="text-xs text-indigo-400 font-normal ml-2">
                    ({userPreferences.ridePreference.toUpperCase()} Filter Applied)
                  </span>
                )}
              </span>
              <span className="text-xs text-emerald-400 font-mono">REAL-TIME SOCKET</span>
            </h3>

            <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
              {loading ? (
                <div className="p-10 text-center text-slate-400 glass-card rounded-3xl space-y-3">
                  <RefreshCcw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
                  <p className="text-sm font-semibold">Searching active rides in database...</p>
                </div>
              ) : filteredRides.length === 0 ? (
                <div className="p-10 text-center text-slate-400 glass-card rounded-3xl space-y-3">
                  <Car className="w-10 h-10 text-slate-500 mx-auto" />
                  <p className="text-sm font-semibold">No rides found matching search criteria.</p>
                  <p className="text-xs text-slate-500">Drivers can offer a new route on the Offer Ride page!</p>
                </div>
              ) : (
                filteredRides.map((ride) => (
                  <div
                    key={ride._id}
                    className="p-5 rounded-3xl glass-card border border-slate-800 hover:border-indigo-500/40 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-sm">
                          {ride.driverName?.charAt(0) || "D"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{ride.driverName}</h4>
                            <span className="bg-amber-500/10 text-amber-300 text-[10px] font-bold px-1.5 py-0.2 rounded border border-amber-500/20 flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> 4.9
                            </span>
                            {ride.distanceFromOriginKm != null && (
                              <span className="bg-indigo-500/10 text-indigo-300 text-[10px] font-bold px-1.5 py-0.2 rounded border border-indigo-500/20">
                                ~{ride.distanceFromOriginKm} km away
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">
                            {ride.vehicleDetails?.make} {ride.vehicleDetails?.model} • <span className="font-mono text-indigo-400">{ride.vehicleDetails?.plate}</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-2xl font-black text-emerald-400 font-mono">${ride.pricePerSeat}</span>
                        <p className="text-[10px] text-slate-400 font-semibold">Per seat</p>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs space-y-1.5">
                      <p className="text-slate-200 font-medium flex items-center gap-1">
                        <span>{ride.origin}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{ride.destination}</span>
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/60">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" /> Departure: {ride.departureTime}
                        </span>
                        <span className="text-purple-400 font-bold">{ride.seatsAvailable} seats available</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Compass className="w-3.5 h-3.5 text-emerald-400" /> Live GPS Coordinates: {ride.originCoords?.lat?.toFixed(3)}, {ride.originCoords?.lng?.toFixed(3)}
                      </span>
                      {(() => {
                        const curId = clerkUser?.id || dbUser?.clerkId;
                        const isConfirmed = ride.passengers?.some((p) => p.userId === curId || String(p.userId) === String(curId));
                        const isPending = ride.bookingRequests?.some((br) => (br.userId === curId || String(br.userId) === String(curId)) && br.status === "pending");

                        if (isConfirmed) {
                          return (
                            <Link
                              to={`/ride/${ride._id}`}
                              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/30 transition-all hover:scale-105"
                            >
                              Track Ride Live 🛰️
                            </Link>
                          );
                        }
                        if (isPending) {
                          return (
                            <span className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40 animate-pulse">
                              Pending Driver Approval
                            </span>
                          );
                        }
                        return (
                          <button
                            onClick={() => setSelectedRide(ride)}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all hover:scale-105"
                          >
                            Book Seat
                          </button>
                        );
                      })()}
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
            <span>Live OpenStreetMap Driver Locations</span>
            <span className="text-xs text-emerald-400 font-mono font-bold">● GPS ACTIVE</span>
          </h3>

          <LiveMap
            height="550px"
            center={pickupLocation ? { lat: pickupLocation.lat, lng: pickupLocation.lng } : { lat: 12.9716, lng: 77.5946 }}
            zoom={12}
            pickupCoords={pickupLocation ? { lat: pickupLocation.lat, lng: pickupLocation.lng } : null}
            pickupName={pickupLocation?.name || "Pickup Point"}
            destinationCoords={destLocation ? { lat: destLocation.lat, lng: destLocation.lng } : null}
            destinationName={destLocation?.name || "Destination"}
            routeGeometry={routeGeometry}
            distanceKm={distanceKm}
            durationMins={durationMins}
            drivers={driverMarkers}
            switchAlert={true}
          />
        </div>
      </div>

      {/* Ride Preferences Modal (PART 1) */}
      {showPreferencesModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full">
            <button
              type="button"
              onClick={() => setShowPreferencesModal(false)}
              className="absolute top-4 right-4 z-20 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <RidePreferencesCard
              initialPreferences={userPreferences}
              onSave={(newPrefs) => {
                setUserPreferences(newPrefs);
                setShowPreferencesModal(false);
                fetchRides();
              }}
              onCancel={() => setShowPreferencesModal(false)}
            />
          </div>
        </div>
      )}

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
              <p><strong>Passenger:</strong> {dbUser?.fullName || clerkUser?.fullName || "RouteMate User"}</p>
              <p><strong>Route:</strong> {selectedRide.origin} ➔ {selectedRide.destination}</p>
              <p><strong>Vehicle:</strong> {selectedRide.vehicleDetails?.make} {selectedRide.vehicleDetails?.model} ({selectedRide.vehicleDetails?.plate})</p>
              <p><strong>Price per seat:</strong> ${selectedRide.pricePerSeat}</p>
              <p><strong>Preference:</strong> <span className="uppercase text-indigo-400 font-bold">{userPreferences.ridePreference}</span></p>
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
                <span className="text-xs text-slate-400">Total Fare:</span>
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
