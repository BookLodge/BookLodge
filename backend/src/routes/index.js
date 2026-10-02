const express = require('express');
const healthRoutes = require('./healthRoutes');

const router = express.Router();

// Mount each domain router under its API prefix.
router.use('/health', healthRoutes);

// Remaining domain routers are added here as they are implemented:
// router.use('/auth', authRoutes);
// router.use('/bookings', bookingRoutes);
// router.use('/hotels', hotelRoutes);
// router.use('/admin', adminRoutes);

module.exports = router;
