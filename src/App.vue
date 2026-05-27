<template>
  <div class="min-h-screen bg-gray-100">
    <nav class="bg-blue-600 text-white p-4">
      <div class="max-w-7xl mx-auto">
        <h1 class="text-2xl font-bold">MIR MAX - Управление проектами</h1>
        <p class="text-sm opacity-90">Учет объектов, доходов и расходов</p>
      </div>
    </nav>

    <div class="max-w-7xl mx-auto p-6 space-y-6">
      <div v-if="pageError" class="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        {{ pageError }}
      </div>

      <DashboardCards :stats="stats" />

      <div class="space-y-6">
        <ObjectsTable @changed="loadAllData" />
        <IncomesTable @changed="loadAllData" />
        <ExpensesTable @changed="loadAllData" />
        <EmployeesTable @changed="loadAllData" />
        <SalaryTable @changed="loadAllData" />
        <DebtsTable @changed="loadAllData" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onErrorCaptured, onMounted } from 'vue';
import DashboardCards from './components/DashboardCards.vue';
import ObjectsTable from './components/ObjectsTable.vue';
import IncomesTable from './components/IncomesTable.vue';
import ExpensesTable from './components/ExpensesTable.vue';
import EmployeesTable from './components/EmployeesTable.vue';
import SalaryTable from './components/SalaryTable.vue';
import DebtsTable from './components/DebtsTable.vue';
import { useFinanceStats } from './composables/useFinanceStats';
import client from './api/client';

const incomes = ref([]);
const expenses = ref([]);
const salaryAccruals = ref([]);
const salaryPayments = ref([]);
const debts = ref([]);
const pageError = ref('');

const stats = useFinanceStats(incomes, expenses, salaryAccruals, salaryPayments, debts);

const loadAllData = async () => {
  try {
    const [incomesRes, expensesRes, accrualsRes, paymentsRes, debtsRes] = await Promise.all([
      client.get('/api/incomes'),
      client.get('/api/expenses'),
      client.get('/api/salary-accruals'),
      client.get('/api/salary-payments'),
      client.get('/api/debts')
    ]);

    incomes.value = incomesRes.data || [];
    expenses.value = expensesRes.data || [];
    salaryAccruals.value = accrualsRes.data || [];
    salaryPayments.value = paymentsRes.data || [];
    debts.value = debtsRes.data || [];

  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
    pageError.value = `Не удалось загрузить данные с backend: ${error.message}`;
  }
};

onErrorCaptured((error) => {
  console.error('Ошибка интерфейса:', error);
  pageError.value = `Ошибка интерфейса: ${error.message}`;
  return false;
});

onMounted(() => loadAllData());
</script>

<style>
</style>
