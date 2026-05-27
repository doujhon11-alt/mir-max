const express = require('express');
const router = express.Router();
const SelectOption = require('../models/SelectOption');
const apiKeyAuth = require('../middleware/auth');

router.use(apiKeyAuth);

router.post('/', async (req, res) => {
  try {
    const option = await SelectOption.create(req.body);
    res.status(201).json({ success: true, data: option });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const query = req.query.category ? { category: req.query.category } : {};
    const options = await SelectOption.find(query).sort({ category: 1, name: 1 });
    res.json({ success: true, data: options });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const option = await SelectOption.findById(req.params.id);
    if (!option) return res.status(404).json({ success: false, error: 'Не найдено' });
    res.json({ success: true, data: option });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const option = await SelectOption.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!option) return res.status(404).json({ success: false, error: 'Не найдено' });
    res.json({ success: true, data: option });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await SelectOption.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
