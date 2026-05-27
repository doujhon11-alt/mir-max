export function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function normalizeString(value) {
  return String(value ?? '').trim();
}

export function formatNumber(value) {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 2
  }).format(toNumber(value)).replace(/\u00a0/g, ' ');
}

export function formatMoney(value) {
  return `${formatNumber(value)} ₸`;
}

export function formatPercent(value) {
  const number = toNumber(value);
  if (number === 0) return '0%';
  return `${number.toFixed(2)}%`;
}

export function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

export function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${formatDate(value)} ${hours}:${minutes}`;
}

export function formatPhone(value) {
  const raw = normalizeString(value);
  if (!raw) return '-';

  const digits = raw.replace(/\D/g, '');
  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    return `+7 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9)}`;
  }

  if (digits.length === 10) {
    return `+7 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`;
  }

  return raw;
}
