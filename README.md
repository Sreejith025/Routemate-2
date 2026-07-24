# 🚖 RouteMate
### Dynamic Ride Sharing with Intelligent Taxi Switching

![Status](https://img.shields.io/badge/Status-Development-blue)
![Platform](https://img.shields.io/badge/Platform-Web-green)
![Hackathon](https://img.shields.io/badge/Hackathon-RUSH%20HOUR%202026-orange)

---

# 📌 Overview

RouteMate is a next-generation ride-sharing platform designed to optimize urban transportation by intelligently matching passengers with nearby drivers while introducing a unique **Dynamic Taxi Switching** feature.

Unlike traditional ride-sharing applications where passengers remain assigned to a single vehicle throughout the journey, RouteMate continuously analyzes traffic conditions, route congestion, and nearby taxis to determine whether switching a passenger to another taxi would reduce travel time without affecting existing passengers.

Our objective is to make shared transportation faster, smarter, and more efficient while reducing congestion and improving passenger experience.

---

# ❗ Problem Statement

Existing ride-sharing platforms assign passengers to one taxi after booking.

During the journey:

- Heavy traffic may occur.
- Roads may be blocked.
- Accidents can increase travel time.
- New ride requests may appear.
- Passengers cannot switch to a better nearby taxi.

As a result:

• Increased travel time

• Higher fuel consumption

• Poor passenger satisfaction

• Inefficient ride allocation

---

# 💡 Our Solution

RouteMate introduces **Dynamic Taxi Switching**.

Whenever a taxi is carrying multiple passengers, the system continuously monitors:

- Live Traffic
- Road Closures
- ETA
- Nearby RouteMate Drivers
- Vehicle Capacity
- Passenger Destinations

If another nearby RouteMate taxi can deliver one passenger significantly faster without delaying other passengers, the application recommends switching taxis.

Example:

Taxi A  
Passenger 1 → Airport  
Passenger 2 → Railway Station  

Heavy traffic appears on Taxi A's route.

Taxi B is only 300 meters away and is already heading towards the Railway Station.

Passenger 2 receives a notification:

"Another nearby RouteMate taxi can reduce your travel time by 15 minutes."

Passenger 2 accepts.

Taxi B picks up Passenger 2.

Passenger 1 reaches the Airport on time.

Passenger 2 reaches the Railway Station much earlier.

Everyone benefits.

---

# 🎯 Objectives

• Reduce passenger travel time

• Optimize ride sharing

• Increase taxi utilization

• Reduce fuel consumption

• Improve commuter experience

• Build smarter urban mobility

---

# 🚀 Key Features

## Authentication

- Clerk Authentication
- Secure Login
- Secure Signup
- Protected Routes
- User Profiles

---

## Passenger Features

- Find Nearby Drivers
- Book Shared Ride
- Live Ride Tracking
- Ride History
- Profile Management
- Taxi Switching Request

---

## Driver Features

- Accept Ride Requests
- Reject Ride Requests
- Start Ride
- End Ride
- Manage Availability
- Live Navigation

---

## Dynamic Taxi Switching

Our flagship feature.

The system automatically checks:

- Traffic Density
- ETA
- Nearby Drivers
- Passenger Priority
- Driver Route

If switching saves significant travel time without affecting other passengers, RouteMate recommends switching.

---

## Real-Time Features

- Socket.IO
- Live Location
- Instant Ride Updates
- Driver Availability
- Ride Status

---

## Maps

- OpenStreetMap
- Leaflet
- Live Location
- Route Visualization

---

## Admin Dashboard

- User Management
- Driver Management
- Ride Monitoring
- Analytics Dashboard

---

# 🏗 System Architecture

Passenger

↓

React Frontend

↓

Clerk Authentication

↓

Express API

↓

MongoDB Atlas

↓

Socket.IO

↓

Ride Matching Engine

↓

Dynamic Taxi Switching Engine

↓

Driver Application

---

# 🛠 Tech Stack

## Frontend

- React.js
- Vite
- Tailwind CSS
- React Router
- Axios
- React Leaflet

## Backend

- Node.js
- Express.js
- Socket.IO

## Database

- MongoDB Atlas

## Authentication

- Clerk

## Maps

- OpenStreetMap
- Leaflet

## Version Control

- Git
- GitHub

---

# 📂 Folder Structure

```
RouteMate/
├── client/
│   ├── components/
│   ├── pages/
│   ├── layouts/
│   ├── services/
│   ├── hooks/
│   └── context/
├── server/
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── utils/
└── README.md
```

---

# 🔄 Application Workflow

1. User creates account using Clerk.

2. User logs in.

3. Passenger enters destination.

4. Nearby drivers appear.

5. Passenger sends ride request.

6. Driver accepts request.

7. Additional passengers can join the ride.

8. System continuously monitors:

- Traffic
- ETA
- Nearby taxis

9. If another taxi offers a significantly better route for a passenger, RouteMate suggests a taxi switch.

10. Passenger accepts or declines.

11. Ride continues.

12. Trip completes.

---

# 📊 Expected Impact

✅ Reduced travel time

✅ Reduced traffic congestion

✅ Better taxi utilization

✅ Lower carbon emissions

✅ Improved passenger satisfaction

---

# 🚀 Future Enhancements

- AI Route Optimization
- Smart Fare Splitting
- Carbon Emission Tracker
- Women-Only Ride Mode
- Emergency SOS
- Voice Assistant
- In-App Chat
- Digital Wallet
- Ride Scheduling
- Driver Ratings

---


# 🌟 Why RouteMate?

Unlike existing ride-sharing platforms, RouteMate doesn't stop optimizing once a ride begins.

It continuously analyzes live traffic, nearby vehicles, and passenger destinations to intelligently recommend taxi switching whenever it improves travel efficiency.

This creates a smarter, more adaptive ride-sharing ecosystem that benefits passengers, drivers, and cities alike.

---

# 📜 License

MIT License

---

## 🚀 Built for RUSH HOUR 2026 Hackathon

**"Smarter Routes. Faster Rides. Better Cities."**
