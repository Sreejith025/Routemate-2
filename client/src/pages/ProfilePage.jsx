import React, { useState, useEffect } from "react";
import { useAuthContext } from "../context/AuthContext";
import {
  User,
  Mail,
  Key,
  Shield,
  Phone,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  Save,
  Car,
  UserCheck,
} from "lucide-react";

const ProfilePage = () => {
  const { clerkUser, dbUser, updateProfile, loading: authLoading } = useAuthContext();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("Passenger");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (dbUser) {
      setFullName(dbUser.fullName || "");
      setPhone(dbUser.phone || "");
      setRole(dbUser.role || "Passenger");
    } else if (clerkUser) {
      setFullName(
        clerkUser.fullName ||
          `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim()
      );
    }
  }, [dbUser, clerkUser]);

  const handleCopyClerkId = () => {
    const idToCopy = clerkUser?.id || dbUser?.clerkId;
    if (idToCopy) {
      navigator.clipboard.writeText(idToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const res = await updateProfile({ fullName, phone, role });
    setSaving(false);

    if (res.success) {
      setMessage({ type: "success", text: "Profile details updated successfully!" });
    } else {
      setMessage({ type: "error", text: res.message || "Failed to update profile" });
    }

    setTimeout(() => setMessage(null), 4000);
  };

  const clerkId = clerkUser?.id || dbUser?.clerkId || "N/A";
  const userEmail =
    dbUser?.email || clerkUser?.primaryEmailAddress?.emailAddress || "N/A";
  const profileImage =
    clerkUser?.imageUrl || dbUser?.profileImage || "https://via.placeholder.com/150";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Title */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-3xl font-extrabold text-white">Account Profile</h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage your RouteMate user information, verified Clerk ID, and role.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl flex items-center space-x-3 text-sm font-medium border ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Profile Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Clerk ID Card */}
        <div className="md:col-span-1 glass-card border border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <img
              src={profileImage}
              alt="Profile"
              className="w-28 h-28 rounded-full object-cover ring-4 ring-indigo-500/40 shadow-xl"
            />
            <span
              className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-slate-900 ${
                role === "Driver"
                  ? "bg-emerald-500"
                  : role === "Admin"
                  ? "bg-purple-500"
                  : "bg-indigo-500"
              }`}
              title={role}
            />
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">
              {dbUser?.fullName || clerkUser?.fullName || "RouteMate User"}
            </h2>
            <span
              className={`mt-1 inline-block px-3 py-1 rounded-full text-xs font-semibold border ${
                role === "Driver"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : role === "Admin"
                  ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                  : "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
              }`}
            >
              {role || "Passenger"}
            </span>
          </div>

          <div className="w-full pt-4 border-t border-slate-800 text-left space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Clerk User ID
              </label>
              <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg p-2 font-mono text-xs text-slate-300">
                <span className="truncate max-w-[170px]" title={clerkId}>
                  {clerkId}
                </span>
                <button
                  onClick={handleCopyClerkId}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                  title="Copy Clerk User ID"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Synced Email
              </label>
              <p className="text-sm font-medium text-slate-200 truncate">{userEmail}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Profile Form */}
        <div className="md:col-span-2 glass-card border border-slate-800 rounded-2xl p-6 space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <User className="w-5 h-5 text-indigo-400" />
            Edit Profile Details
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address (Managed by Clerk)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={userEmail}
                  disabled
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Application Role
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("Passenger")}
                  className={`p-3 rounded-xl border text-sm font-medium flex flex-col items-center justify-center space-y-1 transition-all ${
                    role === "Passenger"
                      ? "bg-indigo-600/20 border-indigo-500 text-white"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <UserCheck className="w-5 h-5" />
                  <span>Passenger</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("Driver")}
                  className={`p-3 rounded-xl border text-sm font-medium flex flex-col items-center justify-center space-y-1 transition-all ${
                    role === "Driver"
                      ? "bg-emerald-600/20 border-emerald-500 text-white"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <Car className="w-5 h-5" />
                  <span>Driver</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("Admin")}
                  className={`p-3 rounded-xl border text-sm font-medium flex flex-col items-center justify-center space-y-1 transition-all ${
                    role === "Admin"
                      ? "bg-purple-600/20 border-purple-500 text-white"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  <span>Admin</span>
                </button>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Saving Changes..." : "Save Profile"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
