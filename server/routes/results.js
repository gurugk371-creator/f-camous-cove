const express = require('express');
const router  = express.Router();
const Candidate = require('../models/Candidate');
const Voter = require('../models/Voter');
const { requireFaculty }  = require('../middleware/auth');
const { syncMongoToLocalJSON } = require('../db');

// ── GET /api/results
router.get('/', requireFaculty, async (req, res) => {
  try {
    const candidates = await Candidate.find().sort({ votes: -1 });
    
    const groupedResults = {};
    const validCourses = ['President', 'Vice President', 'Sports President', 'Sports Vice President', 'Technical Head', 'Coding Club Lead', 'Social Media Coordinator'];
    validCourses.forEach(c => groupedResults[c] = []);

    candidates.forEach(cand => {
      if (!groupedResults[cand.course]) groupedResults[cand.course] = [];
      groupedResults[cand.course].push(cand);
    });

    const totalCount = await Voter.countDocuments();

    res.json({
      success: true,
      electionOpen: true,
      totalVotes: totalCount,
      results: groupedResults
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching counts' });
  }
});

// ── POST /api/results/reset
router.post('/reset', requireFaculty, async (req, res) => {
  try {
    if (req.body.confirm !== 'RESET') return res.status(400).json({ success: false });
    
    // Wipe out all votes counter on candidates
    await Candidate.updateMany({}, { votes: 0 });
    // Wipe voter logs
    await Voter.deleteMany({});

    await syncMongoToLocalJSON();

    // Real-time trigger to reset stats across all admin / results views
    const io = req.app.get('io');
    if (io) {
      io.emit('votesReset');
    }

    res.json({ success: true, message: 'Election wiped clean' });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// Legacy endpoint wrapper fallback
router.get('/data', async (req, res) => {
    const candidates = await Candidate.find();
    const grouped = {};
    candidates.forEach(c => {
        if(!grouped[c.course]) grouped[c.course] = [];
        grouped[c.course].push(c);
    });
    res.json({ candidates: grouped });
});

module.exports = router;
