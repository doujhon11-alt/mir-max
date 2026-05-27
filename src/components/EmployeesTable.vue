<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h2 class="text-xl font-bold mb-4">Сотрудники</h2>

    <form @submit.prevent="addEmployee" class="mb-6 p-4 bg-gray-50 rounded">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input v-model="form.fullName" placeholder="Ф.И.О." class="input" required />
        <input v-model="form.phone" placeholder="Телефон" class="input" />
        <input v-model="form.position" placeholder="Должность" class="input" />
        <input v-model.number="form.salary" placeholder="Зарплата" type="number" class="input" min="0" />
        <select v-model="form.status" class="input">
          <option value="active">Активный</option>
          <option value="fired">Уволен</option>
        </select>
        <textarea v-model="form.comment" placeholder="Комментарий" class="input col-span-2" rows="2"></textarea>
        <button type="submit" class="btn-primary col-span-2">Добавить сотрудника</button>
      </div>
    </form>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-100">
          <tr>
            <th class="p-3 text-left">Ф.И.О.</th>
            <th class="p-3 text-left">Должность</th>
            <th class="p-3 text-left">Зарплата</th>
            <th class="p-3 text-left">Статус</th>
            <th class="p-3 text-left">Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="employee in employees" :key="employee._id" class="border-t hover:bg-gray-50">
            <td class="p-3">{{ employee.fullName }}</td>
            <td class="p-3">{{ employee.position }}</td>
            <td class="p-3">{{ formatCurrency(employee.salary) }}</td>
            <td class="p-3"><span class="badge" :class="employee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">{{ employee.status }}</span></td>
            <td class="p-3">
              <button @click="deleteEmployee(employee._id)" class="btn-danger-sm">Удалить</button>
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

const employees = ref([]);
const form = reactive({
  fullName: '',
  phone: '',
  position: '',
  salary: 0,
  status: 'active',
  comment: ''
});

const formatCurrency = (value) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('ru-KZ', { style: 'currency', currency: 'KZT', minimumFractionDigits: 0 }).format(num);
};

const loadEmployees = async () => {
  try {
    const res = await client.get('/api/employees');
    employees.value = res.data || [];
  } catch (error) {
    console.error('Ошибка загрузки:', error);
  }
};

const addEmployee = async () => {
  try {
    await client.post('/api/employees', form);
    Object.assign(form, {
      fullName: '',
      phone: '',
      position: '',
      salary: 0,
      status: 'active',
      comment: ''
    });
    await loadEmployees();
    emit('changed');
  } catch (error) {
    console.error('Ошибка добавления:', error);
  }
};

const deleteEmployee = async (id) => {
  if (confirm('Вы уверены?')) {
    try {
      await client.delete(`/api/employees/${id}`);
      await loadEmployees();
      emit('changed');
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  }
};

onMounted(() => loadEmployees());
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
