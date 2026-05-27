const express = require('express');
const router = express.Router();
const ObjectAdvance = require('../models/ObjectAdvance');
const apiKeyAuth = require('../middleware/auth');

router.use(apiKeyAuth);

router.post('/', async (req, res) => {
  try {
    const advance = await ObjectAdvance.create(req.body);
    res.status(201).json({ success: true, data: advance });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const advances = await ObjectAdvance.find().sort({ createdAt: -1 });
    res.json({ success: true, data: advances });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const advance = await ObjectAdvance.findById(req.params.id);
    if (!advance) return res.status(404).json({ success: false, error: 'Не найдено' });
    res.json({ success: true, data: advance });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const advance = await ObjectAdvance.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!advance) return res.status(404).json({ success: false, error: 'Не найдено' });
    res.json({ success: true, data: advance });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await ObjectAdvance.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
