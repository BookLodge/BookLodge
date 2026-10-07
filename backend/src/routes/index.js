const express = require('express');
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const hotelRoutes = require('./hotelRoutes');

const router = express.Router();

// Mount each domain router under its API prefix.
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/hotels', hotelRoutes);

// router.use('/bookings', bookingRoutes);
// router.use('/admin', adminRoutes);

module.exports = router;
