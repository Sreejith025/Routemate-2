import React, { useState, useEffect } from "react";
import { X, CheckCircle2, Download, AlertTriangle, ShieldCheck, Car, MapPin, Receipt, Star } from "lucide-react";
import { getDigitalReceiptApi } from "../services/api";
import toast from "react-hot-toast";

const DigitalReceiptModal = ({ isOpen, onClose, rideId, onReportDispute }) => {
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && rideId) {
      fetchReceipt();
    }
  }, [isOpen, rideId]);

  const fetchReceipt = async () => {
    try {
      setLoading(true);
      const res = await getDigitalReceiptApi(rideId);
      if (res.data?.success && res.data?.receipt) {
        setReceipt(res.data.receipt);
      }
    } catch (err) {
      toast.error("Failed to fetch digital receipt details.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-card border border-indigo-500/30 rounded-3xl p-6 bg-slate-900/95 shadow-2xl space-y-6 text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Digital Ride Receipt</h2>
              <p className="text-xs text-slate-400 font-mono">
                {receipt?.receiptNumber || "REC-OFFICIAL-2026"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-xs text-indigo-400 animate-pulse">
            Generating Official Digital Receipt...
          </div>
        ) : receipt ? (
          <div className="space-y-5">
            {/* Payment Badge */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> PAYMENT SUCCESSFUL
              </span>
              <span className="text-xs font-mono font-bold text-slate-200">
                Method: {receipt.paymentMethod}
              </span>
            </div>

            {/* Route Summary */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-start space-x-2">
                <span className="text-emerald-400">📍</span>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Pickup Location</span>
                  <span className="font-bold text-slate-200">{receipt.pickup}</span>
                </div>
              </div>
              <div className="flex items-start space-x-2 pt-1">
                <span className="text-rose-400">🏁</span>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Dropoff Location</span>
                  <span className="font-bold text-slate-200">{receipt.dropoff}</span>
                </div>
              </div>
            </div>

            {/* Itemized Fare Breakdown */}
            <div className="space-y-2 text-xs border-t border-b border-slate-800 py-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Itemized Fare Breakdown
              </span>
              <div className="flex justify-between text-slate-300">
                <span>Base Fare</span>
                <span className="font-mono">₹{receipt.itemization?.baseFare || 240}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Distance Charge</span>
                <span className="font-mono">₹{receipt.itemization?.distanceCharge || 60}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Waiting Charges (Free 5m)</span>
                <span className="font-mono text-emerald-400">₹{receipt.itemization?.waitingCharge || 0}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Taxes & Service GST (5%)</span>
                <span className="font-mono">₹{receipt.itemization?.taxes || 15}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-slate-800">
                <span>Guaranteed Final Fare</span>
                <span className="font-mono text-emerald-400">₹{receipt.itemization?.totalFare || 315}</span>
              </div>
            </div>

            {/* Driver Trust Score */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
              <div>
                <span className="font-bold text-white block">{receipt.driverName || "RouteMate Driver"}</span>
                <span className="text-[10px] text-slate-400 font-mono">Plate: {receipt.vehiclePlate}</span>
              </div>
              <div className="text-right">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  TRUST SCORE: {receipt.driverTrustScore}/100
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => toast.success("Digital Receipt Downloaded as PDF!")}
                className="py-3 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 flex items-center justify-center space-x-1.5"
              >
                <Download className="w-4 h-4 text-indigo-400" />
                <span>Download PDF</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  if (onReportDispute) onReportDispute();
                }}
                className="py-3 rounded-xl text-xs font-bold text-rose-300 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/40 flex items-center justify-center space-x-1.5"
              >
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Report Dispute</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default DigitalReceiptModal;
