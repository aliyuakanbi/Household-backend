const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  takenBy: { type: String, required: true },
  itemName: { type: String, required: true },
  date: { type: Date, default: Date.now },
  message: { type: String }, // ❌ REMOVE `required: true` if it's there
});

module.exports = mongoose.model('Activity', activitySchema);
