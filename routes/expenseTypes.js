const express = require('express');
const router = express.Router();
const ExpenseType = require('../models/ExpenseType');
const apiKeyAuth = require('../middleware/auth');

router.use(apiKeyAuth);

router.post('/', async (req, res) => {
  try {
    const expenseType = await ExpenseType.create(req.body);
    res.status(201).json({ success: true, data: expenseType });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const expenseTypes = await ExpenseType.find().sort({ createdAt: -1 });
    res.json({ success: true, data: expenseTypes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const expenseType = await ExpenseType.findById(req.params.id);
    if (!expenseType) return res.status(404).json({ success: false, error: 'Не найдено' });
    res.json({ success: true, data: expenseType });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const expenseType = await ExpenseType.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!expenseType) return res.status(404).json({ success: false, error: 'Не найдено' });
    res.json({ success: true, data: expenseType });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const expenseType = await ExpenseType.findByIdAndDelete(req.params.id);
    if (!expenseType) return res.status(404).json({ success: false, error: 'Не найдено' });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
