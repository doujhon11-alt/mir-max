const express = require('express');
const router = express.Router();
const Request = require('../models/Request');

router.post('/', async (req, res) => {
  try {
    const { name, phone, area, cableLength, withShield, total, comment } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Имя и телефон обязательны'
      });
    }

    const newRequest = await Request.create({
      name,
      phone,
      area,
      cableLength,
      withShield,
      total,
      comment
    });

    res.status(201).json({
      success: true,
      message: 'Заявка успешно создана',
      data: newRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при создании заявки',
      error: error.message
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const requests = await Request.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении заявок',
      error: error.message
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Неверный ID заявки'
      });
    }

    const request = await Request.findById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Заявка не найдена'
      });
    }

    res.status(200).json({
      success: true,
      data: request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении заявки',
      error: error.message
    });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Неверный ID заявки'
      });
    }

    const request = await Request.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Заявка не найдена'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Заявка успешно обновлена',
      data: request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при обновлении заявки',
      error: error.message
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Неверный ID заявки'
      });
    }

    const request = await Request.findByIdAndDelete(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Заявка не найдена'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Заявка успешно удалена'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при удалении заявки',
      error: error.message
    });
  }
});

module.exports = router;
