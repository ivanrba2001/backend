const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
  title: String,
  description: String,
  hashtags: [String],
  type: String,
  username: String,
  mediaUrl: String,
  cloudinaryId: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Media', MediaSchema);
