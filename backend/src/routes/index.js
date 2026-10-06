const express = require('express');
const healthRoutes = require('./healthRoutes');

const router = express.Router();

const userRoutes = require("../routes/userRoutes"); 
const bookingRoutes = require("./bookingRoutes");

// Mount each domain router under its API prefix.
router.use('/health', healthRoutes);

// router.use('/auth', authRoutes);
router.use('/bookings', bookingRoutes);
// router.use('/hotels', hotelRoutes);
// router.use('/admin', adminRoutes);
router.use('/users', userRoutes);

module.exports = router;
