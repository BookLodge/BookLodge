# BookLodge Frontend

Modern, high-performance hotel booking web application built with **React 19**, **Vite**, and **Tailwind CSS**. BookLodge integrates with the BookLodge Backend API powered by **LiteAPI** for real-time worldwide hotel search, room rates, rich multi-photo galleries, pre-booking rate locks, and seamless Stripe test payments.

---

## Features

- 🔍 **Live Hotel & Destination Search**: Autocomplete location search and live availability lookup by check-in, check-out, and guest counts.
- 🏨 **Rich Property & Room Details**:
  - Multi-photo hero gallery mosaic with fullscreen viewer.
  - Per-room photo carousels, bed configuration, occupancy, and amenity breakdowns.
  - Transparent pricing per night and total stay calculation.
- ⚡ **Streamlined 2-Step Checkout**:
  - Rate lock countdown timer on pre-booking.
  - Sandbox test card widget for simulated payments.
  - Instant booking confirmation with reference codes.
- 👤 **User Authentication & Management**:
  - Customer registration and login with JWT session storage.
  - Personal booking history and instant reservation cancellation.
  - Admin dashboard for monitoring system-wide bookings and managing user statuses.
- 📱 **Fully Responsive UI**: Mobile-first luxury aesthetic designed for desktop, tablet, and mobile screens.

---

## Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Date Handling**: [date-fns](https://date-fns.org/)

---

## Getting Started

### 1. Prerequisites
- **Node.js**: `>= 18.0.0`
- **npm**: `>= 9.0.0`

### 2. Installation
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install
```

### 3. Environment Configuration
Create a `.env` file in the `frontend/` root directory based on `.env.example`:

```env
# URL of your BookLodge Backend API
VITE_API_BASE_URL=https://booklodge-backend.onrender.com/api

# Optional: Google Places API Key for enhanced autocomplete
VITE_GOOGLE_PLACES_KEY=

# Optional: Custom Stripe public key for LiteAPI sandbox
VITE_LITEAPI_STRIPE_PUBLIC_KEY=
```

### 4. Running Locally
```bash
# Start the Vite development server
npm run dev
```
The application will be running at `http://localhost:5173`.

### 5. Production Build
```bash
# Build optimized static bundle
npm run build

# Preview the production build locally
npm run preview
```

---

## Project Structure

```
frontend/
├── public/
│   ├── _redirects         # SPA routing redirect rule for Render / Netlify
│   └── icons.svg
├── src/
│   ├── assets/            # Static image assets
│   ├── components/
│   │   ├── booking/       # PriceLockCountdown, SandboxCardWidget
│   │   ├── common/        # Navbar, Footer, Modal, Badge, Spinner, SkeletonCard
│   │   └── hotel/         # SearchWidget, HotelCard, FilterSidebar, RoomOfferCard
│   ├── context/
│   │   ├── AuthContext.jsx       # Authentication state & JWT session management
│   │   └── BookingContext.jsx    # Active booking draft & search query state
│   ├── hooks/             # useCountdown and utility hooks
│   ├── pages/             # Route page views (HomePage, SearchResults, HotelDetail, Checkout, etc.)
│   ├── routes/            # AppRoutes, ProtectedRoute, AdminRoute
│   ├── services/          # API service layers (api.js, hotelService, bookingService, authService, adminService)
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── package.json
└── vite.config.js
```

---

## Deployment (Render / Static Hosts)

The frontend is preconfigured for static site hosting platforms (Render, Netlify, Vercel, Cloudflare Pages).

- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **SPA Fallback**: Handled automatically via `public/_redirects` (`/* /index.html 200`).
