<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h2 class="text-xl font-bold mb-4">Доходы</h2>

    <form @submit.prevent="addIncome" class="mb-6 p-4 bg-gray-50 rounded">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <select v-model="form.objectId" class="input" required>
          <option value="">Выберите объект</option>
          <option v-for="obj in objects" :key="obj._id" :value="obj._id">{{ obj.name }}</option>
        </select>
        <input v-model.number="form.amount" placeholder="Сумма" type="number" class="input" required min="0" />
        <select v-model="form.status" class="input">
          <option value="Получено">Получено</option>
          <option value="Ожидается">Ожидается</option>
        </select>
        <input v-model="form.date" type="date" class="input" />
        <input v-model="form.paymentMethod" placeholder="Способ оплаты" class="input" />
        <textarea v-model="form.comment" placeholder="Комментарий" class="input col-span-2" rows="2"></textarea>
        <button type="submit" class="btn-primary col-span-2">Добавить доход</button>
      </div>
    </form>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-100">
          <tr>
            <th class="p-3 text-left">Объект</th>
            <th class="p-3 text-left">Сумма</th>
            <th class="p-3 text-left">Статус</th>
            <th class="p-3 text-left">Дата</th>
            <th class="p-3 text-left">Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="income in incomes" :key="income._id" class="border-t hover:bg-gray-50">
            <td class="p-3">{{ getObjectName(income.objectId) }}</td>
            <td class="p-3 font-medium">{{ formatCurrency(income.amount) }}</td>
            <td class="p-3"><span class="badge" :class="income.status === 'Получено' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'">{{ income.status }}</span></td>
            <td class="p-3">{{ formatDate(income.date) }}</td>
            <td class="p-3">
              <button @click="deleteIncome(income._id)" class="btn-danger-sm">Удалить</button>
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

const incomes = ref([]);
const objects = ref([]);
const form = reactive({
  objectId: '',
  amount: 0,
  status: 'Получено',
  date: new Date().toISOString().split('T')[0],
  paymentMethod: 'Наличные',
  comment: ''
});

const formatCurrency = (value) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('ru-KZ', { style: 'currency', currency: 'KZT', minimumFractionDigits: 0 }).format(num);
};

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('ru-KZ');
};

const getObjectName = (objectId) => {
  const obj = objects.value.find(o => o._id === objectId);
  return obj?.name || 'Неизвестный объект';
};

const loadData = async () => {
  try {
    const [incomesRes, objectsRes] = await Promise.all([
      client.get('/api/incomes'),
      client.get('/api/objects')
    ]);
    incomes.value = incomesRes.data || [];
    objects.value = objectsRes.data || [];
  } catch (error) {
    console.error('Ошибка загрузки:', error);
  }
};

const addIncome = async () => {
  try {
    await client.post('/api/incomes', form);
    form.amount = 0;
    form.comment = '';
    await loadData();
    emit('changed');
  } catch (error) {
    console.error('Ошибка добавления:', error);
  }
};

const deleteIncome = async (id) => {
  if (confirm('Вы уверены?')) {
    try {
      await client.delete(`/api/incomes/${id}`);
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

.badge {
  @apply px-2 py-1 rounded text-xs font-medium;
}
</style>
