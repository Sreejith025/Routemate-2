import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

import Landing from "../pages/Landing";
import About from "../pages/About";
import Features from "../pages/Features";
import Contact from "../pages/Contact";
import TaxiSwitching from "../pages/TaxiSwitching";
import SignInPage from "../pages/SignInPage";
import SignUpPage from "../pages/SignUpPage";
import Dashboard from "../pages/Dashboard";
import DriverDashboard from "../pages/DriverDashboard";
import AdminDashboard from "../pages/AdminDashboard";
import ProfilePage from "../pages/ProfilePage";
import SettingsPage from "../pages/SettingsPage";
import FindRide from "../pages/FindRide";
import OfferRide from "../pages/OfferRide";
import RideDetails from "../pages/RideDetails";
import ActiveRideTracking from "../pages/ActiveRideTracking";
import RideHistory from "../pages/RideHistory";
import EmergencyDispatch from "../pages/EmergencyDispatch";
import AdminEmergencyDashboard from "../pages/AdminEmergencyDashboard";
import AdminFareSafetyDashboard from "../pages/AdminFareSafetyDashboard";

import ProtectedRoute from "./ProtectedRoute";

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/features" element={<Features />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/taxi-switching" element={<TaxiSwitching />} />
        <Route path="/emergency" element={<EmergencyDispatch />} />
        <Route path="/emergency/track/:id" element={<EmergencyDispatch />} />
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />
        <Route path="/find-ride" element={<FindRide />} />
        <Route path="/offer-ride" element={<OfferRide />} />

        {/* Protected Passenger Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected Driver Dashboard */}
        <Route
          path="/driver"
          element={
            <ProtectedRoute allowedRoles={["Driver", "Admin"]}>
              <DriverDashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected Admin Dashboard & Emergency Control Room */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/emergency"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminEmergencyDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/fare-safety"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminFareSafetyDashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected User Profile */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Protected User Settings */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Active Ride Tracking & Details */}
        <Route
          path="/active-ride/:id"
          element={
            <ProtectedRoute>
              <ActiveRideTracking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rides/:id"
          element={
            <ProtectedRoute>
              <ActiveRideTracking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ride-history"
          element={
            <ProtectedRoute>
              <RideHistory />
            </ProtectedRoute>
          }
        />

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
