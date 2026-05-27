# MIR MAX

Веб-приложение для учета объектов, доходов, расходов, сотрудников, зарплаты и долгов.

## Стек

- Frontend: Vue 3, Composition API, JavaScript, Tailwind CSS, Vite
- Backend: Node.js, Express, Mongoose, MongoDB Atlas
- Защита API: header `x-api-key`

## Архитектура

MongoDB хранит только сырые данные. Расчетные значения считаются на frontend в `src/composables/useFinanceStats.js`:

- доходы получено/ожидается
- расходы `quantity * price`
- прибыль и маржа по объекту
- долг по зарплате
- остаток долга сотрудника
- итоги dashboard

## Запуск

1. Установить зависимости:

```bash
npm install
```

2. Создать backend env:

```bash
cp .env.example .env
```

3. Создать frontend env:

```bash
cp .env.frontend.example .env.local
```

4. В `.env` указать MongoDB Atlas URI и `PERSONAL_API_KEY`.

5. В `.env.local` указать такой же ключ в `VITE_API_KEY`.

6. Запустить backend:

```bash
npm run dev:backend
```

7. Во втором терминале запустить frontend:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:5000`

## API

Публичный healthcheck:

```text
GET /health
```

CRUD endpoints, все требуют `x-api-key`:

```text
/api/objects
/api/incomes
/api/expenses
/api/employees
/api/salary-accruals
/api/salary-payments
/api/debts
```

Для каждого endpoint доступны:

```text
POST /
GET /
GET /:id
PATCH /:id
DELETE /:id
```

## Проверка

```bash
curl http://localhost:5000/api/objects \
  -H "x-api-key: your_secret_key"
```

Без ключа API должен вернуть:

```json
{"success":false,"message":"Неверный API ключ"}
```
