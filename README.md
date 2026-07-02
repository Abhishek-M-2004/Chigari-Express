# 🚍 Chigari Express

Chigari Express is a full-stack MERN (MongoDB, Express, React, Node.js) application designed for smart city bus ticket booking. It features real-time live bus tracking, secure ticket booking with OTP verification, QR-code based ticket scanning, and an admin dashboard.

## 🌟 Features

*   **Real-time Bus Tracking:** Live simulation of buses running on predefined routes using Socket.io and Leaflet maps.
*   **Secure Ticket Booking:** Calculate distance and fares dynamically based on source and destination. 
*   **Email Confirmations:** Users receive beautiful HTML emails with their ticket details, QR codes, and entry OTPs.
*   **QR Code Integration:** Tickets generate dynamic QR codes for easy gate check-ins.
*   **Admin Dashboard:** Dedicated admin panel to view usage stats, revenue, recent tickets, and to verify user OTPs and QR codes at the gate.
*   **Authentication:** User registration, login, and secure password reset links via email.

## 🛠️ Technology Stack

*   **Frontend:** React (Vite), Socket.io-client, Leaflet (Interactive Maps), HTML5-QRCode.
*   **Backend:** Node.js, Express, Socket.io, MongoDB (Mongoose), Nodemailer (Emails), QRCode.

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites

*   [Node.js](https://nodejs.org/) installed
*   [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally on default port `27017`

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install the backend dependencies:
   ```bash
   npm install
   ```
3. Set up the environment variables:
   * Rename `.env.example` to `.env`.
   * Open the `.env` file and enter your email credentials (use a Google App Password if using Gmail).
   ```env
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_16_character_app_password
   ```
4. Start the backend server:
   ```bash
   npm start
   ```
   *The server will run on port `5000`.*

### 2. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The application will open in your browser at `http://localhost:5173`.*

## 🔐 Default Admin Credentials

To access the Admin Dashboard for scanning tickets and viewing analytics, use the following default credentials (can be changed in `backend/server.js`):

*   **Username:** `admin`
*   **Password:** `admin`

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.
