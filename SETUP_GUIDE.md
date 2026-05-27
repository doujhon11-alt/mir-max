# MIR MAX - Веб-приложение для управления проектами

Полнофункциональное веб-приложение для учета объектов, доходов, расходов, сотрудников и зарплаты.

## 🏗️ Архитектура

### Backend (Node.js + Express + MongoDB)

- REST API с защитой через API Key (x-api-key header)
- 7 коллекций MongoDB с полными CRUD операциями
- Все расчеты происходят на frontend

### Frontend (Vue 3 + JavaScript + Tailwind CSS)

- Composition API с script setup
- Composable `useFinanceStats` со всеми формулами расчета
- Автоматическое форматирование в тенге (KZT)
- Реактивное обновление данных

---

## 📁 Структура проекта

```
project/
├── backend/
│   ├── models/
│   │   ├── Object.js
│   │   ├── Income.js
│   │   ├── Expense.js
│   │   ├── Employee.js
│   │   ├── SalaryAccrual.js
│   │   ├── SalaryPayment.js
│   │   └── Debt.js
│   ├── routes/
│   │   ├── objects.js
│   │   ├── incomes.js
│   │   ├── expenses.js
│   │   ├── employees.js
│   │   ├── salaryAccruals.js
│   │   ├── salaryPayments.js
│   │   └── debts.js
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
├── src/
│   ├── api/
│   │   └── client.js
│   ├── composables/
│   │   └── useFinanceStats.js
│   ├── components/
│   │   ├── DashboardCards.vue
│   │   ├── ObjectsTable.vue
│   │   ├── IncomesTable.vue
│   │   ├── ExpensesTable.vue
│   │   ├── EmployeesTable.vue
│   │   ├── SalaryTable.vue
│   │   └── DebtsTable.vue
│   ├── App.vue
│   └── main.js
├── .env.frontend.example
└── README.md
```

---

## 🚀 Установка и запуск

### Backend

```bash
# Перейти в папку проекта
cd /Users/sayat/Desktop/mir-max.worktrees/agents-mirmax-backend-api-setup

# Установить зависимости
npm install

# Скопировать .env.example в .env
cp .env.example .env

# Обновить .env с вашими данными MongoDB Atlas
# PORT=5000
# MONGODB_URI=mongodb+srv://apalon:PASSWORD@cluster0.9anqgkn.mongodb.net/mirmax...
# CLIENT_URL=http://localhost:5173
# PERSONAL_API_KEY=your_secret_key

# Запустить backend
npm run dev:backend
```

Backend будет работать на `http://localhost:5000`

### Frontend (Vue 3)

```bash
# Убедитесь, что установлены:
# - Node.js 18+
# - npm

# Скопировать .env.frontend.example в .env.local
cp .env.frontend.example .env.local

# Запустить dev server
npm run dev
```

Frontend будет работать на `http://localhost:5173`

### Netlify

На Netlify обычный `server.js` не запускается как постоянный процесс. Для продакшена backend обернут в Netlify Function:

```text
netlify/functions/api.js
```

`netlify.toml` делает redirects:

```text
/api/*  -> /.netlify/functions/api/api/:splat
/health -> /.netlify/functions/api/health
/*      -> /index.html
```

В Netlify Environment Variables добавь:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/mirmax?retryWrites=true&w=majority&appName=Cluster0
CLIENT_URL=https://your-site.netlify.app
PERSONAL_API_KEY=your_secret_key
VITE_API_URL=
VITE_API_KEY=your_secret_key
```

`VITE_API_URL` на Netlify должен быть пустым, чтобы frontend ходил на относительные `/api/*` URL.

---

## 📊 Коллекции MongoDB

### 1. Objects (Объекты)

```javascript
{
  name: String,              // Название объекта
  clientName: String,        // Имя клиента
  phone: String,             // Контакт
  address: String,           // Адрес
  contractAmount: Number,    // Сумма контракта
  startDate: Date,           // Дата начала
  deadline: Date,            // Крайний срок
  status: String,            // active/completed/paused/canceled
  comment: String,
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Incomes (Доходы)

```javascript
{
  objectId: ObjectId,        // Ссылка на объект
  amount: Number,            // Сумма дохода
  status: String,            // "Получено" или "Ожидается"
  date: Date,
  paymentMethod: String,     // Способ оплаты
  comment: String
}
```

### 3. Expenses (Расходы)

```javascript
{
  objectId: ObjectId,        // Ссылка на объект
  category: String,          // Категория расхода
  title: String,             // Название
  quantity: Number,          // Количество
  price: Number,             // Цена за единицу
  date: Date,
  employeeId: ObjectId,      // Кто получил (опционально)
  comment: String
  // На frontend считается: quantity * price
}
```

### 4. Employees (Сотрудники)

```javascript
{
  fullName: String,          // Ф.И.О.
  phone: String,
  position: String,          // Должность
  salary: Number,            // Зарплата
  status: String,            // "active" или "fired"
  comment: String
}
```

### 5. SalaryAccruals (Начисления зарплаты)

```javascript
{
  employeeId: ObjectId,      // Ссылка на сотрудника
  objectId: ObjectId,        // Опционально - по какому объекту
  amount: Number,            // Сумма начисления
  period: String,            // "Месяц" и т.д.
  date: Date,
  comment: String
}
```

### 6. SalaryPayments (Выплаты зарплаты)

```javascript
{
  employeeId: ObjectId,      // Ссылка на сотрудника
  amount: Number,            // Сумма выплаты
  date: Date,
  paymentType: String,       // "Зарплата" или "Аванс"
  comment: String
}
```

### 7. Debts (Долги сотрудников)

```javascript
{
  employeeId: ObjectId,      // Ссылка на сотрудника
  objectId: ObjectId,        // Опционально - по какому объекту
  amount: Number,            // Сумма долга (выданные деньги)
  reimbursed: Number,        // Уже возвращено
  date: Date,
  comment: String
  // На frontend считается: amount - reimbursed (остаток)
}
```

---

## 🔐 API Key защита

Все API endpoints требуют header:

```bash
x-api-key: change_this_secret_key
```

### Endpoints

```
GET /health                      # Проверка здоровья API
GET /                            # Информация об API

POST   /api/objects              # Создать объект
GET    /api/objects              # Получить все объекты
GET    /api/objects/:id          # Получить объект по ID
PATCH  /api/objects/:id          # Обновить объект
DELETE /api/objects/:id          # Удалить объект

POST   /api/incomes
GET    /api/incomes
GET    /api/incomes/:id
PATCH  /api/incomes/:id
DELETE /api/incomes/:id

POST   /api/expenses
GET    /api/expenses
GET    /api/expenses/:id
PATCH  /api/expenses/:id
DELETE /api/expenses/:id

POST   /api/employees
GET    /api/employees
GET    /api/employees/:id
PATCH  /api/employees/:id
DELETE /api/employees/:id

POST   /api/salary-accruals
GET    /api/salary-accruals
GET    /api/salary-accruals/:id
PATCH  /api/salary-accruals/:id
DELETE /api/salary-accruals/:id

POST   /api/salary-payments
GET    /api/salary-payments
GET    /api/salary-payments/:id
PATCH  /api/salary-payments/:id
DELETE /api/salary-payments/:id

POST   /api/debts
GET    /api/debts
GET    /api/debts/:id
PATCH  /api/debts/:id
DELETE /api/debts/:id
```

---

## 📐 Формулы расчета (Frontend)

Все формулы вычисляются в composable `useFinanceStats`:

### Доходы

```javascript
receivedIncome = сумма всех incomes со статусом "Получено"
expectedIncome = сумма всех incomes со статусом "Ожидается"
totalIncomes = receivedIncome + expectedIncome

// По объекту:
getObjectReceived(objectId) = сумма "Получено" по objectId
getObjectExpected(objectId) = сумма "Ожидается" по objectId
```

### Расходы

```javascript
totalObjectExpenses = сумма всех (quantity * price)
getObjectExpenses(objectId) = сумма расходов по objectId
```

### Прибыль по объекту

```javascript
getObjectProfit(objectId) = getObjectReceived(objectId) - getObjectExpenses(objectId)
getObjectMargin(objectId) = (profit / received) * 100
  // Если received = 0, то маржа = 0
```

### Зарплата

```javascript
totalSalaryAccrued = сумма всех salaryAccruals.amount
totalSalaryPaid = сумма всех salaryPayments.amount
salaryDebt = totalSalaryAccrued - totalSalaryPaid
```

### Личные долги

```javascript
totalPersonalExpenses = сумма всех debts.amount
totalReimbursed = сумма всех debts.reimbursed
totalDebt = totalPersonalExpenses - totalReimbursed
```

### Дашборд

```javascript
totalExpenses = totalObjectExpenses + totalSalaryAccrued;
netProfit = receivedIncome - totalExpenses;
```

---

## 🎨 Frontend компоненты

### DashboardCards.vue

Показывает 8 основных показателей:

- Получено доходов
- Ожидается доходов
- Всего расходов
- Чистая прибыль
- Долг по зарплате
- Долг сотрудников
- Всего начислено
- Всего выплачено

### ObjectsTable.vue

Управление объектами с полной информацией.

### IncomesTable.vue

Управление доходами с привязкой к объектам.

### ExpensesTable.vue

Управление расходами. Сумма считается на frontend: quantity × price.

### EmployeesTable.vue

Управление сотрудниками (активные/уволенные).

### SalaryTable.vue

Раздел с двумя таблицами:

- Начисления зарплаты
- Выплаты (зарплата/авансы)

### DebtsTable.vue

Управление личными долгами сотрудников. Остаток долга считается на frontend.

---

## 🔄 API Client

Файл `src/api/client.js` предоставляет функции для работы с API:

```javascript
import client from '@/api/client';

// GET запрос
const data = await client.get('/api/objects');

// POST запрос
const newObj = await client.post('/api/objects', { name: 'Объект 1' });

// PATCH запрос
const updated = await client.patch('/api/objects/123', { status: 'completed' });

// DELETE запрос
await client.delete('/api/objects/123');
```

Автоматически добавляет:

- `x-api-key` header
- `Content-Type: application/json`

---

## ⚙️ Переменные окружения

### Backend (.env)

```
PORT=5000
MONGODB_URI=mongodb+srv://apalon:PASSWORD@cluster0.9anqgkn.mongodb.net/mirmax...
CLIENT_URL=http://localhost:5173
PERSONAL_API_KEY=change_this_secret_key
```

### Frontend (.env.local)

```
VITE_API_URL=http://localhost:5000
VITE_API_KEY=change_this_secret_key
```

---

## 📝 Примеры использования

### Добавить объект

```bash
curl -X POST http://localhost:5000/api/objects \
  -H "Content-Type: application/json" \
  -H "x-api-key: change_this_secret_key" \
  -d '{
    "name": "Офис 1",
    "clientName": "ООО Компания",
    "phone": "+77777777777",
    "address": "Алматы, ул. Жибек жолы",
    "contractAmount": 5000000,
    "status": "active"
  }'
```

### Добавить доход

```bash
curl -X POST http://localhost:5000/api/incomes \
  -H "Content-Type: application/json" \
  -H "x-api-key: change_this_secret_key" \
  -d '{
    "objectId": "507f1f77bcf86cd799439011",
    "amount": 2000000,
    "status": "Получено",
    "paymentMethod": "Банк"
  }'
```

---

## ✅ Требования выполнены

✓ MongoDB хранит только сырые данные  
✓ Все расчеты на frontend через composables  
✓ Vue 3 script setup + Composition API  
✓ Tailwind CSS для стилей  
✓ Форматирование в тенге (KZT)  
✓ API Key защита  
✓ Автоматическое обновление данных  
✓ Запрет на отрицательные числа  
✓ Обработка пустых/NaN значений  
✓ CRUD для всех 7 коллекций  
✓ Готово для production (Render/Railway)

---

## 📞 Помощь

Для вопросов и ошибок проверьте:

1. MongoDB Atlas подключение
2. API Key в .env
3. CORS настройки
4. Консоль браузера (DevTools)
5. Логи backend сервера
