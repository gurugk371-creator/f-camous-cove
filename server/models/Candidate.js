const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
  },
  course: {
    type: String,
    required: [true, 'Please specify the course (e.g., President)'],
    enum: ['President', 'Vice President', 'Sports President', 'Sports Vice President', 'Technical Head', 'Coding Club Lead', 'Social Media Coordinator']
  },
  photo: {
    type: String,
    default: ''
  },
  votes: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Transform helper to match old format
CandidateSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

CandidateSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = mongoose.model('Candidate', CandidateSchema);
