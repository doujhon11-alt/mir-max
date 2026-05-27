const express = require('express');
const router = express.Router();
const SalaryPayment = require('../models/SalaryPayment');

router.post('/', async (req, res) => {
  try {
    const newPayment = await SalaryPayment.create(req.body);
    res.status(201).json({ success: true, data: newPayment });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const payments = await SalaryPayment.find().sort({ createdAt: -1 });
    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const payment = await SalaryPayment.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, error: 'Не найдено' });
    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const payment = await SalaryPayment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!payment) return res.status(404).json({ success: false, error: 'Не найдено' });
    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await SalaryPayment.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
