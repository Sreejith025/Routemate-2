import React, { useState } from "react";
import {
  Zap,
  Car,
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Navigation,
  ShieldCheck,
  Sparkles,
  TrendingDown,
} from "lucide-react";

const DynamicSwitchingDemo = () => {
  const [simulationActive, setSimulationActive] = useState(false);
  const [switched, setSwitched] = useState(false);

  const handleSimulateCongestion = () => {
    setSimulationActive(true);
    setSwitched(false);
  };

  const handleAcceptSwitch = () => {
    setSwitched(true);
  };

  return (
    <div className="glass-card border border-indigo-500/30 rounded-2xl p-6 space-y-6 bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-950 shadow-2xl relative overflow-hidden">
      {/* Glow background accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-white">Dynamic Taxi Switching</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Flagship Feature
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Intelligent mid-commute vehicle optimization engine
            </p>
          </div>
        </div>

        <button
          onClick={handleSimulateCongestion}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 hover:bg-indigo-500/25 flex items-center space-x-1.5 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Simulate Traffic Alert</span>
        </button>
      </div>

      {/* Visual Workflow Scenario */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Taxi A Status */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Car className="w-4 h-4 text-amber-400" />
              Taxi A (Current Vehicle)
            </span>
            <span className="text-[10px] font-mono text-slate-400">Prius • NY-4921</span>
          </div>
          <div className="text-xs text-slate-400 space-y-1 pt-1">
            <p>• Passenger 1 → Airport (ETA 20m)</p>
            <p>• Passenger 2 → Railway Station (ETA 40m)</p>
          </div>
          {simulationActive && !switched && (
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] flex items-center gap-1.5 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Heavy congestion ahead (+15 min delay)</span>
            </div>
          )}
        </div>

        {/* Taxi B Status */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Car className="w-4 h-4 text-emerald-400" />
              Taxi B (Nearby Match)
            </span>
            <span className="text-[10px] font-mono text-slate-400">Camry • NY-8812</span>
          </div>
          <div className="text-xs text-slate-400 space-y-1 pt-1">
            <p>• Distance: 300 meters away</p>
            <p>• Heading direct to: Railway Station</p>
          </div>
          {simulationActive && (
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Direct Route Available (Saves 15 mins)</span>
            </div>
          )}
        </div>
      </div>

      {/* Simulation Active Banner & Recommendation Modal */}
      {simulationActive && (
        <div className="p-5 rounded-xl glass-panel border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 space-y-3 animate-in fade-in slide-in-from-top-2">
          {!switched ? (
            <>
              <div className="flex items-start space-x-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex-shrink-0">
                  <Zap className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    Dynamic Taxi Switch Recommendation
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      -15 mins faster
                    </span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Heavy traffic detected on Taxi A's route. Nearby Taxi B is heading towards your destination (Railway Station). Switching now will deliver you 15 minutes earlier without delaying Taxi A's passengers.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  onClick={handleAcceptSwitch}
                  className="flex-1 py-2.5 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 shadow-md shadow-amber-500/20 flex items-center justify-center space-x-1.5 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accept Taxi Switch (-15 min)</span>
                </button>

                <button
                  onClick={() => setSimulationActive(false)}
                  className="px-4 py-2.5 rounded-xl font-medium text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Decline
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-3 text-emerald-400">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-emerald-400" />
              <div>
                <h4 className="text-sm font-bold text-white">Taxi Switch Accepted! 🎉</h4>
                <p className="text-xs text-emerald-300">
                  Taxi B is pulling over 300m ahead to pick you up. Estimated time saved: 15 minutes!
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Core Benefits Pills */}
      <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-slate-400 pt-2 border-t border-slate-800">
        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
          ⚡ Faster Commutes
        </div>
        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
          🌱 Lower Fuel Usage
        </div>
        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
          🤝 Zero Fare Increase
        </div>
      </div>
    </div>
  );
};

export default DynamicSwitchingDemo;
