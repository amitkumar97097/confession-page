const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const Confession = require("./models/Confession");
const app = express();

/* ================= ENV CONFIG ================= */
const {
  ADMIN_USER,
  ADMIN_PASS,
  JWT_SECRET,
  MONGO_URI,
  PORT = 10000
} = process.env;

if (!ADMIN_USER || !ADMIN_PASS || !JWT_SECRET || !MONGO_URI) {
  console.error("❌ Missing ENV variables");
  process.exit(1);
}

/* ================= BAD WORDS ================= */
const badWords = [
  "fuck","shit","bitch","asshole",
  "madarchod","bhosdike","lund",
  "chutiya","gandu","harami"
];

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* ================= UPLOADS FOLDER ================= */
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
app.use("/uploads", express.static(uploadDir));

/* ================= MULTER CONFIG ================= */
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_, file, cb) => {
    const allowed = /jpg|jpeg|png|webp/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.test(ext)) {
      return cb(new Error("Only images allowed"));
    }
    cb(null, true);
  }
});

/* ================= MONGODB ================= */
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => {
    console.error("❌ Mongo Error:", err.message);
    process.exit(1);
  });

/* ================= JWT AUTH ================= */
function adminAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ error: "Token missing" });
  }

  const token = header.split(" ")[1];
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}

/* ================= USER CONFESSION ================= */
app.post("/confess", upload.single("photo"), async (req, res) => {
  const msg = req.body.message?.trim() || "";

  if (!msg && !req.file) {
    return res.status(400).json({
      success: false,
      error: "Message or image required"
    });
  }

  for (let w of badWords) {
    if (msg.toLowerCase().includes(w)) {
      return res.status(400).json({
        success: false,
        error: "Abusive language 🚫"
      });
    }
  }

  try {
    await Confession.create({
      message: msg,
      image: req.file ? `/uploads/${req.file.filename}` : null,
      ip: req.ip,
      userAgent: req.headers["user-agent"]
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

/* ================= ADMIN LOGIN ================= */
app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = jwt.sign(
      { admin: true },
      JWT_SECRET,
      { expiresIn: "6h" }
    );
    return res.json({ success: true, token });
  }

  res.json({ success: false });
});

/* ================= ADMIN DATA ================= */
app.get("/admin/confessions", adminAuth, async (_, res) => {
  const data = await Confession.find().sort({ createdAt: -1 });
  res.json(data);
});

/* ================= DELETE CONFESSION ================= */
app.delete("/admin/delete/:id", adminAuth, async (req, res) => {
  await Confession.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

/* ================= STATS ================= */
app.get("/admin/stats", adminAuth, async (_, res) => {
  const total = await Confession.countDocuments();
  const withImage = await Confession.countDocuments({ image: { $ne: null } });

  res.json({
    total,
    withImage,
    textOnly: total - withImage
  });
});

/* ================= SERVER ================= */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
