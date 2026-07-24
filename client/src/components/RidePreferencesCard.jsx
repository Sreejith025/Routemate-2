import React, { useState } from "react";
import { Car, ShieldCheck, Users, Check, AlertCircle, Sparkles } from "lucide-react";
import { updatePreferencesApi } from "../services/api";
import { useAuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";

const RidePreferencesCard = ({
  initialPreferences = {},
  onSave,
  onCancel,
  showActions = true,
}) => {
  const { clerkUser, dbUser } = useAuthContext();
  const [selectedPreference, setSelectedPreference] = useState(
    initialPreferences.ridePreference || "shared"
  );
  const [gender, setGender] = useState(initialPreferences.gender || "prefer_not_to_say");
  const [safetyPreference, setSafetyPreference] = useState(
    initialPreferences.safetyPreference || "noPreference"
  );
  const [loading, setLoading] = useState(false);

  // Validation logic
  const isFemale = gender === "female";
  const isValid = (() => {
    if (!selectedPreference) return false;
    if (selectedPreference === "safety") {
      if (!isFemale) return false; // Disabled if male / other / prefer not to say
      if (!safetyPreference) return false;
    }
    return true;
  })();

  const handleSave = async () => {
    if (!isValid) return;

    try {
      setLoading(true);
      const prefData = {
        clerkId: clerkUser?.id || dbUser?.clerkId,
        ridePreference: selectedPreference,
        gender,
        safetyPreference: isFemale ? safetyPreference : "noPreference",
      };

      const res = await updatePreferencesApi(prefData);
      toast.success("Ride preferences updated successfully!");
      if (onSave) onSave(res.data?.preferences || prefData);
    } catch (err) {
      console.error("Save preferences error:", err);
      toast.error(err.response?.data?.message || "Failed to save preferences");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 max-w-2xl mx-auto shadow-2xl relative overflow-hidden bg-slate-900/90 backdrop-blur-xl">
      {/* Subtle Glow Accents */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="space-y-1 relative z-10">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h2 className="text-2xl font-black text-white">Customize Your Ride</h2>
        </div>
        <p className="text-slate-400 text-xs sm:text-sm">
          Choose the travel experience that best suits your comfort and preferences.
        </p>
      </div>

      {/* 3 Selectable Option Cards */}
      <div className="grid grid-cols-1 gap-4 relative z-10">
        {/* Option 1: Shared Ride */}
        <button
          type="button"
          onClick={() => setSelectedPreference("shared")}
          className={`p-5 rounded-2xl text-left border transition-all duration-200 space-y-3 relative ${
            selectedPreference === "shared"
              ? "bg-indigo-600/15 border-indigo-500 ring-2 ring-indigo-500/30 text-white"
              : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🚖</span>
              <h3 className="text-base font-bold text-white">Shared Ride</h3>
            </div>
            {selectedPreference === "shared" && (
              <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            I am comfortable sharing my ride with passengers travelling in the same direction.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              • Lower Fare
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
              • Eco-Friendly
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              • Smart Ride Matching
            </span>
          </div>
        </button>

        {/* Option 2: Private Ride */}
        <button
          type="button"
          onClick={() => setSelectedPreference("private")}
          className={`p-5 rounded-2xl text-left border transition-all duration-200 space-y-3 relative ${
            selectedPreference === "private"
              ? "bg-purple-600/15 border-purple-500 ring-2 ring-purple-500/30 text-white"
              : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🚗</span>
              <h3 className="text-base font-bold text-white">Private Ride</h3>
            </div>
            {selectedPreference === "private" && (
              <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            I prefer travelling alone without sharing my ride.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
              • Direct Route
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              • Complete Privacy
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              • No Additional Stops
            </span>
          </div>
        </button>

        {/* Option 3: Safety Preferences */}
        <div
          className={`p-5 rounded-2xl border transition-all duration-200 space-y-4 relative ${
            selectedPreference === "safety"
              ? "bg-rose-600/15 border-rose-500 ring-2 ring-rose-500/30 text-white"
              : "bg-slate-950/60 border-slate-800 text-slate-300"
          }`}
        >
          <button
            type="button"
            onClick={() => setSelectedPreference("safety")}
            className="w-full text-left flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🛡</span>
              <div>
                <h3 className="text-base font-bold text-white">Safety Preferences</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Customize who you are comfortable travelling with.
                </p>
              </div>
            </div>
            {selectedPreference === "safety" && (
              <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center text-white shrink-0">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            )}
          </button>

          {/* Expanded Safety Preference Options */}
          {selectedPreference === "safety" && (
            <div className="pt-3 border-t border-rose-500/30 space-y-4 animate-fadeIn">
              {/* Gender Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Select Gender
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: "Female", val: "female" },
                    { label: "Male", val: "male" },
                    { label: "Other", val: "other" },
                    { label: "Prefer Not To Say", val: "prefer_not_to_say" },
                  ].map((g) => (
                    <button
                      key={g.val}
                      type="button"
                      onClick={() => setGender(g.val)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        gender === g.val
                          ? "bg-rose-500 text-white border-rose-400 shadow-md"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional Display */}
              {isFemale ? (
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-rose-300">
                    Travel With
                  </label>
                  <div className="space-y-2">
                    {[
                      {
                        val: "femalePassengersOnly",
                        label: "Female Passengers Only",
                        desc: "Ride only with other female co-passengers.",
                      },
                      {
                        val: "femaleDriverOnly",
                        label: "Female Driver Only",
                        desc: "Ride only with female verified drivers.",
                      },
                      {
                        val: "femaleDriverAndPassengers",
                        label: "Female Driver + Female Passengers",
                        desc: "Exclusively female driver and female co-passengers.",
                      },
                      {
                        val: "noPreference",
                        label: "No Preference",
                        desc: "Standard safety match rules.",
                      },
                    ].map((sp) => (
                      <label
                        key={sp.val}
                        onClick={() => setSafetyPreference(sp.val)}
                        className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          safetyPreference === sp.val
                            ? "bg-rose-500/20 border-rose-500 text-white"
                            : "bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="safetyOption"
                          value={sp.val}
                          checked={safetyPreference === sp.val}
                          onChange={() => setSafetyPreference(sp.val)}
                          className="mt-0.5 text-rose-500 focus:ring-rose-500 bg-slate-900 border-slate-700"
                        />
                        <div>
                          <p className="text-xs font-bold text-white">{sp.label}</p>
                          <p className="text-[11px] text-slate-400">{sp.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    Safety Preferences are currently available only for female passengers.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Action Buttons */}
      {showActions && (
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800 relative z-10">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!isValid || loading}
            className={`px-7 py-3 rounded-xl text-xs font-bold text-white shadow-xl transition-all ${
              isValid && !loading
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-600/30 hover:scale-105 active:scale-95"
                : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
            }`}
          >
            {loading ? "Saving Preferences..." : "Continue"}
          </button>
        </div>
      )}
    </div>
  );
};

export default RidePreferencesCard;
