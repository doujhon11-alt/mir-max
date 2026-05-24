/**
 * Mir Max Clean Rewrite
 * Apps Script backend + API for Google Sheets
 *
 * Spreadsheet:
 * 1QcJPAKfbN0TbB4AfLwz3F8i2mc0h3IhrW1Ro-mA0rDE
 */

const APP = {
  apiToken: 'PASTE_SAME_TOKEN_HERE',
  spreadsheetId: '1QcJPAKfbN0TbB4AfLwz3F8i2mc0h3IhrW1Ro-mA0rDE',
  sheets: {
    objects: 'Объекты',
    expenses: 'Расходы',
    incomes: 'Доходы',
    salaryAccruals: 'Начисления зарплаты',
    salaryPayments: 'Выплаты',
  },
  statuses: {
    activeExpenses: ['Одобрено', 'Возмещено'],
    activeIncomes: ['Получено', 'Частично'],
  },
  aliases: {
    id: ['ID', 'Id', 'id', 'Код', 'UID'],
    no: ['№', 'Номер', 'Номер объекта', '№ объекта', 'Объект', 'ID объекта'],
    date: ['Дата', 'Дата операции', 'Дата платежа', 'Дата расхода'],
    month: ['Месяц', 'Период'],
    client: ['Клиент', 'Заказчик', 'Имя клиента'],
    phone: ['Телефон', 'Номер телефона'],
    address: ['Адрес', 'Адрес объекта'],
    contract: ['Сумма договора', 'Договор', 'Стоимость договора', 'Сумма объекта'],
    status: ['Статус', 'Состояние'],
    employee: ['Сотрудник', 'Работник', 'Исполнитель', 'Кто потратил', 'Кто расходовал'],
    category: ['Категория', 'Категория расхода', 'Тип расхода'],
    description: ['Описание', 'Комментарий', 'Примечание', 'Наименование'],
    qty: ['Кол-во', 'Количество', 'К-во'],
    price: ['Цена', 'Цена за ед.', 'Цена за единицу'],
    amount: ['Сумма', 'Итого', 'Сумма оплаты', 'Сумма расхода', 'Общая сумма', 'Итоговая сумма'],
    paidBy: ['Кто оплатил', 'Оплатил', 'Источник оплаты'],
    paymentMethod: ['Способ оплаты', 'Метод оплаты'],
    type: ['Тип платежа', 'Тип выплаты', 'Тип', 'Назначение'],
    salary: ['Оклад', 'Зарплата'],
    bonus: ['Бонус', 'Премия'],
    accrued: ['Начислено', 'Начисленная зарплата'],
  },
};

/**
 * WEB APP
 */
function doGet(e) {
  return json_({ ok: true, app: 'Mir Max Apps Script API', message: 'API работает. Интерфейс на Netlify.' });
}

function doPost(e) {
  try {
    const body = e && e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};

    if (!APP.apiToken || APP.apiToken === 'PASTE_SAME_TOKEN_HERE') {
      throw new Error('В Code.gs не задан APP.apiToken');
    }

    if (String(body.token || '') !== String(APP.apiToken)) {
      throw new Error('Нет доступа: неверный API token');
    }

    const result = route_(body.action, body.payload || {});
    return json_({ ok: true, data: result });
  } catch (error) {
    return json_({ ok: false, error: errorMessage_(error) });
  }
}

function route_(action, payload) {
  const routes = {
    ping: () => ping(),
    getInitialData: () => getInitialData(),
    debugWorkbook: () => debugWorkbook(),
    addObject: () => addObject(payload),
    addExpense: () => addExpense(payload),
    addIncome: () => addIncome(payload),
    updateObjectStatus: () => updateObjectStatus(payload.objectNo, payload.status),
    updateExpenseStatus: () => updateExpenseStatus(payload.id, payload.status),
    updateIncomeStatus: () => updateIncomeStatus(payload.id, payload.status),
  };

  if (!routes[action]) throw new Error('Unknown action: ' + action);
  return routes[action]();
}

/**
 * PUBLIC API FOR google.script.run
 */
function ping() {
  const ss = db_();
  return {
    ok: true,
    spreadsheetName: ss.getName(),
    timestamp: new Date().toISOString(),
  };
}

function getInitialData() {
  return {
    objects: getObjects(),
    expenses: getExpenses(),
    incomes: getIncomes(),
    salaries: getSalaries(),
  };
}

function debugWorkbook() {
  const ss = db_();
  const names = Object.values(APP.sheets);

  const sheets = names.map((name) => {
    const sheet = ss.getSheetByName(name);
    if (!sheet) return { name, exists: false, error: 'Лист не найден' };

    const meta = meta_(sheet);
    const count = Math.max(0, Math.min(3, sheet.getLastRow() - meta.headerRow));
    const sampleRows = count ? sheet.getRange(meta.headerRow + 1, 1, count, meta.lastCol).getDisplayValues() : [];

    return {
      name,
      exists: true,
      lastRow: sheet.getLastRow(),
      lastCol: sheet.getLastColumn(),
      detectedHeaderRow: meta.headerRow,
      detectedHeaders: meta.headers,
      sampleRows,
    };
  });

  let parsedCounts = {};
  let parsedSums = {};

  try {
    const rows = getObjects();
    parsedCounts.objects = rows.length;
  } catch (e) {
    parsedCounts.objectsError = errorMessage_(e);
  }

  try {
    const rows = getExpenses();
    parsedCounts.expenses = rows.length;
    parsedSums.expensesAmount = rows.reduce((sum, row) => sum + number_(row.amount), 0);
  } catch (e) {
    parsedCounts.expensesError = errorMessage_(e);
  }

  try {
    const rows = getIncomes();
    parsedCounts.incomes = rows.length;
    parsedSums.incomesAmount = rows.reduce((sum, row) => sum + number_(row.amount), 0);
  } catch (e) {
    parsedCounts.incomesError = errorMessage_(e);
  }

  try {
    const rows = getSalaries();
    parsedCounts.salaries = rows.length;
  } catch (e) {
    parsedCounts.salariesError = errorMessage_(e);
  }

  return {
    spreadsheetName: ss.getName(),
    spreadsheetId: APP.spreadsheetId,
    parsedCounts,
    parsedSums,
    sheets,
  };
}

function getObjects() {
  const sheet = sheet_(APP.sheets.objects);
  const table = table_(sheet);

  return table.rows.map((row) => {
    const no = cell_(row, table.headers, APP.aliases.no);
    if (blank_(no)) return null;

    return {
      no: number_(no),
      client: text_(cell_(row, table.headers, APP.aliases.client)),
      phone: text_(cell_(row, table.headers, APP.aliases.phone)),
      address: text_(cell_(row, table.headers, APP.aliases.address)),
      contract: number_(cell_(row, table.headers, APP.aliases.contract)),
      status: text_(cell_(row, table.headers, APP.aliases.status)) || 'Новый',
      rowNumber: row.__rowNumber,
    };
  }).filter(Boolean);
}

function getExpenses() {
  const sheet = sheet_(APP.sheets.expenses);
  const table = table_(sheet);

  return table.rows.map((row) => {
    const objectNo = cell_(row, table.headers, APP.aliases.no);
    const amountRaw = cell_(row, table.headers, APP.aliases.amount);
    const qty = number_(cell_(row, table.headers, APP.aliases.qty));
    const price = number_(cell_(row, table.headers, APP.aliases.price));
    const amount = number_(amountRaw) || (qty && price ? qty * price : 0);

    if (blank_(objectNo) && !amount) return null;

    return {
      id: stableId_(row, table.headers),
      date: date_(cell_(row, table.headers, APP.aliases.date)),
      employee: text_(cell_(row, table.headers, APP.aliases.employee)),
      objectNo: number_(objectNo),
      category: text_(cell_(row, table.headers, APP.aliases.category)),
      description: text_(cell_(row, table.headers, APP.aliases.description)),
      qty,
      price,
      amount,
      status: text_(cell_(row, table.headers, APP.aliases.status)) || 'Ожидает',
      paidBy: text_(cell_(row, table.headers, APP.aliases.paidBy)),
      paymentMethod: text_(cell_(row, table.headers, APP.aliases.paymentMethod)),
      rowNumber: row.__rowNumber,
    };
  }).filter(Boolean);
}

function getIncomes() {
  const sheet = sheet_(APP.sheets.incomes);
  const table = table_(sheet);

  return table.rows.map((row) => {
    const objectNo = cell_(row, table.headers, APP.aliases.no);
    const amount = number_(cell_(row, table.headers, APP.aliases.amount));
    if (blank_(objectNo) && !amount) return null;

    return {
      id: stableId_(row, table.headers),
      date: date_(cell_(row, table.headers, APP.aliases.date)),
      objectNo: number_(objectNo),
      client: text_(cell_(row, table.headers, APP.aliases.client)),
      type: text_(cell_(row, table.headers, APP.aliases.type)),
      amount,
      status: text_(cell_(row, table.headers, APP.aliases.status)) || 'Ожидается',
      paymentMethod: text_(cell_(row, table.headers, APP.aliases.paymentMethod)),
      rowNumber: row.__rowNumber,
    };
  }).filter(Boolean);
}

function getSalaries() {
  const accruals = table_(sheet_(APP.sheets.salaryAccruals));
  const payments = table_(sheet_(APP.sheets.salaryPayments));
  const map = {};

  accruals.rows.forEach((row) => {
    const employee = text_(cell_(row, accruals.headers, APP.aliases.employee));
    if (!employee) return;

    const month = month_(cell_(row, accruals.headers, APP.aliases.month), cell_(row, accruals.headers, APP.aliases.date));
    if (!month) return;

    const key = month + '|' + employee;
    if (!map[key]) map[key] = { id: key, month, employee, salary: 0, bonus: 0, advance: 0, paid: 0 };

    const salary = number_(cell_(row, accruals.headers, APP.aliases.salary));
    const bonus = number_(cell_(row, accruals.headers, APP.aliases.bonus));
    const accrued = number_(cell_(row, accruals.headers, APP.aliases.accrued));

    if (salary || bonus) {
      map[key].salary += salary;
      map[key].bonus += bonus;
    } else if (accrued) {
      map[key].salary += accrued;
    }
  });

  payments.rows.forEach((row) => {
    const employee = text_(cell_(row, payments.headers, APP.aliases.employee));
    if (!employee) return;

    const month = month_(cell_(row, payments.headers, APP.aliases.month), cell_(row, payments.headers, APP.aliases.date));
    if (!month) return;

    const key = month + '|' + employee;
    if (!map[key]) map[key] = { id: key, month, employee, salary: 0, bonus: 0, advance: 0, paid: 0 };

    const type = text_(cell_(row, payments.headers, APP.aliases.type)).toLowerCase();
    const amount = number_(cell_(row, payments.headers, APP.aliases.amount));

    if (type.indexOf('аванс') >= 0) map[key].advance += amount;
    else map[key].paid += amount;
  });

  return Object.values(map).sort((a, b) => {
    const m = String(a.month).localeCompare(String(b.month));
    if (m) return m;
    return String(a.employee).localeCompare(String(b.employee), 'ru');
  });
}

function addObject(payload) {
  payload = payload || {};
  if (!payload.client) throw new Error('Клиент обязателен');
  if (!payload.address) throw new Error('Адрес обязателен');
  if (!number_(payload.contract)) throw new Error('Сумма договора обязательна');

  const sheet = sheet_(APP.sheets.objects);
  const headers = headers_(sheet);
  const row = emptyRow_(sheet);
  const no = payload.no ? number_(payload.no) : nextObjectNo_();

  set_(sheet, headers, row, APP.aliases.no, '№', no);
  set_(sheet, headers, row, APP.aliases.client, 'Клиент', payload.client || '');
  set_(sheet, headers, row, APP.aliases.phone, 'Телефон', payload.phone || '');
  set_(sheet, headers, row, APP.aliases.address, 'Адрес', payload.address || '');
  set_(sheet, headers, row, APP.aliases.contract, 'Сумма договора', number_(payload.contract));
  set_(sheet, headers, row, APP.aliases.status, 'Статус', payload.status || 'Новый');

  sheet.appendRow(row);
  return { ok: true, objectNo: no };
}

function addExpense(payload) {
  payload = payload || {};
  if (!payload.date) throw new Error('Дата обязательна');
  if (!payload.objectNo) throw new Error('Объект обязателен');

  const qty = number_(payload.qty || 1);
  const price = number_(payload.price);
  const amount = payload.amount !== undefined ? number_(payload.amount) : qty * price;

  if (!amount) throw new Error('Сумма расхода обязательна');

  const sheet = sheet_(APP.sheets.expenses);
  const headers = headers_(sheet);
  const row = emptyRow_(sheet);
  const id = payload.id || id_('EXP');

  set_(sheet, headers, row, APP.aliases.id, 'ID', id);
  set_(sheet, headers, row, APP.aliases.date, 'Дата', payload.date);
  set_(sheet, headers, row, APP.aliases.employee, 'Кто потратил', payload.employee || '');
  set_(sheet, headers, row, APP.aliases.no, '№ объекта', number_(payload.objectNo));
  set_(sheet, headers, row, APP.aliases.category, 'Категория', payload.category || '');
  set_(sheet, headers, row, APP.aliases.description, 'Описание', payload.description || '');
  set_(sheet, headers, row, APP.aliases.qty, 'Кол-во', qty);
  set_(sheet, headers, row, APP.aliases.price, 'Цена', price);
  set_(sheet, headers, row, APP.aliases.amount, 'Общая сумма', amount);
  set_(sheet, headers, row, APP.aliases.paidBy, 'Кто оплатил', payload.paidBy || 'Компания');
  set_(sheet, headers, row, APP.aliases.paymentMethod, 'Способ оплаты', payload.paymentMethod || '');
  set_(sheet, headers, row, APP.aliases.status, 'Статус', payload.status || 'Ожидает');

  sheet.appendRow(row);
  return { ok: true, id };
}

function addIncome(payload) {
  payload = payload || {};
  if (!payload.date) throw new Error('Дата обязательна');
  if (!payload.objectNo) throw new Error('Объект обязателен');
  if (!number_(payload.amount)) throw new Error('Сумма дохода обязательна');

  const sheet = sheet_(APP.sheets.incomes);
  const headers = headers_(sheet);
  const row = emptyRow_(sheet);
  const id = payload.id || id_('INC');
  const object = getObjects().find((item) => Number(item.no) === Number(payload.objectNo));

  set_(sheet, headers, row, APP.aliases.id, 'ID', id);
  set_(sheet, headers, row, APP.aliases.date, 'Дата', payload.date);
  set_(sheet, headers, row, APP.aliases.no, '№ объекта', number_(payload.objectNo));
  set_(sheet, headers, row, APP.aliases.client, 'Клиент', payload.client || (object ? object.client : ''));
  set_(sheet, headers, row, APP.aliases.type, 'Тип платежа', payload.type || 'Оплата');
  set_(sheet, headers, row, APP.aliases.amount, 'Сумма', number_(payload.amount));
  set_(sheet, headers, row, APP.aliases.paymentMethod, 'Способ оплаты', payload.paymentMethod || '');
  set_(sheet, headers, row, APP.aliases.status, 'Статус', payload.status || 'Получено');

  sheet.appendRow(row);
  return { ok: true, id };
}

function updateObjectStatus(objectNo, status) {
  const sheet = sheet_(APP.sheets.objects);
  const headers = headers_(sheet);
  const noCol = col_(headers, APP.aliases.no);
  if (!noCol) throw new Error('В листе Объекты не найдена колонка №');

  const statusCol = ensureCol_(sheet, headers, APP.aliases.status, 'Статус');
  const foundRow = findRowByValue_(sheet, noCol, objectNo, headerRow_(sheet) + 1);

  if (!foundRow) throw new Error('Объект не найден: ' + objectNo);

  sheet.getRange(foundRow, statusCol).setValue(status);
  return { ok: true, objectNo, status };
}

function updateExpenseStatus(id, status) {
  return updateRowStatus_(APP.sheets.expenses, id, status);
}

function updateIncomeStatus(id, status) {
  return updateRowStatus_(APP.sheets.incomes, id, status);
}

function updateRowStatus_(sheetName, id, status) {
  const sheet = sheet_(sheetName);
  const headers = headers_(sheet);
  const statusCol = ensureCol_(sheet, headers, APP.aliases.status, 'Статус');
  const rowNumber = resolveRow_(sheet, headers, id);

  if (!rowNumber) throw new Error('Строка не найдена: ' + id);

  sheet.getRange(rowNumber, statusCol).setValue(status);
  return { ok: true, id, status };
}

/**
 * LOW-LEVEL HELPERS
 */
function db_() {
  return SpreadsheetApp.openById(APP.spreadsheetId);
}

function sheet_(name) {
  const s = db_().getSheetByName(name);
  if (!s) throw new Error('Не найден лист: ' + name);
  return s;
}

function table_(sheet) {
  const meta = meta_(sheet);
  const lastRow = sheet.getLastRow();
  const lastCol = Math.max(sheet.getLastColumn(), meta.headers.length);

  if (lastRow <= meta.headerRow) return { headers: meta.headers, rows: [] };

  return {
    headers: meta.headers,
    rows: sheet.getRange(meta.headerRow + 1, 1, lastRow - meta.headerRow, lastCol)
      .getValues()
      .map((row, index) => {
        row.__rowNumber = meta.headerRow + 1 + index;
        return row;
      }),
  };
}

function meta_(sheet) {
  const headerRow = headerRow_(sheet);
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  return {
    headerRow,
    lastRow: sheet.getLastRow(),
    lastCol,
    headers: sheet.getRange(headerRow, 1, 1, lastCol).getValues()[0].map(text_),
  };
}

function headerRow_(sheet) {
  const lastRow = Math.max(sheet.getLastRow(), 1);
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const rows = Math.min(lastRow, 10);
  const values = sheet.getRange(1, 1, rows, lastCol).getValues();

  const aliasMap = {};
  Object.keys(APP.aliases).forEach((key) => {
    APP.aliases[key].forEach((alias) => aliasMap[norm_(alias)] = true);
  });

  let best = 1;
  let bestScore = -1;

  values.forEach((row, index) => {
    const score = row.reduce((sum, cell) => sum + (aliasMap[norm_(cell)] ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = index + 1;
    }
  });

  return best;
}

function headers_(sheet) {
  return meta_(sheet).headers;
}

function norm_(value) {
  return text_(value).trim().toLowerCase().replace(/\s+/g, ' ');
}

function col_(headers, aliases) {
  const list = aliases.map(norm_);
  for (let i = 0; i < headers.length; i++) {
    if (list.indexOf(norm_(headers[i])) >= 0) return i + 1;
  }
  return 0;
}

function ensureCol_(sheet, headers, aliases, name) {
  const found = col_(headers, aliases);
  if (found) return found;

  const next = sheet.getLastColumn() + 1;
  sheet.getRange(headerRow_(sheet), next).setValue(name);
  headers.push(name);
  return next;
}

function cell_(row, headers, aliases) {
  const c = col_(headers, aliases);
  return c ? row[c - 1] : '';
}

function set_(sheet, headers, row, aliases, name, value) {
  const c = ensureCol_(sheet, headers, aliases, name);
  row[c - 1] = value;
}

function emptyRow_(sheet) {
  return Array.from({ length: Math.max(sheet.getLastColumn(), 1) }, () => '');
}

function resolveRow_(sheet, headers, id) {
  if (String(id).indexOf('row:') === 0) {
    const n = number_(String(id).replace('row:', ''));
    return n >= 2 && n <= sheet.getLastRow() ? n : 0;
  }

  const idCol = col_(headers, APP.aliases.id);
  if (!idCol) return 0;

  return findRowByValue_(sheet, idCol, id, headerRow_(sheet) + 1);
}

function findRowByValue_(sheet, col, value, startRow) {
  const lastRow = sheet.getLastRow();
  if (lastRow < startRow) return 0;

  const values = sheet.getRange(startRow, col, lastRow - startRow + 1, 1).getValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]) === String(value)) return startRow + i;
  }
  return 0;
}

function stableId_(row, headers) {
  const id = cell_(row, headers, APP.aliases.id);
  return blank_(id) ? 'row:' + row.__rowNumber : String(id);
}

function nextObjectNo_() {
  return getObjects().reduce((max, item) => Math.max(max, number_(item.no)), 0) + 1;
}

function text_(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function number_(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value;

  const cleaned = String(value)
    .replace(/\s/g, '')
    .replace(/₸/g, '')
    .replace(/,/g, '.')
    .replace(/[^0-9.\-]/g, '');

  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function blank_(value) {
  return value === null || value === undefined || String(value).trim() === '';
}

function date_(value) {
  if (!value) return '';
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }

  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);

  const parsed = new Date(str);
  if (!isNaN(parsed)) return Utilities.formatDate(parsed, Session.getScriptTimeZone(), 'yyyy-MM-dd');

  return str;
}

function month_(monthValue, dateValue) {
  if (!blank_(monthValue)) {
    const str = String(monthValue).trim();
    if (/^\d{4}-\d{2}/.test(str)) return str.slice(0, 7);

    const parsed = new Date(str);
    if (!isNaN(parsed)) return Utilities.formatDate(parsed, Session.getScriptTimeZone(), 'yyyy-MM');
  }

  const d = date_(dateValue);
  if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 7);

  return '';
}

function id_(prefix) {
  return prefix + '-' + Utilities.getUuid().slice(0, 8) + '-' + Date.now();
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function errorMessage_(error) {
  return String(error && error.message ? error.message : error);
}
