<template>
  <div class="panel">
    <div class="section-header">
      <div>
        <h2 class="section-title">Сотрудники</h2>
        <p class="section-subtitle">Карточки сотрудников, контакты, документы, статус и данные для выплат</p>
      </div>
      <button type="button" class="btn-primary" @click="openCreate"><Plus class="h-4 w-4" />Добавить сотрудника</button>
    </div>

    <div v-if="error" class="error-box">{{ error }}</div>
    <div class="table-toolbar">
      <input v-model="search" class="search-input" placeholder="Поиск по ФИО, телефону, должности, ИИН, адресу" />
      <select v-model="statusFilter" class="search-input md:max-w-48">
        <option value="">Все статусы</option>
        <option value="active">Работает</option>
        <option value="fired">Уволен</option>
      </select>
    </div>

    <div v-if="loading" class="state-box">Загрузка сотрудников...</div>
    <div v-else-if="!filteredEmployees.length" class="state-box">Пока нет данных. Добавьте первую запись или измените фильтр.</div>

    <div v-else class="overflow-x-auto">
      <table class="data-table">
        <thead>
          <tr>
            <th>Ф.И.О.</th>
            <th>Телефон</th>
            <th>Должность</th>
            <th>ИИН</th>
            <th>Дата приема</th>
            <th>Оклад</th>
            <th>Статус</th>
            <th class="text-right">Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="employee in filteredEmployees" :key="employee._id">
            <td class="font-medium">{{ employee.fullName }}</td>
            <td>{{ formatPhone(employee.phone) }}</td>
            <td>{{ employee.position || '-' }}</td>
            <td>{{ employee.iin || '-' }}</td>
            <td>{{ formatDate(employee.hireDate) }}</td>
            <td>{{ formatMoney(employee.salary) }}</td>
            <td><span class="badge" :class="statusClass(employee.status)">{{ statusLabel(employee.status) }}</span></td>
            <td class="actions">
              <button type="button" class="icon-btn" title="Карточка" aria-label="Карточка" @click="openDetails(employee)"><Eye class="h-4 w-4" /></button>
              <button type="button" class="icon-btn" title="Редактировать" aria-label="Редактировать" @click="openEdit(employee)"><Pencil class="h-4 w-4" /></button>
              <button type="button" class="icon-btn-danger" title="Удалить" aria-label="Удалить" @click="deleteEmployee(employee._id)"><Trash2 class="h-4 w-4" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <BaseModal v-if="detailsEmployee" title="Карточка сотрудника" @close="detailsEmployee = null">
      <div class="space-y-5">
        <div class="flex flex-col gap-2 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-950">{{ detailsEmployee.fullName }}</h3>
            <p class="text-sm text-gray-500">{{ detailsEmployee.position || 'Без должности' }}</p>
          </div>
          <span class="badge self-start" :class="statusClass(detailsEmployee.status)">{{ statusLabel(detailsEmployee.status) }}</span>
        </div>

        <div class="details-grid">
          <div class="detail-item"><span>Телефон</span><b>{{ formatPhone(detailsEmployee.phone) }}</b></div>
          <div class="detail-item"><span>Оклад</span><b>{{ formatMoney(detailsEmployee.salary) }}</b></div>
          <div class="detail-item"><span>Дата рождения</span><b>{{ formatDate(detailsEmployee.birthDate) }}</b></div>
          <div class="detail-item"><span>ИИН</span><b>{{ detailsEmployee.iin || '-' }}</b></div>
          <div class="detail-item"><span>Документ</span><b>{{ detailsEmployee.documentNumber || '-' }}</b></div>
          <div class="detail-item"><span>Адрес</span><b>{{ detailsEmployee.address || '-' }}</b></div>
          <div class="detail-item"><span>Дата приема</span><b>{{ formatDate(detailsEmployee.hireDate) }}</b></div>
          <div class="detail-item"><span>Дата увольнения</span><b>{{ formatDate(detailsEmployee.fireDate) }}</b></div>
          <div class="detail-item"><span>Способ выплаты</span><b>{{ detailsEmployee.paymentMethod || '-' }}</b></div>
          <div class="detail-item"><span>Банк</span><b>{{ detailsEmployee.bankName || '-' }}</b></div>
          <div class="detail-item"><span>Карта / счет</span><b>{{ detailsEmployee.cardNumber || '-' }}</b></div>
          <div class="detail-item"><span>Экстренный контакт</span><b>{{ detailsEmployee.emergencyContact || '-' }}</b></div>
          <div class="detail-item"><span>Телефон контакта</span><b>{{ formatPhone(detailsEmployee.emergencyPhone) }}</b></div>
        </div>

        <div>
          <div class="mb-1 text-sm font-medium text-gray-500">Комментарий</div>
          <div class="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800">{{ detailsEmployee.comment || '-' }}</div>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="openEdit(detailsEmployee)"><Pencil class="h-4 w-4" />Редактировать</button>
          <button type="button" class="btn-secondary" @click="detailsEmployee = null">Закрыть</button>
        </div>
      </div>
    </BaseModal>

    <BaseModal v-if="isModalOpen" :title="editingId ? 'Редактировать сотрудника' : 'Добавить сотрудника'" @close="closeModal">
      <form class="form-grid" @submit.prevent="saveEmployee">
        <label class="field">Ф.И.О. *<input v-model="form.fullName" class="input" required /></label>
        <label class="field">Статус
          <select v-model="form.status" class="input">
            <option value="active">Работает</option>
            <option value="fired">Уволен</option>
          </select>
        </label>
        <label class="field">Телефон<input v-model="form.phone" class="input" /></label>
        <label class="field">Должность
          <ManualSelect v-model="form.position" :options="positions" placeholder="Без должности" manual-placeholder="Введите должность" />
        </label>
        <label class="field">Оклад<input v-model.number="form.salary" class="input" type="number" min="0" /></label>
        <label class="field">Дата рождения<input v-model="form.birthDate" class="input" type="date" /></label>
        <label class="field">ИИН<input v-model="form.iin" class="input" /></label>
        <label class="field">Номер документа<input v-model="form.documentNumber" class="input" /></label>
        <label class="field md:col-span-2">Адрес<input v-model="form.address" class="input" /></label>
        <label class="field">Дата приема<input v-model="form.hireDate" class="input" type="date" /></label>
        <label class="field">Дата увольнения<input v-model="form.fireDate" class="input" type="date" /></label>
        <label class="field">Способ выплаты<ManualSelect v-model="form.paymentMethod" :options="paymentMethods" placeholder="Выберите способ" manual-placeholder="Введите способ выплаты" /></label>
        <label class="field">Банк<input v-model="form.bankName" class="input" /></label>
        <label class="field">Карта / счет<input v-model="form.cardNumber" class="input" /></label>
        <label class="field">Экстренный контакт<input v-model="form.emergencyContact" class="input" /></label>
        <label class="field">Телефон контакта<input v-model="form.emergencyPhone" class="input" /></label>
        <label class="field md:col-span-2">Комментарий<textarea v-model="form.comment" class="input" rows="3" /></label>
        <div class="modal-actions md:col-span-2">
          <button type="button" class="btn-secondary" @click="closeModal">Отмена</button>
          <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'Сохранение...' : 'Сохранить' }}</button>
        </div>
      </form>
    </BaseModal>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue';
import { Eye, Pencil, Plus, Trash2 } from '@lucide/vue';
import client from '../api/client';
import BaseModal from './BaseModal.vue';
import ManualSelect from './ManualSelect.vue';
import { formatDate, formatMoney, formatPhone, toNumber } from '../utils/format';

const emit = defineEmits(['changed']);

const employees = ref([]);
const selectOptions = ref([]);
const search = ref('');
const statusFilter = ref('');
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const isModalOpen = ref(false);
const editingId = ref(null);
const detailsEmployee = ref(null);

const defaultPositions = ['Прораб', 'Мастер', 'Рабочий', 'Менеджер', 'Бухгалтер'];
const defaultPaymentMethods = ['Наличные', 'Kaspi', 'Банк', 'Карта'];
const positions = computed(() => {
  const custom = selectOptions.value.filter(option => option.category === 'employeePosition' && option.isActive).map(option => option.name);
  return Array.from(new Set([...defaultPositions, ...custom]));
});
const paymentMethods = computed(() => {
  const custom = selectOptions.value.filter(option => option.category === 'paymentMethod' && option.isActive).map(option => option.name);
  return Array.from(new Set([...defaultPaymentMethods, ...custom]));
});

const statusLabel = (status) => status === 'fired' ? 'Уволен' : 'Работает';
const statusClass = (status) => status === 'fired' ? 'badge-red' : 'badge-green';
const toDateInput = (value) => value ? new Date(value).toISOString().split('T')[0] : '';

const filteredEmployees = computed(() => {
  const query = search.value.trim().toLowerCase();
  return employees.value.filter(employee => {
    const matchesStatus = !statusFilter.value || employee.status === statusFilter.value;
    const matchesSearch = !query || [
      employee.fullName,
      employee.phone,
      employee.position,
      employee.status,
      employee.iin,
      employee.documentNumber,
      employee.address,
      employee.paymentMethod,
      employee.bankName,
      employee.cardNumber,
      employee.emergencyContact,
      employee.emergencyPhone,
      employee.comment
    ].some(value => String(value || '').toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  });
});

const emptyForm = () => ({
  fullName: '',
  phone: '',
  position: '',
  salary: 0,
  status: 'active',
  birthDate: '',
  iin: '',
  documentNumber: '',
  address: '',
  hireDate: '',
  fireDate: '',
  paymentMethod: '',
  bankName: '',
  cardNumber: '',
  emergencyContact: '',
  emergencyPhone: '',
  comment: ''
});

const form = reactive(emptyForm());
const resetForm = () => Object.assign(form, emptyForm());

const loadEmployees = async () => {
  loading.value = true;
  error.value = '';
  try {
    const [employeesRes, optionsRes] = await Promise.all([
      client.get('/api/employees'),
      client.get('/api/select-options')
    ]);
    employees.value = employeesRes.data || [];
    selectOptions.value = optionsRes.data || [];
  } catch (err) {
    error.value = `Ошибка загрузки сотрудников: ${err.message}`;
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  editingId.value = null;
  resetForm();
  isModalOpen.value = true;
};

const fillForm = (employee) => Object.assign(form, {
  fullName: employee.fullName || '',
  phone: employee.phone || '',
  position: employee.position || '',
  salary: toNumber(employee.salary),
  status: employee.status || 'active',
  birthDate: toDateInput(employee.birthDate),
  iin: employee.iin || '',
  documentNumber: employee.documentNumber || '',
  address: employee.address || '',
  hireDate: toDateInput(employee.hireDate),
  fireDate: toDateInput(employee.fireDate),
  paymentMethod: employee.paymentMethod || '',
  bankName: employee.bankName || '',
  cardNumber: employee.cardNumber || '',
  emergencyContact: employee.emergencyContact || '',
  emergencyPhone: employee.emergencyPhone || '',
  comment: employee.comment || ''
});

const openEdit = (employee) => {
  editingId.value = employee._id;
  fillForm(employee);
  detailsEmployee.value = null;
  isModalOpen.value = true;
};

const openDetails = (employee) => {
  detailsEmployee.value = employee;
};

const closeModal = () => {
  isModalOpen.value = false;
  editingId.value = null;
  resetForm();
};

const saveEmployee = async () => {
  saving.value = true;
  error.value = '';
  try {
    const payload = {
      ...form,
      salary: toNumber(form.salary),
      birthDate: form.birthDate || null,
      hireDate: form.hireDate || null,
      fireDate: form.fireDate || null
    };
    if (editingId.value) await client.patch(`/api/employees/${editingId.value}`, payload);
    else await client.post('/api/employees', payload);
    closeModal();
    await loadEmployees();
    emit('changed');
  } catch (err) {
    error.value = `Ошибка сохранения сотрудника: ${err.message}`;
  } finally {
    saving.value = false;
  }
};

const deleteEmployee = async (id) => {
  if (!confirm('Удалить сотрудника?')) return;
  error.value = '';
  try {
    await client.delete(`/api/employees/${id}`);
    await loadEmployees();
    emit('changed');
  } catch (err) {
    error.value = `Ошибка удаления сотрудника: ${err.message}`;
  }
};

onMounted(loadEmployees);
</script>

<style scoped>
.panel { @apply bg-white rounded-lg shadow p-6; }
.section-header { @apply mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between; }
.section-title { @apply text-xl font-bold text-gray-900; }
.section-subtitle { @apply text-sm text-gray-500; }
.table-toolbar { @apply mb-4 flex flex-col gap-2 md:flex-row; }
.search-input { @apply w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500; }
.form-grid { @apply grid grid-cols-1 gap-4 md:grid-cols-2; }
.details-grid { @apply grid grid-cols-1 gap-3 md:grid-cols-2; }
.detail-item { @apply rounded-xl border border-gray-200 bg-gray-50 p-3; }
.detail-item span { @apply block text-xs font-medium uppercase tracking-wide text-gray-500; }
.detail-item b { @apply mt-1 block break-words text-sm font-semibold text-gray-900; }
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
.badge-green { @apply bg-green-100 text-green-800; }
.badge-red { @apply bg-red-100 text-red-800; }
</style>
