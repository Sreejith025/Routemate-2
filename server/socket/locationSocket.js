import LiveLocation from "../models/LiveLocation.js";
import Ride from "../models/Ride.js";
import { evaluateAndTriggerTaxiSwitch, processTaxiSwitchResponse } from "../services/switchService.js";

/**
 * Initializes socket events for real-time ride tracking & intelligent taxi switching.
 * @param {import("socket.io").Server} io 
 */
export const registerLocationSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    console.log(`📡 Socket connected for live tracking: ${socket.id}`);

    // User joins a specific ride room
    socket.on("join-ride", async (data) => {
      try {
        const { rideId, userId, role } = data || {};
        if (!rideId) return;

        const roomName = `ride_${rideId}`;
        socket.join(roomName);
        socket.rideId = rideId;
        socket.userId = userId;
        socket.role = role;

        console.log(`👤 Socket ${socket.id} (user: ${userId}, role: ${role}) joined room ${roomName}`);
        socket.emit("joined-ride-success", { rideId, room: roomName });
      } catch (err) {
        console.error("Error in join-ride event:", err);
      }
    });

    // Driver emits location update -> monitor traffic, calculate ETA & evaluate taxi switch
    socket.on("driver-location-update", async (data) => {
      try {
        const { rideId, driverId, latitude, longitude, speed, heading, accuracy } = data || {};
        if (!rideId || !driverId || latitude === undefined || longitude === undefined) return;

        const roomName = `ride_${rideId}`;

        // Upsert live location in MongoDB
        await LiveLocation.findOneAndUpdate(
          { rideId, userId: driverId },
          {
            rideId,
            userId: driverId,
            role: "Driver",
            latitude,
            longitude,
            speed: speed || 0,
            heading: heading || 0,
            accuracy: accuracy || 0,
            updatedAt: new Date(),
          },
          { upsert: true, new: true }
        );

        // Broadcast driver location update to everyone in the ride room
        io.to(roomName).emit("driver-location-update", {
          rideId,
          driverId,
          latitude,
          longitude,
          speed: speed || 0,
          heading: heading || 0,
          accuracy: accuracy || 0,
          updatedAt: new Date().toISOString(),
        });

        // Continuously monitor traffic congestion & trigger intelligent taxi switch if ETA delay detected
        evaluateAndTriggerTaxiSwitch(io, rideId, driverId, latitude, longitude, speed || 0);
      } catch (err) {
        console.error("Error in driver-location-update socket handler:", err);
      }
    });

    // Passenger emits location update
    socket.on("passenger-location-update", async (data) => {
      try {
        const { rideId, passengerId, latitude, longitude, speed, heading, accuracy } = data || {};
        if (!rideId || !passengerId || latitude === undefined || longitude === undefined) return;

        const roomName = `ride_${rideId}`;

        // Upsert live location in MongoDB
        await LiveLocation.findOneAndUpdate(
          { rideId, userId: passengerId },
          {
            rideId,
            userId: passengerId,
            role: "Passenger",
            latitude,
            longitude,
            speed: speed || 0,
            heading: heading || 0,
            accuracy: accuracy || 0,
            updatedAt: new Date(),
          },
          { upsert: true, new: true }
        );

        // Broadcast passenger location update to everyone in the ride room
        io.to(roomName).emit("passenger-location-update", {
          rideId,
          passengerId,
          latitude,
          longitude,
          speed: speed || 0,
          heading: heading || 0,
          accuracy: accuracy || 0,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Error in passenger-location-update socket handler:", err);
      }
    });

    // Trigger taxi switch recommendation (explicit socket request)
    socket.on("trigger-taxi-switch", async (data) => {
      try {
        const { rideId, driverId, latitude, longitude, speed } = data || {};
        if (rideId) {
          const result = await evaluateAndTriggerTaxiSwitch(io, rideId, driverId, latitude || 12.9716, longitude || 77.5946, speed || 10);
          if (result) {
            socket.emit("taxi-switch-evaluated", result);
          }
        }
      } catch (err) {
        console.error("Error in trigger-taxi-switch socket handler:", err);
      }
    });

    // Passenger accepts taxi switch recommendation via Socket.IO
    socket.on("accept-taxi-switch", async (data) => {
      try {
        const { rideId } = data || {};
        if (rideId) {
          await processTaxiSwitchResponse(io, rideId, "accept");
        }
      } catch (err) {
        console.error("Error in accept-taxi-switch socket handler:", err);
      }
    });

    // Passenger declines taxi switch recommendation via Socket.IO
    socket.on("decline-taxi-switch", async (data) => {
      try {
        const { rideId } = data || {};
        if (rideId) {
          await processTaxiSwitchResponse(io, rideId, "decline");
        }
      } catch (err) {
        console.error("Error in decline-taxi-switch socket handler:", err);
      }
    });

    // Driver starts ride
    socket.on("ride-started", async (data) => {
      try {
        const { rideId } = data || {};
        if (!rideId) return;

        await Ride.findByIdAndUpdate(rideId, { status: "active" });

        const roomName = `ride_${rideId}`;
        io.to(roomName).emit("ride-started", {
          rideId,
          status: "active",
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Error in ride-started event:", err);
      }
    });

    // Driver ends ride
    socket.on("ride-ended", async (data) => {
      try {
        const { rideId } = data || {};
        if (!rideId) return;

        await Ride.findByIdAndUpdate(rideId, { status: "completed" });

        const roomName = `ride_${rideId}`;
        io.to(roomName).emit("ride-ended", {
          rideId,
          status: "completed",
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Error in ride-ended event:", err);
      }
    });

    // Socket disconnection
    socket.on("disconnect", () => {
      console.log(`🔌 Socket client disconnected: ${socket.id}`);
    });
  });
};
