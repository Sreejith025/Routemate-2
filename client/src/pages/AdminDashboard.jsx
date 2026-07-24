import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useAuthContext } from "../context/AuthContext";
import {
  ShieldAlert,
  Users,
  UserCheck,
  Car,
  RefreshCw,
  Search,
} from "lucide-react";

const AdminDashboard = () => {
  const { dbUser, role } = useAuthContext();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/users");
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (err) {
      console.error("Admin fetch users error:", err);
      setError(err.response?.data?.message || "Failed to fetch user directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.clerkId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const passengerCount = users.filter((u) => u.role === "Passenger").length;
  const driverCount = users.filter((u) => u.role === "Driver").length;
  const adminCount = users.filter((u) => u.role === "Admin").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Admin Banner */}
      <div className="p-8 rounded-3xl glass-card border border-purple-500/20 bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-950">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-6 h-6 text-purple-400" />
              <h1 className="text-2xl font-bold text-white">System Administration Panel</h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Logged in as Admin: <span className="text-purple-300 font-semibold">{dbUser?.fullName}</span> ({dbUser?.email})
            </p>
          </div>

          <button
            onClick={fetchUsers}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-medium text-purple-300 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 flex items-center space-x-2 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh User Directory</span>
          </button>
        </div>
      </div>

      {/* Admin Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Users</span>
            <Users className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">{users.length}</p>
        </div>

        <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Passengers</span>
            <UserCheck className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">{passengerCount}</p>
        </div>

        <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Drivers</span>
            <Car className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">{driverCount}</p>
        </div>

        <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Admins</span>
            <ShieldAlert className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">{adminCount}</p>
        </div>
      </div>

      {/* User Management Table */}
      <div className="glass-card border border-slate-800 rounded-2xl p-6 space-y-4 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-white">Registered MongoDB Users</h2>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Clerk User ID</th>
                <th className="py-3 px-4">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    {loading ? "Loading users..." : "No users found"}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 px-4 flex items-center space-x-3">
                      <img
                        src={user.profileImage || "https://via.placeholder.com/100"}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700"
                      />
                      <div>
                        <div className="font-semibold text-white">{user.fullName}</div>
                        <div className="text-xs text-slate-400">{user.email}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${
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
                    <td className="py-3 px-4 font-mono text-xs text-slate-400">
                      {user.phone || "—"}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-400">
                      {user.clerkId}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
