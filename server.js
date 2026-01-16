const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const Confession = require("./models/Confession");
const app = express();

/* ================= ADMIN CREDENTIALS ================= */
const ADMIN_USER = "admin";
const ADMIN_PASS = "admin12345";
/* ===================================================== */

/* 🚫 Bad words list */
const badWords = [
  "fuck","shit","bitch","asshole",
  "madarchod","bhosdike","lund",
  "chutiya","gandu","harami"
];

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* 🔍 DEBUG: env check */
console.log("MONGO_URI =", process.env.MONGO_URI);

if (!process.env.MONGO_URI) {
  console.error("❌ ERROR: MONGO_URI is undefined");
  process.exit(1);
}

/* 🔗 MongoDB connection */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  });

/* ================= USER CONFESSION ================= */
app.post("/confess", async (req, res) => {
  const msg = req.body.message?.toLowerCase() || "";

  // 🚫 Abuse filter
  for (let word of badWords) {
    if (msg.includes(word)) {
      return res.status(400).json({
        success: false,
        error: "Abusive language detected 🚫"
      });
    }
  }

  try {
    const confession = new Confession({
      message: req.body.message,
      ip: req.ip,
      userAgent: req.headers["user-agent"]
    });
    await confession.save();
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

/* ================= ADMIN LOGIN API ================= */
app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return res.json({ success: true });
  }

  res.json({ success: false });
});

/* ================= ADMIN DATA API ================= */
app.get("/admin/confessions", async (req, res) => {
  const data = await Confession.find().sort({ createdAt: -1 });
  res.json(data);
});

/* ================= SERVER ================= */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
