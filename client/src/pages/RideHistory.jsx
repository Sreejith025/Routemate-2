import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Car, Clock, MapPin, CheckCircle2, ChevronRight, Zap, Download, Filter, RefreshCw } from "lucide-react";
import { getUserRideHistoryApi } from "../services/api";

const RideHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL"); // ALL, COMPLETED, ACTIVE

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await getUserRideHistoryApi();
      if (res.data?.history) {
        setHistory(res.data.history);
      } else {
        setHistory([]);
      }
    } catch (err) {
      console.error("Fetch history error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredList = history.filter((ride) => {
    if (filter === "ALL") return true;
    if (filter === "COMPLETED") return ride.status === "completed";
    if (filter === "ACTIVE") return ride.status === "active" || ride.status === "scheduled";
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="border-b border-slate-800 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Ride History & Receipts</h1>
          <p className="text-slate-400 text-sm mt-1">
            View all your past completed, active, and switched taxi commutes from MongoDB.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchHistory}
            disabled={loading}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
            title="Refresh History"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <div className="flex items-center space-x-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
            {["ALL", "COMPLETED", "ACTIVE"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  filter === f ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-indigo-400 glass-card rounded-3xl animate-pulse">
          Loading ride history from database...
        </div>
      ) : filteredList.length === 0 ? (
        <div className="p-12 text-center text-slate-400 glass-card rounded-3xl space-y-3">
          <Car className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No ride records found</h3>
          <p className="text-xs text-slate-500">Your booked and completed commutes will appear here.</p>
          <Link
            to="/find-ride"
            className="inline-block mt-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500"
          >
            Book a Ride Now
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredList.map((ride) => (
            <div
              key={ride._id}
              className="p-6 rounded-3xl glass-card border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
                    {ride.status}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(ride.createdAt || Date.now()).toLocaleDateString()}
                  </span>
                  {ride.switchDetails?.status === "accepted" && (
                    <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                      <Zap className="w-3 h-3 fill-current" /> Switched Taxi (-{ride.switchDetails?.etaSavedMinutes || 12}m)
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <span>{ride.origin}</span>
                  <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
                  <span>{ride.destination}</span>
                </h3>

                <p className="text-xs text-slate-400">Driver: {ride.driverName}</p>
              </div>

              <div className="flex items-center space-x-6 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                <div className="text-right">
                  <span className="text-xl font-black text-emerald-400 font-mono">${ride.pricePerSeat}</span>
                  <p className="text-[10px] text-slate-400">Total Paid</p>
                </div>

                <Link
                  to={`/rides/${ride._id}`}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center space-x-1"
                >
                  <span>View Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RideHistory;
