import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import api from "../services/api";
import { isAdminEmail } from "../config/adminEmails";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  
  const [dbUser, setDbUser] = useState(null);
  const [dbLoading, setDbLoading] = useState(true);
  const [syncError, setSyncError] = useState(null);

  const userEmail = user?.primaryEmailAddress?.emailAddress || dbUser?.email || "";
  const isAdmin = Boolean(dbUser?.isAdmin || isAdminEmail(userEmail));
  const role = isAdmin ? "Admin" : (dbUser?.role || "Passenger");

  // Sync user with backend MongoDB database
  const syncUserWithBackend = useCallback(async () => {
    if (!isSignedIn || !user) {
      setDbUser(null);
      setDbLoading(false);
      return;
    }

    try {
      setDbLoading(true);
      setSyncError(null);

      const token = await getToken();
      if (!token) {
        setDbLoading(false);
        return;
      }

      const userData = {
        fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || "RouteMate User",
        email: user.primaryEmailAddress?.emailAddress || "",
        profileImage: user.imageUrl || "",
      };

      const response = await api.post("/users/sync", userData);
      if (response.data.success) {
        setDbUser(response.data.user);
      }
    } catch (error) {
      console.error("AuthContext Sync Error:", error);
      setSyncError(error.response?.data?.message || "Failed to sync user profile");
    } finally {
      setDbLoading(false);
    }
  }, [isSignedIn, user, getToken]);

  // Fetch current user from MongoDB database
  const fetchDbUser = useCallback(async () => {
    if (!isSignedIn) {
      setDbUser(null);
      setDbLoading(false);
      return;
    }

    try {
      setDbLoading(true);
      const response = await api.get("/users/me");
      if (response.data.success) {
        setDbUser(response.data.user);
      }
    } catch (error) {
      console.warn("User not synced yet, attempting sync...");
      await syncUserWithBackend();
    } finally {
      setDbLoading(false);
    }
  }, [isSignedIn, syncUserWithBackend]);

  // Auto sync on Clerk authentication change
  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn && user) {
        syncUserWithBackend();
      } else {
        setDbUser(null);
        setDbLoading(false);
      }
    }
  }, [isLoaded, isSignedIn, user, syncUserWithBackend]);

  // Helper to update profile/role
  const updateProfile = async (updateData) => {
    try {
      const response = await api.put("/users/profile", updateData);
      if (response.data.success) {
        setDbUser(response.data.user);
        return { success: true, user: response.data.user };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error("Profile Update Error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to update profile",
      };
    }
  };

  const value = {
    isLoaded,
    isSignedIn,
    clerkUser: user,
    dbUser,
    isAdmin,
    role,
    loading: !isLoaded || dbLoading,
    syncError,
    refreshUser: fetchDbUser,
    syncUserWithBackend,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
