const express = require('express');
const router = express.Router();
const ElectionConfig = require('../models/ElectionConfig');
const Candidate = require('../models/Candidate');
const Voter = require('../models/Voter');
const { requireFaculty } = require('../middleware/auth');
const { syncMongoToLocalJSON } = require('../db');

// ── GET /api/election/config
// Fetch configuration for all positions or active status
router.get('/config', async (req, res) => {
  try {
    const configs = await ElectionConfig.find();
    
    // Map array to an object by position name for easy client lookup
    const configMap = {};
    configs.forEach(c => {
      configMap[c.position] = {
        position: c.position,
        isActive: c.isActive,
        startTime: c.startTime,
        endTime: c.endTime,
        manuallyStopped: c.manuallyStopped
      };
    });
    
    res.json({ success: true, configs: configMap });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/election/config/:position (Faculty Only)
// Update timing parameters and toggle switch states
router.put('/config/:position', requireFaculty, async (req, res) => {
  try {
    const { position } = req.params;
    const { startTime, endTime, isActive, manuallyStopped } = req.body;
    
    // Fetch the existing configuration to determine state transition
    const existingConfig = await ElectionConfig.findOne({ position });
    
    // Current states (default to standard values if doesn't exist)
    const currentIsActive = existingConfig ? existingConfig.isActive : true;
    const currentManuallyStopped = existingConfig ? existingConfig.manuallyStopped : false;
    
    // New target states
    const targetIsActive = isActive !== undefined ? isActive : currentIsActive;
    const targetManuallyStopped = manuallyStopped !== undefined ? manuallyStopped : currentManuallyStopped;
    
    // An election is running if it's active and NOT manually stopped
    const wasRunning = currentIsActive && !currentManuallyStopped;
    const willRun = targetIsActive && !targetManuallyStopped;
    
    // Reset trigger: transitions from NOT RUNNING to RUNNING
    const resetVotes = !wasRunning && willRun;

    const update = {};
    if (startTime !== undefined) update.startTime = startTime ? new Date(startTime) : null;
    if (endTime !== undefined) update.endTime = endTime ? new Date(endTime) : null;
    if (isActive !== undefined) update.isActive = isActive;
    if (manuallyStopped !== undefined) update.manuallyStopped = manuallyStopped;

    // Perform reset if re-starting the election
    if (resetVotes) {
      console.log(`🔄 Election RE-START detected for position: ${position}. Resetting all votes and removing voter records for this course.`);
      
      // 1. Reset votes count for all candidates in this course
      await Candidate.updateMany({ course: position }, { $set: { votes: 0 } });
      
      // 2. Delete all voter records for this course
      await Voter.deleteMany({ course: position });
    }

    // Find and update the configuration, creating it if it doesn't exist (upsert)
    const config = await ElectionConfig.findOneAndUpdate(
      { position },
      { $set: update },
      { new: true, upsert: true }
    );

    // Update the local mirror snapshot
    await syncMongoToLocalJSON();

    // If we reset the votes, let's broadcast real-time socket updates so the frontend UI clears instantly
    if (resetVotes) {
      const io = req.app.get('io');
      if (io) {
        // Fetch the updated candidates to get their IDs and broadcast to all connected users
        const updatedCandidates = await Candidate.find({ course: position });
        updatedCandidates.forEach(cand => {
          io.emit('voteUpdate', {
            candidateId: cand._id.toString(),
            votes: 0,
            course: cand.course
          });
        });
      }
    }

    res.json({ 
      success: true, 
      message: resetVotes 
        ? `Election restarted! Config updated and votes reset for ${position}`
        : `Config updated for ${position}`, 
      config 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
