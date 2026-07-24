import React from "react";
import { Link } from "react-router-dom";
import { Car, Shield, Zap, MapPin, Mail, Phone, Heart, Globe, Share2, MessageCircle } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md">
                <Car className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Route<span className="gradient-text">Mate</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              RouteMate is an intelligent dynamic ride-sharing ecosystem featuring AI mid-ride taxi switching. Save time, cut costs, and reduce urban traffic congestion.
            </p>
            <div className="flex items-center space-x-3 text-slate-400">
              <a href="#" className="p-2 rounded-lg bg-slate-900 hover:text-indigo-400 hover:bg-slate-800 transition-colors" title="Global Network">
                <Globe className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-slate-900 hover:text-indigo-400 hover:bg-slate-800 transition-colors" title="Community">
                <Share2 className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-slate-900 hover:text-indigo-400 hover:bg-slate-800 transition-colors" title="Support Chat">
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Platform</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/find-ride" className="hover:text-white transition-colors">Find a Shared Ride</Link>
              </li>
              <li>
                <Link to="/offer-ride" className="hover:text-white transition-colors">Offer a Ride (Drivers)</Link>
              </li>
              <li>
                <Link to="/taxi-switching" className="text-amber-400 font-semibold hover:text-amber-300 transition-colors flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> Taxi Switching Innovation
                </Link>
              </li>
              <li>
                <Link to="/features" className="hover:text-white transition-colors">Platform Features</Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">User Dashboard</Link>
              </li>
            </ul>
          </div>

          {/* Innovation & Tech */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Company & Mission</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/about" className="hover:text-white transition-colors">About RouteMate</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">Help & Contact</Link>
              </li>
              <li>
                <a href="#safety" className="hover:text-white transition-colors">Safety & Security</a>
              </li>
              <li>
                <a href="#sustainability" className="hover:text-white transition-colors">Green Mobility Impact</a>
              </li>
              <li>
                <Link to="/admin" className="hover:text-white transition-colors">Admin Portal</Link>
              </li>
            </ul>
          </div>

          {/* Newsletter / Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Stay Connected</h4>
            <p className="text-xs text-slate-400">
              Subscribe for dynamic route optimization updates & hackathon release notes.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex items-center space-x-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full"
              />
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3.5 py-2 rounded-lg font-medium shrink-0 transition-colors">
                Join
              </button>
            </form>
            <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span>Clerk Authenticated & Secured</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} RouteMate Inc. All rights reserved.</p>
          <p className="flex items-center gap-1 mt-2 sm:mt-0">
            Engineered with <Heart className="w-3.5 h-3.5 text-red-500 fill-current" /> for Next-Gen Mobility.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
