<template>
  <div class="panel">
    <div class="section-header">
      <div>
        <h2 class="section-title">Начисления и выплаты зарплаты</h2>
        <p class="section-subtitle">Зарплата считается по сотруднику и месяцу, объект остается необязательным примечанием</p>
      </div>
      <div class="flex gap-2">
        <button type="button" class="btn-secondary" @click="openAccrualCreate"><Plus class="h-4 w-4" />Добавить начисление</button>
        <button type="button" class="btn-primary" @click="openPaymentCreate"><Plus class="h-4 w-4" />Добавить выплату</button>
      </div>
    </div>

    <div v-if="error" class="error-box">{{ error }}</div>
    <div class="table-toolbar">
      <input v-model="salarySearch" class="search-input" placeholder="Поиск по сотруднику, месяцу, объекту или типу" />
    </div>

    <div v-if="loading" class="state-box">Загрузка зарплаты...</div>

    <div v-else class="space-y-6">
      <section>
        <h3 class="mb-3 text-sm font-semibold text-gray-700">Отчет по зарплате за месяц</h3>
        <div v-if="!filteredSalaryReport.length" class="state-box">Пока нет данных по зарплате</div>
        <div v-else class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Сотрудник</th>
                <th>Месяц</th>
                <th class="text-right">Начислено</th>
                <th class="text-right">Выплачено</th>
                <th class="text-right">Остаток</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in filteredSalaryReport" :key="row.key">
                <td>{{ getEmployeeName(row.employeeId) }}</td>
                <td>{{ row.period }}</td>
                <td class="text-right">{{ formatMoney(row.accrued) }}</td>
                <td class="text-right">{{ formatMoney(row.paid) }}</td>
                <td class="text-right font-medium">{{ formatMoney(row.debt) }}</td>
                <td><span class="badge" :class="salaryStatusClass(row.status)">{{ row.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h3 class="mb-3 text-sm font-semibold text-gray-700">Начисления</h3>
          <div v-if="!filteredAccruals.length" class="state-box">Пока нет данных. Добавьте первую запись или измените фильтр.</div>
          <div v-else class="overflow-x-auto">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Сотрудник</th>
                  <th>Месяц</th>
                  <th>Объект</th>
                  <th>Дата</th>
                  <th class="text-right">Сумма</th>
                  <th class="text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="accrual in filteredAccruals" :key="accrual._id">
                  <td>{{ getEmployeeName(accrual.employeeId) }}</td>
                  <td>{{ accrual.period || 'Месяц' }}</td>
                  <td>{{ getObjectName(accrual.objectId) }}</td>
                  <td>{{ formatDate(accrual.date) }}</td>
                  <td class="text-right font-medium">{{ formatMoney(accrual.amount) }}</td>
                  <td class="actions">
                    <button type="button" class="icon-btn" title="Редактировать" aria-label="Редактировать" @click="openAccrualEdit(accrual)"><Pencil class="h-4 w-4" /></button>
                    <button type="button" class="icon-btn-danger" title="Удалить" aria-label="Удалить" @click="deleteAccrual(accrual._id)"><Trash2 class="h-4 w-4" /></button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 class="mb-3 text-sm font-semibold text-gray-700">Выплаты</h3>
          <div v-if="!filteredPayments.length" class="state-box">Пока нет данных. Добавьте первую запись или измените фильтр.</div>
          <div v-else class="overflow-x-auto">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Сотрудник</th>
                  <th>Месяц</th>
                  <th>Тип</th>
                  <th>Дата</th>
                  <th class="text-right">Сумма</th>
                  <th class="text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="payment in filteredPayments" :key="payment._id">
                  <td>{{ getEmployeeName(payment.employeeId) }}</td>
                  <td>{{ payment.period || 'Месяц' }}</td>
                  <td>{{ payment.paymentType }}</td>
                  <td>{{ formatDate(payment.date) }}</td>
                  <td class="text-right font-medium">{{ formatMoney(payment.amount) }}</td>
                  <td class="actions">
                    <button type="button" class="icon-btn" title="Редактировать" aria-label="Редактировать" @click="openPaymentEdit(payment)"><Pencil class="h-4 w-4" /></button>
                    <button type="button" class="icon-btn-danger" title="Удалить" aria-label="Удалить" @click="deletePayment(payment._id)"><Trash2 class="h-4 w-4" /></button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <BaseModal v-if="isAccrualModalOpen" :title="editingAccrualId ? 'Редактировать начисление' : 'Добавить начисление'" @close="closeAccrualModal">
      <form class="form-grid" @submit.prevent="saveAccrual">
        <label class="field">Сотрудник *
          <select v-model="accrualForm.employeeId" class="input" required>
            <option value="">Выберите сотрудника</option>
            <option v-for="emp in employees" :key="emp._id" :value="emp._id">{{ emp.fullName }}</option>
          </select>
        </label>
        <label class="field">Месяц *<input v-model="accrualForm.period" class="input" type="month" required /></label>
        <label class="field">Сумма *<input v-model.number="accrualForm.amount" class="input" type="number" min="0" required /></label>
        <label class="field">Дата начисления<input v-model="accrualForm.date" class="input" type="date" /></label>
        <label class="field">Объект-примечание
          <select v-model="accrualForm.objectId" class="input">
            <option value="">Без объекта</option>
            <option v-for="obj in objects" :key="obj._id" :value="obj._id">{{ obj.name }}</option>
          </select>
        </label>
        <label class="field md:col-span-2">Комментарий<textarea v-model="accrualForm.comment" class="input" rows="3" /></label>
        <div class="modal-actions md:col-span-2">
          <button type="button" class="btn-secondary" @click="closeAccrualModal">Отмена</button>
          <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'Сохранение...' : 'Сохранить' }}</button>
        </div>
      </form>
    </BaseModal>

    <BaseModal v-if="isPaymentModalOpen" :title="editingPaymentId ? 'Редактировать выплату' : 'Добавить выплату'" @close="closePaymentModal">
      <form class="form-grid" @submit.prevent="savePayment">
        <label class="field">Сотрудник *
          <select v-model="paymentForm.employeeId" class="input" required>
            <option value="">Выберите сотрудника</option>
            <option v-for="emp in employees" :key="emp._id" :value="emp._id">{{ emp.fullName }}</option>
          </select>
        </label>
        <label class="field">Месяц *<input v-model="paymentForm.period" class="input" type="month" required /></label>
        <label class="field">Сумма *<input v-model.number="paymentForm.amount" class="input" type="number" min="0" required /></label>
        <label class="field">Тип выплаты
          <ManualSelect v-model="paymentForm.paymentType" :options="paymentTypes" placeholder="Выберите тип выплаты" manual-placeholder="Введите тип выплаты" />
        </label>
        <label class="field">Дата выплаты<input v-model="paymentForm.date" class="input" type="date" /></label>
        <label class="field md:col-span-2">Комментарий<textarea v-model="paymentForm.comment" class="input" rows="3" /></label>
        <div class="modal-actions md:col-span-2">
          <button type="button" class="btn-secondary" @click="closePaymentModal">Отмена</button>
          <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'Сохранение...' : 'Сохранить' }}</button>
        </div>
      </form>
    </BaseModal>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue';
import { Pencil, Plus, Trash2 } from '@lucide/vue';
import client from '../api/client';
import BaseModal from './BaseModal.vue';
import ManualSelect from './ManualSelect.vue';
import { formatDate, formatMoney, toNumber } from '../utils/format';

const emit = defineEmits(['changed']);

const defaultPaymentTypes = ['Аванс', 'Зарплата', 'Премия', 'Другое'];
const accruals = ref([]);
const payments = ref([]);
const employees = ref([]);
const objects = ref([]);
const selectOptions = ref([]);
const salarySearch = ref('');
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const isAccrualModalOpen = ref(false);
const isPaymentModalOpen = ref(false);
const editingAccrualId = ref(null);
const editingPaymentId = ref(null);

const today = () => new Date().toISOString().split('T')[0];
const monthNow = () => new Date().toISOString().slice(0, 7);
const toDateInput = (value) => value ? new Date(value).toISOString().split('T')[0] : '';

const paymentTypes = computed(() => {
  const custom = selectOptions.value.filter(option => option.category === 'salaryPaymentType' && option.isActive).map(option => option.name);
  return Array.from(new Set([...defaultPaymentTypes, ...custom]));
});

const getEmployeeName = (employeeId) => employees.value.find(e => String(e._id) === String(employeeId))?.fullName || 'Неизвестный сотрудник';
const getObjectName = (objectId) => {
  if (!objectId) return '-';
  return objects.value.find(o => String(o._id) === String(objectId))?.name || 'Неизвестный объект';
};

const salaryReport = computed(() => {
  const rows = new Map();
  const ensureRow = (employeeId, period) => {
    const normalizedPeriod = String(period || 'Месяц').trim() || 'Месяц';
    const key = `${employeeId || 'unknown'}::${normalizedPeriod}`;
    if (!rows.has(key)) rows.set(key, { key, employeeId, period: normalizedPeriod, accrued: 0, paid: 0, debt: 0, status: 'Закрыто' });
    return rows.get(key);
  };
  accruals.value.forEach((accrual) => { ensureRow(accrual.employeeId, accrual.period).accrued += toNumber(accrual.amount); });
  payments.value.forEach((payment) => { ensureRow(payment.employeeId, payment.period).paid += toNumber(payment.amount); });
  return Array.from(rows.values()).map((row) => {
    const debt = row.accrued - row.paid;
    return { ...row, debt, status: debt > 0 ? 'Есть долг' : debt < 0 ? 'Переплата' : 'Закрыто' };
  }).sort((a, b) => String(b.period).localeCompare(String(a.period)) || getEmployeeName(a.employeeId).localeCompare(getEmployeeName(b.employeeId)));
});

const matchesSearch = (values) => {
  const query = salarySearch.value.trim().toLowerCase();
  if (!query) return true;
  return values.some(value => String(value || '').toLowerCase().includes(query));
};

const filteredSalaryReport = computed(() => salaryReport.value.filter(row => matchesSearch([getEmployeeName(row.employeeId), row.period, row.accrued, row.paid, row.debt, row.status])));
const filteredAccruals = computed(() => accruals.value.filter(accrual => matchesSearch([getEmployeeName(accrual.employeeId), getObjectName(accrual.objectId), accrual.period, accrual.amount, accrual.comment])));
const filteredPayments = computed(() => payments.value.filter(payment => matchesSearch([getEmployeeName(payment.employeeId), payment.period, payment.paymentType, payment.amount, payment.comment])));

const salaryStatusClass = (status) => ({
  'Есть долг': 'badge-red',
  'Закрыто': 'badge-green',
  'Переплата': 'badge-yellow'
}[status] || 'badge-gray');

const emptyAccrualForm = () => ({ employeeId: '', objectId: '', amount: 0, period: monthNow(), date: today(), comment: '' });
const emptyPaymentForm = () => ({ employeeId: '', amount: 0, period: monthNow(), date: today(), paymentType: 'Зарплата', comment: '' });
const accrualForm = reactive(emptyAccrualForm());
const paymentForm = reactive(emptyPaymentForm());
const resetAccrualForm = () => Object.assign(accrualForm, emptyAccrualForm());
const resetPaymentForm = () => Object.assign(paymentForm, emptyPaymentForm());

const loadData = async () => {
  loading.value = true;
  error.value = '';
  try {
    const [accrualsRes, paymentsRes, employeesRes, objectsRes, optionsRes] = await Promise.all([
      client.get('/api/salary-accruals'),
      client.get('/api/salary-payments'),
      client.get('/api/employees'),
      client.get('/api/objects'),
      client.get('/api/select-options')
    ]);
    accruals.value = accrualsRes.data || [];
    payments.value = paymentsRes.data || [];
    employees.value = employeesRes.data || [];
    objects.value = objectsRes.data || [];
    selectOptions.value = optionsRes.data || [];
  } catch (err) {
    error.value = `Ошибка загрузки зарплаты: ${err.message}`;
  } finally {
    loading.value = false;
  }
};

const openAccrualCreate = () => { editingAccrualId.value = null; resetAccrualForm(); isAccrualModalOpen.value = true; };
const openAccrualEdit = (accrual) => {
  editingAccrualId.value = accrual._id;
  Object.assign(accrualForm, {
    employeeId: accrual.employeeId || '',
    objectId: accrual.objectId || '',
    amount: toNumber(accrual.amount),
    period: accrual.period || monthNow(),
    date: toDateInput(accrual.date),
    comment: accrual.comment || ''
  });
  isAccrualModalOpen.value = true;
};
const closeAccrualModal = () => { isAccrualModalOpen.value = false; editingAccrualId.value = null; resetAccrualForm(); };

const saveAccrual = async () => {
  saving.value = true;
  error.value = '';
  try {
    const payload = { ...accrualForm, amount: toNumber(accrualForm.amount), objectId: accrualForm.objectId || null };
    if (editingAccrualId.value) await client.patch(`/api/salary-accruals/${editingAccrualId.value}`, payload);
    else await client.post('/api/salary-accruals', payload);
    closeAccrualModal();
    await loadData();
    emit('changed');
  } catch (err) {
    error.value = `Ошибка сохранения начисления: ${err.message}`;
  } finally {
    saving.value = false;
  }
};

const openPaymentCreate = () => { editingPaymentId.value = null; resetPaymentForm(); isPaymentModalOpen.value = true; };
const openPaymentEdit = (payment) => {
  editingPaymentId.value = payment._id;
  Object.assign(paymentForm, {
    employeeId: payment.employeeId || '',
    amount: toNumber(payment.amount),
    period: payment.period || monthNow(),
    date: toDateInput(payment.date),
    paymentType: payment.paymentType || 'Зарплата',
    comment: payment.comment || ''
  });
  isPaymentModalOpen.value = true;
};
const closePaymentModal = () => { isPaymentModalOpen.value = false; editingPaymentId.value = null; resetPaymentForm(); };

const savePayment = async () => {
  saving.value = true;
  error.value = '';
  try {
    const payload = { ...paymentForm, amount: toNumber(paymentForm.amount) };
    if (editingPaymentId.value) await client.patch(`/api/salary-payments/${editingPaymentId.value}`, payload);
    else await client.post('/api/salary-payments', payload);
    closePaymentModal();
    await loadData();
    emit('changed');
  } catch (err) {
    error.value = `Ошибка сохранения выплаты: ${err.message}`;
  } finally {
    saving.value = false;
  }
};

const deleteAccrual = async (id) => {
  if (!confirm('Удалить начисление?')) return;
  error.value = '';
  try {
    await client.delete(`/api/salary-accruals/${id}`);
    await loadData();
    emit('changed');
  } catch (err) {
    error.value = `Ошибка удаления начисления: ${err.message}`;
  }
};

const deletePayment = async (id) => {
  if (!confirm('Удалить выплату?')) return;
  error.value = '';
  try {
    await client.delete(`/api/salary-payments/${id}`);
    await loadData();
    emit('changed');
  } catch (err) {
    error.value = `Ошибка удаления выплаты: ${err.message}`;
  }
};

onMounted(loadData);
</script>

<style scoped>
.panel { @apply bg-white rounded-lg shadow p-6; }
.section-header { @apply mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between; }
.section-title { @apply text-xl font-bold text-gray-900; }
.section-subtitle { @apply text-sm text-gray-500; }
.table-toolbar { @apply mb-4 flex flex-col gap-2 md:flex-row; }
.search-input { @apply w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500; }
.form-grid { @apply grid grid-cols-1 gap-4 md:grid-cols-2; }
.field { @apply flex flex-col gap-1 text-sm font-medium text-gray-700; }
.input { @apply rounded border border-gray-300 px-3 py-2 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-blue-500; }
.btn-primary { @apply inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60; }
.btn-secondary { @apply inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50; }
.icon-btn { @apply inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500; }
.icon-btn-danger { @apply inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500; }
.data-table { @apply w-full text-sm; }
.data-table th { @apply bg-gray-100 p-3 text-left font-medium text-gray-600; }
.data-table td { @apply border-t p-3 text-gray-800; }
.actions { @apply flex justify-end gap-2; }
.state-box { @apply rounded border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500; }
.error-box { @apply mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700; }
.modal-actions { @apply flex justify-end gap-2 pt-2; }
.badge { @apply rounded-full px-2.5 py-1 text-xs font-medium; }
.badge-red { @apply bg-red-100 text-red-800; }
.badge-green { @apply bg-green-100 text-green-800; }
.badge-yellow { @apply bg-yellow-100 text-yellow-800; }
.badge-gray { @apply bg-gray-100 text-gray-700; }
</style>
