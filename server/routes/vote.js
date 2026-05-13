const express = require('express');
const router  = express.Router();
const Candidate = require('../models/Candidate');
const Voter = require('../models/Voter');
const { syncMongoToLocalJSON } = require('../db');

// ── POST /api/vote
router.post('/', async (req, res) => {
  try {
    const { name, email, mobile, rollNo, course, candidateId } = req.body;

    if (!email || !mobile || !rollNo || !candidateId) {
      return res.status(400).json({ success: false, message: 'Missing inputs.' });
    }

    const normEmail = email.toLowerCase().trim();
    const normMobile = mobile.trim();
    const normRoll = rollNo.trim();

    // Check duplicate vote across any identification field
    const existingVoter = await Voter.findOne({
      $or: [
        { email: normEmail },
        { mobile: normMobile },
        { rollNo: normRoll }
      ]
    });

    if (existingVoter) {
      return res.status(409).json({ success: false, message: 'You have already voted!' });
    }

    // Check valid candidate
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found.' });
    }

    // ENFORCE ELECTION TIMING WINDOWS
    const ElectionConfig = require('../models/ElectionConfig');
    const config = await ElectionConfig.findOne({ position: candidate.course });
    if (config) {
      const now = new Date();
      if (config.manuallyStopped) {
        return res.status(403).json({ success: false, message: 'Voting has been manually closed by the Administrator.' });
      }
      if (config.startTime && now < new Date(config.startTime)) {
        return res.status(403).json({ success: false, message: 'Election has not started yet!' });
      }
      if (config.endTime && now > new Date(config.endTime)) {
        return res.status(403).json({ success: false, message: 'Voting is now closed!' });
      }
      if (!config.isActive) {
        return res.status(403).json({ success: false, message: 'This election is currently inactive.' });
      }
    }

    // Atomically increment votes
    candidate.votes += 1;
    await candidate.save();

    // Register voter record
    await Voter.create({
      name: name,
      email: normEmail,
      mobile: normMobile,
      rollNo: normRoll,
      course: course,
      candidateId: candidate._id
    });

    console.log(`🗳️  Vote counted successfully for ${candidate.name}`);
    
    // Broadcast the vote update live to all connected devices via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('voteUpdate', {
        candidateId: candidate._id.toString(),
        votes: candidate.votes,
        course: candidate.course
      });
    }

    await syncMongoToLocalJSON();
    res.json({ success: true, message: 'Vote Success', votedFor: candidate.name });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to record vote.' });
  }
});

// ── GET /api/vote/check
router.get('/check', async (req, res) => {
  try {
    const { email, mobile, rollNo } = req.query;
    const conditions = [];
    
    if (email) conditions.push({ email: email.toLowerCase().trim() });
    if (mobile) conditions.push({ mobile: mobile.trim() });
    if (rollNo) conditions.push({ rollNo: rollNo.trim() });

    if (conditions.length === 0) return res.json({ hasVoted: false });

    const match = await Voter.findOne({ $or: conditions });
    res.json({ success: true, hasVoted: !!match });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error checking records.' });
  }
});

module.exports = router;
