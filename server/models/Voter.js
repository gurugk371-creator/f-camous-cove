const mongoose = require('mongoose');

const VoterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  mobile: {
    type: String,
    required: true,
    trim: true
  },
  rollNo: {
    type: String,
    required: true,
    trim: true
  },
  course: {
    type: String,
    required: true
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  votedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure fast lookups for double voting check
VoterSchema.index({ email: 1 });
VoterSchema.index({ mobile: 1 });
VoterSchema.index({ rollNo: 1 });

module.exports = mongoose.model('Voter', VoterSchema);
