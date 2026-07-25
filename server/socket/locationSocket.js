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

    // 1. driver-online: Driver goes online
    socket.on("driver-online", async (data) => {
      try {
        const { driverId, latitude, longitude } = data || {};
        if (!driverId) return;

        if (latitude != null && longitude != null) {
          await LiveLocation.findOneAndUpdate(
            { userId: driverId, role: "Driver" },
            {
              userId: driverId,
              role: "Driver",
              latitude,
              longitude,
              updatedAt: new Date(),
            },
            { upsert: true, new: true }
          );
        }

        io.emit("driver-online", { driverId, status: "Online", timestamp: new Date().toISOString() });
        io.emit("nearby-drivers-updated", { message: `Driver ${driverId} is online.` });
      } catch (err) {
        console.error("Error in driver-online event:", err);
      }
    });

    // 2. driver-offline: Driver goes offline (removes marker immediately)
    socket.on("driver-offline", async (data) => {
      try {
        const { driverId } = data || {};
        if (!driverId) return;

        await LiveLocation.findOneAndDelete({ userId: driverId, role: "Driver" });

        io.emit("driver-offline", { driverId, status: "Offline", timestamp: new Date().toISOString() });
        io.emit("nearby-drivers-updated", { message: `Driver ${driverId} went offline.` });
      } catch (err) {
        console.error("Error in driver-offline event:", err);
      }
    });

    // User joins a specific ride room
    const handleJoinRide = async (data) => {
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
    };

    socket.on("join-ride", handleJoinRide);
    socket.on("joinRide", handleJoinRide);

    // 3. driver-location-update: Throttled driver position update
    socket.on("driver-location-update", async (data) => {
      try {
        const { rideId, driverId, latitude, longitude, speed, heading, accuracy } = data || {};
        if (latitude === undefined || longitude === undefined) return;

        const dId = driverId || socket.userId || "demo_driver";

        // Upsert live location in MongoDB
        await LiveLocation.findOneAndUpdate(
          { userId: dId, role: "Driver" },
          {
            rideId: rideId || null,
            userId: dId,
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

        const updatePayload = {
          rideId,
          driverId: dId,
          latitude,
          longitude,
          speed: speed || 0,
          heading: heading || 0,
          accuracy: accuracy || 0,
          updatedAt: new Date().toISOString(),
        };

        if (rideId) {
          io.to(`ride_${rideId}`).emit("driver-location-update", updatePayload);
        }
        io.emit("driver-location-update", updatePayload);
        io.emit("nearby-drivers-updated", updatePayload);

        // Continuously evaluate traffic congestion & ETA
        if (rideId) {
          evaluateAndTriggerTaxiSwitch(io, rideId, dId, latitude, longitude, speed || 0);
        }
      } catch (err) {
        console.error("Error in driver-location-update socket handler:", err);
      }
    });

    // 4. passenger-location-update
    socket.on("passenger-location-update", async (data) => {
      try {
        const { rideId, passengerId, latitude, longitude, speed, heading, accuracy } = data || {};
        if (latitude === undefined || longitude === undefined) return;

        const pId = passengerId || socket.userId || "demo_passenger";

        await LiveLocation.findOneAndUpdate(
          { userId: pId, role: "Passenger" },
          {
            rideId: rideId || null,
            userId: pId,
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

        const updatePayload = {
          rideId,
          passengerId: pId,
          latitude,
          longitude,
          speed: speed || 0,
          heading: heading || 0,
          accuracy: accuracy || 0,
          updatedAt: new Date().toISOString(),
        };

        if (rideId) {
          io.to(`ride_${rideId}`).emit("passenger-location-update", updatePayload);
        }
      } catch (err) {
        console.error("Error in passenger-location-update socket handler:", err);
      }
    });

    // 5. ride-confirmed
    socket.on("ride-confirmed", async (data) => {
      try {
        const { rideId, driverId, passengerId } = data || {};
        if (!rideId) return;

        io.to(`ride_${rideId}`).emit("ride-confirmed", {
          rideId,
          driverId,
          passengerId,
          status: "confirmed",
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Error in ride-confirmed event:", err);
      }
    });

    // 6. ride-started
    socket.on("ride-started", async (data) => {
      try {
        const { rideId } = data || {};
        if (!rideId) return;

        await Ride.findByIdAndUpdate(rideId, { status: "active", currentStage: "Shared Ride Started" });

        const roomName = `ride_${rideId}`;
        io.to(roomName).emit("ride-started", {
          rideId,
          status: "active",
          stage: "Shared Ride Started",
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Error in ride-started event:", err);
      }
    });

    // 7. ride-completed
    socket.on("ride-completed", async (data) => {
      try {
        const { rideId } = data || {};
        if (!rideId) return;

        await Ride.findByIdAndUpdate(rideId, { status: "completed", currentStage: "Ride Completed" });

        const roomName = `ride_${rideId}`;
        io.to(roomName).emit("ride-completed", {
          rideId,
          status: "completed",
          stage: "Ride Completed",
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Error in ride-completed event:", err);
      }
    });

    // 8. ETA-updated & traffic-updated & second-passenger socket events
    socket.on("ETA-updated", (data) => {
      if (data?.rideId) {
        io.to(`ride_${data.rideId}`).emit("ETA-updated", data);
      }
    });

    socket.on("traffic-updated", (data) => {
      if (data?.rideId) {
        io.to(`ride_${data.rideId}`).emit("traffic-updated", data);
      }
    });

    socket.on("second-passenger-requested", (data) => {
      if (data?.rideId) {
        io.to(`ride_${data.rideId}`).emit("second-passenger-requested", data);
      }
    });

    socket.on("second-passenger-confirmed", (data) => {
      if (data?.rideId) {
        io.to(`ride_${data.rideId}`).emit("second-passenger-confirmed", data);
      }
    });

    socket.on("route-updated", (data) => {
      if (data?.rideId) {
        io.to(`ride_${data.rideId}`).emit("route-updated", data);
      }
    });

    socket.on("fare-updated", (data) => {
      if (data?.rideId) {
        io.to(`ride_${data.rideId}`).emit("fare-updated", data);
      }
    });

    socket.on("ride-updated", (data) => {
      if (data?._id || data?.rideId) {
        const id = data._id || data.rideId;
        io.to(`ride_${id}`).emit("ride-updated", data);
      }
    });

    // Anti-Extortion Core Socket Handlers
    socket.on("verify-cash-amount", (data) => {
      if (data?.rideId) {
        io.to(`ride_${data.rideId}`).emit("verify-cash-amount", data);
      }
    });

    socket.on("unlock-driver-pin", (data) => {
      if (data?.rideId) {
        io.to(`ride_${data.rideId}`).emit("unlock-driver-pin", data);
      }
    });

    socket.on("instant-payout-executed", (data) => {
      if (data?.rideId) {
        io.to(`ride_${data.rideId}`).emit("instant-payout-executed", data);
      }
    });

    socket.on("anti-stalling-check", (data) => {
      if (data?.rideId) {
        io.to(`ride_${data.rideId}`).emit("anti-stalling-check", data);
      }
    });

    // Socket disconnection
    socket.on("disconnect", () => {
      console.log(`🔌 Socket client disconnected: ${socket.id}`);
    });
  });
};
