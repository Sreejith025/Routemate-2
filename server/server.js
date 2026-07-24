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
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/location", locationRoutes);

// Root Health Check Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "RouteMate Backend Running with Intelligent Taxi Switching 🚗💨",
    socketConnected: true,
  });
});

// Register Location Socket Handlers
registerLocationSocketHandlers(io);

// Additional Socket.IO Events
io.on("connection", (socket) => {
  // Join ride room
  socket.on("joinRide", (data) => {
    const rideId = typeof data === "object" ? data.rideId : data;
    if (rideId) {
      socket.join(`ride_${rideId}`);
    }
  });

  // Leave shared ride request
  socket.on("leaveSharedRide", (data) => {
    if (data?.rideId) {
      io.to(`ride_${data.rideId}`).emit("leaveSharedRide", data);
    }
  });

  // Find nearby taxi request
  socket.on("findNearbyTaxi", (data) => {
    if (data?.rideId) {
      io.to(`ride_${data.rideId}`).emit("findNearbyTaxi", data);
    }
  });

  // Switch suggestion event
  socket.on("switchSuggestion", (data) => {
    if (data?.rideId) {
      io.to(`ride_${data.rideId}`).emit("switchSuggestion", data);
    }
  });

  // Switch accepted event
  socket.on("switchAccepted", (data) => {
    if (data?.sourceRideId) {
      io.to(`ride_${data.sourceRideId}`).emit("switchAccepted", data);
    }
    if (data?.targetRideId) {
      io.to(`ride_${data.targetRideId}`).emit("switchAccepted", data);
    }
  });

  // Switch rejected event
  socket.on("switchRejected", (data) => {
    if (data?.rideId) {
      io.to(`ride_${data.rideId}`).emit("switchRejected", data);
    }
  });

  // Driver transfer notification event
  socket.on("driverTransferNotification", (data) => {
    if (data?.rideId) {
      io.to(`ride_${data.rideId}`).emit("driverTransferNotification", data);
    }
  });

  // Ride updated event
  socket.on("rideUpdated", (data) => {
    if (data?.rideId) {
      io.to(`ride_${data.rideId}`).emit("rideUpdated", data);
    }
  });

  // Legacy event handlers
  socket.on("driver_location_update", (data) => {
    socket.broadcast.emit("location_updated", data);
  });

  socket.on("trigger_taxi_switch", (data) => {
    io.emit("taxi_switch_suggested", data);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});