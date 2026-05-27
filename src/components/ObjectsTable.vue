<template>
  <div class="panel">
    <div class="section-header">
      <div>
        <h2 class="section-title">Объекты</h2>
        <p class="section-subtitle">Клиенты, адреса, договоры и статус работ</p>
      </div>
      <button type="button" class="btn-primary" @click="openCreate"><Plus class="h-4 w-4" />Добавить объект</button>
    </div>

    <div v-if="error" class="error-box">{{ error }}</div>
    <div class="table-toolbar">
      <input v-model="search" class="search-input" placeholder="Поиск по объекту, клиенту, адресу" />
      <select v-model="statusFilter" class="search-input md:max-w-48">
        <option value="">Все статусы</option>
        <option value="В работе">В работе</option>
        <option value="Завершён">Завершён</option>
        <option value="Приостановлен">Приостановлен</option>
        <option value="Отменён">Отменён</option>
      </select>
    </div>

    <div v-if="loading" class="state-box">Загрузка объектов...</div>
    <div v-else-if="!filteredObjects.length" class="state-box">Пока нет данных. Добавьте первую запись или измените фильтр.</div>

    <div v-else class="overflow-x-auto">
      <table class="data-table">
        <thead>
          <tr>
            <th>Название</th>
            <th>Клиент</th>
            <th>Телефон</th>
            <th>Сумма</th>
            <th>Старт</th>
            <th>Дедлайн</th>
            <th>Статус</th>
            <th class="text-right">Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="obj in filteredObjects" :key="obj._id">
            <td class="font-medium">{{ obj.name }}</td>
            <td>{{ obj.clientName }}</td>
            <td>{{ formatPhone(obj.phone) }}</td>
            <td>{{ formatMoney(obj.contractAmount) }}</td>
            <td>{{ formatDate(obj.startDate) }}</td>
            <td>{{ formatDate(obj.deadline) }}</td>
            <td><span class="badge" :class="statusClass(obj.status)">{{ statusLabel(obj.status) }}</span></td>
            <td class="actions">
              <button type="button" class="icon-btn" title="Редактировать" aria-label="Редактировать" @click="openEdit(obj)"><Pencil class="h-4 w-4" /></button>
              <button type="button" class="icon-btn-danger" title="Удалить" aria-label="Удалить" @click="deleteObject(obj._id)"><Trash2 class="h-4 w-4" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <BaseModal v-if="isModalOpen" :title="editingId ? 'Редактировать объект' : 'Добавить объект'" @close="closeModal">
      <form class="form-grid" @submit.prevent="saveObject">
        <label class="field">Название объекта *<input v-model="form.name" class="input" required /></label>
        <label class="field">Клиент *<input v-model="form.clientName" class="input" required /></label>
        <label class="field">Телефон<input v-model="form.phone" class="input" /></label>
        <label class="field">Адрес<input v-model="form.address" class="input" /></label>
        <label class="field">Сумма договора<input v-model.number="form.contractAmount" class="input" type="number" min="0" /></label>
        <label class="field">Дата начала<input v-model="form.startDate" class="input" type="date" /></label>
        <label class="field">Дедлайн<input v-model="form.deadline" class="input" type="date" /></label>
        <label class="field">Статус
          <ManualSelect v-model="form.status" :options="objectStatuses" placeholder="Выберите статус" manual-placeholder="Введите статус" />
        </label>
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
import { Pencil, Plus, Trash2 } from '@lucide/vue';
import client from '../api/client';
import BaseModal from './BaseModal.vue';
import ManualSelect from './ManualSelect.vue';
import { formatDate, formatMoney, formatPhone, toNumber } from '../utils/format';

const emit = defineEmits(['changed']);
const objectStatuses = ['В работе', 'Завершён', 'Приостановлен', 'Отменён'];

const objects = ref([]);
const search = ref('');
const statusFilter = ref('');
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const isModalOpen = ref(false);
const editingId = ref(null);

const emptyForm = () => ({
  name: '',
  clientName: '',
  phone: '',
  address: '',
  contractAmount: 0,
  startDate: '',
  deadline: '',
  status: 'В работе',
  comment: ''
});

const form = reactive(emptyForm());

const toDateInput = (value) => {
  if (!value) return '';
  return new Date(value).toISOString().split('T')[0];
};

const resetForm = () => Object.assign(form, emptyForm());

const filteredObjects = computed(() => {
  const query = search.value.trim().toLowerCase();
  return objects.value.filter(obj => {
    const matchesStatus = !statusFilter.value || normalizeStatus(obj.status) === statusFilter.value;
    const matchesSearch = !query || [obj.name, obj.clientName, obj.phone, obj.address, obj.status]
      .some(value => String(value || '').toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  });
});

const statusLabel = (status) => ({
  active: 'В работе',
  completed: 'Завершён',
  paused: 'Приостановлен',
  canceled: 'Отменён',
  'В работе': 'В работе',
  'Завершён': 'Завершён',
  'Приостановлен': 'Приостановлен',
  'Отменён': 'Отменён'
}[status] || status || '-');

const normalizeStatus = (status) => ({
  active: 'В работе',
  completed: 'Завершён',
  paused: 'Приостановлен',
  canceled: 'Отменён'
}[status] || status || 'В работе');

const statusClass = (status) => ({
  active: 'badge-active',
  'В работе': 'badge-active',
  completed: 'badge-completed',
  'Завершён': 'badge-completed',
  paused: 'badge-paused',
  'Приостановлен': 'badge-paused',
  canceled: 'badge-canceled',
  'Отменён': 'badge-canceled'
}[status] || 'badge-active');

const loadObjects = async () => {
  loading.value = true;
  error.value = '';
  try {
    const res = await client.get('/api/objects');
    objects.value = res.data || [];
  } catch (err) {
    error.value = `Ошибка загрузки объектов: ${err.message}`;
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  editingId.value = null;
  resetForm();
  isModalOpen.value = true;
};

const openEdit = (obj) => {
  editingId.value = obj._id;
  Object.assign(form, {
    name: obj.name || '',
    clientName: obj.clientName || '',
    phone: obj.phone || '',
    address: obj.address || '',
    contractAmount: toNumber(obj.contractAmount),
    startDate: toDateInput(obj.startDate),
    deadline: toDateInput(obj.deadline),
    status: normalizeStatus(obj.status),
    comment: obj.comment || ''
  });
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  editingId.value = null;
  resetForm();
};

const saveObject = async () => {
  saving.value = true;
  error.value = '';
  try {
    const payload = {
      ...form,
      contractAmount: toNumber(form.contractAmount)
    };
    if (editingId.value) {
      await client.patch(`/api/objects/${editingId.value}`, payload);
    } else {
      await client.post('/api/objects', payload);
    }
    closeModal();
    await loadObjects();
    emit('changed');
  } catch (err) {
    error.value = `Ошибка сохранения объекта: ${err.message}`;
  } finally {
    saving.value = false;
  }
};

const deleteObject = async (id) => {
  if (!confirm('Удалить объект?')) return;
  error.value = '';
  try {
    await client.delete(`/api/objects/${id}`);
    await loadObjects();
    emit('changed');
  } catch (err) {
    error.value = `Ошибка удаления объекта: ${err.message}`;
  }
};

onMounted(loadObjects);
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
.badge { @apply rounded px-2 py-1 text-xs font-medium; }
.badge-active { @apply bg-green-100 text-green-800; }
.badge-completed { @apply bg-blue-100 text-blue-800; }
.badge-paused { @apply bg-yellow-100 text-yellow-800; }
.badge-canceled { @apply bg-red-100 text-red-800; }
</style>
