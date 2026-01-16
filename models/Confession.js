const mongoose = require("mongoose");

const confessionSchema = new mongoose.Schema({
  message:String,
  ip:String,
  userAgent:String,
  createdAt:{ type:Date, default:Date.now }
});

module.exports = mongoose.model("Confession", confessionSchema);
