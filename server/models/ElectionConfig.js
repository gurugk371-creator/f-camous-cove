const mongoose = require('mongoose');

const ElectionConfigSchema = new mongoose.Schema({
  position: {
    type: String,
    required: true,
    unique: true,
    enum: ['President', 'Vice President', 'Sports President', 'Sports Vice President', 'Technical Head', 'Coding Club Lead', 'Social Media Coordinator']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startTime: {
    type: Date,
    default: null
  },
  endTime: {
    type: Date,
    default: null
  },
  manuallyStopped: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('ElectionConfig', ElectionConfigSchema);
