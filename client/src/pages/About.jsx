import React from "react";
import { Link } from "react-router-dom";
import { Car, Shield, Target, Users, Sparkles, Globe, Heart, Award, ArrowRight } from "lucide-react";

const About = () => {
  return (
    <div className="space-y-16 py-8">
      {/* Hero Header */}
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold px-4 py-1.5 rounded-full">
          <Globe className="w-4 h-4" />
          <span>Rethinking Urban Mobility</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          About <span className="gradient-text">RouteMate</span>
        </h1>
        <p className="text-slate-300 text-base leading-relaxed">
          RouteMate was born out of a simple observation: urban traffic congestion wastes millions of passenger hours daily, while thousands of partially empty taxis travel down overlapping routes. We are building the next generation of intelligent shared mobility.
        </p>
      </section>

      {/* Core Values */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-8 rounded-3xl border border-slate-800 space-y-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-white">Continuous Innovation</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Pioneering dynamic mid-ride taxi switching algorithms to eliminate traffic bottleneck delays in real time.
          </p>
        </div>

        <div className="glass-card p-8 rounded-3xl border border-slate-800 space-y-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-white">Community First</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Connecting passengers and verified drivers to make commuting affordable, social, and reliable for everyone.
          </p>
        </div>

        <div className="glass-card p-8 rounded-3xl border border-slate-800 space-y-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
            <Shield className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-white">Safety & Security</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Secured by Clerk authentication, verified driver profiles, and real-time OpenStreetMap route monitoring.
          </p>
        </div>
      </section>

      {/* Metrics Banner */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-8 lg:p-12 text-center grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <span className="text-4xl font-black text-white font-mono">14.2m</span>
          <p className="text-xs text-slate-400 mt-1">Commuter Minutes Saved</p>
        </div>
        <div>
          <span className="text-4xl font-black text-amber-400 font-mono">3,850+</span>
          <p className="text-xs text-slate-400 mt-1">Dynamic Taxi Switches</p>
        </div>
        <div>
          <span className="text-4xl font-black text-emerald-400 font-mono">420 Tons</span>
          <p className="text-xs text-slate-400 mt-1">CO₂ Emissions Avoided</p>
        </div>
        <div>
          <span className="text-4xl font-black text-indigo-400 font-mono">99.4%</span>
          <p className="text-xs text-slate-400 mt-1">On-Time Arrival Rate</p>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Ready to Experience Intelligent Ride-Sharing?</h2>
        <p className="text-xs text-slate-400 max-w-lg mx-auto">
          Join thousands of commuters using RouteMate to travel smarter, faster, and greener every day.
        </p>
        <div className="flex justify-center gap-4 pt-2">
          <Link
            to="/find-ride"
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-2"
          >
            <span>Find a Ride Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;
