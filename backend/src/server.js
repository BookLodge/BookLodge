const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

const authRoutes = require("./src/routes/authRoutes");

const { protect } = require("./src/middleware/auth");

dotenv.config();


const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });

app.get("/", (req, res) => {
  res.json({
    message: "BookLodge Hotel API is running"
  });
});
app.get("/api/protected", protect, (req, res) => {
  res.json({
    message: "You have access to this protected route",
    user: req.user
  });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});