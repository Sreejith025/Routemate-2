import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { clerkMiddleware } from "@clerk/express";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Enable Clerk authentication middleware globally
app.use(clerkMiddleware());

// API Routes
app.use("/api/users", userRoutes);

// Root Health Check Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "RouteMate Backend Running 🚗",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});