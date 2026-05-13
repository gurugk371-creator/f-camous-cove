/* ================================================================
   db.js — Flat-file JSON "database" helper
   Reads and writes database.json in the parent (project) directory
   ================================================================ */

const fs   = require('fs');
const path = require('path');

// database.json lives in the project root (one level up from /server)
const DB_PATH = path.join(__dirname, '..', 'database.json');

/* ---------- Default data structure (first-run seed) ---------- */
const DEFAULT_DATA = {
  candidates: {
    'President': [
      { id: 'p1', name: 'Aarav Sharma',   photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face' },
      { id: 'p2', name: 'Vivaan Patel',   photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face' },
      { id: 'p3', name: 'Aditya Singh',   photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop&crop=face' },
      { id: 'p4', name: 'Reyansh Gupta',  photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=300&fit=crop&crop=face' },
      { id: 'p5', name: 'Krishna Verma',  photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face' }
    ],
    'Vice President': [
      { id: 'vp1', name: 'Rahul Mehta',    photo: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=300&h=300&fit=crop&crop=face' },
      { id: 'vp2', name: 'Arjun Reddy',    photo: 'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=300&h=300&fit=crop&crop=face' },
      { id: 'vp3', name: 'Siddharth Iyer', photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&h=300&fit=crop&crop=face' },
      { id: 'vp4', name: 'Vikram Das',     photo: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=300&h=300&fit=crop&crop=face' },
      { id: 'vp5', name: 'Karan Joshi',    photo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&h=300&fit=crop&crop=face' }
    ],
    'Sports President': [
      { id: 'sp1', name: 'Rohan Mishra',    photo: 'https://images.unsplash.com/photo-1506803682981-6e718a9dd3ee?w=300&h=300&fit=crop&crop=face' },
      { id: 'sp2', name: 'Aakash Dubey',    photo: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=300&h=300&fit=crop&crop=face' },
      { id: 'sp3', name: 'Nikhil Pandey',   photo: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=300&h=300&fit=crop&crop=face' },
      { id: 'sp4', name: 'Ishaan Kumar',    photo: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=300&h=300&fit=crop&crop=face' },
      { id: 'sp5', name: 'Dhruv Yadav',     photo: 'https://images.unsplash.com/photo-1583864697784-a0efc8379f70?w=300&h=300&fit=crop&crop=face' }
    ],
    'Sports Vice President': [
      { id: 'svp1', name: 'Anshul Kapoor',   photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face' },
      { id: 'svp2', name: 'Pranav Nair',     photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face' },
      { id: 'svp3', name: 'Tanmay Shah',     photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop&crop=face' },
      { id: 'svp4', name: 'Harsh Tiwari',    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=300&fit=crop&crop=face' },
      { id: 'svp5', name: 'Manish Saxena',   photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face' }
    ],
    'Technical Head': [
      { id: 'th1', name: 'Prateek Awasthi', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face' },
      { id: 'th2', name: 'Kunal Chopra',    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face' },
      { id: 'th3', name: 'Shubham Luthra',  photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop&crop=face' },
      { id: 'th4', name: 'Ankit Bhatia',    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=300&fit=crop&crop=face' },
      { id: 'th5', name: 'Deepak Rawat',    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face' }
    ],
    'Coding Club Lead': [
      { id: 'ccl1', name: 'Abhishek Raut',  photo: 'https://images.unsplash.com/photo-1506803682981-6e718a9dd3ee?w=300&h=300&fit=crop&crop=face' },
      { id: 'ccl2', name: 'Saurabh Dixit',  photo: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=300&h=300&fit=crop&crop=face' },
      { id: 'ccl3', name: 'Aayush Mittal',  photo: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=300&h=300&fit=crop&crop=face' },
      { id: 'ccl4', name: 'Neeraj Oberoi',  photo: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=300&h=300&fit=crop&crop=face' },
      { id: 'ccl5', name: 'Tarun Khanna',   photo: 'https://images.unsplash.com/photo-1583864697784-a0efc8379f70?w=300&h=300&fit=crop&crop=face' }
    ],
    'Social Media Coordinator': [
      { id: 'smc1', name: 'Mohit Aggarwal',  photo: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=300&h=300&fit=crop&crop=face' },
      { id: 'smc2', name: 'Varun Goel',      photo: 'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=300&h=300&fit=crop&crop=face' },
      { id: 'smc3', name: 'Amit Jain',       photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&h=300&fit=crop&crop=face' },
      { id: 'smc4', name: 'Ritesh Bansal',   photo: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=300&h=300&fit=crop&crop=face' },
      { id: 'smc5', name: 'Sumit Grover',    photo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&h=300&fit=crop&crop=face' }
    ]
  },
  votes: {
    'President':                { p1: 0, p2: 0, p3: 0, p4: 0, p5: 0 },
    'Vice President':           { vp1: 0, vp2: 0, vp3: 0, vp4: 0, vp5: 0 },
    'Sports President':        { sp1: 0, sp2: 0, sp3: 0, sp4: 0, sp5: 0 },
    'Sports Vice President':   { svp1: 0, svp2: 0, svp3: 0, svp4: 0, svp5: 0 },
    'Technical Head':           { th1: 0, th2: 0, th3: 0, th4: 0, th5: 0 },
    'Coding Club Lead':         { ccl1: 0, ccl2: 0, ccl3: 0, ccl4: 0, ccl5: 0 },
    'Social Media Coordinator': { smc1: 0, smc2: 0, smc3: 0, smc4: 0, smc5: 0 }
  },
  votedRecords: [],
  electionOpen: true,
  createdAt: new Date().toISOString()
};

/* ---------- Read database ---------- */
function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    writeDB(DEFAULT_DATA);
    return DEFAULT_DATA;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[DB] Parse error, resetting to defaults:', err.message);
    writeDB(DEFAULT_DATA);
    return DEFAULT_DATA;
  }
}

/* ---------- Write database (atomic-ish via temp file) ---------- */
function writeDB(data) {
  const tmp = DB_PATH + '.tmp';
  try {
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmp, DB_PATH);
  } catch (err) {
    console.error('[DB] Write error:', err.message);
    throw err;
  }
}

async function syncMongoToLocalJSON() {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) return;
    
    const Candidate = mongoose.model('Candidate');
    const Voter = mongoose.model('Voter');
    
    // Register ElectionConfig if it hasn't been initialized
    let ElectionConfig;
    try {
      ElectionConfig = mongoose.model('ElectionConfig');
    } catch (e) {
      ElectionConfig = require('./models/ElectionConfig');
    }
    
    const allCandidates = await Candidate.find().lean();
    const voters = await Voter.find().lean();
    const configs = await ElectionConfig.find().lean();
    
    const candidatesMap = {};
    const votesMap = {};
    const configsMap = {};
    
    const validCourses = ['President', 'Vice President', 'Sports President', 'Sports Vice President', 'Technical Head', 'Coding Club Lead', 'Social Media Coordinator'];
    
    validCourses.forEach(c => {
      candidatesMap[c] = [];
      votesMap[c] = {};
      configsMap[c] = {
        position: c,
        isActive: true,
        startTime: null,
        endTime: null,
        manuallyStopped: false
      };
    });
    
    configs.forEach(cfg => {
      if (configsMap[cfg.position]) {
        configsMap[cfg.position] = {
          position: cfg.position,
          isActive: cfg.isActive,
          startTime: cfg.startTime,
          endTime: cfg.endTime,
          manuallyStopped: cfg.manuallyStopped
        };
      }
    });
    
    allCandidates.forEach(cand => {
      const course = cand.course;
      if (!course) return;
      if (!candidatesMap[course]) candidatesMap[course] = [];
      if (!votesMap[course]) votesMap[course] = {};
      
      candidatesMap[course].push({
        id: cand._id.toString(),
        name: cand.name,
        photo: cand.photo
      });
      votesMap[course][cand._id.toString()] = cand.votes || 0;
    });
    
    const dbData = {
      candidates: candidatesMap,
      votes: votesMap,
      votedRecords: voters.map(v => ({
        email: v.email,
        mobile: v.mobile,
        rollNo: v.rollNo,
        course: v.course,
        candidateId: v.candidateId.toString()
      })),
      electionConfigs: configsMap,
      electionOpen: true,
      createdAt: new Date().toISOString()
    };
    
    writeDB(dbData);
  } catch (err) {
    console.error('[DB] Sync to Local JSON error:', err.message);
  }
}

module.exports = { readDB, writeDB, DEFAULT_DATA, syncMongoToLocalJSON };
