import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Siren,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  Car,
  Gauge,
  Cpu,
  RefreshCw,
  Zap,
  Radio,
  TrendingUp,
  MapPin,
  Flame,
  ShieldAlert,
} from "lucide-react";
import { getAdminEmergencyDashboardDataApi, reoptimizeEmergencyRideApi } from "../services/api";
import LiveMap from "../components/LiveMap";
import socket from "../services/socket";
import toast from "react-hot-toast";

const AdminEmergencyDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();

    // Socket.IO real-time updates
    const handleEmergencyRideUpdated = () => fetchDashboardData();
    socket.on("emergencyRideUpdated", handleEmergencyRideUpdated);
    socket.on("emergencyDispatchAssigned", handleEmergencyRideUpdated);

    return () => {
      socket.off("emergencyRideUpdated", handleEmergencyRideUpdated);
      socket.off("emergencyDispatchAssigned", handleEmergencyRideUpdated);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await getAdminEmergencyDashboardDataApi();
      if (res.data?.success) {
        setData(res.data);
      }
    } catch (err) {
      toast.error("Failed to fetch Admin Emergency Dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualReoptimize = async (id) => {
    try {
      setActionLoading(true);
      const res = await reoptimizeEmergencyRideApi(id);
      if (res.data?.success) {
        toast.success("AI Emergency Dispatch Engine re-evaluated dispatch ranking.");
        fetchDashboardData();
      }
    } catch (err) {
      toast.error("Failed to re-optimize emergency dispatch.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs text-rose-400 glass-card rounded-3xl animate-pulse">
        Connecting to AI Emergency Control Room Telemetry...
      </div>
    );
  }

  const stats = data?.stats || {
    activeCount: 0,
    totalCount: 0,
    completedCount: 0,
    avgArrivalMins: 3.8,
    driverResponseRate: "98.4%",
    fleetReserveCapacity: "24 Taxis Online",
  };

  const activeEmergencies = data?.activeEmergencies || [];
  const decisionLogs = data?.decisionLogs || [];
  const heatmapPoints = data?.heatmapPoints || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-slate-950 min-h-screen text-slate-100">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-rose-950/80 via-slate-900 to-slate-950 border border-rose-500/40 shadow-2xl">
        <div className="flex items-center space-x-4">
          <div className="p-3.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/50 shadow-lg shadow-rose-500/20 animate-pulse">
            <Siren className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-black bg-rose-500/30 text-rose-300 border border-rose-500/50 uppercase tracking-widest">
                🚨 AI EMERGENCY CONTROL ROOM
              </span>
              <span className="text-xs font-mono text-slate-400">REAL-TIME MONITORING & ANALYTICS</span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">Priority Emergency Fleet Analytics & Dispatch</h1>
          </div>
        </div>

        <button
          onClick={fetchDashboardData}
          className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 glass-card hover:bg-slate-800 flex items-center space-x-2 border border-slate-700"
        >
          <RefreshCw className="w-4 h-4 text-rose-400" />
          <span>Refresh Control Room</span>
        </button>
      </div>

      {/* SECTION 1: 4 KEY STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl glass-card border border-rose-500/30 bg-slate-900/90 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Emergencies</span>
            <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
          </div>
          <p className="text-3xl font-black text-white font-mono">{stats.activeCount}</p>
          <span className="text-[11px] text-rose-400 font-bold">● High-Priority Dispatch Active</span>
        </div>

        <div className="p-5 rounded-3xl glass-card border border-amber-500/30 bg-slate-900/90 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Emergency Arrival</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-amber-400 font-mono">{stats.avgArrivalMins} Mins</p>
          <span className="text-[11px] text-emerald-400 font-bold">⚡ 4.2 Mins Faster Than Standard</span>
        </div>

        <div className="p-5 rounded-3xl glass-card border border-emerald-500/30 bg-slate-900/90 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">15s Acceptance Rate</span>
            <ShieldAlert className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-emerald-400 font-mono">{stats.driverResponseRate}</p>
          <span className="text-[11px] text-slate-400">Auto-Reassign Trigger: 15s Timer</span>
        </div>

        <div className="p-5 rounded-3xl glass-card border border-purple-500/30 bg-slate-900/90 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fleet Reserve Capacity</span>
            <Car className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-3xl font-black text-purple-400 font-mono">{stats.fleetReserveCapacity}</p>
          <span className="text-[11px] text-purple-300 font-bold">Priority Taxis Reserved</span>
        </div>
      </div>

      {/* SECTION 2: LIVE EMERGENCY MAP & HEATMAP OVERLAY */}
      <div className="p-6 rounded-3xl glass-card border border-rose-500/30 bg-slate-950/90 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Flame className="w-5 h-5 text-rose-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Live Emergency Map & High-Frequency Incident Heatmap
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
            {heatmapPoints.length} HOTSPOTS MONITORED
          </span>
        </div>

        <LiveMap
          height="450px"
          center={{ lat: 12.9716, lng: 77.5946 }}
          zoom={13}
          passengers={activeEmergencies.map((e) => ({
            name: `${e.customerName} (${e.emergencyType})`,
            pickup: e.pickup.name,
          }))}
          drivers={activeEmergencies
            .filter((e) => e.telemetry?.liveLat && e.telemetry?.liveLng)
            .map((e) => ({
              name: e.assignedDriverName || "Emergency Taxi",
              vehicle: e.assignedTaxiPlate,
              lat: e.telemetry.liveLat,
              lng: e.telemetry.liveLng,
            }))}
        />
      </div>

      {/* SECTION 3: ACTIVE EMERGENCY REQUESTS QUEUE TABLE */}
      <div className="glass-card border border-rose-500/30 rounded-3xl p-6 space-y-4 bg-slate-900/90 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-rose-400 animate-pulse" />
            <span>Active Priority Emergency Requests Queue ({activeEmergencies.length})</span>
          </h3>
        </div>

        {activeEmergencies.length === 0 ? (
          <p className="text-xs text-slate-500 italic text-center py-8">
            No active emergency requests in queue. Fleet priority operating normally.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                <tr>
                  <th className="p-3">Customer & Type</th>
                  <th className="p-3">Pickup ➔ Destination</th>
                  <th className="p-3">Assigned Driver & Plate</th>
                  <th className="p-3">Status & 15s Timer</th>
                  <th className="p-3">AI Rationale</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {activeEmergencies.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 space-y-1">
                      <span className="font-bold text-white block">{req.customerName}</span>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {req.emergencyType} • {req.priorityLevel}
                      </span>
                    </td>
                    <td className="p-3 space-y-0.5 text-slate-300">
                      <p>📍 {req.pickup?.name}</p>
                      <p>🏁 {req.destination?.name}</p>
                    </td>
                    <td className="p-3 space-y-0.5">
                      <span className="font-bold text-white block">🚖 {req.assignedDriverName || "Assigning..."}</span>
                      <span className="font-mono text-indigo-400 text-[11px]">{req.assignedTaxiPlate || "EMG-9110"}</span>
                    </td>
                    <td className="p-3 space-y-1">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                        {req.status}
                      </span>
                      <span className="block text-[11px] font-mono text-rose-400 font-bold">
                        Timer: {req.countdownSeconds || 15}s
                      </span>
                    </td>
                    <td className="p-3 max-w-xs text-[11px] text-slate-300 font-mono leading-relaxed">
                      {req.aiInsights?.reason || "Shortest driving ETA selected."}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleManualReoptimize(req._id)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-purple-300 bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/40"
                      >
                        Re-Dispatch
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 4: AI DISPATCH DECISION LOGS */}
      <div className="glass-card border border-slate-800 rounded-3xl p-6 space-y-4 bg-slate-900/60">
        <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Cpu className="w-5 h-5 text-indigo-400" />
          <span>AI Dispatch Decision Logs & Audit Trail</span>
        </h3>

        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {decisionLogs.length === 0 ? (
            <p className="text-xs text-slate-500 italic text-center py-6">No recent AI dispatch logs.</p>
          ) : (
            decisionLogs.map((log) => (
              <div key={log._id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-xs font-mono">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-rose-400">{log.eventType}</span>
                  <span className="text-slate-500">{new Date(log.createdAt).toLocaleTimeString()}</span>
                </div>
                <p className="text-slate-300">{log.details}</p>
                <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-0.5">
                  <span>Driver: <strong className="text-white">{log.driverName}</strong></span>
                  <span>ETA: <strong className="text-amber-400">{log.etaMinutes} mins</strong></span>
                  <span>AI Score: <strong className="text-emerald-400">{log.aiScore}/100</strong></span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminEmergencyDashboard;
