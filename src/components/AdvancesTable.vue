<template>
  <div class="panel">
    <div class="section-header">
      <div>
        <h2 class="section-title">Авансы по объектам</h2>
        <p class="section-subtitle">Авансы увеличивают полученные деньги только в статусах Получен или Учтён</p>
      </div>
      <button type="button" class="btn-primary" @click="openCreate"><Plus class="h-4 w-4" />Добавить аванс</button>
    </div>

    <div v-if="error" class="error-box">{{ error }}</div>
    <div class="table-toolbar">
      <input v-model="search" class="search-input" placeholder="Поиск по объекту, статусу, способу оплаты" />
      <select v-model="statusFilter" class="search-input md:max-w-48">
        <option value="">Все статусы</option>
        <option v-for="status in statuses" :key="status" :value="status">{{ status }}</option>
      </select>
    </div>

    <div v-if="loading" class="state-box">Загрузка авансов...</div>
    <div v-else-if="!filteredAdvances.length" class="state-box">Пока нет данных. Добавьте первый аванс или измените фильтр.</div>

    <div v-else class="overflow-x-auto">
      <table class="data-table">
        <thead>
          <tr>
            <th>Объект</th>
            <th class="text-right">Сумма</th>
            <th>Дата</th>
            <th>Способ оплаты</th>
            <th>Статус</th>
            <th class="text-right">Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="advance in filteredAdvances" :key="advance._id">
            <td>{{ getObjectName(advance.objectId) }}</td>
            <td class="text-right font-medium">{{ formatMoney(advance.amount) }}</td>
            <td>{{ formatDate(advance.date) }}</td>
            <td>{{ advance.paymentMethod || '-' }}</td>
            <td><span class="badge" :class="statusClass(advance.status)">{{ advance.status }}</span></td>
            <td class="actions">
              <button type="button" class="icon-btn" title="Редактировать" aria-label="Редактировать" @click="openEdit(advance)"><Pencil class="h-4 w-4" /></button>
              <button type="button" class="icon-btn-danger" title="Удалить" aria-label="Удалить" @click="deleteAdvance(advance._id)"><Trash2 class="h-4 w-4" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <BaseModal v-if="isModalOpen" :title="editingId ? 'Редактировать аванс' : 'Добавить аванс'" @close="closeModal">
      <form class="form-grid" @submit.prevent="saveAdvance">
        <label class="field">Объект *
          <select v-model="form.objectId" class="input" required>
            <option value="">Выберите объект</option>
            <option v-for="obj in objects" :key="obj._id" :value="obj._id">{{ obj.name }}</option>
          </select>
        </label>
        <label class="field">Сумма аванса *<input v-model.number="form.amount" class="input" type="number" min="0" required /></label>
        <label class="field">Дата<input v-model="form.date" class="input" type="date" /></label>
        <label class="field">Способ оплаты
          <ManualSelect v-model="form.paymentMethod" :options="paymentMethods" placeholder="Выберите способ оплаты" manual-placeholder="Введите способ оплаты" />
        </label>
        <label class="field">Статус
          <ManualSelect v-model="form.status" :options="statuses" placeholder="Выберите статус" manual-placeholder="Введите статус" />
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
import { formatDate, formatMoney, toNumber } from '../utils/format';

const emit = defineEmits(['changed']);

const statuses = ['Получен', 'Учтён', 'Возвращён', 'Отменён'];
const defaultPaymentMethods = ['Наличные', 'Kaspi', 'Банк', 'Карта'];

const advances = ref([]);
const objects = ref([]);
const selectOptions = ref([]);
const search = ref('');
const statusFilter = ref('');
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const isModalOpen = ref(false);
const editingId = ref(null);

const today = () => new Date().toISOString().split('T')[0];
const emptyForm = () => ({ objectId: '', amount: 0, date: today(), paymentMethod: 'Наличные', status: 'Получен', comment: '' });
const form = reactive(emptyForm());
const resetForm = () => Object.assign(form, emptyForm());
const toDateInput = (value) => value ? new Date(value).toISOString().split('T')[0] : '';

const paymentMethods = computed(() => {
  const custom = selectOptions.value.filter(option => option.category === 'paymentMethod' && option.isActive).map(option => option.name);
  return Array.from(new Set([...defaultPaymentMethods, ...custom]));
});

const filteredAdvances = computed(() => {
  const query = search.value.trim().toLowerCase();
  return advances.value.filter(advance => {
    const matchesStatus = !statusFilter.value || advance.status === statusFilter.value;
    const haystack = [getObjectName(advance.objectId), advance.amount, advance.paymentMethod, advance.status, advance.comment]
      .map(value => String(value || '').toLowerCase()).join(' ');
    return matchesStatus && (!query || haystack.includes(query));
  });
});

const getObjectName = (objectId) => objects.value.find(o => String(o._id) === String(objectId))?.name || 'Неизвестный объект';
const statusClass = (status) => ({
  'Получен': 'badge-green',
  'Учтён': 'badge-blue',
  'Возвращён': 'badge-yellow',
  'Отменён': 'badge-red'
}[status] || 'badge-gray');

const loadData = async () => {
  loading.value = true;
  error.value = '';
  try {
    const [advancesRes, objectsRes, optionsRes] = await Promise.all([
      client.get('/api/object-advances'),
      client.get('/api/objects'),
      client.get('/api/select-options')
    ]);
    advances.value = advancesRes.data || [];
    objects.value = objectsRes.data || [];
    selectOptions.value = optionsRes.data || [];
  } catch (err) {
    error.value = `Ошибка загрузки авансов: ${err.message}`;
  } finally {
    loading.value = false;
  }
};

const openCreate = () => { editingId.value = null; resetForm(); isModalOpen.value = true; };
const openEdit = (advance) => {
  editingId.value = advance._id;
  Object.assign(form, {
    objectId: advance.objectId || '',
    amount: toNumber(advance.amount),
    date: toDateInput(advance.date),
    paymentMethod: advance.paymentMethod || 'Наличные',
    status: advance.status || 'Получен',
    comment: advance.comment || ''
  });
  isModalOpen.value = true;
};
const closeModal = () => { isModalOpen.value = false; editingId.value = null; resetForm(); };

const saveAdvance = async () => {
  saving.value = true;
  error.value = '';
  try {
    const payload = { ...form, amount: toNumber(form.amount) };
    if (editingId.value) await client.patch(`/api/object-advances/${editingId.value}`, payload);
    else await client.post('/api/object-advances', payload);
    closeModal();
    await loadData();
    emit('changed');
  } catch (err) {
    error.value = `Ошибка сохранения аванса: ${err.message}`;
  } finally {
    saving.value = false;
  }
};

const deleteAdvance = async (id) => {
  if (!confirm('Удалить аванс?')) return;
  error.value = '';
  try {
    await client.delete(`/api/object-advances/${id}`);
    await loadData();
    emit('changed');
  } catch (err) {
    error.value = `Ошибка удаления аванса: ${err.message}`;
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
.badge-green { @apply bg-green-100 text-green-800; }
.badge-blue { @apply bg-blue-100 text-blue-800; }
.badge-yellow { @apply bg-yellow-100 text-yellow-800; }
.badge-red { @apply bg-red-100 text-red-800; }
.badge-gray { @apply bg-gray-100 text-gray-700; }
</style>
