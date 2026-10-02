const express = require('express');
const healthRoutes = require('./healthRoutes');

const router = express.Router();

const userRoutes = require("../routes/userRoutes"); 

// Mount each domain router under its API prefix.
router.use('/health', healthRoutes);

// Remaining domain routers are added here as they are implemented:
// router.use('/auth', authRoutes);
// router.use('/bookings', bookingRoutes);
// router.use('/hotels', hotelRoutes);
// router.use('/admin', adminRoutes);
router.use('/users', userRoutes);

module.exports = router;
