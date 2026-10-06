const express = require('express');
const healthRoutes = require('./healthRoutes');
const hotelRoutes = require('./hotelRoutes');

const router = express.Router();

const userRoutes = require("../routes/userRoutes"); 

// Mount each domain router under its API prefix.
router.use('/health', healthRoutes);
router.use('/hotels', hotelRoutes);

// Remaining domain routers are added here as they are implemented:
// router.use('/auth', authRoutes);
// router.use('/bookings', bookingRoutes);
// router.use('/admin', adminRoutes);

router.use('/users', userRoutes);

module.exports = router;
