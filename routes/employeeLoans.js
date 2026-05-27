const express = require('express');
const router = express.Router();
const EmployeeLoan = require('../models/EmployeeLoan');
const apiKeyAuth = require('../middleware/auth');

router.use(apiKeyAuth);

router.post('/', async (req, res) => {
  try {
    const newLoan = await EmployeeLoan.create(req.body);
    res.status(201).json({ success: true, data: newLoan });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const loans = await EmployeeLoan.find().sort({ createdAt: -1 });
    res.json({ success: true, data: loans });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const loan = await EmployeeLoan.findById(req.params.id);
    if (!loan) return res.status(404).json({ success: false, error: 'Не найдено' });
    res.json({ success: true, data: loan });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const loan = await EmployeeLoan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!loan) return res.status(404).json({ success: false, error: 'Не найдено' });
    res.json({ success: true, data: loan });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await EmployeeLoan.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
