import React, { useState } from "react";
import { X, UserPlus, Phone, MapPin, DollarSign, QrCode, CheckCircle2, RefreshCw, ShieldCheck } from "lucide-react";
import { createOfflineBookingApi } from "../services/api";
import LocationAutocompleteInput from "./LocationAutocompleteInput";
import toast from "react-hot-toast";

const OfflineBookingModal = ({ isOpen, onClose, driverId, driverName, onBookingCreated }) => {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [pickupInput, setPickupInput] = useState("");
  const [destInput, setDestInput] = useState("");
  const [pickupCoords, setPickupCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [estimatedFare, setEstimatedFare] = useState("350");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [loading, setLoading] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pickupInput || !destInput || !estimatedFare) {
      toast.error("Pickup, dropoff, and fare are required.");
      return;
    }

    const pLoc = pickupCoords || { name: pickupInput, lat: 12.9716, lng: 77.5946 };
    const dLoc = destCoords || { name: destInput, lat: 12.9925, lng: 77.6145 };

    try {
      setLoading(true);
      const res = await createOfflineBookingApi({
        driverId: driverId || "driver_demo",
        driverName: driverName || "RouteMate Driver",
        customerName: customerName || "Walk-in Passenger",
        customerPhone: customerPhone || "+91 98765 43210",
        pickup: pLoc,
        dropoff: dLoc,
        estimatedFare: Number(estimatedFare),
        paymentMethod,
      });

      if (res.data?.success) {
        toast.success(res.data.message || "Walk-in Offline Ride Booked!");
        setCreatedBooking(res.data.offlineBooking);
        if (onBookingCreated) onBookingCreated(res.data.offlineBooking);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create offline booking.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCreatedBooking(null);
    setCustomerName("");
    setCustomerPhone("");
    setPickupInput("");
    setDestInput("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg glass-card border border-emerald-500/30 rounded-3xl p-6 bg-slate-900/95 shadow-2xl space-y-6 text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Book Walk-in / Offline Customer</h2>
              <p className="text-xs text-slate-400">Direct booking with instant Razorpay / Cash payment</p>
            </div>
          </div>
          <button onClick={handleReset} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {createdBooking ? (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto text-2xl animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                OFFLINE RIDE REGISTERED
              </span>
              <h3 className="text-xl font-black text-white mt-2">{createdBooking.customerName}</h3>
              <p className="text-xs text-slate-400 font-mono">{createdBooking.customerPhone}</p>
            </div>

            {/* 4-Digit Drop PIN Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-1">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                Secure 4-Digit Drop PIN
              </span>
              <div className="text-4xl font-black font-mono text-amber-400 tracking-widest my-1">
                {createdBooking.dropPin}
              </div>
              <span className="text-[11px] text-slate-400 block">
                Give this PIN to passenger. Required to complete trip!
              </span>
            </div>

            {/* QR Simulation if digital */}
            {paymentMethod !== "CASH" && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-indigo-400 flex items-center justify-center gap-1">
                  <QrCode className="w-4 h-4" /> Razorpay Instant UPI QR Code
                </span>
                <div className="w-32 h-32 bg-white p-2 rounded-xl mx-auto flex items-center justify-center font-bold text-slate-900 text-xs text-center border-2 border-indigo-500">
                  [RAZORPAY UPI QR ₹{createdBooking.estimatedFare}]
                </div>
              </div>
            )}

            <button
              onClick={handleReset}
              className="w-full py-3.5 rounded-xl text-xs font-extrabold text-white bg-slate-800 hover:bg-slate-700"
            >
              Done & Return to Driver Hub
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Customer Name</label>
                <input
                  type="text"
                  placeholder="Walk-in Passenger"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Mobile Number</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">📍 Pickup Address</label>
              <LocationAutocompleteInput
                placeholder="Enter pickup location..."
                value={pickupInput}
                onChange={(val) => setPickupInput(val)}
                onSelectLocation={(loc) => {
                  setPickupInput(loc.name);
                  setPickupCoords(loc);
                }}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">🏁 Drop Destination</label>
              <LocationAutocompleteInput
                placeholder="Enter drop location..."
                value={destInput}
                onChange={(val) => setDestInput(val)}
                onSelectLocation={(loc) => {
                  setDestInput(loc.name);
                  setDestCoords(loc);
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Agreed Fare (₹)</label>
                <input
                  type="number"
                  value={estimatedFare}
                  onChange={(e) => setEstimatedFare(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
                >
                  <option value="CASH">💵 Cash Payment</option>
                  <option value="RAZORPAY_QR">📱 Razorpay UPI QR</option>
                  <option value="UPI">💳 Online Digital</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 shadow-xl shadow-emerald-600/20 flex items-center justify-center space-x-2 transition-all"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Registering Walk-in Ride...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>REGISTER OFFLINE RIDE & GENERATE PIN</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default OfflineBookingModal;
