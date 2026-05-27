<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h2 class="text-xl font-bold mb-4">Объекты</h2>

    <form @submit.prevent="addObject" class="mb-6 p-4 bg-gray-50 rounded">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input v-model="form.name" placeholder="Название объекта" class="input" required />
        <input v-model="form.clientName" placeholder="Имя клиента" class="input" required />
        <input v-model="form.phone" placeholder="Телефон" class="input" />
        <input v-model="form.address" placeholder="Адрес" class="input" />
        <input v-model.number="form.contractAmount" placeholder="Сумма контракта" type="number" class="input" min="0" />
        <input v-model="form.startDate" type="date" class="input" />
        <input v-model="form.deadline" type="date" class="input" />
        <select v-model="form.status" class="input">
          <option value="active">Активный</option>
          <option value="completed">Завершенный</option>
          <option value="paused">На паузе</option>
          <option value="canceled">Отменен</option>
        </select>
        <textarea v-model="form.comment" placeholder="Комментарий" class="input col-span-2" rows="2"></textarea>
        <button type="submit" class="btn-primary col-span-2">Добавить объект</button>
      </div>
    </form>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-100">
          <tr>
            <th class="p-3 text-left">Название</th>
            <th class="p-3 text-left">Клиент</th>
            <th class="p-3 text-left">Сумма</th>
            <th class="p-3 text-left">Статус</th>
            <th class="p-3 text-left">Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="obj in objects" :key="obj._id" class="border-t hover:bg-gray-50">
            <td class="p-3">{{ obj.name }}</td>
            <td class="p-3">{{ obj.clientName }}</td>
            <td class="p-3">{{ formatCurrency(obj.contractAmount) }}</td>
            <td class="p-3"><span class="badge" :class="`badge-${obj.status}`">{{ obj.status }}</span></td>
            <td class="p-3">
              <button @click="deleteObject(obj._id)" class="btn-danger-sm">Удалить</button>
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

const objects = ref([]);
const form = reactive({
  name: '',
  clientName: '',
  phone: '',
  address: '',
  contractAmount: 0,
  startDate: '',
  deadline: '',
  status: 'active',
  comment: ''
});

const formatCurrency = (value) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('ru-KZ', {
    style: 'currency',
    currency: 'KZT',
    minimumFractionDigits: 0
  }).format(num);
};

const loadObjects = async () => {
  try {
    const res = await client.get('/api/objects');
    objects.value = res.data || [];
  } catch (error) {
    console.error('Ошибка загрузки объектов:', error);
  }
};

const addObject = async () => {
  try {
    await client.post('/api/objects', form);
    Object.assign(form, {
      name: '',
      clientName: '',
      phone: '',
      address: '',
      contractAmount: 0,
      startDate: '',
      deadline: '',
      status: 'active',
      comment: ''
    });
    await loadObjects();
    emit('changed');
  } catch (error) {
    console.error('Ошибка добавления объекта:', error);
  }
};

const deleteObject = async (id) => {
  if (confirm('Вы уверены?')) {
    try {
      await client.delete(`/api/objects/${id}`);
      await loadObjects();
      emit('changed');
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  }
};

onMounted(() => loadObjects());
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

.badge-active {
  @apply bg-green-100 text-green-800;
}

.badge-completed {
  @apply bg-blue-100 text-blue-800;
}

.badge-paused {
  @apply bg-yellow-100 text-yellow-800;
}

.badge-canceled {
  @apply bg-red-100 text-red-800;
}
</style>
