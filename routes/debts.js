const express = require('express');
const router = express.Router();
const Debt = require('../models/Debt');

router.post('/', async (req, res) => {
  try {
    const newDebt = await Debt.create(req.body);
    res.status(201).json({ success: true, data: newDebt });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const debts = await Debt.find().sort({ createdAt: -1 });
    res.json({ success: true, data: debts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const debt = await Debt.findById(req.params.id);
    if (!debt) return res.status(404).json({ success: false, error: 'Не найдено' });
    res.json({ success: true, data: debt });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const debt = await Debt.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!debt) return res.status(404).json({ success: false, error: 'Не найдено' });
    res.json({ success: true, data: debt });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Debt.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
