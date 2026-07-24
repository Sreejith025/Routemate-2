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
app.use("/api/rides", rideRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Root Health Check Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "RouteMate Backend Running with Intelligent Taxi Switching 🚗💨",
    socketConnected: true,
  });
});

// Socket.IO Real-time Events
io.on("connection", (socket) => {
  console.log(`⚡ Socket client connected: ${socket.id}`);

  // Broadcast driver live location update
  socket.on("driver_location_update", (data) => {
    socket.broadcast.emit("location_updated", data);
  });

  // Broadcast dynamic taxi switch recommendation trigger
  socket.on("trigger_taxi_switch", (data) => {
    io.emit("taxi_switch_suggested", data);
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Socket client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});