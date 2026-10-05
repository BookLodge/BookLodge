const express = require('express');
const healthRoutes = require('./healthRoutes');
const bookingRoutes = require('./bookingRoutes');

const router = express.Router();

// Mount each domain router under its API prefix.
router.use('/health', healthRoutes);
router.use('/bookings', bookingRoutes);

// Remaining domain routers are added here as they are implemented:
// router.use('/auth', authRoutes);
// router.use('/hotels', hotelRoutes);
// router.use('/admin', adminRoutes);

module.exports = router;