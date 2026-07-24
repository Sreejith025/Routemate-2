import api from "./api";

/**
 * Update current user's live location on backend MongoDB
 * @param {Object} locationData { rideId, role, latitude, longitude, speed, heading, accuracy }
 */
export const updateLocationApi = (locationData) => {
  return api.post("/location/update", locationData);
};

/**
 * Fetch latest live locations for all participants in a ride
 * @param {string} rideId 
 */
export const getRideLocationsApi = (rideId) => {
  return api.get(`/location/${rideId}`);
};

/**
 * Fetch latest live location for a specific driver
 * @param {string} driverId 
 */
export const getDriverLocationApi = (driverId) => {
  return api.get(`/location/driver/${driverId}`);
};
