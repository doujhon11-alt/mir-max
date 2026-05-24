# Mir Max Private Netlify + Apps Script

Без Google Cloud и без кредитки.

## Схема

Netlify сайт -> Netlify Functions -> Apps Script API -> Google Sheets.

## Установка Apps Script

1. Google Таблица -> Расширения -> Apps Script.
2. Вставь `apps-script/Code.gs`.
3. В начале файла замени:

```js
apiToken: 'PASTE_SAME_TOKEN_HERE'
```

на:

```text
bc0d08931aafdf815b2cbd4238a68c1288eca52946c65902
```

4. Deploy -> New deployment -> Web app.
5. Execute as: Me.
6. Who has access: Anyone.
7. Deploy и скопируй Web App URL.

## Netlify Environment Variables

В Netlify -> Project configuration -> Environment variables добавь:

```env
ADMIN_PASSWORD=твой_пароль_для_сайта
SESSION_SECRET=f7434e38903b655ab9bac1c312d15972612bb99cb5a282bea0ebacbe9952b196
APPS_SCRIPT_URL=твой_Web_App_URL_из_Apps_Script
APPS_SCRIPT_TOKEN=bc0d08931aafdf815b2cbd4238a68c1288eca52946c65902
```

`APPS_SCRIPT_TOKEN` должен совпадать с `apiToken` в Code.gs.

## Deploy

Залей эти файлы в GitHub репозиторий, который подключен к Netlify:

```bash
git add .
git commit -m "Add private Mir Max app"
git push
```

Потом открой сайт: `https://mir-max.netlify.app`.

## Почему это безопасно

- Пароль проверяется на Netlify Function, не в браузере.
- Apps Script принимает запросы только с секретным token.
- Google таблица может оставаться закрытой в твоем Google Drive.
