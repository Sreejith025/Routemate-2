import Client from "../models/Client.js";
import Ride from "../models/Ride.js";
import User from "../models/User.js";

/**
 * FEATURE 6: Multi-Tenant Client Platform APIs
 */
export const getClients = async (req, res) => {
  try {
    const clients = await Client.find({ isActive: true }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: clients.length, clients });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createClient = async (req, res) => {
  try {
    const { name, type, contactEmail, contactPhone, commissionRate, pricingRules } = req.body;
    const clientId = `CLIENT_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;

    const newClient = new Client({
      clientId,
      name: name || "RouteMate Organization",
      type: type || "TAXI_COMPANY",
      contactEmail: contactEmail || "org@routemate.com",
      contactPhone: contactPhone || "+1234567890",
      commissionRate: commissionRate || 15,
      pricingRules: pricingRules || { baseFare: 50, ratePerKm: 15, ratePerMin: 2 },
    });

    await newClient.save();
    return res.status(201).json({ success: true, client: newClient });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getClientAnalytics = async (req, res) => {
  try {
    const { id } = req.params; // clientId
    const rides = await Ride.find({ clientId: id });
    const drivers = await User.find({ clientId: id, role: "Driver" });
    const passengers = await User.find({ clientId: id, role: "Passenger" });

    const totalRevenue = rides.reduce((acc, r) => acc + (r.pricePerSeat || 100), 0);
    const completedRidesCount = rides.filter((r) => r.status === "completed").length;

    return res.status(200).json({
      success: true,
      clientId: id,
      totalDrivers: drivers.length,
      totalPassengers: passengers.length,
      totalRides: rides.length,
      completedRides: completedRidesCount,
      totalRevenue,
      commissionEarned: Math.round(totalRevenue * 0.15),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
