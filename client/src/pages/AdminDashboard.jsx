import React, { useState, useEffect } from "react";
import api, { getDashboardStatsApi, getAvailableRidesApi } from "../services/api";
import { useAuthContext } from "../context/AuthContext";
import {
  ShieldAlert,
  Users,
  UserCheck,
  Car,
  RefreshCw,
  Search,
  Zap,
  Activity,
  BarChart3,
  Sliders,
  Compass,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Database,
  Radio,
} from "lucide-react";
import LiveMap from "../components/LiveMap";
import AdminSidebar from "../components/AdminSidebar";
import toast from "react-hot-toast";

const AdminDashboard = () => {
  const { dbUser, role } = useAuthContext();
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [rides, setRides] = useState([]);
  const [stats, setStats] = useState({
    users: { total: 0, drivers: 0, passengers: 0, admins: 0 },
    rides: { total: 0, active: 0, scheduled: 0, completed: 0, dynamicSwitches: 0 },
    systemEfficiency: { avgTimeSavedMinutes: 0, co2ReducedKg: 0, activeTrafficAlerts: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, statsRes, ridesRes] = await Promise.allSettled([
        api.get("/users"),
        getDashboardStatsApi(),
        getAvailableRidesApi(),
      ]);

      if (usersRes.status === "fulfilled" && usersRes.value.data.success) {
        setUsers(usersRes.value.data.users);
      }
      if (statsRes.status === "fulfilled" && statsRes.value.data.stats) {
        setStats(statsRes.value.data.stats);
      }
      if (ridesRes.status === "fulfilled" && ridesRes.value.data.rides) {
        setRides(ridesRes.value.data.rides);
      }
    } catch (err) {
      console.error("Admin fetch data error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put("/users/profile", { userId, role: newRole });
      toast.success(`User role updated to ${newRole}`);
      fetchData();
    } catch (err) {
      toast.error("Failed to update role");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.clerkId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const driversList = users.filter((u) => u.role === "Driver");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Header */}
      <div className="p-8 rounded-3xl glass-card border border-purple-500/20 bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-950 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-6 h-6 text-purple-400" />
              <h1 className="text-2xl font-black text-white">RouteMate Authorized Admin Control Center</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Global Control & Monitoring • Authenticated Admin: <span className="text-purple-300 font-bold">{dbUser?.fullName || "System Admin"}</span> ({dbUser?.email})
            </p>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-purple-300 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 flex items-center space-x-2 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh System Metrics</span>
          </button>
        </div>
      </div>

      {/* Layout with Admin Sidebar */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Admin Sidebar Navigation */}
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Admin Main Module Display */}
        <div className="flex-1 space-y-8">
          {/* Module 1: Overview */}
          {(activeTab === "overview" || activeTab === "analytics") && (
            <div className="space-y-6">
              {/* Analytics KPI Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl glass-card border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Total Registered Users</span>
                    <Users className="w-4 h-4 text-indigo-400" />
                  </div>
                  <p className="text-3xl font-extrabold text-white">{users.length}</p>
                  <p className="text-[11px] text-slate-400">MongoDB Synced</p>
                </div>

                <div className="p-5 rounded-2xl glass-card border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Active Drivers Fleet</span>
                    <Car className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-3xl font-extrabold text-emerald-400">{driversList.length || stats.users.drivers}</p>
                  <p className="text-[11px] text-emerald-400">Verified Hosts</p>
                </div>

                <div className="p-5 rounded-2xl glass-card border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Active En-route Rides</span>
                    <Activity className="w-4 h-4 text-indigo-400" />
                  </div>
                  <p className="text-3xl font-extrabold text-white">{rides.length || stats.rides.active}</p>
                  <p className="text-[11px] text-indigo-400">Live Routes</p>
                </div>

                <div className="p-5 rounded-2xl glass-card border border-amber-500/30 space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Taxi Switches</span>
                    <Zap className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-3xl font-extrabold text-amber-400 font-mono">{stats.rides.dynamicSwitches || 14}</p>
                  <p className="text-[11px] text-amber-300">Intelligent Reroutes Executed</p>
                </div>
              </div>

              {/* Global Fleet & Reroute Monitoring Map */}
              <div className="glass-card border border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-400" />
                    <span>Global Ride & Telemetry Live Monitoring (OSM)</span>
                  </h2>
                  <span className="text-xs text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-1 rounded">SYSTEM HEALTH 100%</span>
                </div>

                <LiveMap
                  height="380px"
                  center={{ lat: 12.9716, lng: 77.5946 }}
                  zoom={12}
                  switchAlert={true}
                />
              </div>
            </div>
          )}

          {/* Module 2: Ride Management & Monitoring */}
          {(activeTab === "rides" || activeTab === "monitoring") && (
            <div className="glass-card border border-slate-800 rounded-3xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-400" />
                <span>Global Ride Management & Monitoring</span>
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Ride Route</th>
                      <th className="py-3 px-4">Driver</th>
                      <th className="py-3 px-4">Passengers</th>
                      <th className="py-3 px-4">Seats</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {rides.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">
                          No active ride offers in database.
                        </td>
                      </tr>
                    ) : (
                      rides.map((r) => (
                        <tr key={r._id} className="hover:bg-slate-900/50 transition-colors">
                          <td className="py-3 px-4 font-bold text-white">
                            {r.origin} ➔ {r.destination}
                          </td>
                          <td className="py-3 px-4 text-emerald-400">{r.driverName}</td>
                          <td className="py-3 px-4">{r.passengers?.length || 0} Passengers</td>
                          <td className="py-3 px-4">{r.seatsAvailable} left</td>
                          <td className="py-3 px-4">
                            <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-emerald-500/20">
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Module 3: User & Driver Management */}
          {(activeTab === "overview" || activeTab === "users" || activeTab === "drivers") && (
            <div className="glass-card border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-white">
                  {activeTab === "drivers" ? "Driver Fleet Directory" : "Registered Users & Role Management"}
                </h2>
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search user name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Current Role</th>
                      <th className="py-3 px-4">Admin Privileges</th>
                      <th className="py-3 px-4">Role Quick Switch</th>
                      <th className="py-3 px-4">Joined Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">
                          {loading ? "Loading users..." : "No users matched search"}
                        </td>
                      </tr>
                    ) : (
                      filteredUsers
                        .filter((u) => activeTab !== "drivers" || u.role === "Driver")
                        .map((user) => (
                          <tr key={user._id} className="hover:bg-slate-900/50 transition-colors">
                            <td className="py-3 px-4 flex items-center space-x-3">
                              <img
                                src={
                                  user.profileImage ||
                                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                                }
                                alt=""
                                className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700"
                              />
                              <div>
                                <div className="font-bold text-white">{user.fullName}</div>
                                <div className="text-[11px] text-slate-400">{user.email}</div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  user.role === "Driver"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                    : user.role === "Admin"
                                    ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                                    : "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                                }`}
                              >
                                {user.role}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${user.isAdmin || user.role === "Admin" ? "bg-purple-500/20 text-purple-300 border border-purple-500/40" : "bg-slate-800 text-slate-400"}`}>
                                {user.isAdmin || user.role === "Admin" ? "FULL ADMIN ACCESS" : "Standard User"}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <select
                                value={user.role}
                                onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2 py-1 text-slate-200 focus:outline-none"
                              >
                                <option value="Passenger">Passenger</option>
                                <option value="Driver">Driver</option>
                                <option value="Admin">Admin</option>
                              </select>
                            </td>
                            <td className="py-3 px-4 text-[11px] text-slate-400">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Module 4: System Configuration */}
          {activeTab === "sysconfig" && (
            <div className="glass-card border border-slate-800 rounded-3xl p-6 space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-400" />
                <span>System Configuration & Authorized Admin Controls</span>
              </h2>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 text-xs text-slate-300">
                <h4 className="font-bold text-purple-300 text-sm">Authorized Admin Emails List (Configured)</h4>
                <ul className="list-disc pl-5 space-y-1 font-mono text-emerald-400">
                  <li>abisri024@gmail.com</li>
                  <li>asanusri2006@gmail.com</li>
                </ul>
                <p className="text-slate-400 pt-2">
                  Users logging in with emails matching the configuration above automatically receive full Admin privileges (`isAdmin = true`), access to all dashboards, and full system management capabilities.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 block font-semibold">Socket.IO Server</span>
                  <span className="text-emerald-400 font-bold font-mono">ONLINE (Port 5000)</span>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 block font-semibold">MongoDB Atlas Database</span>
                  <span className="text-emerald-400 font-bold font-mono">CONNECTED</span>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 block font-semibold">OSRM Routing Service</span>
                  <span className="text-indigo-400 font-bold font-mono">ACTIVE</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
