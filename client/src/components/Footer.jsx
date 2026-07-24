import React from "react";
import { Car, ShieldCheck, Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-slate-800 bg-slate-950/80 mt-auto py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Car className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-200">RouteMate</span>
            <span className="text-xs text-slate-500">© {new Date().getFullYear()} All rights reserved.</span>
          </div>

          <div className="flex items-center space-x-6 text-sm text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Verified & Secure Rides
            </span>
            <span className="flex items-center gap-1">
              Built with <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" /> for commuters
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
