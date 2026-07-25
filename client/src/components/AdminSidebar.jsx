import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ShieldAlert,
  Siren,
  LayoutDashboard,
  UserCheck,
  Car,
  Layers,
  Zap,
  Activity,
  Users,
  BarChart3,
  Settings,
  Sliders,
  Compass,
  Cpu,
} from "lucide-react";

const AdminSidebar = ({ activeTab, onTabChange }) => {
  const location = useLocation();

  const isRouteActive = (path) => location.pathname === path;

  // External Page Links
  const dashboardRoutes = [
    { name: "🛡️ Fare & Safety Control", path: "/admin/fare-safety", icon: ShieldAlert, color: "text-emerald-400 font-bold" },
    { name: "🚨 Emergency Control Room", path: "/admin/emergency", icon: Siren, color: "text-rose-400 font-bold" },
    { name: "Admin Control Center", path: "/admin", icon: ShieldAlert, color: "text-purple-400" },
    { name: "Passenger Dashboard", path: "/dashboard", icon: UserCheck, color: "text-indigo-400" },
    { name: "Driver Dashboard", path: "/driver", icon: Car, color: "text-emerald-400" },
    { name: "Taxi Switching", path: "/taxi-switching", icon: Zap, color: "text-amber-400" },
    { name: "Features Overview", path: "/features", icon: Layers, color: "text-blue-400" },
    { name: "Settings", path: "/settings", icon: Settings, color: "text-slate-400" },
  ];

  // Admin Internal Tabs (for Admin Dashboard)
  const adminTabs = [
    { id: "overview", name: "System Overview", icon: LayoutDashboard },
    { id: "optimization", name: "AI Optimization Engine", icon: Cpu },
    { id: "saferide", name: "SafeRide AI Center", icon: ShieldAlert },
    { id: "rides", name: "Ride Management", icon: Compass },
    { id: "monitoring", name: "Ride Monitoring", icon: Activity },
    { id: "users", name: "User Management", icon: Users },
    { id: "drivers", name: "Driver Management", icon: Car },
    { id: "analytics", name: "Analytics Dashboard", icon: BarChart3 },
    { id: "sysconfig", name: "System Configuration", icon: Sliders },
  ];

  return (
    <aside className="w-full lg:w-72 glass-card border border-purple-500/20 rounded-3xl p-5 space-y-6 shrink-0 bg-slate-950/80 backdrop-blur-xl">
      {/* Sidebar Header */}
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-lg">
          <ShieldAlert className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-wider">Admin Console</h2>
          <span className="text-[11px] text-purple-300 font-mono font-bold">FULL SYSTEM ACCESS</span>
        </div>
      </div>

      {/* Internal Admin Dashboard Modules */}
      {onTabChange && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2">
            Admin Modules
          </p>
          <nav className="space-y-1">
            {adminTabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? "bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-md shadow-purple-500/10"
                      : "text-slate-400 hover:text-white hover:bg-slate-900/60"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-purple-400" : "text-slate-400"}`} />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Multi-Dashboard Cross Navigation */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2">
          Cross-Dashboard Navigation
        </p>
        <nav className="space-y-1">
          {dashboardRoutes.map((route) => {
            const Icon = route.icon;
            const active = isRouteActive(route.path);
            return (
              <Link
                key={route.path}
                to={route.path}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${route.color}`} />
                <span>{route.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default AdminSidebar;
