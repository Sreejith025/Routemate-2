import React, { useState } from "react";
import {
  Car,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  User,
  Heart,
} from "lucide-react";
import { updatePreferencesApi } from "../services/api";
import toast from "react-hot-toast";

const RidePreferencesCard = ({ initialPreferences, onSavePreferences, onContinue }) => {
  const [selectedPreference, setSelectedPreference] = useState(
    initialPreferences?.ridePreference || "shared"
  );
  const [gender, setGender] = useState(initialPreferences?.gender || "female");
  const [safetyPreference, setSafetyPreference] = useState(
    initialPreferences?.safetyPreference || "noPreference"
  );
  const [saving, setSaving] = useState(false);

  const isValidSelection = () => {
    if (!selectedPreference) return false;
    if (selectedPreference === "safety") {
      if (!gender) return false;
      if (gender === "female" && !safetyPreference) return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!isValidSelection()) return;
    try {
      setSaving(true);
      const payload = {
        ridePreference: selectedPreference,
        gender,
        safetyPreference: selectedPreference === "safety" && gender === "female" ? safetyPreference : "noPreference",
      };

      await updatePreferencesApi(payload);
      toast.success("Ride preferences saved to MongoDB!");
      if (onSavePreferences) onSavePreferences(payload);
      if (onContinue) onContinue(payload);
    } catch (err) {
      console.error("Save preferences error:", err);
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card border border-indigo-500/30 rounded-3xl p-6 md:p-8 space-y-6 bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-950 shadow-2xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Title */}
      <div className="space-y-1">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Travel Customization</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-white">Customize Your Ride</h2>
        <p className="text-xs md:text-sm text-slate-300">
          Choose the travel experience that best suits your comfort and preferences.
        </p>
      </div>

      {/* 3 Selectable Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Option 1: Shared Ride */}
        <div
          onClick={() => setSelectedPreference("shared")}
          className={`cursor-pointer p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-4 ${
            selectedPreference === "shared"
              ? "bg-indigo-600/20 border-indigo-500 ring-2 ring-indigo-500/40 shadow-xl shadow-indigo-600/20 scale-[1.02]"
              : "bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850"
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-3xl">🚖</span>
              {selectedPreference === "shared" && (
                <CheckCircle2 className="w-5 h-5 text-indigo-400" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Shared Ride</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                I am comfortable sharing my ride with passengers travelling in the same direction.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 space-y-1.5 text-[11px] text-slate-300">
            <p className="font-semibold text-indigo-300 uppercase tracking-wider text-[10px]">Benefits</p>
            <p className="flex items-center gap-1.5">• Lower Fare</p>
            <p className="flex items-center gap-1.5">• Eco-Friendly</p>
            <p className="flex items-center gap-1.5">• Smart Ride Matching</p>
          </div>
        </div>

        {/* Option 2: Private Ride */}
        <div
          onClick={() => setSelectedPreference("private")}
          className={`cursor-pointer p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-4 ${
            selectedPreference === "private"
              ? "bg-indigo-600/20 border-indigo-500 ring-2 ring-indigo-500/40 shadow-xl shadow-indigo-600/20 scale-[1.02]"
              : "bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850"
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-3xl">🚗</span>
              {selectedPreference === "private" && (
                <CheckCircle2 className="w-5 h-5 text-indigo-400" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Private Ride</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                I prefer travelling alone without sharing my ride.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 space-y-1.5 text-[11px] text-slate-300">
            <p className="font-semibold text-indigo-300 uppercase tracking-wider text-[10px]">Benefits</p>
            <p className="flex items-center gap-1.5">• Direct Route</p>
            <p className="flex items-center gap-1.5">• Complete Privacy</p>
            <p className="flex items-center gap-1.5">• No Additional Stops</p>
          </div>
        </div>

        {/* Option 3: Safety Preferences */}
        <div
          onClick={() => setSelectedPreference("safety")}
          className={`cursor-pointer p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-4 ${
            selectedPreference === "safety"
              ? "bg-purple-600/20 border-purple-500 ring-2 ring-purple-500/40 shadow-xl shadow-purple-600/20 scale-[1.02]"
              : "bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850"
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-3xl">🛡</span>
              {selectedPreference === "safety" && (
                <CheckCircle2 className="w-5 h-5 text-purple-400" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Safety Preferences</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Customize who you are comfortable travelling with.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 space-y-1.5 text-[11px] text-slate-300">
            <p className="font-semibold text-purple-300 uppercase tracking-wider text-[10px]">Features</p>
            <p className="flex items-center gap-1.5">• Gender Specific Filters</p>
            <p className="flex items-center gap-1.5">• Verified Drivers Only</p>
            <p className="flex items-center gap-1.5">• Enhanced Safety Controls</p>
          </div>
        </div>
      </div>

      {/* Safety Preference Detailed Configuration Section */}
      {selectedPreference === "safety" && (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-purple-500/30 space-y-5 animate-in fade-in slide-in-from-top-2">
          <h4 className="text-sm font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>Configure Safety Options</span>
          </h4>

          {/* Gender Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Select Gender</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: "female", label: "Female" },
                { id: "male", label: "Male" },
                { id: "other", label: "Other" },
                { id: "prefer_not_to_say", label: "Prefer Not To Say" },
              ].map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGender(g.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    gender === g.id
                      ? "bg-purple-600/30 border-purple-500 text-purple-200"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Gender-Specific Safety Rule Display */}
          {gender === "female" ? (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <label className="text-xs font-semibold text-slate-300">Travel With</label>
              <div className="space-y-2">
                {[
                  { id: "femalePassengersOnly", label: "Female Passengers Only" },
                  { id: "femaleDriverOnly", label: "Female Driver Only" },
                  { id: "femaleDriverAndPassengers", label: "Female Driver + Female Passengers" },
                  { id: "noPreference", label: "No Preference" },
                ].map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      safetyPreference === opt.id
                        ? "bg-purple-600/20 border-purple-500 text-white"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900"
                    }`}
                  >
                    <input
                      type="radio"
                      name="safetyPreference"
                      value={opt.id}
                      checked={safetyPreference === opt.id}
                      onChange={() => setSafetyPreference(opt.id)}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-xs font-medium">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
              <span>Safety Preferences are currently available only for female passengers.</span>
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-2 flex justify-end">
        <button
          onClick={handleSave}
          disabled={!isValidSelection() || saving}
          className={`px-6 py-3 rounded-xl font-bold text-xs flex items-center space-x-2 shadow-lg transition-all ${
            isValidSelection() && !saving
              ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30 hover:scale-105"
              : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
          }`}
        >
          <span>{saving ? "Saving Preferences..." : "Confirm & Save Preferences"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default RidePreferencesCard;
