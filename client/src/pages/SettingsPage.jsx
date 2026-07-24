import React, { useState } from "react";
import { Settings, Shield, Bell, Moon, MapPin, RefreshCw, UserCheck, SlidersHorizontal } from "lucide-react";
import { useAuthContext } from "../context/AuthContext";
import { updateProfileApi } from "../services/api";
import RidePreferencesCard from "../components/RidePreferencesCard";
import toast from "react-hot-toast";

const SettingsPage = () => {
  const { dbUser, role } = useAuthContext();
  const [selectedRole, setSelectedRole] = useState(role || "Passenger");
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [switchAlerts, setSwitchAlerts] = useState(true);

  const handleSaveRole = async () => {
    try {
      setSaving(true);
      await updateProfileApi({ role: selectedRole });
      toast.success(`Role updated to ${selectedRole}! Reloading session...`);
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      toast.error("Failed to update role");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-indigo-400" />
          <span>Account & Platform Settings</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Customize your role preferences, travel experience, and notification triggers.
        </p>
      </div>

      <div className="space-y-6">
        {/* Ride Preferences Card Section (Part 1) */}
        <RidePreferencesCard
          initialPreferences={{
            ridePreference: dbUser?.ridePreference || "shared",
            gender: dbUser?.gender || "female",
            safetyPreference: dbUser?.safetyPreference || "noPreference",
          }}
        />

        {/* Role Quick Switcher */}
        <div className="glass-card border border-slate-800 rounded-3xl p-8 space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Active Account Role</h3>
              <p className="text-xs text-slate-400">Switch between Passenger, Driver, and Admin views</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {["Passenger", "Driver", "Admin"].map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRole(r)}
                className={`p-4 rounded-2xl border text-left space-y-1 transition-all ${
                  selectedRole === r
                    ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900"
                }`}
              >
                <div className="font-bold text-sm">{r}</div>
                <div className="text-[11px] text-slate-500">
                  {r === "Passenger"
                    ? "Book shared rides & receive taxi switch recommendations"
                    : r === "Driver"
                    ? "Host vehicle routes, accept booking requests & earn"
                    : "Full system telemetry monitor & user administration"}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleSaveRole}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${saving ? "animate-spin" : ""}`} />
            <span>Save Role Preference</span>
          </button>
        </div>

        {/* Notifications & Dynamic Switch Alert Preferences */}
        <div className="glass-card border border-slate-800 rounded-3xl p-8 space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <span>Alert & Notification Triggers</span>
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div>
                <strong className="text-white text-xs block">Dynamic Mid-Ride Taxi Switch Alerts</strong>
                <span className="text-[11px] text-slate-400">Receive instant popups when a faster taxi is available nearby</span>
              </div>
              <input
                type="checkbox"
                checked={switchAlerts}
                onChange={() => setSwitchAlerts(!switchAlerts)}
                className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div>
                <strong className="text-white text-xs block">Real-time Ride Status Notifications</strong>
                <span className="text-[11px] text-slate-400">Driver location updates and ETA change notifications</span>
              </div>
              <input
                type="checkbox"
                checked={notifications}
                onChange={() => setNotifications(!notifications)}
                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
