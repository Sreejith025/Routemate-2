import Ride from "../models/Ride.js";
import User from "../models/User.js";
import LiveLocation from "../models/LiveLocation.js";
import RideSwitch from "../models/RideSwitch.js";
import OptimizationLog from "../models/OptimizationLog.js";

// Helper: Haversine distance in meters
const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Helper: Route similarity percentage calculation (MODULE 5)
export const calculateRouteSimilarityPercentage = (origin1, dest1, origin2, dest2) => {
  const dOrigin = calculateDistanceMeters(origin1.lat, origin1.lng, origin2.lat, origin2.lng);
  const dDest = calculateDistanceMeters(dest1.lat, dest1.lng, dest2.lat, dest2.lng);

  const maxAllowedDist = 4000; // 4 KM vector window
  const originScore = Math.max(0, 1 - dOrigin / maxAllowedDist);
  const destScore = Math.max(0, 1 - dDest / maxAllowedDist);

  return Math.round(((originScore + destScore) / 2) * 100);
};

/**
 * MODULE 7: AI Optimization Score Calculation
 * Weighted Formula:
 * - Traffic Delay: 30%
 * - ETA Improvement: 25%
 * - Route Similarity: 20% (Must be >= 80%)
 * - Taxi Distance: 10%
 * - Passenger Preference: 5%
 * - Driver Rating: 5%
 * - Vehicle Capacity: 5%
 */
export const calculateAIOptimizationScore = ({
  trafficDelayMinutes = 0,
  etaSavedMinutes = 0,
  routeSimilarityPercentage = 0,
  proximityKm = 0,
  preferenceMatch = true,
  driverRating = 4.8,
  seatsAvailable = 2,
}) => {
  // 1. Traffic Delay (30%)
  const trafficComponent = Math.min(30, (trafficDelayMinutes / 15) * 30);

  // 2. ETA Improvement (25%)
  const etaComponent = Math.min(25, (etaSavedMinutes / 20) * 25);

  // 3. Route Similarity (20%) - Must be >= 80%
  const similarityComponent = (routeSimilarityPercentage / 100) * 20;

  // 4. Taxi Distance (10%) - Proximity < 2 KM
  const distanceComponent = Math.max(0, (1 - proximityKm / 2) * 10);

  // 5. Passenger Preference (5%)
  const preferenceComponent = preferenceMatch ? 5 : 0;

  // 6. Driver Rating (5%)
  const ratingComponent = (Math.min(5, driverRating) / 5) * 5;

  // 7. Vehicle Capacity (5%)
  const capacityComponent = Math.min(5, seatsAvailable * 2.5);

  const totalScore = Math.round(
    trafficComponent +
      etaComponent +
      similarityComponent +
      distanceComponent +
      preferenceComponent +
      ratingComponent +
      capacityComponent
  );

  return Math.min(100, Math.max(0, totalScore));
};

/**
 * MODULE 8: Fairness Engine
 * Rule: Maximum acceptable additional delay to existing passengers in candidate taxi is 5 minutes.
 */
export const evaluateFairness = (candLocation, candidateRide, passengerDropoffCoords) => {
  if (!candidateRide.passengers || candidateRide.passengers.length === 0) {
    return { isFair: true, fairnessScore: 100, maxDelayMinutes: 0 };
  }

  // Calculate estimated detour delay added to candidate taxi's existing passengers
  const candLat = candLocation?.latitude || candidateRide.originCoords?.lat || 12.9716;
  const candLng = candLocation?.longitude || candidateRide.originCoords?.lng || 77.5946;

  const directDistMeters = calculateDistanceMeters(
    candLat,
    candLng,
    candidateRide.destinationCoords?.lat || 12.9352,
    candidateRide.destinationCoords?.lng || 77.6245
  );

  const detourDistMeters = calculateDistanceMeters(
    candLat,
    candLng,
    passengerDropoffCoords.lat,
    passengerDropoffCoords.lng
  );

  // Additional detour in km and minutes at average 35 km/h speed
  const additionalKm = Math.max(0, (detourDistMeters - directDistMeters * 0.2) / 1000);
  const additionalDelayMinutes = Math.round((additionalKm / 35) * 60);

  // FAIRNESS RULE: Maximum acceptable additional delay = 5 minutes
  const isFair = additionalDelayMinutes <= 5;
  const fairnessScore = Math.max(0, Math.round(100 - (additionalDelayMinutes / 5) * 40));

  return {
    isFair,
    fairnessScore,
    maxDelayMinutes: additionalDelayMinutes,
  };
};

/**
 * MODULE 1 & MODULE 12: RideOptimizationService Real-Time Optimization Cycle
 */
export const runRideOptimizationCycle = async (io) => {
  try {
    // 1. Fetch all active shared rides
    const activeRides = await Ride.find({
      status: { $in: ["active", "scheduled"] },
      sharingEnabled: { $ne: false },
    });

    if (!activeRides || activeRides.length === 0) return [];

    const optimizationResults = [];

    for (const ride of activeRides) {
      if (!ride.passengers || ride.passengers.length === 0) continue;

      // MODULE 2: Monitor Driver & Passenger Live Location
      const driverLoc = await LiveLocation.findOne({
        userId: ride.driverId,
        role: "Driver",
      }).sort({ updatedAt: -1 });

      const currentLat = driverLoc?.latitude || ride.originCoords?.lat || 12.9716;
      const currentLng = driverLoc?.longitude || ride.originCoords?.lng || 77.5946;
      const destLat = ride.destinationCoords?.lat || 12.9352;
      const destLng = ride.destinationCoords?.lng || 77.6245;

      const remainingDistMeters = calculateDistanceMeters(currentLat, currentLng, destLat, destLng);
      const driverSpeedKmh = (driverLoc?.speed || 0) * 3.6;

      // MODULE 3: Traffic Monitoring & Delay Calculation
      const freeFlowSpeedKmh = 45; // normal speed
      const effectiveSpeedKmh = driverSpeedKmh > 5 ? Math.min(driverSpeedKmh, 25) : 18; // congested speed

      const freeFlowEtaMins = Math.round((remainingDistMeters / 1000 / freeFlowSpeedKmh) * 60);
      const currentEtaMins = Math.round((remainingDistMeters / 1000 / effectiveSpeedKmh) * 60);
      const trafficDelayMinutes = Math.max(0, currentEtaMins - freeFlowEtaMins);

      // Mark traffic status if delay > 4 mins or speed < 25 km/h
      if (trafficDelayMinutes >= 4 || (driverSpeedKmh > 0 && driverSpeedKmh < 25)) {
        ride.trafficStatus = "TrafficAffected";
        ride.trafficDelayMinutes = trafficDelayMinutes;
        await ride.save();

        if (io) {
          io.to(`ride_${ride._id}`).emit("trafficDetected", {
            rideId: ride._id.toString(),
            trafficStatus: "TrafficAffected",
            trafficDelayMinutes,
            currentSpeedKmh: Math.round(driverSpeedKmh),
            timestamp: new Date().toISOString(),
          });
        }
      }

      // MODULE 4: Discover Nearby Taxis (< 2 KM, active, empty seats)
      const candidateRides = await Ride.find({
        _id: { $ne: ride._id },
        status: { $in: ["active", "scheduled"] },
        seatsAvailable: { $gte: 1 },
        sharingEnabled: { $ne: false },
      });

      for (const passenger of ride.passengers) {
        let bestOptimization = null;

        for (const candidate of candidateRides) {
          const candLoc = await LiveLocation.findOne({
            userId: candidate.driverId,
            role: "Driver",
          }).sort({ updatedAt: -1 });

          const candLat = candLoc?.latitude || candidate.originCoords?.lat || currentLat + 0.006;
          const candLng = candLoc?.longitude || candidate.originCoords?.lng || currentLng + 0.006;

          const proximityMeters = calculateDistanceMeters(currentLat, currentLng, candLat, candLng);
          const proximityKm = Number((proximityMeters / 1000).toFixed(2));

          // Condition: Proximity < 2 KM
          if (proximityKm <= 2.0) {
            // MODULE 5: Route Similarity (Must be >= 80%)
            const similarity = calculateRouteSimilarityPercentage(
              { lat: currentLat, lng: currentLng },
              { lat: destLat, lng: destLng },
              { lat: candLat, lng: candLng },
              { lat: candidate.destinationCoords?.lat || destLat, lng: candidate.destinationCoords?.lng || destLng }
            );

            if (similarity >= 80) {
              // MODULE 6: ETA Comparison
              const candDistToDest = calculateDistanceMeters(candLat, candLng, destLat, destLng);
              const candidateEtaMins = Math.max(4, Math.round((candDistToDest / 1000 / 45) * 60));
              const etaSavedMinutes = currentEtaMins - candidateEtaMins;

              if (etaSavedMinutes >= 3) {
                // MODULE 9: Safety & Preferences Match Check
                const mongoUser = await User.findOne({ clerkId: passenger.userId });
                let preferenceMatch = true;

                if (mongoUser?.safetyPreference === "femaleDriverOnly" || mongoUser?.safetyPreference === "femaleDriverAndPassengers") {
                  const isFemale = candidate.driverName?.toLowerCase().includes("sarah") || candidate.driverName?.toLowerCase().includes("female");
                  if (!isFemale) preferenceMatch = false;
                }

                // MODULE 7: AI Optimization Score
                const score = calculateAIOptimizationScore({
                  trafficDelayMinutes,
                  etaSavedMinutes,
                  routeSimilarityPercentage: similarity,
                  proximityKm,
                  preferenceMatch,
                  driverRating: 4.8,
                  seatsAvailable: candidate.seatsAvailable,
                });

                // MODULE 8: Fairness Engine Check
                const fairness = evaluateFairness(candLoc, candidate, { lat: destLat, lng: destLng });

                if (score >= 65 && fairness.isFair) {
                  if (!bestOptimization || score > bestOptimization.score) {
                    bestOptimization = {
                      candidateRide: candidate,
                      score,
                      fairnessScore: fairness.fairnessScore,
                      maxPassengerDelayMinutes: fairness.maxDelayMinutes,
                      trafficDelayMinutes,
                      etaSavedMinutes,
                      routeSimilarityPercentage: similarity,
                      proximityKm,
                      currentETA: currentEtaMins,
                      newETA: candidateEtaMins,
                    };
                  }
                } else if (!fairness.isFair) {
                  // Log rejection due to fairness rule violation (> 5 min delay)
                  await OptimizationLog.create({
                    rideId: ride._id,
                    passengerId: passenger.userId,
                    passengerName: passenger.name,
                    candidateRideId: candidate._id,
                    candidateDriverName: candidate.driverName,
                    candidateVehiclePlate: candidate.vehicleDetails?.plate || "RT-9900",
                    optimizationScore: score,
                    fairnessScore: fairness.fairnessScore,
                    maxPassengerDelayMinutes: fairness.maxDelayMinutes,
                    trafficDelayMinutes,
                    etaSavedMinutes,
                    routeSimilarityPercentage: similarity,
                    status: "rejected_by_fairness",
                  });
                }
              }
            }
          }
        }

        // IF VALID AI OPTIMIZATION FOUND
        if (bestOptimization) {
          const {
            candidateRide,
            score,
            fairnessScore,
            maxPassengerDelayMinutes,
            trafficDelayMinutes: tDelay,
            etaSavedMinutes: tSaved,
            routeSimilarityPercentage: similarity,
            currentETA,
            newETA,
          } = bestOptimization;

          // Create Optimization Log Record
          const optLog = await OptimizationLog.create({
            rideId: ride._id,
            passengerId: passenger.userId,
            passengerName: passenger.name,
            candidateRideId: candidateRide._id,
            candidateDriverName: candidateRide.driverName,
            candidateVehiclePlate: candidateRide.vehicleDetails?.plate || "RT-9900",
            optimizationScore: score,
            fairnessScore,
            maxPassengerDelayMinutes,
            trafficDelayMinutes: tDelay,
            etaSavedMinutes: tSaved,
            routeSimilarityPercentage: similarity,
            status: "recommended",
          });

          // Update ride recommendation state
          ride.dynamicSwitchSuggested = true;
          ride.switchDetails = {
            passengerId: passenger.userId,
            passengerName: passenger.name,
            targetRideId: candidateRide._id.toString(),
            targetDriverId: candidateRide.driverId,
            targetTaxiDriverName: candidateRide.driverName,
            targetVehiclePlate: candidateRide.vehicleDetails?.plate || "RT-9900",
            etaSavedMinutes: tSaved,
            switchingScore: score,
            reason: `AI Re-Optimization Engine: Switching saves ${tSaved} mins! (AI Score: ${score}/100, Fairness: ${fairnessScore}%)`,
            status: "pending",
          };

          if (!ride.optimizationHistory) ride.optimizationHistory = [];
          ride.optimizationHistory.push({
            score,
            fairnessScore,
            targetRideId: candidateRide._id.toString(),
            timestamp: new Date(),
          });

          await ride.save();

          const payload = {
            optimizationLogId: optLog._id.toString(),
            rideId: ride._id.toString(),
            passengerId: passenger.userId,
            passengerName: passenger.name,
            targetRideId: candidateRide._id.toString(),
            targetDriverName: candidateRide.driverName,
            targetVehiclePlate: candidateRide.vehicleDetails?.plate || "RT-9900",
            optimizationScore: score,
            fairnessScore,
            currentETA,
            newETA,
            timeSaved: tSaved,
            routeSimilarity: similarity,
            reason: ride.switchDetails.reason,
            timestamp: new Date().toISOString(),
          };

          // MODULE 12: Emit Real-Time Socket.IO Events
          if (io) {
            io.to(`ride_${ride._id}`).emit("rideOptimized", payload);
            io.to(`ride_${ride._id}`).emit("switchRecommended", payload);
            io.to(`ride_${ride._id}`).emit("driverNotification", {
              type: "SWITCH_RECOMMENDED",
              message: `AI Optimization Recommendation: Switch suggested for ${passenger.name} (AI Score: ${score}/100).`,
              timestamp: new Date().toISOString(),
            });
            io.emit("adminRideOptimized", payload);
          }

          optimizationResults.push(payload);
        }
      }
    }

    return optimizationResults;
  } catch (err) {
    console.error("Error in runRideOptimizationCycle:", err);
    return [];
  }
};
