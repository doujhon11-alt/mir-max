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

## Netlify

Проект деплоится в одном репозитории:

- frontend собирается командой `npm run build` в `dist`
- backend на Netlify работает через `netlify/functions/api.js`
- `server.js` используется только для локального запуска Express

Netlify redirects в `netlify.toml` отправляют:

```text
/api/*  -> /.netlify/functions/api/api/:splat
/health -> /.netlify/functions/api/health
/*      -> /index.html
```

Для Netlify environment variables:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/mirmax?retryWrites=true&w=majority&appName=Cluster0
CLIENT_URL=https://your-site.netlify.app
PERSONAL_API_KEY=your_secret_key
VITE_API_URL=
VITE_API_KEY=your_secret_key
```

Локально в `.env.local` оставь:

```env
VITE_API_URL=http://localhost:5000
VITE_API_KEY=your_secret_key
```

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
