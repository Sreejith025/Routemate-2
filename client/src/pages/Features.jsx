import React from "react";
import { Link } from "react-router-dom";
import {
  Zap,
  Map,
  Users,
  ShieldCheck,
  LayoutDashboard,
  Clock,
  Navigation,
  Lock,
  Smartphone,
  ArrowRight,
} from "lucide-react";

const FEATURES_LIST = [
  {
    icon: Zap,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    title: "Intelligent Mid-Ride Taxi Switching",
    desc: "Real-time traffic telemetry constantly searches for nearby express taxis heading in your direction. If a traffic delay occurs, RouteMate recommends a seamless mid-ride taxi switch to cut ETA.",
    link: "/taxi-switching",
    linkText: "Explore Switching Workflow",
  },
  {
    icon: Map,
    color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
    title: "OpenStreetMap & React Leaflet Live Tracking",
    desc: "Interactive zero-cost vector mapping showing live vehicle positions, user locations, passenger pickup coordinates, and dynamic reroute polyline overlays.",
    link: "/find-ride",
    linkText: "Try Live Map Search",
  },
  {
    icon: Users,
    color: "text-purple-400 bg-purple-500/10 border-purple-500/30",
    title: "Multi-Passenger Route Pooling",
    desc: "Matches passengers traveling along overlapping sub-corridors. Split fare costs transparently without out-of-way detours for existing passengers.",
    link: "/offer-ride",
    linkText: "Offer a Shared Ride",
  },
  {
    icon: LayoutDashboard,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    title: "Role-Based Personalized Dashboards",
    desc: "Tailored portals for Passengers (Active ride, history), Drivers (Availability toggle, earnings, requests), and Admins (System health, global ride monitor).",
    link: "/dashboard",
    linkText: "View Your Dashboard",
  },
  {
    icon: Lock,
    color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    title: "Clerk Enterprise Authentication",
    desc: "Instant secure multi-tenant sign in with automatic MongoDB sync, session persistence, role authorization middleware, and user profile management.",
    link: "/sign-in",
    linkText: "Sign In Securely",
  },
  {
    icon: Clock,
    color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    title: "Real-Time Socket.IO Telemetry",
    desc: "Low-latency WebSocket channel delivering instant driver location updates, incoming ride notifications, and mid-ride switch alerts directly to client screens.",
    link: "/taxi-switching",
    linkText: "Learn Technical Specs",
  },
];

const Features = () => {
  return (
    <div className="space-y-16 py-8">
      {/* Header */}
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center space-x-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold px-4 py-1.5 rounded-full">
          <Navigation className="w-4 h-4" />
          <span>Full Platform Capability</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          RouteMate <span className="gradient-text">Platform Features</span>
        </h1>
        <p className="text-slate-300 text-base leading-relaxed">
          Engineered as a production-grade hackathon MVP, RouteMate combines real-time mapping, role-based authorization, and patent-pending taxi switching logic.
        </p>
      </section>

      {/* Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {FEATURES_LIST.map((f, idx) => {
          const Icon = f.icon;
          return (
            <div
              key={idx}
              className="glass-card p-8 rounded-3xl border border-slate-800 flex flex-col justify-between space-y-6 hover:border-slate-700 transition-all group"
            >
              <div className="space-y-4">
                <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center ${f.color}`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                  {f.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </div>

              <Link
                to={f.link}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center space-x-2 pt-4 border-t border-slate-800/80"
              >
                <span>{f.linkText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          );
        })}
      </section>
    </div>
  );
};

export default Features;
