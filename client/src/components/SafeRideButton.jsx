import React, { useState } from "react";
import { ShieldAlert } from "lucide-react";
import SafeRideModal from "./SafeRideModal";

const SafeRideButton = ({ ride, passengerId, onRideUpdated, positionClass = "fixed bottom-6 right-6 z-40" }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!ride) return null;

  return (
    <>
      {/* Floating Safety Button (Req FEATURE 1 & FEATURE 8) */}
      <div className={positionClass}>
        <button
          onClick={() => setIsModalOpen(true)}
          className="group relative flex items-center space-x-2.5 px-5 py-3 rounded-full text-xs font-black text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 shadow-2xl shadow-purple-600/40 border border-purple-400/40 transition-all hover:scale-105 active:scale-95 animate-pulse"
        >
          <ShieldAlert className="w-5 h-5 text-amber-300 group-hover:rotate-12 transition-transform" />
          <span className="tracking-wide uppercase font-extrabold text-amber-200">🛡 Ride Safety</span>

          {/* Glow backdrop pulse */}
          <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 opacity-30 blur-md group-hover:opacity-60 transition-opacity pointer-events-none" />
        </button>
      </div>

      {/* SafeRide AI Modal */}
      <SafeRideModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ride={ride}
        passengerId={passengerId}
        onRideUpdated={onRideUpdated}
      />
    </>
  );
};

export default SafeRideButton;
