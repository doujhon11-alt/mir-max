<template>
  <div class="panel">
    <div class="section-header">
      <div>
        <h2 class="section-title">Расходы</h2>
        <p class="section-subtitle">Объектные, общие и отдельные расходы компании на сотрудников</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button type="button" class="btn-secondary" @click="openDetails()"><Eye class="h-4 w-4" />Подробнее</button>
        <button type="button" class="btn-secondary" @click="openTypeCreate"><Plus class="h-4 w-4" />Вид расхода</button>
        <button type="button" class="btn-primary" @click="openCreate"><Plus class="h-4 w-4" />Добавить расход</button>
      </div>
    </div>

    <div v-if="error" class="error-box">{{ error }}</div>
    <div v-if="loading" class="state-box">Загрузка расходов...</div>

    <div v-else class="space-y-6">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div class="summary-box"><div class="summary-label">Расходы по объектам</div><div class="summary-value text-red-700">{{ formatMoney(objectExpensesTotal) }}</div></div>
        <div class="summary-box"><div class="summary-label">Расходы на сотрудников</div><div class="summary-value text-orange-700">{{ formatMoney(employeeExpensesTotal) }}</div></div>
        <div class="summary-box"><div class="summary-label">Общие расходы</div><div class="summary-value text-slate-700">{{ formatMoney(generalExpensesTotal) }}</div></div>
        <div class="summary-box"><div class="summary-label">Все расходы</div><div class="summary-value text-red-800">{{ formatMoney(allExpensesTotal) }}</div></div>
      </div>

      <div>
        <h3 class="mb-3 text-sm font-semibold text-gray-700">Виды расходов</h3>
        <div class="table-toolbar">
          <input v-model="typeSearch" class="search-input" placeholder="Поиск по видам расходов" />
          <select v-model="typeStatusFilter" class="search-input md:max-w-44">
            <option value="">Все</option>
            <option value="active">Активные</option>
            <option value="inactive">Отключенные</option>
          </select>
        </div>

        <div v-if="!filteredExpenseTypes.length" class="state-box">Справочник видов расходов пуст, используются базовые значения</div>
        <div v-else class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Описание</th>
                <th>Статус</th>
                <th class="text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="type in filteredExpenseTypes" :key="type._id || type.name">
                <td class="font-medium">{{ type.name }}</td>
                <td>{{ type.description || '-' }}</td>
                <td><span class="badge" :class="type.isActive ? 'badge-green' : 'badge-red'">{{ type.isActive ? 'Активен' : 'Отключен' }}</span></td>
                <td class="actions">
                  <button v-if="type._id" type="button" class="icon-btn" title="Редактировать" aria-label="Редактировать" @click="openTypeEdit(type)"><Pencil class="h-4 w-4" /></button>
                  <button v-if="type._id" type="button" class="icon-btn-danger" title="Удалить" aria-label="Удалить" @click="deleteExpenseType(type._id)"><Trash2 class="h-4 w-4" /></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 class="mb-3 text-sm font-semibold text-gray-700">Список расходов</h3>
        <div class="table-toolbar">
          <input v-model="expenseSearch" class="search-input" placeholder="Поиск по расходам" />
          <select v-model="categoryFilter" class="search-input md:max-w-56">
            <option value="">Все виды расходов</option>
            <option v-for="type in activeExpenseTypes" :key="type.name" :value="type.name">{{ type.name }}</option>
          </select>
          <select v-model="objectFilter" class="search-input md:max-w-56">
            <option value="">Все объекты</option>
            <option value="__none">Без объекта</option>
            <option v-for="obj in objects" :key="obj._id" :value="obj._id">{{ obj.name }}</option>
          </select>
          <select v-model="employeeFilter" class="search-input md:max-w-56">
            <option value="">Все сотрудники</option>
            <option value="__none">Без сотрудника</option>
            <option v-for="employee in employees" :key="employee._id" :value="employee._id">{{ employee.fullName }}</option>
          </select>
        </div>

        <div v-if="!filteredExpenses.length" class="state-box">Расходы пока не добавлены</div>
        <div v-else class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Объект</th>
                <th>Вид</th>
                <th>Название</th>
                <th>Сотрудник</th>
                <th class="text-right">Кол-во x Цена</th>
                <th class="text-right">Сумма</th>
                <th>Дата</th>
                <th class="text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="expense in filteredExpenses" :key="expense._id">
                <td>{{ getObjectName(expense.objectId) }}</td>
                <td><span class="badge" :class="isEmployeeExpense(expense) ? 'badge-orange' : 'badge-gray'">{{ expense.category || '-' }}</span></td>
                <td class="font-medium">{{ expense.title }}</td>
                <td>{{ getEmployeeName(expense.employeeId) }}</td>
                <td class="text-right">{{ formatNumber(expense.quantity) }} x {{ formatMoney(expense.price) }}</td>
                <td class="text-right font-medium">{{ formatMoney(expenseAmount(expense)) }}</td>
                <td>{{ formatDate(expense.date) }}</td>
                <td class="actions">
                  <button type="button" class="icon-btn" title="Подробнее" aria-label="Подробнее" @click="openDetails({ objectId: expense.objectId || '__none', employeeId: expense.employeeId || '' })"><Eye class="h-4 w-4" /></button>
                  <button type="button" class="icon-btn" title="Редактировать" aria-label="Редактировать" @click="openEdit(expense)"><Pencil class="h-4 w-4" /></button>
                  <button type="button" class="icon-btn-danger" title="Удалить" aria-label="Удалить" @click="deleteExpense(expense._id)"><Trash2 class="h-4 w-4" /></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <BaseModal v-if="isDetailsOpen" title="Детализация расходов" @close="closeDetails">
      <div class="space-y-5">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div class="summary-box"><div class="summary-label">Итоговая сумма</div><div class="summary-value text-red-700">{{ formatMoney(detailTotal) }}</div></div>
          <div class="summary-box"><div class="summary-label">Записей</div><div class="summary-value text-gray-900">{{ detailExpenses.length }}</div></div>
          <div class="summary-box"><div class="summary-label">На сотрудников</div><div class="summary-value text-orange-700">{{ formatMoney(detailEmployeeTotal) }}</div></div>
        </div>

        <div class="table-toolbar">
          <input v-model="detailSearch" class="search-input" placeholder="Поиск по названию или комментарию" />
          <select v-model="detailObjectFilter" class="search-input md:max-w-56">
            <option value="">Все объекты</option>
            <option value="__none">Общие расходы</option>
            <option v-for="obj in objects" :key="obj._id" :value="obj._id">{{ obj.name }}</option>
          </select>
          <select v-model="detailCategoryFilter" class="search-input md:max-w-56">
            <option value="">Все виды</option>
            <option v-for="type in activeExpenseTypes" :key="type.name" :value="type.name">{{ type.name }}</option>
          </select>
          <select v-model="detailEmployeeFilter" class="search-input md:max-w-56">
            <option value="">Все сотрудники</option>
            <option value="__none">Без сотрудника</option>
            <option v-for="employee in employees" :key="employee._id" :value="employee._id">{{ employee.fullName }}</option>
          </select>
          <input v-model="detailDateFrom" class="search-input md:max-w-44" type="date" />
          <input v-model="detailDateTo" class="search-input md:max-w-44" type="date" />
          <button type="button" class="btn-primary" @click="openCreateFromDetails"><Plus class="h-4 w-4" />Добавить</button>
        </div>

        <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div class="group-box">
            <h4 class="group-title">По видам расходов</h4>
            <div v-for="row in groupedByCategory" :key="row.name" class="group-row"><span>{{ row.name }}</span><b>{{ formatMoney(row.total) }}</b></div>
          </div>
          <div class="group-box">
            <h4 class="group-title">По сотрудникам</h4>
            <div v-for="row in groupedByEmployee" :key="row.name" class="group-row"><span>{{ row.name }}</span><b>{{ formatMoney(row.total) }}</b></div>
          </div>
          <div class="group-box">
            <h4 class="group-title">По месяцам</h4>
            <div v-for="row in groupedByMonth" :key="row.name" class="group-row"><span>{{ row.name }}</span><b>{{ formatMoney(row.total) }}</b></div>
          </div>
        </div>

        <div v-if="!detailExpenses.length" class="state-box">Нет расходов по выбранным фильтрам</div>
        <div v-else class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Объект</th>
                <th>Вид</th>
                <th>Название</th>
                <th>Сотрудник</th>
                <th class="text-right">Кол-во</th>
                <th class="text-right">Цена</th>
                <th class="text-right">Сумма</th>
                <th>Комментарий</th>
                <th>Статус</th>
                <th class="text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="expense in detailExpenses" :key="expense._id">
                <td>{{ formatDate(expense.date) }}</td>
                <td>{{ getObjectName(expense.objectId) }}</td>
                <td>{{ expense.category || '-' }}</td>
                <td class="font-medium">{{ expense.title }}</td>
                <td>{{ getEmployeeName(expense.employeeId) }}</td>
                <td class="text-right">{{ formatNumber(expense.quantity) }}</td>
                <td class="text-right">{{ formatMoney(expense.price) }}</td>
                <td class="text-right font-medium">{{ formatMoney(expenseAmount(expense)) }}</td>
                <td>{{ expense.comment || '-' }}</td>
                <td><span class="badge badge-green">Учтен</span></td>
                <td class="actions">
                  <button type="button" class="icon-btn" title="Редактировать" aria-label="Редактировать" @click="openEdit(expense)"><Pencil class="h-4 w-4" /></button>
                  <button type="button" class="icon-btn-danger" title="Удалить" aria-label="Удалить" @click="deleteExpense(expense._id)"><Trash2 class="h-4 w-4" /></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </BaseModal>

    <BaseModal v-if="isExpenseModalOpen" :title="editingId ? 'Редактировать расход' : 'Добавить расход'" @close="closeExpenseModal">
      <form class="form-grid" @submit.prevent="saveExpense">
        <label class="field">Объект
          <select v-model="form.objectId" class="input">
            <option value="">Общий расход без объекта</option>
            <option v-for="obj in objects" :key="obj._id" :value="obj._id">{{ obj.name }}</option>
          </select>
        </label>
        <label class="field">Вид расхода *
          <ManualSelect v-model="form.category" :options="expenseTypeNames" placeholder="Выберите вид расхода" manual-placeholder="Введите вид расхода" required />
        </label>
        <label class="field">Сотрудник
          <select v-model="form.employeeId" class="input">
            <option value="">Без сотрудника</option>
            <option v-for="employee in employees" :key="employee._id" :value="employee._id">{{ employee.fullName }}</option>
          </select>
        </label>
        <label class="field">Название *<input v-model="form.title" class="input" required /></label>
        <label class="field">Количество *<input v-model.number="form.quantity" class="input" type="number" min="0" required /></label>
        <label class="field">Цена *<input v-model.number="form.price" class="input" type="number" min="0" required /></label>
        <label class="field">Дата<input v-model="form.date" class="input" type="date" /></label>
        <label class="field md:col-span-2">Комментарий<textarea v-model="form.comment" class="input" rows="3" /></label>
        <div class="modal-actions md:col-span-2">
          <button type="button" class="btn-secondary" @click="closeExpenseModal">Отмена</button>
          <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'Сохранение...' : 'Сохранить' }}</button>
        </div>
      </form>
    </BaseModal>

    <BaseModal v-if="isTypeModalOpen" :title="editingTypeId ? 'Редактировать вид расхода' : 'Добавить вид расхода'" @close="closeTypeModal">
      <form class="form-grid" @submit.prevent="saveExpenseType">
        <label class="field md:col-span-2">Название *<input v-model="typeForm.name" class="input" required /></label>
        <label class="field md:col-span-2">Описание<textarea v-model="typeForm.description" class="input" rows="3" /></label>
        <label class="inline-flex items-center gap-2 text-sm font-medium text-gray-700 md:col-span-2">
          <input v-model="typeForm.isActive" type="checkbox" class="rounded border-gray-300" />
          Активен
        </label>
        <div class="modal-actions md:col-span-2">
          <button type="button" class="btn-secondary" @click="closeTypeModal">Отмена</button>
          <button type="submit" class="btn-primary" :disabled="savingType">{{ savingType ? 'Сохранение...' : 'Сохранить' }}</button>
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
import { formatDate, formatMoney, formatNumber, toNumber } from '../utils/format';

const emit = defineEmits(['changed']);

const defaultExpenseTypeNames = ['Материал', 'Инструмент', 'Транспорт', 'Зарплата', 'Квартира сотрудника', 'Продукты сотрудника', 'Транспорт сотрудника', 'Бытовые расходы сотрудника', 'Прочее'];
const employeeExpenseCategories = ['Квартира сотрудника', 'Продукты сотрудника', 'Транспорт сотрудника', 'Бытовые расходы сотрудника'];

const expenses = ref([]);
const objects = ref([]);
const employees = ref([]);
const expenseTypes = ref([]);
const expenseSearch = ref('');
const categoryFilter = ref('');
const objectFilter = ref('');
const employeeFilter = ref('');
const typeSearch = ref('');
const typeStatusFilter = ref('');
const detailSearch = ref('');
const detailObjectFilter = ref('');
const detailCategoryFilter = ref('');
const detailEmployeeFilter = ref('');
const detailDateFrom = ref('');
const detailDateTo = ref('');
const loading = ref(false);
const saving = ref(false);
const savingType = ref(false);
const error = ref('');
const isExpenseModalOpen = ref(false);
const isTypeModalOpen = ref(false);
const isDetailsOpen = ref(false);
const editingId = ref(null);
const editingTypeId = ref(null);

const today = () => new Date().toISOString().split('T')[0];
const emptyForm = () => ({ objectId: '', employeeId: '', category: '', title: '', quantity: 1, price: 0, date: today(), comment: '' });
const emptyTypeForm = () => ({ name: '', description: '', isActive: true });
const form = reactive(emptyForm());
const typeForm = reactive(emptyTypeForm());

const expenseAmount = (expense) => toNumber(expense.quantity) * toNumber(expense.price);
const isEmployeeExpense = (expense) => employeeExpenseCategories.includes(expense.category);
const isGeneralExpense = (expense) => !expense.objectId && !isEmployeeExpense(expense);
const isObjectExpense = (expense) => Boolean(expense.objectId) && !isEmployeeExpense(expense);

const allExpenseTypes = computed(() => {
  const map = new Map();
  defaultExpenseTypeNames.forEach(name => map.set(name, { name, description: 'Базовый вид расхода', isActive: true }));
  expenseTypes.value.forEach(type => map.set(type.name, type));
  expenses.value.forEach(expense => {
    if (expense.category && !map.has(expense.category)) map.set(expense.category, { name: expense.category, description: 'Старое значение', isActive: true });
  });
  return Array.from(map.values());
});

const activeExpenseTypes = computed(() => allExpenseTypes.value.filter(type => type.isActive !== false));
const expenseTypeNames = computed(() => activeExpenseTypes.value.map(type => type.name));
const filteredExpenseTypes = computed(() => {
  const query = typeSearch.value.trim().toLowerCase();
  return allExpenseTypes.value.filter(type => {
    const matchesStatus = !typeStatusFilter.value || (typeStatusFilter.value === 'active' ? type.isActive !== false : type.isActive === false);
    const matchesSearch = !query || [type.name, type.description].some(value => String(value || '').toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  });
});

const objectExpensesTotal = computed(() => expenses.value.filter(isObjectExpense).reduce((sum, expense) => sum + expenseAmount(expense), 0));
const employeeExpensesTotal = computed(() => expenses.value.filter(isEmployeeExpense).reduce((sum, expense) => sum + expenseAmount(expense), 0));
const generalExpensesTotal = computed(() => expenses.value.filter(isGeneralExpense).reduce((sum, expense) => sum + expenseAmount(expense), 0));
const allExpensesTotal = computed(() => objectExpensesTotal.value + employeeExpensesTotal.value + generalExpensesTotal.value);

const baseFilterExpenses = (items, filters) => items.filter(expense => {
  const matchesCategory = !filters.category || expense.category === filters.category;
  const matchesObject = !filters.object || (filters.object === '__none' ? !expense.objectId : String(expense.objectId) === String(filters.object));
  const matchesEmployee = !filters.employee || (filters.employee === '__none' ? !expense.employeeId : String(expense.employeeId) === String(filters.employee));
  const query = (filters.search || '').trim().toLowerCase();
  const haystack = [getObjectName(expense.objectId), getEmployeeName(expense.employeeId), expense.category, expense.title, expense.quantity, expense.price, expense.comment]
    .map(value => String(value || '').toLowerCase()).join(' ');
  const date = expense.date ? new Date(expense.date) : null;
  const from = filters.from ? new Date(filters.from) : null;
  const to = filters.to ? new Date(filters.to) : null;
  const matchesDate = (!from || (date && date >= from)) && (!to || (date && date <= new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59)));
  return matchesCategory && matchesObject && matchesEmployee && matchesDate && (!query || haystack.includes(query));
});

const filteredExpenses = computed(() => baseFilterExpenses(expenses.value, { search: expenseSearch.value, category: categoryFilter.value, object: objectFilter.value, employee: employeeFilter.value }));
const detailExpenses = computed(() => baseFilterExpenses(expenses.value, { search: detailSearch.value, category: detailCategoryFilter.value, object: detailObjectFilter.value, employee: detailEmployeeFilter.value, from: detailDateFrom.value, to: detailDateTo.value }));
const detailTotal = computed(() => detailExpenses.value.reduce((sum, expense) => sum + expenseAmount(expense), 0));
const detailEmployeeTotal = computed(() => detailExpenses.value.filter(isEmployeeExpense).reduce((sum, expense) => sum + expenseAmount(expense), 0));

const groupBy = (items, getName) => {
  const map = new Map();
  items.forEach((expense) => {
    const name = getName(expense) || '-';
    map.set(name, (map.get(name) || 0) + expenseAmount(expense));
  });
  return Array.from(map.entries()).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);
};
const groupedByCategory = computed(() => groupBy(detailExpenses.value, expense => expense.category || '-'));
const groupedByEmployee = computed(() => groupBy(detailExpenses.value, expense => getEmployeeName(expense.employeeId)));
const groupedByMonth = computed(() => groupBy(detailExpenses.value, expense => expense.date ? new Date(expense.date).toISOString().slice(0, 7) : '-'));

const toDateInput = (value) => value ? new Date(value).toISOString().split('T')[0] : '';
const resetForm = () => Object.assign(form, emptyForm());
const resetTypeForm = () => Object.assign(typeForm, emptyTypeForm());
const getObjectName = (objectId) => {
  if (!objectId) return 'Общие расходы';
  return objects.value.find(o => String(o._id) === String(objectId))?.name || 'Неизвестный объект';
};
const getEmployeeName = (employeeId) => {
  if (!employeeId) return '-';
  return employees.value.find(e => String(e._id) === String(employeeId))?.fullName || 'Неизвестный сотрудник';
};

const loadData = async () => {
  loading.value = true;
  error.value = '';
  try {
    const [expensesRes, objectsRes, employeesRes, typesRes] = await Promise.all([
      client.get('/api/expenses'),
      client.get('/api/objects'),
      client.get('/api/employees'),
      client.get('/api/expense-types')
    ]);
    expenses.value = expensesRes.data || [];
    objects.value = objectsRes.data || [];
    employees.value = employeesRes.data || [];
    expenseTypes.value = typesRes.data || [];
  } catch (err) {
    error.value = `Ошибка загрузки расходов: ${err.message}`;
  } finally {
    loading.value = false;
  }
};

const openCreate = (defaults = {}) => {
  editingId.value = null;
  resetForm();
  Object.assign(form, defaults);
  isExpenseModalOpen.value = true;
};
const openCreateFromDetails = () => openCreate({ objectId: detailObjectFilter.value === '__none' ? '' : detailObjectFilter.value, category: detailCategoryFilter.value || '', employeeId: detailEmployeeFilter.value === '__none' ? '' : detailEmployeeFilter.value });
const openEdit = (expense) => {
  editingId.value = expense._id;
  Object.assign(form, { objectId: expense.objectId || '', employeeId: expense.employeeId || '', category: expense.category || '', title: expense.title || '', quantity: toNumber(expense.quantity), price: toNumber(expense.price), date: toDateInput(expense.date), comment: expense.comment || '' });
  isExpenseModalOpen.value = true;
};
const closeExpenseModal = () => { isExpenseModalOpen.value = false; editingId.value = null; resetForm(); };

const openDetails = (defaults = {}) => {
  detailSearch.value = '';
  detailObjectFilter.value = defaults.objectId || '';
  detailCategoryFilter.value = defaults.category || '';
  detailEmployeeFilter.value = defaults.employeeId || '';
  detailDateFrom.value = '';
  detailDateTo.value = '';
  isDetailsOpen.value = true;
};
const closeDetails = () => { isDetailsOpen.value = false; };

const saveExpense = async () => {
  saving.value = true;
  error.value = '';
  try {
    const payload = { ...form, objectId: form.objectId || null, employeeId: form.employeeId || null, quantity: toNumber(form.quantity), price: toNumber(form.price) };
    if (editingId.value) await client.patch(`/api/expenses/${editingId.value}`, payload);
    else await client.post('/api/expenses', payload);
    closeExpenseModal();
    await loadData();
    emit('changed');
  } catch (err) {
    error.value = `Ошибка сохранения расхода: ${err.message}`;
  } finally {
    saving.value = false;
  }
};

const deleteExpense = async (id) => {
  if (!confirm('Удалить расход?')) return;
  error.value = '';
  try {
    await client.delete(`/api/expenses/${id}`);
    await loadData();
    emit('changed');
  } catch (err) {
    error.value = `Ошибка удаления расхода: ${err.message}`;
  }
};
const openTypeCreate = () => { editingTypeId.value = null; resetTypeForm(); isTypeModalOpen.value = true; };
const openTypeEdit = (type) => { editingTypeId.value = type._id; Object.assign(typeForm, { name: type.name || '', description: type.description || '', isActive: Boolean(type.isActive) }); isTypeModalOpen.value = true; };
const closeTypeModal = () => { isTypeModalOpen.value = false; editingTypeId.value = null; resetTypeForm(); };
const saveExpenseType = async () => {
  savingType.value = true;
  error.value = '';
  try {
    const payload = { ...typeForm };
    if (editingTypeId.value) await client.patch(`/api/expense-types/${editingTypeId.value}`, payload);
    else await client.post('/api/expense-types', payload);
    closeTypeModal();
    await loadData();
  } catch (err) {
    error.value = `Ошибка сохранения вида расхода: ${err.message}`;
  } finally {
    savingType.value = false;
  }
};
const deleteExpenseType = async (id) => {
  if (!confirm('Удалить вид расхода? Старые расходы со строковой категорией сохранятся.')) return;
  error.value = '';
  try {
    await client.delete(`/api/expense-types/${id}`);
    await loadData();
  } catch (err) {
    error.value = `Ошибка удаления вида расхода: ${err.message}`;
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
.summary-label { @apply text-sm text-gray-500; }
.summary-value { @apply mt-1 text-2xl font-semibold; }
.group-box { @apply rounded-2xl border border-gray-200 bg-white p-4; }
.group-title { @apply mb-2 text-sm font-semibold text-gray-700; }
.group-row { @apply flex justify-between gap-3 border-t border-gray-100 py-2 text-sm first:border-t-0; }
.table-toolbar { @apply mb-4 flex flex-col gap-2 md:flex-row md:flex-wrap; }
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
.badge-red { @apply bg-red-100 text-red-800; }
.badge-orange { @apply bg-orange-100 text-orange-800; }
.badge-gray { @apply bg-gray-100 text-gray-700; }
</style>
