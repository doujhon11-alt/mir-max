<template>
  <div class="panel">
    <div class="section-header">
      <div>
        <h2 class="section-title">Значения select</h2>
        <p class="section-subtitle">Пользовательские значения для способов оплаты, должностей, типов выплат и категорий долгов</p>
      </div>
      <button type="button" class="btn-primary" @click="openCreate"><Plus class="h-4 w-4" />Добавить значение</button>
    </div>

    <div v-if="error" class="error-box">{{ error }}</div>
    <div class="table-toolbar">
      <input v-model="search" class="search-input" placeholder="Поиск по названию или категории" />
      <select v-model="categoryFilter" class="search-input md:max-w-64">
        <option value="">Все категории</option>
        <option v-for="category in categories" :key="category.value" :value="category.value">{{ category.label }}</option>
      </select>
    </div>

    <div v-if="loading" class="state-box">Загрузка значений...</div>
    <div v-else-if="!filteredOptions.length" class="state-box">Пока нет данных. Добавьте первое значение.</div>

    <div v-else class="overflow-x-auto">
      <table class="data-table">
        <thead>
          <tr>
            <th>Категория</th>
            <th>Название</th>
            <th>Описание</th>
            <th>Статус</th>
            <th class="text-right">Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="option in filteredOptions" :key="option._id">
            <td>{{ categoryLabel(option.category) }}</td>
            <td class="font-medium">{{ option.name }}</td>
            <td>{{ option.description || '-' }}</td>
            <td><span class="badge" :class="option.isActive ? 'badge-green' : 'badge-gray'">{{ option.isActive ? 'Активно' : 'Отключено' }}</span></td>
            <td class="actions">
              <button type="button" class="icon-btn" title="Редактировать" aria-label="Редактировать" @click="openEdit(option)"><Pencil class="h-4 w-4" /></button>
              <button type="button" class="icon-btn-danger" title="Удалить" aria-label="Удалить" @click="deleteOption(option._id)"><Trash2 class="h-4 w-4" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <BaseModal v-if="isModalOpen" :title="editingId ? 'Редактировать значение' : 'Добавить значение'" @close="closeModal">
      <form class="form-grid" @submit.prevent="saveOption">
        <label class="field">Категория *
          <select v-model="form.category" class="input" required>
            <option v-for="category in categories" :key="category.value" :value="category.value">{{ category.label }}</option>
          </select>
        </label>
        <label class="field">Название *<input v-model="form.name" class="input" required /></label>
        <label class="field">Статус
          <select v-model="form.isActive" class="input">
            <option :value="true">Активно</option>
            <option :value="false">Отключено</option>
          </select>
        </label>
        <label class="field md:col-span-2">Описание<textarea v-model="form.description" class="input" rows="3" /></label>
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

const emit = defineEmits(['changed']);

const categories = [
  { value: 'paymentMethod', label: 'Способ оплаты' },
  { value: 'employeePosition', label: 'Должность сотрудника' },
  { value: 'salaryPaymentType', label: 'Тип выплаты' },
  { value: 'debtCategory', label: 'Категория долгов' }
];

const options = ref([]);
const search = ref('');
const categoryFilter = ref('');
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const isModalOpen = ref(false);
const editingId = ref(null);

const emptyForm = () => ({ category: 'paymentMethod', name: '', description: '', isActive: true });
const form = reactive(emptyForm());
const resetForm = () => Object.assign(form, emptyForm());
const categoryLabel = (value) => categories.find(category => category.value === value)?.label || value || '-';

const filteredOptions = computed(() => {
  const query = search.value.trim().toLowerCase();
  return options.value.filter(option => {
    const matchesCategory = !categoryFilter.value || option.category === categoryFilter.value;
    const haystack = [categoryLabel(option.category), option.name, option.description].map(value => String(value || '').toLowerCase()).join(' ');
    return matchesCategory && (!query || haystack.includes(query));
  });
});

const loadOptions = async () => {
  loading.value = true;
  error.value = '';
  try {
    const res = await client.get('/api/select-options');
    options.value = res.data || [];
  } catch (err) {
    error.value = `Ошибка загрузки значений: ${err.message}`;
  } finally {
    loading.value = false;
  }
};

const openCreate = () => { editingId.value = null; resetForm(); isModalOpen.value = true; };
const openEdit = (option) => {
  editingId.value = option._id;
  Object.assign(form, {
    category: option.category || 'paymentMethod',
    name: option.name || '',
    description: option.description || '',
    isActive: option.isActive !== false
  });
  isModalOpen.value = true;
};
const closeModal = () => { isModalOpen.value = false; editingId.value = null; resetForm(); };

const saveOption = async () => {
  saving.value = true;
  error.value = '';
  try {
    if (editingId.value) await client.patch(`/api/select-options/${editingId.value}`, form);
    else await client.post('/api/select-options', form);
    closeModal();
    await loadOptions();
    emit('changed');
  } catch (err) {
    error.value = `Ошибка сохранения значения: ${err.message}`;
  } finally {
    saving.value = false;
  }
};

const deleteOption = async (id) => {
  if (!confirm('Удалить значение? Старые записи со строковым значением сохранятся.')) return;
  error.value = '';
  try {
    await client.delete(`/api/select-options/${id}`);
    await loadOptions();
    emit('changed');
  } catch (err) {
    error.value = `Ошибка удаления значения: ${err.message}`;
  }
};

onMounted(loadOptions);
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
.badge-gray { @apply bg-gray-100 text-gray-700; }
</style>
