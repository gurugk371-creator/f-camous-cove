const express  = require('express');
const router   = express.Router();
const Candidate = require('../models/Candidate');
const { requireFaculty }  = require('../middleware/auth');
const { syncMongoToLocalJSON } = require('../db');

// Helper to map dynamic case inputs to canonical stored cases
const normalizeCourse = (input = '') => {
  const canonicalMap = {
    'president': 'President',
    'vice president': 'Vice President',
    'sports president': 'Sports President',
    'sports vice president': 'Sports Vice President',
    'technical head': 'Technical Head',
    'coding club lead': 'Coding Club Lead',
    'social media coordinator': 'Social Media Coordinator'
  };
  return canonicalMap[input.toLowerCase()] || input;
};

// ── GET /api/candidates (grouped by course)
router.get('/', async (req, res) => {
  try {
    const candidates = await Candidate.find();
    const grouped = {};
    
    // Create buckets for predefined courses
    const validCourses = ['President', 'Vice President', 'Sports President', 'Sports Vice President', 'Technical Head', 'Coding Club Lead', 'Social Media Coordinator'];
    validCourses.forEach(c => grouped[c] = []);

    candidates.forEach(cand => {
      if (!grouped[cand.course]) grouped[cand.course] = [];
      grouped[cand.course].push(cand);
    });

    res.json({ success: true, candidates: grouped });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error loading candidates' });
  }
});

// ── GET /api/candidates/:course
router.get('/:course', async (req, res) => {
  try {
    const course = normalizeCourse(req.params.course);
    const candidates = await Candidate.find({ course: course });
    res.json({ success: true, candidates });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error loading candidates' });
  }
});

// ── POST /api/candidates/:course (Faculty Only)
router.post('/:course', requireFaculty, async (req, res) => {
  try {
    const { name, photo } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

    const course = normalizeCourse(req.params.course);
    const candidate = await Candidate.create({
      name,
      course: course,
      photo: photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff`
    });

    await syncMongoToLocalJSON();
    res.status(201).json({ success: true, message: 'Candidate created', candidate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── PUT /api/candidates/:course/:id (Faculty Only)
router.put('/:course/:id', requireFaculty, async (req, res) => {
  try {
    const { name, photo } = req.body;
    const update = {};
    if (name) update.name = name;
    if (photo) update.photo = photo;

    const candidate = await Candidate.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!candidate) return res.status(404).json({ success: false, message: 'Not found' });

    await syncMongoToLocalJSON();
    res.json({ success: true, message: 'Updated', candidate });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

// ── DELETE /api/candidates/:course/:id (Faculty Only)
router.delete('/:course/:id', requireFaculty, async (req, res) => {
  try {
    const result = await Candidate.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Not found' });
    await syncMongoToLocalJSON();
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Deletion failed' });
  }
});

module.exports = router;
