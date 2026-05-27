<template>
  <div class="space-y-6">
    <section class="panel">
      <div class="section-header">
        <div>
          <h2 class="section-title">Долги</h2>
          <p class="section-subtitle">Раздельный учет: компания должна сотрудникам и сотрудники должны компании</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn-secondary" @click="openCreate"><Plus class="h-4 w-4" />Личный расход</button>
          <button type="button" class="btn-primary" @click="openLoanCreate"><Plus class="h-4 w-4" />Займ сотруднику</button>
        </div>
      </div>

      <div v-if="error" class="error-box">{{ error }}</div>
      <div class="table-toolbar">
        <input v-model="search" class="search-input" placeholder="Поиск по сотруднику, объекту, статусу, комментарию" />
      </div>

      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div class="summary-box">
          <div class="text-sm text-gray-500">Компания должна сотрудникам</div>
          <div class="mt-1 text-2xl font-semibold text-purple-700">{{ formatMoney(companyOwesEmployees) }}</div>
        </div>
        <div class="summary-box">
          <div class="text-sm text-gray-500">Сотрудники должны компании</div>
          <div class="mt-1 text-2xl font-semibold text-orange-700">{{ formatMoney(employeesOweCompany) }}</div>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="section-header">
        <div>
          <h3 class="section-title">Личные расходы сотрудников за компанию</h3>
          <p class="section-subtitle">Сотрудник оплатил за компанию. Компания должна вернуть остаток.</p>
        </div>
        <select v-model="debtFilter" class="search-input md:max-w-48">
          <option value="">Все долги</option>
          <option value="open">Есть долг</option>
          <option value="closed">Закрыто</option>
        </select>
      </div>

      <div v-if="loading" class="state-box">Загрузка долгов...</div>
      <div v-else-if="!filteredDebts.length" class="state-box">Пока нет данных. Добавьте первую запись или измените фильтр.</div>

      <div v-else class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Сотрудник</th>
              <th>Объект</th>
              <th class="text-right">Личный расход</th>
              <th class="text-right">Возмещено</th>
              <th class="text-right">Остаток</th>
              <th>Дата</th>
              <th>Статус</th>
              <th class="text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="debt in filteredDebts" :key="debt._id">
              <td>{{ getEmployeeName(debt.employeeId) }}</td>
              <td>{{ getObjectName(debt.objectId) }}</td>
              <td class="text-right">{{ formatMoney(debt.amount) }}</td>
              <td class="text-right">{{ formatMoney(debt.reimbursed) }}</td>
              <td class="text-right font-medium">{{ formatMoney(companyDebtRest(debt)) }}</td>
              <td>{{ formatDate(debt.date) }}</td>
              <td><span class="badge" :class="companyDebtRest(debt) > 0 ? 'badge-red' : 'badge-green'">{{ companyDebtRest(debt) > 0 ? 'Есть долг' : 'Закрыто' }}</span></td>
              <td class="actions">
                <button type="button" class="icon-btn" title="Редактировать" aria-label="Редактировать" @click="openEdit(debt)"><Pencil class="h-4 w-4" /></button>
                <button type="button" class="icon-btn-danger" title="Удалить" aria-label="Удалить" @click="deleteDebt(debt._id)"><Trash2 class="h-4 w-4" /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel">
      <div class="section-header">
        <div>
          <h3 class="section-title">Долги / займы сотрудникам</h3>
          <p class="section-subtitle">Компания дала деньги сотруднику. Сотрудник должен вернуть остаток.</p>
        </div>
        <select v-model="loanStatusFilter" class="search-input md:max-w-56">
          <option value="">Все статусы</option>
          <option v-for="status in loanStatuses" :key="status" :value="status">{{ status }}</option>
        </select>
      </div>

      <div v-if="loading" class="state-box">Загрузка займов...</div>
      <div v-else-if="!filteredLoans.length" class="state-box">Пока нет данных. Добавьте первый займ или измените фильтр.</div>

      <div v-else class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Сотрудник</th>
              <th class="text-right">Выдано</th>
              <th>Дата выдачи</th>
              <th class="text-right">Возвращено</th>
              <th>Дата возврата</th>
              <th class="text-right">Остаток</th>
              <th>Статус</th>
              <th class="text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="loan in filteredLoans" :key="loan._id">
              <td>{{ getEmployeeName(loan.employeeId) }}</td>
              <td class="text-right">{{ formatMoney(loan.issuedAmount) }}</td>
              <td>{{ formatDate(loan.issueDate) }}</td>
              <td class="text-right">{{ formatMoney(loan.returnedAmount) }}</td>
              <td>{{ formatDate(loan.returnDate) }}</td>
              <td class="text-right font-medium">{{ formatMoney(employeeLoanRest(loan)) }}</td>
              <td><span class="badge" :class="loanStatusClass(loan.status)">{{ loan.status }}</span></td>
              <td class="actions">
                <button type="button" class="icon-btn" title="Добавить возврат" aria-label="Добавить возврат" @click="openReturnModal(loan)"><Plus class="h-4 w-4" /></button>
                <button type="button" class="icon-btn" title="Редактировать" aria-label="Редактировать" @click="openLoanEdit(loan)"><Pencil class="h-4 w-4" /></button>
                <button type="button" class="icon-btn-danger" title="Удалить" aria-label="Удалить" @click="deleteLoan(loan._id)"><Trash2 class="h-4 w-4" /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <BaseModal v-if="isModalOpen" :title="editingId ? 'Редактировать личный расход' : 'Добавить личный расход'" @close="closeModal">
      <form class="form-grid" @submit.prevent="saveDebt">
        <label class="field">Сотрудник *
          <select v-model="form.employeeId" class="input" required>
            <option value="">Выберите сотрудника</option>
            <option v-for="emp in employees" :key="emp._id" :value="emp._id">{{ emp.fullName }}</option>
          </select>
        </label>
        <label class="field">Объект
          <select v-model="form.objectId" class="input">
            <option value="">Без объекта</option>
            <option v-for="obj in objects" :key="obj._id" :value="obj._id">{{ obj.name }}</option>
          </select>
        </label>
        <label class="field">Сумма личного расхода *<input v-model.number="form.amount" class="input" type="number" min="0" required /></label>
        <label class="field">Возмещено компанией<input v-model.number="form.reimbursed" class="input" type="number" min="0" /></label>
        <label class="field">Дата<input v-model="form.date" class="input" type="date" /></label>
        <label class="field md:col-span-2">Комментарий<textarea v-model="form.comment" class="input" rows="3" /></label>
        <div class="modal-actions md:col-span-2">
          <button type="button" class="btn-secondary" @click="closeModal">Отмена</button>
          <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'Сохранение...' : 'Сохранить' }}</button>
        </div>
      </form>
    </BaseModal>

    <BaseModal v-if="isLoanModalOpen" :title="editingLoanId ? 'Редактировать займ сотруднику' : 'Добавить займ сотруднику'" @close="closeLoanModal">
      <form class="form-grid" @submit.prevent="saveLoan">
        <label class="field">Сотрудник *
          <select v-model="loanForm.employeeId" class="input" required>
            <option value="">Выберите сотрудника</option>
            <option v-for="emp in employees" :key="emp._id" :value="emp._id">{{ emp.fullName }}</option>
          </select>
        </label>
        <label class="field">Сумма выданного долга *<input v-model.number="loanForm.issuedAmount" class="input" type="number" min="0" required /></label>
        <label class="field">Дата выдачи<input v-model="loanForm.issueDate" class="input" type="date" /></label>
        <label class="field">Сумма возврата<input v-model.number="loanForm.returnedAmount" class="input" type="number" min="0" /></label>
        <label class="field">Дата возврата<input v-model="loanForm.returnDate" class="input" type="date" /></label>
        <label class="field">Статус
          <ManualSelect v-model="loanForm.status" :options="loanStatuses" placeholder="Выберите статус" manual-placeholder="Введите статус" />
        </label>
        <label class="field md:col-span-2">Комментарий<textarea v-model="loanForm.comment" class="input" rows="3" /></label>
        <div class="modal-actions md:col-span-2">
          <button type="button" class="btn-secondary" @click="closeLoanModal">Отмена</button>
          <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'Сохранение...' : 'Сохранить' }}</button>
        </div>
      </form>
    </BaseModal>

    <BaseModal v-if="isReturnModalOpen" title="Добавить частичный возврат" @close="closeReturnModal">
      <form class="form-grid" @submit.prevent="saveLoanReturn">
        <label class="field">Сумма возврата *<input v-model.number="returnForm.amount" class="input" type="number" min="0" required /></label>
        <label class="field">Дата возврата<input v-model="returnForm.date" class="input" type="date" /></label>
        <div class="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600 md:col-span-2">
          Текущий остаток: <span class="font-semibold text-gray-900">{{ formatMoney(selectedLoan ? employeeLoanRest(selectedLoan) : 0) }}</span>
        </div>
        <div class="modal-actions md:col-span-2">
          <button type="button" class="btn-secondary" @click="closeReturnModal">Отмена</button>
          <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'Сохранение...' : 'Сохранить возврат' }}</button>
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

const loanStatuses = ['Активен', 'Частично возвращён', 'Возвращён', 'Списан', 'Отменён'];

const debts = ref([]);
const employeeLoans = ref([]);
const employees = ref([]);
const objects = ref([]);
const search = ref('');
const debtFilter = ref('');
const loanStatusFilter = ref('');
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const isModalOpen = ref(false);
const isLoanModalOpen = ref(false);
const isReturnModalOpen = ref(false);
const editingId = ref(null);
const editingLoanId = ref(null);
const selectedLoan = ref(null);

const today = () => new Date().toISOString().split('T')[0];
const emptyForm = () => ({ employeeId: '', objectId: '', amount: 0, reimbursed: 0, date: today(), comment: '' });
const emptyLoanForm = () => ({ employeeId: '', issuedAmount: 0, issueDate: today(), returnedAmount: 0, returnDate: '', status: 'Активен', comment: '' });
const emptyReturnForm = () => ({ amount: 0, date: today() });

const form = reactive(emptyForm());
const loanForm = reactive(emptyLoanForm());
const returnForm = reactive(emptyReturnForm());

const resetForm = () => Object.assign(form, emptyForm());
const resetLoanForm = () => Object.assign(loanForm, emptyLoanForm());
const resetReturnForm = () => Object.assign(returnForm, emptyReturnForm());

const toDateInput = (value) => {
  if (!value) return '';
  return new Date(value).toISOString().split('T')[0];
};

const companyDebtRest = (debt) => Math.max(toNumber(debt.amount) - toNumber(debt.reimbursed), 0);
const employeeLoanRest = (loan) => {
  if (!loan || loan.status === 'Списан' || loan.status === 'Отменён') return 0;
  return Math.max(toNumber(loan.issuedAmount) - toNumber(loan.returnedAmount), 0);
};

const normalizedLoanStatus = (loan) => {
  if (loan.status === 'Списан' || loan.status === 'Отменён') return loan.status;
  const issued = toNumber(loan.issuedAmount);
  const returned = toNumber(loan.returnedAmount);
  if (issued > 0 && returned >= issued) return 'Возвращён';
  if (returned > 0) return 'Частично возвращён';
  return 'Активен';
};

const companyOwesEmployees = computed(() => debts.value.reduce((sum, debt) => sum + companyDebtRest(debt), 0));
const employeesOweCompany = computed(() => employeeLoans.value.reduce((sum, loan) => sum + employeeLoanRest(loan), 0));

const filteredDebts = computed(() => {
  const query = search.value.trim().toLowerCase();
  return debts.value.filter(debt => {
    const rest = companyDebtRest(debt);
    const matchesStatus = !debtFilter.value || (debtFilter.value === 'open' ? rest > 0 : rest <= 0);
    const haystack = [getEmployeeName(debt.employeeId), getObjectName(debt.objectId), debt.amount, debt.reimbursed, debt.comment]
      .map(value => String(value || '').toLowerCase()).join(' ');
    return matchesStatus && (!query || haystack.includes(query));
  });
});

const filteredLoans = computed(() => {
  const query = search.value.trim().toLowerCase();
  return employeeLoans.value.filter(loan => {
    const status = loan.status || normalizedLoanStatus(loan);
    const matchesStatus = !loanStatusFilter.value || status === loanStatusFilter.value;
    const haystack = [getEmployeeName(loan.employeeId), loan.issuedAmount, loan.returnedAmount, loan.status, loan.comment]
      .map(value => String(value || '').toLowerCase()).join(' ');
    return matchesStatus && (!query || haystack.includes(query));
  });
});

const getEmployeeName = (employeeId) => employees.value.find(e => String(e._id) === String(employeeId))?.fullName || 'Неизвестный сотрудник';
const getObjectName = (objectId) => {
  if (!objectId) return '-';
  return objects.value.find(o => String(o._id) === String(objectId))?.name || 'Неизвестный объект';
};

const loanStatusClass = (status) => ({
  'Активен': 'badge-red',
  'Частично возвращён': 'badge-yellow',
  'Возвращён': 'badge-green',
  'Списан': 'badge-gray',
  'Отменён': 'badge-gray'
}[status] || 'badge-gray');

const loadData = async () => {
  loading.value = true;
  error.value = '';
  try {
    const [debtsRes, loansRes, employeesRes, objectsRes] = await Promise.all([
      client.get('/api/debts'),
      client.get('/api/employee-loans'),
      client.get('/api/employees'),
      client.get('/api/objects')
    ]);
    debts.value = debtsRes.data || [];
    employeeLoans.value = loansRes.data || [];
    employees.value = employeesRes.data || [];
    objects.value = objectsRes.data || [];
  } catch (err) {
    error.value = `Ошибка загрузки долгов: ${err.message}`;
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  editingId.value = null;
  resetForm();
  isModalOpen.value = true;
};

const openEdit = (debt) => {
  editingId.value = debt._id;
  Object.assign(form, {
    employeeId: debt.employeeId || '',
    objectId: debt.objectId || '',
    amount: toNumber(debt.amount),
    reimbursed: toNumber(debt.reimbursed),
    date: toDateInput(debt.date),
    comment: debt.comment || ''
  });
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  editingId.value = null;
  resetForm();
};

const openLoanCreate = () => {
  editingLoanId.value = null;
  resetLoanForm();
  isLoanModalOpen.value = true;
};

const openLoanEdit = (loan) => {
  editingLoanId.value = loan._id;
  Object.assign(loanForm, {
    employeeId: loan.employeeId || '',
    issuedAmount: toNumber(loan.issuedAmount),
    issueDate: toDateInput(loan.issueDate),
    returnedAmount: toNumber(loan.returnedAmount),
    returnDate: toDateInput(loan.returnDate),
    status: loan.status || normalizedLoanStatus(loan),
    comment: loan.comment || ''
  });
  isLoanModalOpen.value = true;
};

const closeLoanModal = () => {
  isLoanModalOpen.value = false;
  editingLoanId.value = null;
  resetLoanForm();
};

const openReturnModal = (loan) => {
  selectedLoan.value = loan;
  resetReturnForm();
  isReturnModalOpen.value = true;
};

const closeReturnModal = () => {
  isReturnModalOpen.value = false;
  selectedLoan.value = null;
  resetReturnForm();
};

const saveDebt = async () => {
  saving.value = true;
  error.value = '';
  try {
    const payload = { ...form, amount: toNumber(form.amount), reimbursed: toNumber(form.reimbursed) };
    if (editingId.value) await client.patch(`/api/debts/${editingId.value}`, payload);
    else await client.post('/api/debts', payload);
    closeModal();
    await loadData();
    emit('changed');
  } catch (err) {
    error.value = `Ошибка сохранения личного расхода: ${err.message}`;
  } finally {
    saving.value = false;
  }
};

const loanPayload = () => {
  const payload = {
    ...loanForm,
    issuedAmount: toNumber(loanForm.issuedAmount),
    returnedAmount: toNumber(loanForm.returnedAmount),
    returnDate: loanForm.returnDate || null
  };
  payload.status = payload.status || normalizedLoanStatus(payload);
  return payload;
};

const saveLoan = async () => {
  saving.value = true;
  error.value = '';
  try {
    const payload = loanPayload();
    if (editingLoanId.value) await client.patch(`/api/employee-loans/${editingLoanId.value}`, payload);
    else await client.post('/api/employee-loans', payload);
    closeLoanModal();
    await loadData();
    emit('changed');
  } catch (err) {
    error.value = `Ошибка сохранения займа: ${err.message}`;
  } finally {
    saving.value = false;
  }
};

const saveLoanReturn = async () => {
  if (!selectedLoan.value) return;
  saving.value = true;
  error.value = '';
  try {
    const returnedAmount = toNumber(selectedLoan.value.returnedAmount) + toNumber(returnForm.amount);
    const payload = {
      returnedAmount,
      returnDate: returnForm.date || today(),
      status: normalizedLoanStatus({ ...selectedLoan.value, returnedAmount })
    };
    await client.patch(`/api/employee-loans/${selectedLoan.value._id}`, payload);
    closeReturnModal();
    await loadData();
    emit('changed');
  } catch (err) {
    error.value = `Ошибка сохранения возврата: ${err.message}`;
  } finally {
    saving.value = false;
  }
};

const deleteDebt = async (id) => {
  if (!confirm('Удалить личный расход?')) return;
  error.value = '';
  try {
    await client.delete(`/api/debts/${id}`);
    await loadData();
    emit('changed');
  } catch (err) {
    error.value = `Ошибка удаления личного расхода: ${err.message}`;
  }
};

const deleteLoan = async (id) => {
  if (!confirm('Удалить займ сотруднику?')) return;
  error.value = '';
  try {
    await client.delete(`/api/employee-loans/${id}`);
    await loadData();
    emit('changed');
  } catch (err) {
    error.value = `Ошибка удаления займа: ${err.message}`;
  }
};

onMounted(loadData);
</script>

<style scoped>
.panel { @apply bg-white rounded-lg shadow p-6; }
.section-header { @apply mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between; }
.section-title { @apply text-xl font-bold text-gray-900; }
.section-subtitle { @apply text-sm text-gray-500; }
.summary-box { @apply rounded-2xl border border-gray-200 bg-gray-50 p-4; }
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
