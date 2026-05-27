require('dotenv').config();

const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Ошибка: MONGODB_URI не установлен в .env файле');
  process.exit(1);
}

async function start() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 10000
    });
    console.log('Подключено к MongoDB Atlas');

    app.listen(PORT, () => {
      console.log(`MIR MAX Backend запущен на http://localhost:${PORT}`);
      console.log('API Key требуется: x-api-key header');
    });
  } catch (error) {
    console.error('Ошибка подключения к MongoDB:', error.message);
    process.exit(1);
  }
}

start();
