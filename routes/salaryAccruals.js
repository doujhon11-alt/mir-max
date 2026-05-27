const express = require('express');
const router = express.Router();
const SalaryAccrual = require('../models/SalaryAccrual');

router.post('/', async (req, res) => {
  try {
    const newAccrual = await SalaryAccrual.create(req.body);
    res.status(201).json({ success: true, data: newAccrual });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const accruals = await SalaryAccrual.find().sort({ createdAt: -1 });
    res.json({ success: true, data: accruals });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const accrual = await SalaryAccrual.findById(req.params.id);
    if (!accrual) return res.status(404).json({ success: false, error: 'Не найдено' });
    res.json({ success: true, data: accrual });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const accrual = await SalaryAccrual.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!accrual) return res.status(404).json({ success: false, error: 'Не найдено' });
    res.json({ success: true, data: accrual });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await SalaryAccrual.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
