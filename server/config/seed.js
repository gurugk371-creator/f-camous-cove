const fs = require('fs');
const path = require('path');
const Candidate = require('../models/Candidate');
const Voter = require('../models/Voter');

const seedFromJSON = async () => {
  try {
    const candidatesCount = await Candidate.countDocuments();
    
    // Only seed if the candidate database is empty
    if (candidatesCount === 0) {
      console.log('🔄 Seeding MongoDB from JSON dataset...');
      
      const dbPath = path.join(__dirname, '..', '..', 'database.json');
      
      let dataToSeed;
      if (fs.existsSync(dbPath)) {
        const raw = fs.readFileSync(dbPath, 'utf-8');
        dataToSeed = JSON.parse(raw);
      } else {
        // Fallback defaults
        const { DEFAULT_DATA } = require('../db');
        dataToSeed = DEFAULT_DATA;
      }

      // Loop through courses and create candidate docs
      const courses = Object.keys(dataToSeed.candidates);
      for (const course of courses) {
        const rawCandidates = dataToSeed.candidates[course];
        for (const c of rawCandidates) {
          const votes = (dataToSeed.votes[course] && dataToSeed.votes[course][c.id]) || 0;
          await Candidate.create({
            name: c.name,
            course: course,
            photo: c.photo,
            votes: votes
          });
        }
      }
      
      console.log('✅ Seed complete: Loaded historical candidates and votes.');
    }
    // Seed election configs if missing
    const ElectionConfig = require('../models/ElectionConfig');
    const configsCount = await ElectionConfig.countDocuments();
    if (configsCount === 0) {
      console.log('🔄 Seeding Election Configurations...');
      const dbPath = path.join(__dirname, '..', '..', 'database.json');
      let dataToSeed;
      if (fs.existsSync(dbPath)) {
        const raw = fs.readFileSync(dbPath, 'utf-8');
        dataToSeed = JSON.parse(raw);
      } else {
        const { DEFAULT_DATA } = require('../db');
        dataToSeed = DEFAULT_DATA;
      }

      const validCourses = ['President', 'Vice President', 'Sports President', 'Sports Vice President', 'Technical Head', 'Coding Club Lead', 'Social Media Coordinator'];
      const localConfigs = dataToSeed.electionConfigs || {};

      for (const course of validCourses) {
        const localCfg = localConfigs[course] || {};
        await ElectionConfig.create({
          position: course,
          isActive: localCfg.isActive !== undefined ? localCfg.isActive : true,
          startTime: localCfg.startTime ? new Date(localCfg.startTime) : null,
          endTime: localCfg.endTime ? new Date(localCfg.endTime) : null,
          manuallyStopped: localCfg.manuallyStopped || false
        });
      }
      console.log('✅ Election configs seeded successfully.');
    }
  } catch (err) {
    console.error('⚠️ Seed failed, but carrying on:', err.message);
  }
};

module.exports = seedFromJSON;
