import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isSignedIn, loading, role, isAdmin } = useAuthContext();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-sm font-medium text-slate-400">Verifying session & profile...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  // Admin users are granted full application access to all pages & dashboards
  if (isAdmin || role === "Admin") {
    return children;
  }

  // Role restriction check for non-admin users
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    if (role === "Driver") return <Navigate to="/driver" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
