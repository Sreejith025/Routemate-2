import mongoose from "mongoose";

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/routemate";
  
  try {
    console.log(`Attempting to connect to MongoDB at: ${mongoUri.replace(/:[^:@]+@/, ":****@")}`);
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Failed: ${error.message}`);
    console.log("ℹ️  To connect to MongoDB:");
    console.log("    1. If using local MongoDB: ensure 'mongod' or MongoDB Service is running.");
    console.log("    2. If using MongoDB Atlas: set MONGO_URI in server/.env to your Atlas connection string:");
    console.log("       MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/routemate");
  }
};

export default connectDB;
