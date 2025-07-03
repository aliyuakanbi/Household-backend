const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const Item = require("./Models/item");
const Activity = require("./Models/activity");
const authRoutes = require("./routes/auth");
const bcrypt = require("bcrypt");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ✅ Test route
app.get("/", (req, res) => {
  res.send("✅ Backend is working!");
});

// ✅ Create item + Log activity
app.post("/api/items", async (req, res) => {
  try {
    const newItem = await Item.create(req.body);

    await Activity.create({
      takenBy: newItem.takenBy,
      itemName: newItem.name,
      date: new Date(),
      message: `🟢 ${newItem.takenBy} added "${newItem.name}"`,
    });

    res.status(201).json(newItem);
  } catch (err) {
    console.error("❌ Error adding item:", err.message);
    res.status(400).json({ error: err.message });
  }
});

// ✅ Get all items
app.get("/api/items", async (req, res) => {
  try {
    const items = await Item.find().sort({ boughtDate: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get single item
app.get("/api/items/:id", async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch item" });
  }
});

// ✅ Spending summary
app.get("/api/spending-summary", async (req, res) => {
  const month = parseInt(req.query.month);
  const year = parseInt(req.query.year);

  if (!month || !year) {
    return res.status(400).json({ message: "Please provide month and year" });
  }

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  try {
    const items = await Item.find({ boughtDate: { $gte: start, $lt: end } });
    const totalItems = items.length;
    const totalSpent = items.reduce((sum, item) => sum + item.price, 0);

    res.json({
      month: `${start.toLocaleString("default", { month: "long" })} ${year}`,
      totalItems,
      totalSpent,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to calculate spending" });
  }
});

// ✅ Expiring items
app.get("/api/expiring-soon", async (req, res) => {
  const today = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(today.getDate() + 3);

  try {
    const items = await Item.find({
      expiryDate: { $gte: today, $lte: threeDaysFromNow },
    }).sort({ expiryDate: 1 });

    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch expiring items" });
  }
});

// ✅ Create activity manually
app.post("/api/activity", async (req, res) => {
  try {
    const activity = await Activity.create(req.body);
    res.status(201).json(activity);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Get activity log
app.get("/api/activity", async (req, res) => {
  try {
    const logs = await Activity.find().sort({ date: -1 }); // use date not timestamp
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

// ✅ Auth routes
app.use("/api", authRoutes);

// ✅ Connect MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
app.get("/api/activity/delete-broken", async (req, res) => {
  try {
    const result = await Activity.deleteMany({
      $or: [
        { takenBy: { $exists: false } },
        { itemName: { $exists: false } }
      ]
    });
    res.send(`🧹 Deleted ${result.deletedCount} broken activities.`);
  } catch (err) {
    res.status(500).send("❌ Cleanup failed: " + err.message);
  }
});
app.use("/api", require("./routes/auth"));
