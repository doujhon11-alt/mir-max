<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h2 class="text-xl font-bold mb-4">Расходы</h2>

    <form @submit.prevent="addExpense" class="mb-6 p-4 bg-gray-50 rounded">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <select v-model="form.objectId" class="input" required>
          <option value="">Выберите объект</option>
          <option v-for="obj in objects" :key="obj._id" :value="obj._id">{{ obj.name }}</option>
        </select>
        <input v-model="form.category" placeholder="Категория" class="input" required />
        <input v-model="form.title" placeholder="Название" class="input" required />
        <input v-model.number="form.quantity" placeholder="Количество" type="number" class="input" required min="0" />
        <input v-model.number="form.price" placeholder="Цена" type="number" class="input" required min="0" />
        <input v-model="form.date" type="date" class="input" />
        <textarea v-model="form.comment" placeholder="Комментарий" class="input col-span-2" rows="2"></textarea>
        <button type="submit" class="btn-primary col-span-2">Добавить расход</button>
      </div>
    </form>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-100">
          <tr>
            <th class="p-3 text-left">Объект</th>
            <th class="p-3 text-left">Категория</th>
            <th class="p-3 text-left">Название</th>
            <th class="p-3 text-right">Кол-во × Цена</th>
            <th class="p-3 text-right">Сумма</th>
            <th class="p-3 text-left">Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="expense in expenses" :key="expense._id" class="border-t hover:bg-gray-50">
            <td class="p-3">{{ getObjectName(expense.objectId) }}</td>
            <td class="p-3">{{ expense.category }}</td>
            <td class="p-3">{{ expense.title }}</td>
            <td class="p-3 text-right">{{ expense.quantity }} × {{ formatCurrency(expense.price) }}</td>
            <td class="p-3 text-right font-medium">{{ formatCurrency(expense.quantity * expense.price) }}</td>
            <td class="p-3">
              <button @click="deleteExpense(expense._id)" class="btn-danger-sm">Удалить</button>
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

const expenses = ref([]);
const objects = ref([]);
const form = reactive({
  objectId: '',
  category: '',
  title: '',
  quantity: 0,
  price: 0,
  date: new Date().toISOString().split('T')[0],
  comment: ''
});

const formatCurrency = (value) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('ru-KZ', { style: 'currency', currency: 'KZT', minimumFractionDigits: 0 }).format(num);
};

const getObjectName = (objectId) => {
  const obj = objects.value.find(o => o._id === objectId);
  return obj?.name || 'Неизвестный объект';
};

const loadData = async () => {
  try {
    const [expensesRes, objectsRes] = await Promise.all([
      client.get('/api/expenses'),
      client.get('/api/objects')
    ]);
    expenses.value = expensesRes.data || [];
    objects.value = objectsRes.data || [];
  } catch (error) {
    console.error('Ошибка загрузки:', error);
  }
};

const addExpense = async () => {
  try {
    await client.post('/api/expenses', form);
    Object.assign(form, {
      objectId: '',
      category: '',
      title: '',
      quantity: 0,
      price: 0,
      date: new Date().toISOString().split('T')[0],
      comment: ''
    });
    await loadData();
    emit('changed');
  } catch (error) {
    console.error('Ошибка добавления:', error);
  }
};

const deleteExpense = async (id) => {
  if (confirm('Вы уверены?')) {
    try {
      await client.delete(`/api/expenses/${id}`);
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
