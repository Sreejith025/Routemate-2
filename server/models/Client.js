import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    clientId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "TAXI_COMPANY",
        "AUTO_ASSOCIATION",
        "TRAVEL_AGENCY",
        "CORPORATE_FLEET",
        "COLLEGE_TRANSPORT",
        "GOVERNMENT_TRANSPORT",
      ],
      default: "TAXI_COMPANY",
    },
    contactEmail: String,
    contactPhone: String,
    branding: {
      logoUrl: String,
      primaryColor: { type: String, default: "#4f46e5" },
      theme: { type: String, default: "dark" },
    },
    commissionRate: {
      type: Number,
      default: 15, // 15% platform commission
    },
    pricingRules: {
      baseFare: { type: Number, default: 50 },
      ratePerKm: { type: Number, default: 15 },
      ratePerMin: { type: Number, default: 2 },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Client", clientSchema);
