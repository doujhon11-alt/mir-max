<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h2 class="text-xl font-bold mb-4">Начисления и выплаты зарплаты</h2>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 class="text-lg font-semibold mb-4">Начисления</h3>
        <form @submit.prevent="addAccrual" class="mb-6 p-4 bg-gray-50 rounded">
          <div class="space-y-3">
            <select v-model="accrualForm.employeeId" class="input w-full" required>
              <option value="">Выберите сотрудника</option>
              <option v-for="emp in employees" :key="emp._id" :value="emp._id">{{ emp.fullName }}</option>
            </select>
            <select v-model="accrualForm.objectId" class="input w-full">
              <option value="">Выберите объект (опционально)</option>
              <option v-for="obj in objects" :key="obj._id" :value="obj._id">{{ obj.name }}</option>
            </select>
            <input v-model.number="accrualForm.amount" placeholder="Сумма" type="number" class="input w-full" required min="0" />
            <input v-model="accrualForm.date" type="date" class="input w-full" />
            <button type="submit" class="btn-primary w-full">Добавить начисление</button>
          </div>
        </form>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-100">
              <tr>
                <th class="p-2 text-left">Сотрудник</th>
                <th class="p-2 text-right">Сумма</th>
                <th class="p-2">Действие</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="accrual in accruals" :key="accrual._id" class="border-t text-sm">
                <td class="p-2">{{ getEmployeeName(accrual.employeeId) }}</td>
                <td class="p-2 text-right">{{ formatCurrency(accrual.amount) }}</td>
                <td class="p-2 text-center">
                  <button @click="deleteAccrual(accrual._id)" class="btn-danger-xs">Удалить</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 class="text-lg font-semibold mb-4">Выплаты</h3>
        <form @submit.prevent="addPayment" class="mb-6 p-4 bg-gray-50 rounded">
          <div class="space-y-3">
            <select v-model="paymentForm.employeeId" class="input w-full" required>
              <option value="">Выберите сотрудника</option>
              <option v-for="emp in employees" :key="emp._id" :value="emp._id">{{ emp.fullName }}</option>
            </select>
            <input v-model.number="paymentForm.amount" placeholder="Сумма" type="number" class="input w-full" required min="0" />
            <select v-model="paymentForm.paymentType" class="input w-full">
              <option value="Зарплата">Зарплата</option>
              <option value="Аванс">Аванс</option>
            </select>
            <input v-model="paymentForm.date" type="date" class="input w-full" />
            <button type="submit" class="btn-primary w-full">Добавить выплату</button>
          </div>
        </form>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-100">
              <tr>
                <th class="p-2 text-left">Сотрудник</th>
                <th class="p-2 text-right">Сумма</th>
                <th class="p-2 text-left">Тип</th>
                <th class="p-2">Действие</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="payment in payments" :key="payment._id" class="border-t text-sm">
                <td class="p-2">{{ getEmployeeName(payment.employeeId) }}</td>
                <td class="p-2 text-right">{{ formatCurrency(payment.amount) }}</td>
                <td class="p-2">{{ payment.paymentType }}</td>
                <td class="p-2 text-center">
                  <button @click="deletePayment(payment._id)" class="btn-danger-xs">Удалить</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import client from '../api/client';

const emit = defineEmits(['changed']);

const accruals = ref([]);
const payments = ref([]);
const employees = ref([]);
const objects = ref([]);

const accrualForm = reactive({
  employeeId: '',
  objectId: '',
  amount: 0,
  period: 'Месяц',
  date: new Date().toISOString().split('T')[0],
  comment: ''
});

const paymentForm = reactive({
  employeeId: '',
  amount: 0,
  date: new Date().toISOString().split('T')[0],
  paymentType: 'Зарплата',
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
    const [accrualsRes, paymentsRes, employeesRes, objectsRes] = await Promise.all([
      client.get('/api/salary-accruals'),
      client.get('/api/salary-payments'),
      client.get('/api/employees'),
      client.get('/api/objects')
    ]);
    accruals.value = accrualsRes.data || [];
    payments.value = paymentsRes.data || [];
    employees.value = employeesRes.data || [];
    objects.value = objectsRes.data || [];
  } catch (error) {
    console.error('Ошибка загрузки:', error);
  }
};

const addAccrual = async () => {
  try {
    await client.post('/api/salary-accruals', accrualForm);
    accrualForm.amount = 0;
    accrualForm.employeeId = '';
    accrualForm.objectId = '';
    await loadData();
    emit('changed');
  } catch (error) {
    console.error('Ошибка добавления:', error);
  }
};

const addPayment = async () => {
  try {
    await client.post('/api/salary-payments', paymentForm);
    paymentForm.amount = 0;
    paymentForm.employeeId = '';
    await loadData();
    emit('changed');
  } catch (error) {
    console.error('Ошибка добавления:', error);
  }
};

const deleteAccrual = async (id) => {
  if (confirm('Вы уверены?')) {
    try {
      await client.delete(`/api/salary-accruals/${id}`);
      await loadData();
      emit('changed');
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  }
};

const deletePayment = async (id) => {
  if (confirm('Вы уверены?')) {
    try {
      await client.delete(`/api/salary-payments/${id}`);
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

.btn-danger-xs {
  @apply px-1 py-0.5 bg-red-600 text-white rounded text-xs hover:bg-red-700;
}
</style>
