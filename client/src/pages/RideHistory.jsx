import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Car, Clock, MapPin, CheckCircle2, ChevronRight, Zap, Download, Filter } from "lucide-react";
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
      }
    } catch (err) {
      console.error("Fetch history error:", err);
    } finally {
      setLoading(false);
    }
  };

  const MOCK_HISTORIES = [
    {
      _id: "h1",
      driverName: "Alex Rivera",
      origin: "Downtown Tech Hub",
      destination: "Airport Terminal 2",
      date: "2026-07-22",
      price: 18,
      status: "completed",
      switchedTaxi: true,
      timeSaved: "14 mins",
    },
    {
      _id: "h2",
      driverName: "Elena Rostova",
      origin: "Central Plaza",
      destination: "Innovation Campus",
      date: "2026-07-20",
      price: 12,
      status: "completed",
      switchedTaxi: false,
    },
    {
      _id: "h3",
      driverName: "David Chen",
      origin: "Metro Business Park",
      destination: "Waterfront Mall",
      date: "2026-07-18",
      price: 15,
      status: "completed",
      switchedTaxi: true,
      timeSaved: "10 mins",
    },
  ];

  const displayList = history.length > 0 ? history : MOCK_HISTORIES;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="border-b border-slate-800 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Ride History & Receipts</h1>
          <p className="text-slate-400 text-sm mt-1">
            View all your past completed, active, and switched taxi commutes.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
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

      <div className="space-y-4">
        {displayList.map((ride) => (
          <div
            key={ride._id}
            className="p-6 rounded-3xl glass-card border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
                  {ride.status}
                </span>
                <span className="text-xs text-slate-400">{ride.date}</span>
                {ride.switchedTaxi && (
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-current" /> Switched Taxi (-{ride.timeSaved || "12m"})
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
                <span className="text-xl font-black text-emerald-400 font-mono">${ride.price}</span>
                <p className="text-[10px] text-slate-400">Total Paid</p>
              </div>

              <Link
                to={`/rides/${ride._id}`}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center space-x-1"
              >
                <span>View Log</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RideHistory;
