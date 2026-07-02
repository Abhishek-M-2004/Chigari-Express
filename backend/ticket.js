const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  ticketId: {
    type: String,
    required: true,
    unique: true
  },
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  distance: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["active", "used", "expired"],
    default: "active"
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  validTill: {
    type: Date,
    required: true
  },
  // Tracking for geolocation validation
  scannedAtSource: {
    type: Boolean,
    default: false
  },
  scannedAtDestination: {
    type: Boolean,
    default: false
  },
  sourceScanTime: Date,
  destinationScanTime: Date,
  // Geolocation data
  allowedSourceLocation: {
    lat: Number,
    lng: Number,
    radius: { type: Number, default: 200 }
  },
  allowedDestinationLocation: {
    lat: Number,
    lng: Number,
    radius: { type: Number, default: 200 }
  },
  // OTP for gate verification
  otp: {
    type: String,
    required: true
  },
  otpVerified: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model("Ticket", ticketSchema);