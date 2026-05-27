<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h2 class="text-xl font-bold mb-4">Долги сотрудников</h2>

    <form @submit.prevent="addDebt" class="mb-6 p-4 bg-gray-50 rounded">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <select v-model="form.employeeId" class="input" required>
          <option value="">Выберите сотрудника</option>
          <option v-for="emp in employees" :key="emp._id" :value="emp._id">{{ emp.fullName }}</option>
        </select>
        <select v-model="form.objectId" class="input">
          <option value="">Выберите объект (опционально)</option>
          <option v-for="obj in objects" :key="obj._id" :value="obj._id">{{ obj.name }}</option>
        </select>
        <input v-model.number="form.amount" placeholder="Сумма долга" type="number" class="input" required min="0" />
        <input v-model.number="form.reimbursed" placeholder="Возвращено" type="number" class="input" min="0" />
        <input v-model="form.date" type="date" class="input" />
        <textarea v-model="form.comment" placeholder="Комментарий" class="input col-span-2" rows="2"></textarea>
        <button type="submit" class="btn-primary col-span-2">Добавить долг</button>
      </div>
    </form>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-100">
          <tr>
            <th class="p-3 text-left">Сотрудник</th>
            <th class="p-3 text-right">Сумма долга</th>
            <th class="p-3 text-right">Возвращено</th>
            <th class="p-3 text-right">Остаток</th>
            <th class="p-3 text-left">Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="debt in debts" :key="debt._id" class="border-t hover:bg-gray-50">
            <td class="p-3">{{ getEmployeeName(debt.employeeId) }}</td>
            <td class="p-3 text-right">{{ formatCurrency(debt.amount) }}</td>
            <td class="p-3 text-right">{{ formatCurrency(debt.reimbursed) }}</td>
            <td class="p-3 text-right font-medium">{{ formatCurrency(debt.amount - debt.reimbursed) }}</td>
            <td class="p-3">
              <button @click="deleteDebt(debt._id)" class="btn-danger-sm">Удалить</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import client from '../api/client';

const emit = defineEmits(['changed']);

const debts = ref([]);
const employees = ref([]);
const objects = ref([]);
const form = reactive({
  employeeId: '',
  objectId: '',
  amount: 0,
  reimbursed: 0,
  date: new Date().toISOString().split('T')[0],
  comment: ''
});

const formatCurrency = (value) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('ru-KZ', { style: 'currency', currency: 'KZT', minimumFractionDigits: 0 }).format(num);
};

const getEmployeeName = (employeeId) => {
  const emp = employees.value.find(e => e._id === employeeId);
  return emp?.fullName || 'Неизвестный сотрудник';
};

const loadData = async () => {
  try {
    const [debtsRes, employeesRes, objectsRes] = await Promise.all([
      client.get('/api/debts'),
      client.get('/api/employees'),
      client.get('/api/objects')
    ]);
    debts.value = debtsRes.data || [];
    employees.value = employeesRes.data || [];
    objects.value = objectsRes.data || [];
  } catch (error) {
    console.error('Ошибка загрузки:', error);
  }
};

const addDebt = async () => {
  try {
    await client.post('/api/debts', form);
    Object.assign(form, {
      employeeId: '',
      objectId: '',
      amount: 0,
      reimbursed: 0,
      date: new Date().toISOString().split('T')[0],
      comment: ''
    });
    await loadData();
    emit('changed');
  } catch (error) {
    console.error('Ошибка добавления:', error);
  }
};

const deleteDebt = async (id) => {
  if (confirm('Вы уверены?')) {
    try {
      await client.delete(`/api/debts/${id}`);
      await loadData();
      emit('changed');
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  }
};

onMounted(() => loadData());
</script>

<style scoped>
.input {
  @apply px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.btn-primary {
  @apply px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition;
}

.btn-danger-sm {
  @apply px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700;
}
</style>
