import express from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import { clerkMiddleware } from "@clerk/express";

import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import rideRoutes from "./routes/rideRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import { registerLocationSocketHandlers } from "./socket/locationSocket.js";

import safeRideRoutes from "./routes/safeRideRoutes.js";
import optimizationRoutes from "./routes/optimizationRoutes.js";
import emergencyRoutes from "./routes/emergencyRoutes.js";
import fareProtectionRoutes from "./routes/fareProtectionRoutes.js";
import { runRideOptimizationCycle } from "./services/RideOptimizationService.js";

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Attach io instance to express app
app.set("io", io);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Enable Clerk authentication middleware with publishable & secret key fallbacks
const publishableKey =
  process.env.CLERK_PUBLISHABLE_KEY ||
  "pk_test_d2VhbHRoeS1waXBlZmlzaC01Ni5jbGVyay5hY2NvdW50cy5kZXYk";

const secretKey =
  process.env.CLERK_SECRET_KEY ||
  "sk_test_d2VhbHRoeS1waXBlZmlzaC01Ni5jbGVyay5hY2NvdW50cy5kZXYk";

app.use(clerkMiddleware({ publishableKey, secretKey }));

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/user", userRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/rides", safeRideRoutes);
app.use("/api/safe-ride", safeRideRoutes);
app.use("/api/optimization", optimizationRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/fare-protection", fareProtectionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/location", locationRoutes);

// Root Health Check Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "RouteMate AI Multi-Passenger Ride Re-Optimization & Emergency Dispatch Engine Running 🤖🚨🚗💨",
    socketConnected: true,
  });
});

// Register Location Socket Handlers
registerLocationSocketHandlers(io);

// MODULE 12: Real-Time Socket.IO Event Engine (All 12 Required Events + Emergency Module)
io.on("connection", (socket) => {
  // joinEmergency room
  socket.on("joinEmergency", (data) => {
    const emergencyRideId = typeof data === "object" ? data?.emergencyRideId || data?.rideId : data;
    if (emergencyRideId) {
      socket.join(`emergency_${emergencyRideId}`);
    }
  });

  // 1. joinRide
  socket.on("joinRide", (data) => {
    const rideId = typeof data === "object" ? data?.rideId : data;
    if (rideId) {
      socket.join(`ride_${rideId}`);
    }
  });

  // 2. driverLocationUpdated
  socket.on("driverLocationUpdated", (data) => {
    if (data?.rideId) {
      io.to(`ride_${data.rideId}`).emit("driverLocationUpdated", data);
    }
    socket.broadcast.emit("location_updated", data);
  });

  // 3. trafficDetected
  socket.on("trafficDetected", (data) => {
    if (data?.rideId) {
      io.to(`ride_${data.rideId}`).emit("trafficDetected", data);
    }
    io.emit("adminTrafficAlert", data);
  });

  // 4. rideOptimized
  socket.on("rideOptimized", (data) => {
    if (data?.rideId) {
      io.to(`ride_${data.rideId}`).emit("rideOptimized", data);
    }
  });

  // 5. switchRecommended
  socket.on("switchRecommended", (data) => {
    if (data?.rideId) {
      io.to(`ride_${data.rideId}`).emit("switchRecommended", data);
    }
  });

  // 6. switchAccepted
  socket.on("switchAccepted", (data) => {
    if (data?.sourceRideId || data?.rideId) {
      const rId = data.sourceRideId || data.rideId;
      io.to(`ride_${rId}`).emit("switchAccepted", data);
    }
    if (data?.targetRideId) {
      io.to(`ride_${data.targetRideId}`).emit("switchAccepted", data);
    }
  });

  // 7. switchRejected
  socket.on("switchRejected", (data) => {
    if (data?.rideId) {
      io.to(`ride_${data.rideId}`).emit("switchRejected", data);
    }
  });

  // 8. driverNotification
  socket.on("driverNotification", (data) => {
    if (data?.rideId) {
      io.to(`ride_${data.rideId}`).emit("driverNotification", data);
    }
  });

  // 9. rideConvertedToPrivate
  socket.on("rideConvertedToPrivate", (data) => {
    if (data?.rideId) {
      io.to(`ride_${data.rideId}`).emit("rideConvertedToPrivate", data);
    }
  });

  // 10. rideUpdated
  socket.on("rideUpdated", (data) => {
    if (data?.rideId) {
      io.to(`ride_${data.rideId}`).emit("rideUpdated", data);
    }
  });

  // 11. complaintSubmitted
  socket.on("complaintSubmitted", (data) => {
    if (data?.rideId) {
      io.to(`ride_${data.rideId}`).emit("complaintSubmitted", data);
    }
    io.emit("adminReportDiscomfort", data);
  });

  // 12. SOSActivated
  socket.on("SOSActivated", (data) => {
    if (data?.rideId) {
      io.to(`ride_${data.rideId}`).emit("SOSActivated", data);
    }
    io.emit("adminSosAlert", data);
  });

  // Legacy Compatibility Events
  socket.on("reportDiscomfort", (data) => {
    if (data?.rideId) {
      io.to(`ride_${data.rideId}`).emit("reportDiscomfort", data);
    }
    io.emit("adminReportDiscomfort", data);
  });

  socket.on("sosTriggered", (data) => {
    if (data?.rideId) {
      io.to(`ride_${data.rideId}`).emit("sosTriggered", data);
    }
    io.emit("adminSosAlert", data);
  });
});

// Periodic AI Multi-Passenger Ride Re-Optimization Background Loop (Every 15 seconds)
setInterval(() => {
  runRideOptimizationCycle(io).catch((err) => {
    console.warn("Background AI Optimization cycle warning:", err.message);
  });
}, 15000);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});