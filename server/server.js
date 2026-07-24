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
import { updatePreferences } from "./controllers/userController.js";
import { requireAuthUser } from "./middleware/authMiddleware.js";

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
app.put("/api/user/preferences", requireAuthUser, updatePreferences); // PUT /api/user/preferences spec compatibility
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

// Socket.IO Real-time Events (Part 8)
io.on("connection", (socket) => {
  console.log(`⚡ Socket client connected: ${socket.id}`);

  // 1. Passenger / Driver joins a ride room
  socket.on("joinRide", (data) => {
    const room = `ride_${data?.rideId || "default"}`;
    socket.join(room);
    console.log(`Socket ${socket.id} joined room ${room}`);
  });

  // 2. Passenger requests to Leave Shared Ride
  socket.on("leaveSharedRide", (data) => {
    console.log(`Passenger ${data?.passengerName} requested to leave shared ride: ${data?.rideId}`);
    io.emit("driverTransferNotification", {
      type: "transfer_requested",
      message: `Passenger ${data?.passengerName || "A passenger"} requested a ride transfer to another taxi.`,
      rideId: data?.rideId,
      transferPoint: data?.transferPoint,
    });
  });

  // 3. Find nearby taxi query broadcast
  socket.on("findNearbyTaxi", (data) => {
    socket.broadcast.emit("nearbyTaxiSearchTriggered", data);
  });

  // 4. Switch suggestion broadcast to passenger
  socket.on("switchSuggestion", (data) => {
    io.emit("switchSuggestion", data);
  });

  // 5. Passenger accepts switch
  socket.on("switchAccepted", (data) => {
    io.emit("switchAccepted", data);
    io.emit("driverTransferNotification", {
      type: "transfer_accepted",
      message: "Passenger transfer confirmed! Proceed to rendezvous transfer point.",
      rideId: data?.rideId,
      transferPoint: data?.transferPoint,
    });
    io.emit("rideUpdated", { rideId: data?.rideId, status: "updated" });
  });

  // 6. Passenger rejects switch
  socket.on("switchRejected", (data) => {
    io.emit("switchRejected", data);
  });

  // 7. Broadcast driver live location update
  socket.on("driver_location_update", (data) => {
    socket.broadcast.emit("location_updated", data);
  });

  // 8. Legacy trigger fallback
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