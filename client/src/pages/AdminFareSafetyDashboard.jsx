import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  DollarSign,
  CheckCircle2,
  Users,
  Car,
  RefreshCw,
  Receipt,
  UserPlus,
  Lock,
  Cpu,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { getAdminFareSafetyDataApi } from "../services/api";
import socket from "../services/socket";
import toast from "react-hot-toast";

const AdminFareSafetyDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();

    // Socket updates
    const handleDisputeAlert = () => fetchData();
    const handleOfflineCreated = () => fetchData();
    socket.on("adminFareDisputeAlert", handleDisputeAlert);
    socket.on("offlineBookingCreated", handleOfflineCreated);

    return () => {
      socket.off("adminFareDisputeAlert", handleDisputeAlert);
      socket.off("offlineBookingCreated", handleOfflineCreated);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getAdminFareSafetyDataApi();
      if (res.data?.success) {
        setData(res.data);
      }
    } catch (err) {
      toast.error("Failed to fetch Admin Fare & Safety data.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs text-indigo-400 glass-card rounded-3xl animate-pulse">
        Connecting to AI Fare Protection Telemetry...
      </div>
    );
  }

  const stats = data?.stats || {
    totalDisputes: 0,
    resolvedDisputes: 0,
    totalOfflineCount: 0,
    totalRevenue: 0,
    avgDriverTrustScore: 94.8,
    overchargeFlagsCount: 0,
  };

  const disputes = data?.disputes || [];
  const offlineBookings = data?.offlineBookings || [];
  const razorpayPayments = data?.razorpayPayments || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-slate-950 min-h-screen text-slate-100">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-500/40 shadow-2xl">
        <div className="flex items-center space-x-4">
          <div className="p-3.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/50 shadow-lg shadow-indigo-500/20 animate-pulse">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/30 text-indigo-300 border border-indigo-500/50 uppercase tracking-widest">
                🛡️ AI FARE & SAFETY CONTROL ROOM
              </span>
              <span className="text-xs font-mono text-slate-400">FAIRNESS & DISPUTE MONITORING</span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">Guaranteed Fare Protection & Trust Scores</h1>
          </div>
        </div>

        <button
          onClick={fetchData}
          className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 glass-card hover:bg-slate-800 flex items-center space-x-2 border border-slate-700"
        >
          <RefreshCw className="w-4 h-4 text-indigo-400" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* SECTION 1: 4 KEY STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl glass-card border border-rose-500/30 bg-slate-900/90 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fare Disputes Filed</span>
            <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
          </div>
          <p className="text-3xl font-black text-white font-mono">{stats.totalDisputes}</p>
          <span className="text-[11px] text-rose-400 font-bold">
            {stats.overchargeFlagsCount} Overcharge Violations Flagged
          </span>
        </div>

        <div className="p-5 rounded-3xl glass-card border border-emerald-500/30 bg-slate-900/90 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Disputes Resolved</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-emerald-400 font-mono">{stats.resolvedDisputes}</p>
          <span className="text-[11px] text-slate-400">100% AI Automated Resolution</span>
        </div>

        <div className="p-5 rounded-3xl glass-card border border-amber-500/30 bg-slate-900/90 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Offline Walk-in Bookings</span>
            <UserPlus className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-amber-400 font-mono">{stats.totalOfflineCount}</p>
          <span className="text-[11px] text-amber-300 font-bold">Driver Self-Registration Active</span>
        </div>

        <div className="p-5 rounded-3xl glass-card border border-indigo-500/30 bg-slate-900/90 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">System Driver Trust</span>
            <TrendingUp className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-3xl font-black text-indigo-400 font-mono">{stats.avgDriverTrustScore}/100</p>
          <span className="text-[11px] text-indigo-300 font-bold">Avg Driver Integrity Score</span>
        </div>
      </div>

      {/* SECTION 2: FARE DISPUTES & OVERCHARGING FLAGS TABLE */}
      <div className="glass-card border border-rose-500/30 rounded-3xl p-6 space-y-4 bg-slate-900/90 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <span>AI Fare Overcharging Disputes & Violations ({disputes.length})</span>
          </h3>
        </div>

        {disputes.length === 0 ? (
          <p className="text-xs text-slate-500 italic text-center py-8">
            No overcharging disputes reported. All driver fares match locked app fares.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                <tr>
                  <th className="p-3">Passenger & Driver</th>
                  <th className="p-3">App Locked Fare vs Demanded</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">AI Audit Finding</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {disputes.map((disp) => (
                  <tr key={disp._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 space-y-1">
                      <span className="font-bold text-white block">👤 {disp.customerName}</span>
                      <span className="text-slate-400 font-mono text-[11px]">🚖 Driver: {disp.driverName}</span>
                    </td>
                    <td className="p-3 font-mono space-y-0.5">
                      <p className="text-emerald-400 font-bold">Locked: ₹{disp.lockedFareAmount}</p>
                      <p className="text-rose-400 font-bold">Demanded: ₹{disp.demandedFareAmount}</p>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {disp.disputeCategory}
                      </span>
                    </td>
                    <td className="p-3 max-w-xs text-[11px] text-slate-300 font-mono leading-relaxed">
                      {disp.aiAnalysis?.analysisSummary}
                    </td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                        {disp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 3: OFFLINE BOOKINGS & RAZORPAY PAYMENTS TABLE */}
      <div className="glass-card border border-amber-500/30 rounded-3xl p-6 space-y-4 bg-slate-900/90 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-amber-400" />
            <span>Driver Walk-in / Offline Customer Bookings ({offlineBookings.length})</span>
          </h3>
        </div>

        {offlineBookings.length === 0 ? (
          <p className="text-xs text-slate-500 italic text-center py-8">
            No offline walk-in bookings registered.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                <tr>
                  <th className="p-3">Passenger & Contact</th>
                  <th className="p-3">Pickup ➔ Dropoff</th>
                  <th className="p-3">Driver</th>
                  <th className="p-3">Fare & Payment</th>
                  <th className="p-3">Drop PIN</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {offlineBookings.map((off) => (
                  <tr key={off._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 space-y-1">
                      <span className="font-bold text-white block">{off.customerName}</span>
                      <span className="text-slate-400 font-mono text-[11px]">{off.customerPhone}</span>
                    </td>
                    <td className="p-3 space-y-0.5 text-slate-300">
                      <p>📍 {off.pickup?.name}</p>
                      <p>🏁 {off.dropoff?.name}</p>
                    </td>
                    <td className="p-3 font-bold text-white">🚖 {off.driverName}</td>
                    <td className="p-3 font-mono space-y-0.5">
                      <p className="text-emerald-400 font-bold">₹{off.estimatedFare}</p>
                      <p className="text-slate-400 text-[10px]">{off.paymentMethod}</p>
                    </td>
                    <td className="p-3 font-mono font-bold text-amber-400 text-sm">
                      {off.dropPin}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                        {off.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFareSafetyDashboard;
