const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

if (!MONGODB_URI) {
  console.error('❌ Ошибка: MONGODB_URI не установлен в .env файле');
  process.exit(1);
}

app.use(cors({
  origin: CLIENT_URL,
  credentials: true
}));

app.use(express.json());

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ Подключено к MongoDB Atlas'))
  .catch((error) => {
    console.error('❌ Ошибка подключения к MongoDB:', error.message);
    process.exit(1);
  });

app.get('/', (req, res) => {
  res.json({
    message: 'MIR MAX API работает',
    version: '1.0.0',
    endpoints: {
      'POST /api/requests': 'Создать новую заявку',
      'GET /api/requests': 'Получить все заявки',
      'GET /api/requests/:id': 'Получить заявку по ID',
      'PATCH /api/requests/:id': 'Обновить заявку',
      'DELETE /api/requests/:id': 'Удалить заявку'
    }
  });
});

const requestRoutes = require('./routes/requestRoutes');
app.use('/api/requests', requestRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint не найден'
  });
});

app.use((error, req, res, next) => {
  console.error('❌ Ошибка:', error.message);
  res.status(500).json({
    success: false,
    message: 'Внутренняя ошибка сервера',
    error: error.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 MIR MAX Backend запущен на http://localhost:${PORT}`);
  console.log(`🔗 MongoDB URI: ${MONGODB_URI.substring(0, 50)}...`);
});
