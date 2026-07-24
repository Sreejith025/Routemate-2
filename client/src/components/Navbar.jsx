import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useClerk, UserButton } from "@clerk/clerk-react";
import { useAuthContext } from "../context/AuthContext";
import {
  Car,
  Home,
  Search,
  PlusCircle,
  LayoutDashboard,
  User,
  LogOut,
  LogIn,
  UserPlus,
  Menu,
  X,
  Zap,
  Info,
  Layers,
  Phone,
  Settings,
  ShieldAlert,
  Clock,
} from "lucide-react";

const Navbar = () => {
  const { isSignedIn, dbUser, role, isAdmin } = useAuthContext();
  const { signOut } = useClerk();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  // Primary Dashboard Link
  const getDashboardLink = () => {
    if (isAdmin || role === "Admin") return "/admin";
    if (role === "Driver") return "/driver";
    return "/dashboard";
  };

  // Passenger Nav Links
  const passengerLinks = [
    { name: "Home", path: "/", icon: Home, show: true },
    { name: "Passenger Hub", path: "/dashboard", icon: LayoutDashboard, show: isSignedIn },
    { name: "Find Ride", path: "/find-ride", icon: Search, show: true },
    { name: "Ride History", path: "/ride-history", icon: Clock, show: isSignedIn },
    { name: "Taxi Switching", path: "/taxi-switching", icon: Zap, show: true, highlight: true },
    { name: "Features", path: "/features", icon: Layers, show: true },
    { name: "Profile", path: "/profile", icon: User, show: isSignedIn },
  ];

  // Admin Nav Links (Full Access to All Dashboards & Features)
  const adminLinks = [
    { name: "Admin Console", path: "/admin", icon: ShieldAlert, show: true, highlightAdmin: true },
    { name: "Passenger Hub", path: "/dashboard", icon: LayoutDashboard, show: true },
    { name: "Driver Hub", path: "/driver", icon: Car, show: true },
    { name: "Find Ride", path: "/find-ride", icon: Search, show: true },
    { name: "Offer Ride", path: "/offer-ride", icon: PlusCircle, show: true },
    { name: "Taxi Switching", path: "/taxi-switching", icon: Zap, show: true, highlight: true },
    { name: "Features", path: "/features", icon: Layers, show: true },
  ];

  const navLinks = isAdmin || role === "Admin" ? adminLinks : passengerLinks;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={getDashboardLink()} className="flex items-center space-x-3 group shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform duration-200">
              <Car className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              Route<span className="gradient-text">Mate</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks
              .filter((link) => link.show)
              .map((link) => {
                const Icon = link.icon;
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                      active
                        ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm"
                        : link.highlightAdmin
                        ? "bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm"
                        : link.highlight
                        ? "text-amber-400 hover:bg-amber-500/10 border border-amber-500/30 bg-amber-500/5 animate-pulse-glow"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${link.highlightAdmin ? "text-purple-400" : link.highlight ? "text-amber-400" : ""}`} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
          </nav>

          {/* Desktop User / Auth Actions */}
          <div className="hidden lg:flex items-center space-x-3">
            {isSignedIn ? (
              <div className="flex items-center space-x-2.5 bg-slate-900/80 p-1.5 pl-3 rounded-full border border-slate-800">
                {/* Role Badge */}
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    isAdmin || role === "Admin"
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                      : role === "Driver"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                  }`}
                >
                  {isAdmin || role === "Admin" ? "ADMIN" : (role || "Passenger")}
                </span>

                <Link
                  to="/settings"
                  className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </Link>

                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8 rounded-full ring-2 ring-indigo-500/50",
                    },
                  }}
                />

                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/sign-in"
                  className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/sign-up"
                  className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-lg shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02]"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Get Started</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center space-x-2">
            {isSignedIn && <UserButton afterSignOutUrl="/" />}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-2">
          {navLinks
            .filter((link) => link.show)
            .map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                      : link.highlightAdmin
                      ? "bg-purple-600/20 text-purple-300 border border-purple-500/30 font-bold"
                      : link.highlight
                      ? "text-amber-400 bg-amber-500/10 border border-amber-500/30 font-bold"
                      : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.name}</span>
                </Link>
              );
            })}

          {isSignedIn && (
            <Link
              to="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-900"
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </Link>
          )}

          <div className="pt-4 border-t border-slate-800">
            {isSignedIn ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/sign-in"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 text-center"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/sign-up"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 text-center"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Sign Up</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
