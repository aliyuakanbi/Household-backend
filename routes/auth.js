const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../Models/User");

// Sign up
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already in use" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email, password: hashed });
    res.status(201).json({ message: "Signup successful", user: { name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: "Signup failed" });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Wrong password" });

    res.json({ message: "Login successful", user: { name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: "Login error" });
  }
});

module.exports = router;
