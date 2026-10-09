# AzureReserve — Hotel Booking Platform (Frontend)

> **TS Academy Capstone Project #7 — Hotel Booking App**  
> Built with React 19, Tailwind CSS v4, React Router v7, and LiteAPI Sandbox Integration.

---

## 🚀 Overview

AzureReserve is a modern, responsive, and secure hotel booking web application. It connects directly with travel inventory providers (LiteAPI), implements real-time room availability and rate locking, and handles sandbox credit card payments with instant voucher generation.

This repository represents the **Frontend Client** built by the frontend engineering team (Phoenix) to integrate seamlessly with the **Node.js/Express REST API** built by the backend team (Hajime).

---

## 🛠️ Tech Stack & Key Libraries

| Category | Technology |
| :--- | :--- |
| **Framework & Build** | [React 19](https://react.dev/) + [Vite 8](https://vite.dev/) |
| **Styling & Design** | [Tailwind CSS v4](https://tailwindcss.com/) with custom slate & royal blue design tokens |
| **Routing** | [React Router v7](https://reactrouter.com/) (Public, Customer-Protected, and Admin-Protected routes) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **HTTP Client** | [Axios](https://axios-http.com/) with JWT request interceptor & unified error handler |
| **Date Utilities** | [date-fns](https://date-fns.org/) for check-in/check-out calculations and constraints |
| **Feedback** | [React Hot Toast](https://react-hot-toast.com/) |

---

## 📋 Features & Implemented Pages

### 1. Public & Guest Experience
- **Landing / Home Page (`/`)**: Hero destination search bar, trending destinations (Lagos, Abuja, London, Dubai), featured luxury suites, and value propositions.
- **Search Results (`/search`)**: Real-time filtering by star rating (5, 4, 3 stars), max price slider, breakfast deals, and animated skeleton loaders.
- **Hotel Details & Room Rates (`/hotels/:id`)**: Photo gallery, verified amenities, stay summary, and room offers with cancellation policies.
- **Prebook & Sandbox Checkout (`/checkout`)**:
  - Soft authentication: Allows both guest checkout (no account needed) and prefilled member checkout.
  - **Price-Lock Countdown Timer**: 10-minute dynamic lock banner ensuring rates do not fluctuate during payment.
  - **LiteAPI Sandbox Payment Form**: Includes auto-fill button for the official test card (`4242 4242 4242 4242`).
- **Booking Confirmation Voucher (`/booking-confirmation`)**: Displays reference code (`HB-...`), hotel confirmation code, printable receipt, and guest account creation prompt.
- **Guest Booking Lookup (`/lookup`)**: Look up any reservation using **Reference + Guest Email** (strictly preventing IDOR) with one-click cancellation.
- **About & Architecture (`/about`)**: Complete capstone project documentation, architectural overview, and team credits.

### 2. Member & Customer Portal
- **Login (`/login`) & Register (`/register`)**: Form validation with quick-fill demo buttons for rapid evaluation.
- **My Reservations (`/my-bookings`)**: Protected dashboard listing all upcoming and past stays with cancellation requests.

### 3. Administrator Console
- **Platform Bookings Audit (`/admin/bookings`)**: Real-time tabular log of all platform reservations with status filtering (`CONFIRMED`, `PENDING_PAYMENT`, `CANCELLED`, `FAILED`) and deep audit inspection.
- **User & Role Management (`/admin/users`)**: Inspect registered members and toggle account deactivation (`isActive: false/true`).

---

## 💳 Sandbox Test Payment Details

In accordance with LiteAPI sandbox specifications, no real money is charged:
- **Test Card Number:** `4242 4242 4242 4242`
- **Expiration:** Any future date (e.g. `12/28`)
- **CVV:** Any 3 digits (e.g. `123`)
- **Cardholder:** Any name (e.g. `Alex Morgan`)

---

## ⚙️ How to Run Locally

### Prerequisites
- Node.js LTS (v20+ or v24+)
- npm (v10+)

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd hotel-booking-frontend
npm install
```

### 2. Environment Configuration
Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base URL of the backend REST API | `http://localhost:5000/api` |
| `VITE_USE_MOCK` | Toggle mock service layer vs live backend API | `true` (Standalone) / `false` (Connected) |

> **Seamless Backend Integration:**  
> When the backend team has deployed or booted their local server, simply change `VITE_USE_MOCK=false` in `.env`. The frontend will automatically route all requests to the live backend endpoints!

### 3. Start Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

---

## 🛡️ Frontend Security Practices

1. **IDOR Defense:** `customerId` is never sent by client forms during booking actions; it is derived server-side from the verified JWT.
2. **Two-Factor Guest Ownership:** Guest bookings require matching both the Reference code and the guest's Email to view or cancel.
3. **Price Integrity:** Final prices are verified server-side at the `prebook` step; client-tampered totals are impossible.
4. **Token Security:** Bearer tokens are stored securely and injected via an automated Axios interceptor, clearing immediately on 401 Unauthorized responses.
