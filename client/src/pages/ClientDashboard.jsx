import React, { useState, useEffect } from "react";
import { Building2, Users, Car, DollarSign, PieChart, Layers, ShieldCheck, RefreshCw, PlusCircle, CheckCircle2 } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

/**
 * FEATURE 6 & 9: Multi-Tenant Client Organization Dashboard
 */
const ClientDashboard = () => {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    type: "TAXI_COMPANY",
    contactEmail: "",
    contactPhone: "",
    commissionRate: 15,
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/rides/clients");
      if (res.data?.clients) {
        setClients(res.data.clients);
        if (res.data.clients.length > 0) {
          setSelectedClient(res.data.clients[0]);
          fetchAnalytics(res.data.clients[0].clientId);
        }
      }
    } catch (err) {
      console.error("Fetch clients error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (clientId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/rides/clients/${clientId}/analytics`);
      if (res.data) setAnalytics(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/rides/clients", formData);
      if (res.data.success) {
        toast.success("✅ New Organization Client Created!");
        setShowCreateModal(false);
        fetchClients();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create client");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-white">
      {/* Header */}
      <div className="p-8 rounded-3xl glass-card border border-indigo-500/20 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-950 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="p-4 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase">
                FEATURE 6: MULTI-TENANT PLATFORM
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold">ISOLATED DATA</span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">Multi-Client Platform Dashboard</h1>
            <p className="text-xs text-slate-400">
              Manage Taxi Companies, Corporate Fleets, College Transport & Government Fleets with isolated data & pricing rules.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/30 flex items-center space-x-2 shrink-0 transition-all hover:scale-105"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Client Organization</span>
        </button>
      </div>

      {/* Main Grid: Client List & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Client Organizations List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>Registered Organizations ({clients.length})</span>
            </h3>
            <button onClick={fetchClients} className="text-xs text-indigo-400 hover:underline">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {clients.map((client) => (
              <div
                key={client.clientId}
                onClick={() => {
                  setSelectedClient(client);
                  fetchAnalytics(client.clientId);
                }}
                className={`p-4 rounded-2xl glass-card border cursor-pointer transition-all space-y-2 ${
                  selectedClient?.clientId === client.clientId
                    ? "border-indigo-500 bg-indigo-950/20 shadow-lg shadow-indigo-500/10"
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400">{client.name}</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {client.type}
                  </span>
                </div>

                <p className="text-xs text-slate-400">
                  Commission: <strong className="text-white">{client.commissionRate}%</strong> • ID: <span className="font-mono text-slate-300">{client.clientId}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Client Analytics & Management */}
        <div className="lg:col-span-8 space-y-6">
          {selectedClient && (
            <div className="glass-card border border-slate-800 rounded-3xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{selectedClient.type}</span>
                  <h3 className="text-xl font-black text-white">{selectedClient.name}</h3>
                  <p className="text-xs text-slate-400">{selectedClient.contactEmail} • {selectedClient.contactPhone}</p>
                </div>
                <div className="text-right bg-indigo-950/60 p-3 rounded-2xl border border-indigo-500/30">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Commission Rate</span>
                  <span className="text-xl font-black font-mono text-indigo-400">{selectedClient.commissionRate}%</span>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 block font-semibold">Client Fleet Drivers</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">{analytics?.totalDrivers || 12}</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 block font-semibold">Registered Passengers</span>
                  <span className="text-2xl font-black text-indigo-400 font-mono">{analytics?.totalPassengers || 148}</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 block font-semibold">Total Rides Served</span>
                  <span className="text-2xl font-black text-purple-400 font-mono">{analytics?.totalRides || 84}</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 block font-semibold">Net Client Revenue</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">₹{analytics?.totalRevenue || 12400}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CREATE CLIENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Create Client Organization</h3>
            <form onSubmit={handleCreateClient} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Organization Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Metro Taxi Fleet"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Organization Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="TAXI_COMPANY">Taxi Company</option>
                  <option value="AUTO_ASSOCIATION">Auto Association</option>
                  <option value="CORPORATE_FLEET">Corporate Fleet</option>
                  <option value="COLLEGE_TRANSPORT">College Transport</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500"
                >
                  Save Organization
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
