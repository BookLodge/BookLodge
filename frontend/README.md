# BookLodge Frontend

Modern, luxury hotel booking web application built with **React 19**, **Vite**, and **Tailwind CSS**. BookLodge connects directly to the BookLodge Backend API powered by **LiteAPI** for real-time worldwide destination search, live room availability, multi-photo property galleries, rate-locked pre-bookings, and seamless checkout.

---

## 🌟 Key Features

- 🔍 **Live Global Hotel Search**:
  - Autocomplete location suggestions with real-time backend indexing.
  - Check-in, check-out, and guest count configuration with validation.
  - Server-backed live inventory and dynamic room pricing.

- 🏨 **Rich Property & Room Details**:
  - **Multi-Photo Hero Gallery**: Responsive mosaic photo grid with fullscreen viewer modal.
  - **Specific Room Photo Carousels**: Individual room photo galleries with slider controls and counter indicators.
  - **Room Pagination**: Compact 5-room paginated display per hotel for maximum performance.
  - **Amenities & Bedding Breakdown**: Dynamic bed types, guest capacity, and room amenities.

- 🎛️ **Precision Search Filtering & Pagination**:
  - **Pagination**: 8 hotels per page on search results with smooth auto-scroll.
  - **Guest Review Score Tiers**: `8.0 - 10`, `5.1 - 7.9`, and `5.0 & Below` filter brackets.
  - **Price Slider**: Dynamic price-per-night range filtering with visible slider track.
  - **Deals Filter**: Instant filtering for breakfast-included offers.

- ⚡ **2-Step Guaranteed Checkout**:
  - **Pre-Booking Rate Lock**: 10-minute price-lock timer guaranteeing rates while completing checkout.
  - **Sandbox Test Card Widget**: Integrated card simulator for testing Stripe payment authorizations.
  - **Instant Reservation Confirmation**: Real-time booking code, client reference, and stay receipt.

- 👤 **User & Admin Management**:
  - Customer registration and login with JWT session handling.
  - Customer dashboard for viewing upcoming/past reservations and instant cancellations.
  - Admin panel for monitoring system-wide bookings and managing user access.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **UI Library** | [React 19](https://react.dev/) |
| **Build Tool & Dev Server** | [Vite](https://vitejs.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Routing** | [React Router v7](https://reactrouter.com/) |
| **HTTP Client** | [Axios](https://axios-http.com/) |
| **Date Utilities** | [date-fns](https://date-fns.org/) |
| **Notifications** | [react-hot-toast](https://react-hot-toast.com/) |

---

## 📁 Project Structure

```
frontend/
├── public/
│   ├── _redirects              # SPA routing rule for Render / Netlify
│   ├── favicon.svg             # App favicon
│   └── icons.svg               # SVG icons sprite
├── src/
│   ├── assets/                 # Image assets (hero.png)
│   ├── components/
│   │   ├── booking/            # PriceLockCountdown, SandboxCardWidget
│   │   ├── common/             # Navbar, Footer, Modal, Badge, Spinner, SkeletonCard
│   │   └── hotel/              # SearchWidget, HotelCard, FilterSidebar, RoomOfferCard
│   ├── context/
│   │   ├── AuthContext.jsx     # Authentication state & JWT session management
│   │   └── BookingContext.jsx  # Active booking draft & search query state
│   ├── hooks/                  # useCountdown and utility hooks
│   ├── pages/                  # Application views (HomePage, SearchResults, HotelDetail, Checkout, etc.)
│   ├── routes/                 # AppRoutes, ProtectedRoute, AdminRoute
│   ├── services/               # API service layer (api.js, hotelService, bookingService, authService, adminService, paymentService)
│   ├── App.jsx                 # Root layout & Toast provider
│   ├── index.css               # Global Tailwind CSS imports
│   └── main.jsx                # App entry point
├── .env.example                # Template environment variables
├── .gitignore                  # Git ignore rules
├── package.json                # Project dependencies & scripts
├── README.md                   # Project documentation
└── vite.config.js              # Vite build configuration
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: `>= 18.0.0`
- **npm**: `>= 9.0.0`

### 2. Installation
```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install
```

### 3. Environment Configuration
Create a `.env` file in `frontend/` based on `.env.example`:

```env
# URL of your BookLodge Backend API (Local or Cloud)
VITE_API_BASE_URL=https://booklodge-backend.onrender.com/api

# Optional: Google Places API Key for destination autocomplete
VITE_GOOGLE_PLACES_KEY=

# Optional: Custom Stripe public key for LiteAPI sandbox
VITE_LITEAPI_STRIPE_PUBLIC_KEY=
```

### 4. Running Locally
```bash
# Start Vite development server
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### 5. Production Build
```bash
# Create optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🌐 Production Deployment (Render)

The frontend is fully configured for static site hosting on **Render**, **Netlify**, or **Vercel**.

1. **Service Type**: Static Site
2. **Root Directory**: `frontend`
3. **Build Command**: `npm install && npm run build`
4. **Publish Directory**: `dist`
5. **SPA Redirect**: Handled automatically via `public/_redirects` (`/* /index.html 200`) to ensure client-side routes (e.g. `/search`, `/hotels/:id`) never 404 on refresh.
6. **Environment Variable**: Set `VITE_API_BASE_URL` to your live backend URL (e.g. `https://booklodge-backend.onrender.com/api`).
