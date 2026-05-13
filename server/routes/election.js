const express = require('express');
const router = express.Router();
const ElectionConfig = require('../models/ElectionConfig');
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
    
    const update = {};
    if (startTime !== undefined) update.startTime = startTime ? new Date(startTime) : null;
    if (endTime !== undefined) update.endTime = endTime ? new Date(endTime) : null;
    if (isActive !== undefined) update.isActive = isActive;
    if (manuallyStopped !== undefined) update.manuallyStopped = manuallyStopped;

    // Find and update, creating it if it doesn't exist (upsert)
    const config = await ElectionConfig.findOneAndUpdate(
      { position },
      { $set: update },
      { new: true, upsert: true }
    );

    // Update the local mirror snapshot
    await syncMongoToLocalJSON();

    res.json({ success: true, message: `Config updated for ${position}`, config });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
