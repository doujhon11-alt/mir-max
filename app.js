const express = require('express');
const cors = require('cors');

const objectsRoutes = require('./routes/objects');
const incomesRoutes = require('./routes/incomes');
const expensesRoutes = require('./routes/expenses');
const employeesRoutes = require('./routes/employees');
const salaryAccrualsRoutes = require('./routes/salaryAccruals');
const salaryPaymentsRoutes = require('./routes/salaryPayments');
const debtsRoutes = require('./routes/debts');

const app = express();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const API_KEY = process.env.PERSONAL_API_KEY || 'change_this_secret_key';
const allowedOrigins = new Set([
  CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173'
]);

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

app.use((req, res, next) => {
  const functionPrefix = '/.netlify/functions/api';
  if (req.url.startsWith(functionPrefix)) {
    req.url = req.url.slice(functionPrefix.length) || '/';
  }
  next();
});

const checkApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== API_KEY) {
    return res.status(403).json({ success: false, message: 'Неверный API ключ' });
  }
  next();
};

app.get('/health', (req, res) => {
  res.json({ success: true, status: 'ok', message: 'MIR MAX API работает' });
});

app.get('/', (req, res) => {
  res.json({
    success: true,
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
  console.error('Ошибка:', error.message);
  res.status(500).json({
    success: false,
    message: 'Внутренняя ошибка сервера',
    error: error.message
  });
});

module.exports = app;
