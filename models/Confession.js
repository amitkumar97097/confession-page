const mongoose = require("mongoose");

const confessionSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
      trim: true
    },

    image: {
      type: String,   // 👈 image path (e.g. /uploads/xyz.jpg)
      default: null
    },

    ip: {
      type: String
    },

    userAgent: {
      type: String
    }
  },
  {
    timestamps: true // 👈 createdAt + updatedAt automatically
  }
);

module.exports = mongoose.model("Confession", confessionSchema);
