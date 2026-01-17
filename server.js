const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const Confession = require("./models/Confession");
const app = express();

/* ================= ADMIN CREDENTIALS ================= */
const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS;
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

/* 🔍 ENV CHECK */
if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI missing");
  process.exit(1);
}

/* 🔗 MongoDB */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => {
    console.error("❌ Mongo Error:", err.message);
    process.exit(1);
  });

/* ================= USER CONFESSION ================= */
app.post("/confess", async (req, res) => {
  const msg = req.body.message?.trim();

  if (!msg) {
    return res.status(400).json({
      success: false,
      error: "Message cannot be empty"
    });
  }

  const lower = msg.toLowerCase();
  for (let word of badWords) {
    if (lower.includes(word)) {
      return res.status(400).json({
        success: false,
        error: "Abusive language detected 🚫"
      });
    }
  }

  try {
    await Confession.create({
      message: msg,
      ip: req.ip,
      userAgent: req.headers["user-agent"]
    });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

/* ================= ADMIN LOGIN ================= */
app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return res.json({ success: true });
  }
  res.json({ success: false });
});

/* ================= ADMIN AUTH MIDDLEWARE ================= */
function adminAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).send("Unauthorized");

  const decoded = Buffer.from(auth.split(" ")[1], "base64")
    .toString()
    .split(":");

  if (decoded[0] !== ADMIN_USER || decoded[1] !== ADMIN_PASS) {
    return res.status(403).send("Forbidden");
  }
  next();
}

/* ================= ADMIN DATA ================= */
app.get("/admin/confessions", adminAuth, async (req, res) => {
  const data = await Confession.find().sort({ createdAt: -1 });
  res.json(data);
});

/* ================= SERVER ================= */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
