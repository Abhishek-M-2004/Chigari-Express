/* =========================
   IMPORTS
========================= */
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");
const http = require("http");
const { Server } = require("socket.io");
const crypto = require("crypto");

const User = require("./user");
const Ticket = require("./ticket");
const { sendTicketEmail, sendPasswordResetEmail } = require("./emailService");

/* =========================
   APP + SERVER + SOCKET
========================= */
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());

/* =========================
   DATABASE CONNECTION
========================= */
mongoose
  .connect("mongodb://127.0.0.1:27017/chigiri_booking_v2")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error(err));

/* =========================
   PREDEFINED STOPS
========================= */
const STOPS = {
  Navanagar: { distance: 0, lat: 15.8497, lng: 74.4977 },
  Keshwapur: { distance: 2, lat: 15.8575, lng: 74.5129 },
  CBT: { distance: 4, lat: 15.8612, lng: 74.5083 },
  Unkal: { distance: 6, lat: 15.8675, lng: 74.5189 },
  Vidyanagar: { distance: 8, lat: 15.8731, lng: 74.5256 },
  "Gokul Road": { distance: 10, lat: 15.8814, lng: 74.5311 },
  "Airport Road": { distance: 12, lat: 15.89, lng: 74.54 }
};

/* =========================
   ADMIN CREDENTIALS
========================= */
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin";

/* =========================
   LIVE BUS SIMULATION
   (ORIGINAL LOGIC – INTEGRATED)
========================= */

// Hubballi and Dharwad approximate coordinates
const HUBBALLI = { lat: 15.3647, lng: 75.1240 };
const DHARWAD = { lat: 15.4589, lng: 75.0078 };

// Create 10 dummy buses
let buses = [];
for (let i = 1; i <= 10; i++) {
  buses.push({
    id: "BRTS-" + i,
    lat: HUBBALLI.lat + Math.random() * (DHARWAD.lat - HUBBALLI.lat),
    lng: HUBBALLI.lng + Math.random() * (DHARWAD.lng - HUBBALLI.lng),
    direction: Math.random() > 0.5 ? 1 : -1
  });
}

// Update bus positions every 1 second
setInterval(() => {
  buses.forEach(bus => {
    const speed = 0.0005;

    bus.lat += speed * bus.direction * (DHARWAD.lat - HUBBALLI.lat) * 5;
    bus.lng += speed * bus.direction * (DHARWAD.lng - HUBBALLI.lng) * 5;

    // Reverse direction at bounds
    if (bus.lat > DHARWAD.lat || bus.lat < HUBBALLI.lat) {
      bus.direction *= -1;
    }
  });

  // Emit to ALL connected clients
  io.emit("busUpdate", buses);
}, 1000);

/* =========================
   SOCKET.IO CONNECTION
========================= */
io.on("connection", socket => {
  console.log("🚌 Client connected:", socket.id);

  // Send current bus positions immediately
  socket.emit("busUpdate", buses);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

/* =========================
   UTILITY FUNCTIONS
========================= */
function calculateDistance(from, to) {
  if (!STOPS[from] || !STOPS[to]) return null;
  return Math.abs(STOPS[to].distance - STOPS[from].distance);
}

function calculateFare(from, to) {
  const distance = calculateDistance(from, to);
  if (distance === null) return null;
  return { distance, fare: Math.max(distance * 5, 10) };
}

function calculateGeoDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Generate 4-digit OTP
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Generate reset token
function generateResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

/* =========================
   ROUTES - EXISTING
========================= */

// Stops
app.get("/api/stops", (req, res) => {
  res.json(Object.keys(STOPS));
});

// Register
app.post("/api/register", async (req, res) => {
  try {
    await new User(req.body).save();
    res.json({ message: "User registered" });
  } catch {
    res.status(500).json({ message: "Registration failed" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  const user = await User.findOne(req.body);
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  res.json(user);
});

// Delete Account
app.delete("/api/delete-account/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { password } = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify password
    if (user.password !== password) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    // Delete user's tickets
    await Ticket.deleteMany({ userId: userId });

    // Delete user account
    await User.findByIdAndDelete(userId);

    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("Delete account error:", err);
    res.status(500).json({ message: "Failed to delete account" });
  }
});

// Create Ticket (UPDATED with OTP)
app.post("/api/create-ticket", async (req, res) => {
  try {
    const { userId, from, to } = req.body;
    if (from === to)
      return res.status(400).json({ message: "Source and destination same" });

    const fareData = calculateFare(from, to);
    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const ticketId = uuidv4();
    const validTill = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const otp = generateOTP(); // Generate 4-digit OTP

    const ticket = await new Ticket({
      userId,
      from,
      to,
      distance: fareData.distance,
      amount: fareData.fare,
      ticketId,
      status: "active",
      validTill,
      otp, // Save OTP
      allowedSourceLocation: { ...STOPS[from], radius: 200 },
      allowedDestinationLocation: { ...STOPS[to], radius: 200 }
    }).save();

    const qrCodeDataURL = await QRCode.toDataURL(
      JSON.stringify({ ticketId, from, to, validTill }),
      { width: 180 }
    );

    await sendTicketEmail(
      user.email,
      { ...ticket._doc, qrCodeDataURL, otp },
      user.name
    );

    res.json({
      message: "Ticket booked",
      ticket: {
        ...ticket._doc,
        qrCodeDataURL
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ticket booking failed" });
  }
});

// Validate Ticket
app.post("/api/validate-ticket", async (req, res) => {
  try {
    const { ticketId, currentLat, currentLng, scanType } = req.body;
    const ticket = await Ticket.findOne({ ticketId });
    if (!ticket) return res.json({ valid: false, message: "Invalid ticket" });

    const loc =
      scanType === "entry"
        ? ticket.allowedSourceLocation
        : ticket.allowedDestinationLocation;

    const dist = calculateGeoDistance(
      currentLat,
      currentLng,
      loc.lat,
      loc.lng
    );

    if (dist > loc.radius)
      return res.json({ valid: false, message: "Out of station range" });

    if (scanType === "exit") ticket.status = "used";
    await ticket.save();

    res.json({ valid: true, message: "Ticket validated" });
  } catch {
    res.status(500).json({ valid: false, message: "Server error" });
  }
});

/* =========================
   NEW ROUTES - TICKET HISTORY
========================= */
app.get("/api/tickets/:userId", async (req, res) => {
  try {
    const tickets = await Ticket.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .lean();

    // Update expired tickets
    const now = new Date();
    tickets.forEach(ticket => {
      if (ticket.status === "active" && new Date(ticket.validTill) < now) {
        ticket.status = "expired";
      }
    });

    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch tickets" });
  }
});

/* =========================
   NEW ROUTES - PASSWORD RESET
========================= */
app.post("/api/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = generateResetToken();
    user.resetToken = resetToken;
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    await sendPasswordResetEmail(email, resetToken, user.name);

    res.json({ message: "Password reset email sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send reset email" });
  }
});

app.post("/api/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ message: "Failed to reset password" });
  }
});

/* =========================
   NEW ROUTES - ADMIN
========================= */
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    res.json({
      success: true,
      message: "Admin authenticated",
      admin: { username: ADMIN_USERNAME }
    });
  } else {
    res.status(401).json({ success: false, message: "Invalid admin credentials" });
  }
});

// Admin Stats / Usage Reports
app.get("/api/admin/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTickets = await Ticket.countDocuments();
    const activeTickets = await Ticket.countDocuments({ status: "active" });
    const usedTickets = await Ticket.countDocuments({ status: "used" });
    const expiredTickets = await Ticket.countDocuments({ status: "expired" });

    // Revenue
    const revenueResult = await Ticket.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Daily bookings (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dailyBookings = await Ticket.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          revenue: { $sum: "$amount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Recent tickets
    const recentTickets = await Ticket.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("userId", "name email")
      .lean();

    res.json({
      totalUsers,
      totalTickets,
      activeTickets,
      usedTickets,
      expiredTickets,
      totalRevenue,
      dailyBookings,
      recentTickets
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

// OTP Verification for Gate
app.post("/api/admin/verify-otp", async (req, res) => {
  try {
    const { otp } = req.body;

    const ticket = await Ticket.findOne({
      otp,
      status: "active",
      otpVerified: false
    }).populate("userId", "name email");

    if (!ticket) {
      return res.json({
        valid: false,
        message: "Invalid OTP or ticket already used",
        gateStatus: "CLOSED"
      });
    }

    // Check if ticket is expired
    if (new Date(ticket.validTill) < new Date()) {
      return res.json({
        valid: false,
        message: "Ticket has expired",
        gateStatus: "CLOSED"
      });
    }

    // Mark as verified
    ticket.otpVerified = true;
    ticket.status = "used";
    await ticket.save();

    res.json({
      valid: true,
      message: "OTP Verified Successfully!",
      gateStatus: "OPEN",
      ticket: {
        from: ticket.from,
        to: ticket.to,
        passenger: ticket.userId?.name || "Unknown",
        amount: ticket.amount
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ valid: false, message: "Server error", gateStatus: "CLOSED" });
  }
});

// QR Code Verification for Gate
app.post("/api/admin/verify-qr", async (req, res) => {
  try {
    const { ticketId } = req.body;

    const ticket = await Ticket.findOne({
      ticketId,
      status: "active",
      otpVerified: false
    }).populate("userId", "name email");

    if (!ticket) {
      return res.json({
        valid: false,
        message: "Invalid QR or ticket already used",
        gateStatus: "CLOSED"
      });
    }

    // Check if ticket is expired
    if (new Date(ticket.validTill) < new Date()) {
      return res.json({
        valid: false,
        message: "Ticket has expired",
        gateStatus: "CLOSED"
      });
    }

    // Mark as verified
    ticket.otpVerified = true;
    ticket.status = "used";
    await ticket.save();

    res.json({
      valid: true,
      message: "QR Verified Successfully!",
      gateStatus: "OPEN",
      ticket: {
        from: ticket.from,
        to: ticket.to,
        passenger: ticket.userId?.name || "Unknown",
        amount: ticket.amount,
        otp: ticket.otp
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ valid: false, message: "Server error", gateStatus: "CLOSED" });
  }
});

/* =========================
   SERVER START
========================= */
server.listen(5000, () => {
  console.log("🚀 Chigari Express Backend running on port 5000");
  console.log("📡 Live Bus Tracking Enabled (Socket.IO)");
});
