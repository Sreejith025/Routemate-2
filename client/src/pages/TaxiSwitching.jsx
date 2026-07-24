import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Zap,
  ArrowRight,
  CheckCircle2,
  Clock,
  TrendingDown,
  ShieldCheck,
  Cpu,
  Car,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Users,
  MapPin,
  Navigation,
} from "lucide-react";
import LiveMap from "../components/LiveMap";
import TaxiSwitchCard from "../components/TaxiSwitchCard";

const WORKFLOW_STEPS = [
  {
    step: 1,
    title: "Passenger A Boarding",
    desc: "Passenger A books Taxi A for route Downtown ➔ Airport.",
    icon: "🧍‍♂️",
    badge: "Initial Trip",
  },
  {
    step: 2,
    title: "Taxi A En-Route",
    desc: "Taxi A proceeds along primary highway route.",
    icon: "🚕",
    badge: "Active Ride",
  },
  {
    step: 3,
    title: "Passenger B Joins Shared Ride",
    desc: "Passenger B boards Taxi A for overlapping sub-route to Westside.",
    icon: "👥",
    badge: "Shared Pooling",
  },
  {
    step: 4,
    title: "Live Traffic Congestion Detected",
    desc: "RouteMate telemetry detects unexpected +18 min traffic delay ahead on highway.",
    icon: "🚨",
    badge: "Traffic Alert",
    alert: true,
  },
  {
    step: 5,
    title: "Nearby Taxi B Discovered",
    desc: "Telemetry finds idle/express Taxi B 0.4 miles away heading directly towards Westside.",
    icon: "🔍",
    badge: "Match Found",
  },
  {
    step: 6,
    title: "Intelligent ETA Comparison",
    desc: "AI calculates: Staying on Taxi A = 34 mins. Switching Passenger B to Taxi B = 20 mins (-14 mins saved!).",
    icon: "📊",
    badge: "ETA Optimized",
  },
  {
    step: 7,
    title: "Suggest Mid-Ride Taxi Switch",
    desc: "RouteMate sends instant switch recommendation pop-up to Passenger B.",
    icon: "⚡",
    badge: "Recommendation Sent",
  },
  {
    step: 8,
    title: "Passenger B Accepts Switch",
    desc: "Passenger B taps 'Accept Switch'. Rendezvous node set at Exit 14 Gas Station.",
    icon: "✅",
    badge: "Action Confirmed",
  },
  {
    step: 9,
    title: "Taxi Switch Completed",
    desc: "Passenger B seamlessly transfers to Taxi B without delaying Taxi A.",
    icon: "🔄",
    badge: "Reroute Complete",
  },
  {
    step: 10,
    title: "Passenger A Continues Direct Trip",
    desc: "Passenger A stays on Taxi A and reaches Airport on schedule.",
    icon: "🏁",
    badge: "Goal Achieved",
  },
];

const TaxiSwitching = () => {
  const [activeStep, setActiveStep] = useState(6);
  const [simulating, setSimulating] = useState(false);

  const startSimulation = () => {
    setSimulating(true);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < WORKFLOW_STEPS.length) {
        setActiveStep(step);
      } else {
        clearInterval(interval);
        setSimulating(false);
      }
    }, 1800);
  };

  const resetSimulation = () => {
    setActiveStep(0);
    setSimulating(false);
  };

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-8 lg:p-14">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold px-4 py-1.5 rounded-full animate-pulse-glow">
            <Zap className="w-4 h-4" />
            <span>RouteMate Core Innovation</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none">
            Dynamic Mid-Ride <br />
            <span className="gradient-text">Intelligent Taxi Switching</span>
          </h1>

          <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Standard ridesharing locks passengers into a single vehicle regardless of traffic jams.
            RouteMate dynamically monitors traffic, ETAs, and nearby taxis in real time, offering seamless mid-ride transfers to get passengers to their destination faster without delaying co-passengers.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={startSimulation}
              disabled={simulating}
              className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-white font-bold text-sm shadow-xl shadow-amber-500/20 transition-all hover:scale-105"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{simulating ? "Simulating Workflow..." : "Watch Live Workflow Interactive Demo"}</span>
            </button>
            <Link
              to="/find-ride"
              className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-colors"
            >
              Try Find Ride
            </Link>
          </div>
        </div>
      </section>

      {/* Step-by-Step Interactive Workflow Diagram */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Interactive Workflow Engine</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white">How Intelligent Switching Works</h2>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={resetSimulation}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Reset Simulation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-400 font-mono">
              Step <strong className="text-amber-400">{activeStep + 1}</strong> of {WORKFLOW_STEPS.length}
            </span>
          </div>
        </div>

        {/* Workflow Horizontal Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
          {WORKFLOW_STEPS.map((s, idx) => {
            const isCurrent = activeStep === idx;
            const isPassed = activeStep > idx;
            return (
              <button
                key={s.step}
                onClick={() => setActiveStep(idx)}
                className={`p-3 rounded-2xl text-left border transition-all duration-200 flex flex-col justify-between ${
                  isCurrent
                    ? "bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-500/30 scale-105 shadow-lg shadow-amber-500/20"
                    : isPassed
                    ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-850"
                }`}
              >
                <div className="flex items-center justify-between text-base">
                  <span>{s.icon}</span>
                  <span className="text-[10px] font-mono font-bold">{s.step}</span>
                </div>
                <p className="text-[11px] font-bold mt-2 line-clamp-2">{s.title}</p>
              </button>
            );
          })}
        </div>

        {/* Active Step Details Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center shadow-2xl">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">{WORKFLOW_STEPS[activeStep].icon}</span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                  {WORKFLOW_STEPS[activeStep].badge}
                </span>
                <h3 className="text-2xl font-bold text-white mt-1">
                  Step {WORKFLOW_STEPS[activeStep].step}: {WORKFLOW_STEPS[activeStep].title}
                </h3>
              </div>
            </div>

            <p className="text-slate-300 text-base leading-relaxed">
              {WORKFLOW_STEPS[activeStep].desc}
            </p>

            <div className="flex flex-wrap gap-4 pt-2 text-xs">
              <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-slate-300 flex items-center space-x-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Passenger B (Impacted)</span>
              </div>
              <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-slate-300 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>ETA Advantage: -14 Mins</span>
              </div>
              <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-slate-300 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>Zero Fare Surge Penalty</span>
              </div>
            </div>
          </div>

          {/* Interactive Card Preview */}
          <div className="lg:col-span-1">
            <TaxiSwitchCard
              passengerName="Sarah Connor"
              currentTaxi="Taxi A (Toyota Prius • RT-8842)"
              targetTaxi="Taxi B (Tesla Model 3 • EV-9901)"
              driverBName="Marcus Vance"
              timeSaved={14}
            />
          </div>
        </div>
      </section>

      {/* Real World Scenario Simulation Map */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Live Telemetry Simulation</span>
          <h2 className="text-3xl font-extrabold text-white mt-1">Real-World Rerouting Map Preview</h2>
          <p className="text-sm text-slate-400">
            OpenStreetMap view showing live Taxi A, Taxi B, and the designated safe Rendezvous Switch Node.
          </p>
        </div>

        <LiveMap
          height="450px"
          center={{ lat: 12.955, lng: 77.61 }}
          zoom={13}
          drivers={[
            { name: "Driver A (Taxi A)", vehicle: "Toyota Prius • RT-8842", lat: 12.965, lng: 77.595 },
            { name: "Driver B (Taxi B - Target)", vehicle: "Tesla Model 3 • EV-9901", lat: 12.945, lng: 77.625 },
          ]}
          passengers={[{ name: "Passenger B (Sarah C.)", lat: 12.96, lng: 77.6 }]}
          switchAlert={true}
        />
      </section>

      {/* Key Benefits Grid */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold text-white">Why RouteMate Wins</h2>
          <p className="text-sm text-slate-400">
            Intelligent taxi switching unlocks unprecedented efficiency for passengers, drivers, and cities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Up to 35% Faster ETAs</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Passengers skip localized traffic gridlocks by jumping into express taxis already traveling down clear corridors.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <TrendingDown className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Lower Ride Costs</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Shared pooling combined with intelligent vehicle utilization drops per-mile costs by up to 28%.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Car className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Increased Driver Income</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Drivers fill empty seat segments dynamically without straying far off their primary route.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Zero Passenger A Delay</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Rendezvous points are strictly selected so Taxi A never takes detours that add time to Passenger A's original trip.
            </p>
          </div>
        </div>
      </section>

      {/* Future AI Roadmap */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 lg:p-12 space-y-6">
        <div className="flex items-center space-x-3 text-indigo-400 text-xs font-bold uppercase tracking-wider">
          <Cpu className="w-5 h-5" />
          <span>Future AI Roadmap & Machine Learning Integration</span>
        </div>

        <h2 className="text-3xl font-extrabold text-white">Predictive Dynamic Rerouting Engine</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-amber-400 text-xs font-mono font-bold">Phase 1 • Q4</span>
            <h4 className="text-base font-bold text-white">Predictive Congestion Forecasting</h4>
            <p className="text-xs text-slate-400">
              Neural network models analyzing historical traffic patterns to trigger pre-emptive taxi switches 10 minutes before gridlocks form.
            </p>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-indigo-400 text-xs font-mono font-bold">Phase 2 • Q1</span>
            <h4 className="text-base font-bold text-white">Multi-Passenger Rendezvous Nodes</h4>
            <p className="text-xs text-slate-400">
              Automated safe drop-off node calculation using street lighting, commercial hubs, and verified gas stations.
            </p>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-emerald-400 text-xs font-mono font-bold">Phase 3 • Q2</span>
            <h4 className="text-base font-bold text-white">Autonomous Fleet Dispatch</h4>
            <p className="text-xs text-slate-400">
              Direct API integrations with autonomous taxi fleets to seamlessly swap autonomous shuttles mid-trip.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TaxiSwitching;
