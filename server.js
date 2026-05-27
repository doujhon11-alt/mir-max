const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const API_KEY = process.env.PERSONAL_API_KEY || 'change_this_secret_key';
const allowedOrigins = new Set([
  CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173'
]);

if (!MONGODB_URI) {
  console.error('❌ Ошибка: MONGODB_URI не установлен в .env файле');
  process.exit(1);
}

app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    const isLocalNetworkDev = /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+):5173$/.test(origin);
    if (allowedOrigins.has(origin) || isLocalNetworkDev) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true
}));

app.use(express.json());

const checkApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== API_KEY) {
    return res.status(403).json({ success: false, message: 'Неверный API ключ' });
  }
  next();
};

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ Подключено к MongoDB Atlas'))
  .catch((error) => {
    console.error('❌ Ошибка подключения к MongoDB:', error.message);
    process.exit(1);
  });

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'MIR MAX API работает' });
});

app.get('/', (req, res) => {
  res.json({
    message: 'MIR MAX API работает',
    version: '2.0.0',
    endpoints: [
      'GET /health',
      '/api/objects',
      '/api/incomes',
      '/api/expenses',
      '/api/employees',
      '/api/salary-accruals',
      '/api/salary-payments',
      '/api/debts'
    ],
    note: 'Все API endpoints требуют x-api-key в заголовке'
  });
});

const objectsRoutes = require('./routes/objects');
const incomesRoutes = require('./routes/incomes');
const expensesRoutes = require('./routes/expenses');
const employeesRoutes = require('./routes/employees');
const salaryAccrualsRoutes = require('./routes/salaryAccruals');
const salaryPaymentsRoutes = require('./routes/salaryPayments');
const debtsRoutes = require('./routes/debts');

app.use('/api/objects', checkApiKey, objectsRoutes);
app.use('/api/incomes', checkApiKey, incomesRoutes);
app.use('/api/expenses', checkApiKey, expensesRoutes);
app.use('/api/employees', checkApiKey, employeesRoutes);
app.use('/api/salary-accruals', checkApiKey, salaryAccrualsRoutes);
app.use('/api/salary-payments', checkApiKey, salaryPaymentsRoutes);
app.use('/api/debts', checkApiKey, debtsRoutes);

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
  console.log(`🔑 API Key требуется: x-api-key header`);
});
