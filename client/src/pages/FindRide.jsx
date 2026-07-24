import React, { useState, useEffect } from "react";
import axios from "axios";
import MapContainerComponent from "../components/map/MapContainerComponent";
import DynamicSwitchingDemo from "../components/map/DynamicSwitchingDemo";
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
} from "lucide-react";

// Mock drivers generator offset relative to center position
const generateMockDrivers = (center) => {
  const lat = center?.lat || 37.7749;
  const lng = center?.lng || -122.4194;

  return [
    {
      id: "drv-1",
      name: "Carlos Rodriguez",
      vehicleModel: "Toyota Prius",
      vehicleNumber: "NY-4921",
      rating: 4.9,
      availableSeats: 3,
      eta: "4 mins away",
      distance: "0.6 km",
      phone: "+1 (555) 234-5678",
      destination: "Airport Express",
      isAvailable: true,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
      location: { lat: lat + 0.005, lng: lng + 0.004 },
    },
    {
      id: "drv-2",
      name: "Sarah Jenkins",
      vehicleModel: "Honda Accord",
      vehicleNumber: "NY-8812",
      rating: 4.8,
      availableSeats: 2,
      eta: "6 mins away",
      distance: "1.1 km",
      phone: "+1 (555) 876-5432",
      destination: "Downtown Financial District",
      isAvailable: true,
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200",
      location: { lat: lat - 0.006, lng: lng + 0.007 },
    },
    {
      id: "drv-3",
      name: "Michael Chen",
      vehicleModel: "Hyundai Ioniq 5",
      vehicleNumber: "NY-1039",
      rating: 5.0,
      availableSeats: 3,
      eta: "8 mins away",
      distance: "1.5 km",
      phone: "+1 (555) 345-6789",
      destination: "Central Railway Station",
      isAvailable: true,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
      location: { lat: lat + 0.008, lng: lng - 0.005 },
    },
    {
      id: "drv-4",
      name: "David Miller",
      vehicleModel: "Nissan Leaf",
      vehicleNumber: "NY-5520",
      rating: 4.7,
      availableSeats: 1,
      eta: "3 mins away",
      distance: "0.4 km",
      phone: "+1 (555) 654-3210",
      destination: "Tech University Campus",
      isAvailable: true,
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
      location: { lat: lat - 0.003, lng: lng - 0.006 },
    },
    {
      id: "drv-5",
      name: "Priya Sharma",
      vehicleModel: "Tesla Model 3",
      vehicleNumber: "NY-7731",
      rating: 4.9,
      availableSeats: 2,
      eta: "5 mins away",
      distance: "0.9 km",
      phone: "+1 (555) 987-6543",
      destination: "Metro Galleria Mall",
      isAvailable: true,
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
      location: { lat: lat + 0.002, lng: lng + 0.009 },
    },
  ];
};

const FindRide = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [pickupInput, setPickupInput] = useState("");
  const [destInput, setDestInput] = useState("");
  const [pickup, setPickup] = useState(null);
  const [destination, setDestination] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [showDrivers, setShowDrivers] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [searching, setSearching] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [locating, setLocating] = useState(true);

  // Request browser geolocation on page load
  const getUserCurrentLocation = () => {
    setLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: "Your Current GPS Location",
          };
          setUserLocation(coords);
          setPickup(coords);
          setPickupInput("Your Current GPS Location");
          setDrivers(generateMockDrivers(coords));
          setLocating(false);
        },
        (error) => {
          console.warn("Geolocation denied or error, falling back to default:", error);
          const fallback = { lat: 37.7749, lng: -122.4194, address: "San Francisco City Center" };
          setUserLocation(fallback);
          setPickup(fallback);
          setPickupInput("San Francisco City Center");
          setDrivers(generateMockDrivers(fallback));
          setLocating(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      const fallback = { lat: 37.7749, lng: -122.4194, address: "San Francisco City Center" };
      setUserLocation(fallback);
      setPickup(fallback);
      setPickupInput("San Francisco City Center");
      setDrivers(generateMockDrivers(fallback));
      setLocating(false);
    }
  };

  useEffect(() => {
    getUserCurrentLocation();
  }, []);

  // Geocode address text into lat/lng using Nominatim API
  const handleAddressSearch = async (e) => {
    e.preventDefault();
    if (!pickupInput && !destInput) return;

    setSearching(true);
    try {
      if (pickupInput && pickupInput !== "Your Current GPS Location") {
        const res = await axios.get(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(pickupInput)}`
        );
        if (res.data && res.data.length > 0) {
          const first = res.data[0];
          const newPickup = {
            lat: parseFloat(first.lat),
            lng: parseFloat(first.lon),
            address: first.display_name,
          };
          setPickup(newPickup);
          setUserLocation(newPickup);
          setDrivers(generateMockDrivers(newPickup));
        }
      }

      if (destInput) {
        const res = await axios.get(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destInput)}`
        );
        if (res.data && res.data.length > 0) {
          const first = res.data[0];
          setDestination({
            lat: parseFloat(first.lat),
            lng: parseFloat(first.lon),
            address: first.display_name,
          });
        }
      }
    } catch (err) {
      console.error("Geocoding search error:", err);
    } finally {
      setSearching(false);
    }
  };

  // Map click handler to toggle setting pickup or destination
  const handleMapClick = (coords) => {
    if (!pickup) {
      const p = { ...coords, address: `Location (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})` };
      setPickup(p);
      setPickupInput(p.address);
    } else if (!destination) {
      const d = { ...coords, address: `Destination (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})` };
      setDestination(d);
      setDestInput(d.address);
    } else {
      const d = { ...coords, address: `Destination (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})` };
      setDestination(d);
      setDestInput(d.address);
    }
  };

  const handleBookRide = (driver) => {
    setBookingSuccess(`Ride requested with ${driver.name} (${driver.vehicleModel})!`);
    setSelectedDriver(null);
    setTimeout(() => setBookingSuccess(null), 5000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-extrabold text-white">Find a Shared Ride</h1>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Live Map Matching
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Locate nearby RouteMate drivers, select pickup & destination, and experience dynamic taxi switching.
          </p>
        </div>

        <button
          onClick={getUserCurrentLocation}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 flex items-center space-x-2 transition-colors"
        >
          <RefreshCcw className={`w-4 h-4 ${locating ? "animate-spin" : ""}`} />
          <span>{locating ? "Locating GPS..." : "Refresh Location"}</span>
        </button>
      </div>

      {bookingSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold flex items-center space-x-3 animate-in fade-in">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{bookingSuccess}</span>
        </div>
      )}

      {/* Main Grid Layout: Inputs & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Route Search Form & Dynamic Switching Demo */}
        <div className="lg:col-span-5 space-y-6">
          {/* Location Search Card */}
          <div className="glass-card border border-slate-800 rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Navigation className="w-5 h-5 text-indigo-400" />
              Plan Your Trip
            </h2>

            <form onSubmit={handleAddressSearch} className="space-y-4">
              {/* Pickup Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Pickup Location
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={pickupInput}
                    onChange={(e) => setPickupInput(e.target.value)}
                    placeholder="Enter pickup address or click on map..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Destination Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Destination
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-rose-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={destInput}
                    onChange={(e) => setDestInput(e.target.value)}
                    placeholder="Where are you heading?"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={searching}
                className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                <Search className="w-4 h-4" />
                <span>{searching ? "Geocoding Route..." : "Find Route & Drivers"}</span>
              </button>
            </form>

            {/* Quick Action buttons */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setPickup(null);
                  setDestination(null);
                  setPickupInput("");
                  setDestInput("");
                }}
                className="hover:text-rose-400 transition-colors"
              >
                Clear Route Pins
              </button>
              <span>{drivers.length} Drivers Active Nearby</span>
            </div>
          </div>

          {/* Nearby Drivers Quick List */}
          <div className="glass-card border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Car className="w-4 h-4 text-amber-400" />
                Nearby Drivers ({drivers.length})
              </span>
              <span className="text-xs font-normal text-slate-400">Click marker on map to view</span>
            </h3>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {drivers.map((drv) => (
                <div
                  key={drv.id}
                  onClick={() => setSelectedDriver(drv)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedDriver?.id === drv.id
                      ? "bg-amber-500/10 border-amber-500/40 text-white"
                      : "bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/80"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={drv.avatar}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-700"
                    />
                    <div>
                      <div className="font-semibold text-xs text-white">{drv.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {drv.vehicleModel} • <span className="text-emerald-400">{drv.availableSeats} seats</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-indigo-400">{drv.eta}</span>
                    <div className="text-[10px] text-amber-400 font-semibold">★ {drv.rating}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Taxi Switching Demo Section */}
          <DynamicSwitchingDemo />
        </div>

        {/* Right Column: Full Interactive Leaflet Map */}
        <div className="lg:col-span-7 h-[650px] lg:h-auto min-h-[550px] sticky top-24">
          <MapContainerComponent
            userLocation={userLocation}
            pickup={pickup}
            destination={destination}
            drivers={drivers}
            showDrivers={showDrivers}
            setShowDrivers={setShowDrivers}
            selectedDriver={selectedDriver}
            setSelectedDriver={setSelectedDriver}
            onMapClick={handleMapClick}
            onBookRide={handleBookRide}
            onRecenter={getUserCurrentLocation}
          />
        </div>
      </div>
    </div>
  );
};

export default FindRide;
