const express = require('express');
const router = express.Router();
const Object = require('../models/Object');
const apiKeyAuth = require('../middleware/auth');

router.use(apiKeyAuth);

router.post('/', async (req, res) => {
  try {
    const newObject = await Object.create(req.body);
    res.status(201).json({ success: true, data: newObject });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const objects = await Object.find().sort({ createdAt: -1 });
    res.json({ success: true, data: objects });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const obj = await Object.findById(req.params.id);
    if (!obj) return res.status(404).json({ success: false, error: 'Не найдено' });
    res.json({ success: true, data: obj });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const obj = await Object.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!obj) return res.status(404).json({ success: false, error: 'Не найдено' });
    res.json({ success: true, data: obj });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Object.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
