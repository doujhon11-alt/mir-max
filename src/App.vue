<template>
  <div class="min-h-screen bg-gray-50 text-gray-900">
    <div v-if="isSidebarOpen" class="fixed inset-0 z-30 bg-black/40 lg:hidden" @click="isSidebarOpen = false"></div>

    <aside
      :class="[
        'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-gray-200 bg-white transition-transform duration-200 lg:translate-x-0',
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <div class="border-b border-gray-200 px-5 py-5">
        <div class="text-lg font-bold tracking-wide text-gray-950">MIR MAX</div>
        <div class="text-sm text-gray-500">Финансы и объекты</div>
      </div>

      <nav class="flex-1 space-y-1 overflow-y-auto p-3">
        <button
          v-for="section in sections"
          :key="section.id"
          type="button"
          :class="[
            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition',
            currentSection === section.id
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-950'
          ]"
          @click="selectSection(section.id)"
        >
          <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-base">{{ section.icon }}</span>
          <span>{{ section.title }}</span>
        </button>
      </nav>

      <div class="border-t border-gray-200 p-4 text-xs text-gray-500">
        MongoDB Atlas · Vue 3 · Netlify Functions
      </div>
    </aside>

    <div class="lg:pl-72">
      <header class="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div class="flex flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex items-start gap-3">
            <button type="button" class="btn-secondary lg:hidden" title="Открыть меню" aria-label="Открыть меню" @click="isSidebarOpen = true"><Menu class="h-4 w-4" /><span class="hidden sm:inline">Меню</span></button>
            <div>
              <h1 class="text-xl font-semibold text-gray-950">{{ activeSection.title }}</h1>
              <p class="text-sm text-gray-500">{{ activeSection.description }}</p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <div class="text-xs text-gray-500">Обновлено: {{ lastUpdatedLabel }}</div>
            <button type="button" class="btn-secondary" :disabled="isRefreshing" @click="loadAllData"><RefreshCw class="h-4 w-4" :class="{ 'animate-spin': isRefreshing }" />{{ isRefreshing ? 'Обновление...' : 'Обновить' }}</button>
            <button type="button" class="btn-disabled" disabled><FileSpreadsheet class="h-4 w-4" />Скачать Excel</button>
            <button type="button" class="btn-disabled" disabled><FileText class="h-4 w-4" />Скачать PDF</button>
          </div>
        </div>
      </header>

      <main class="space-y-6 p-4 sm:p-6">
        <div v-if="pageError" class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {{ pageError }} Проверьте подключение или API ключ.
        </div>

        <DashboardCards
          v-if="currentSection === 'dashboard'"
          :stats="stats"
          :objects="objects"
          :incomes="incomes"
          :expenses="expenses"
          :salary-payments="salaryPayments"
          :employee-loans="employeeLoans"
          :object-advances="objectAdvances"
          @open-section="selectSection"
        />

        <ObjectsTable v-else-if="currentSection === 'objects'" @changed="loadAllData" />
        <IncomesTable v-else-if="currentSection === 'incomes'" @changed="loadAllData" />
        <AdvancesTable v-else-if="currentSection === 'advances'" @changed="loadAllData" />
        <ExpensesTable v-else-if="currentSection === 'expenses'" @changed="loadAllData" />
        <EmployeesTable v-else-if="currentSection === 'employees'" @changed="loadAllData" />
        <SalaryTable v-else-if="currentSection === 'salary'" @changed="loadAllData" />
        <DebtsTable v-else-if="currentSection === 'debts'" @changed="loadAllData" />
        <ExpensesTable v-else-if="currentSection === 'expenseTypes'" @changed="loadAllData" />
        <SelectOptionsTable v-else-if="currentSection === 'selectOptions'" @changed="loadAllData" />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onErrorCaptured, onMounted } from 'vue';
import { FileSpreadsheet, FileText, Menu, RefreshCw } from '@lucide/vue';
import DashboardCards from './components/DashboardCards.vue';
import ObjectsTable from './components/ObjectsTable.vue';
import IncomesTable from './components/IncomesTable.vue';
import AdvancesTable from './components/AdvancesTable.vue';
import ExpensesTable from './components/ExpensesTable.vue';
import EmployeesTable from './components/EmployeesTable.vue';
import SalaryTable from './components/SalaryTable.vue';
import DebtsTable from './components/DebtsTable.vue';
import SelectOptionsTable from './components/SelectOptionsTable.vue';
import { useFinanceStats } from './composables/useFinanceStats';
import { formatDateTime } from './utils/format';
import client from './api/client';

const sections = [
  { id: 'dashboard', title: 'Dashboard', description: 'Ключевые показатели, прибыль и последние операции', icon: '⌂' },
  { id: 'objects', title: 'Объекты', description: 'Клиенты, договоры, адреса и статусы объектов', icon: '□' },
  { id: 'incomes', title: 'Доходы', description: 'Полученные и ожидаемые платежи', icon: '₸' },
  { id: 'advances', title: 'Авансы', description: 'Авансы по объектам и их статусы', icon: '↘' },
  { id: 'expenses', title: 'Расходы', description: 'Расходы по объектам и справочник видов расходов', icon: '−' },
  { id: 'employees', title: 'Сотрудники', description: 'Команда, контакты, должности и оклады', icon: '◎' },
  { id: 'salary', title: 'Зарплата', description: 'Начисления, авансы и выплаты', icon: '≡' },
  { id: 'debts', title: 'Долги', description: 'Личные расходы сотрудников и займы компании сотрудникам', icon: '!' },
  { id: 'expenseTypes', title: 'Виды расходов', description: 'Справочник категорий для расходных операций', icon: '+' },
  { id: 'selectOptions', title: 'Значения select', description: 'Свои значения для выпадающих списков', icon: '≙' }
];

const currentSection = ref('dashboard');
const isSidebarOpen = ref(false);
const isRefreshing = ref(false);
const lastUpdatedAt = ref(null);
const pageError = ref('');

const objects = ref([]);
const incomes = ref([]);
const expenses = ref([]);
const salaryAccruals = ref([]);
const salaryPayments = ref([]);
const debts = ref([]);
const employeeLoans = ref([]);
const objectAdvances = ref([]);

const stats = useFinanceStats(incomes, expenses, salaryAccruals, salaryPayments, debts, employeeLoans, objectAdvances);

const activeSection = computed(() => sections.find(section => section.id === currentSection.value) || sections[0]);
const lastUpdatedLabel = computed(() => lastUpdatedAt.value ? formatDateTime(lastUpdatedAt.value) : '-');

const selectSection = (sectionId) => {
  currentSection.value = sectionId;
  isSidebarOpen.value = false;
};

const loadAllData = async () => {
  isRefreshing.value = true;
  pageError.value = '';
  try {
    const [objectsRes, incomesRes, advancesRes, expensesRes, accrualsRes, paymentsRes, debtsRes, employeeLoansRes] = await Promise.all([
      client.get('/api/objects'),
      client.get('/api/incomes'),
      client.get('/api/object-advances'),
      client.get('/api/expenses'),
      client.get('/api/salary-accruals'),
      client.get('/api/salary-payments'),
      client.get('/api/debts'),
      client.get('/api/employee-loans')
    ]);

    objects.value = objectsRes.data || [];
    incomes.value = incomesRes.data || [];
    objectAdvances.value = advancesRes.data || [];
    expenses.value = expensesRes.data || [];
    salaryAccruals.value = accrualsRes.data || [];
    salaryPayments.value = paymentsRes.data || [];
    debts.value = debtsRes.data || [];
    employeeLoans.value = employeeLoansRes.data || [];
    lastUpdatedAt.value = new Date().toISOString();
  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
    pageError.value = `Не удалось загрузить данные: ${error.message}`;
  } finally {
    isRefreshing.value = false;
  }
};

onErrorCaptured((error) => {
  console.error('Ошибка интерфейса:', error);
  pageError.value = `Ошибка интерфейса: ${error.message}`;
  return false;
});

onMounted(loadAllData);
</script>

<style scoped>
.btn-secondary { @apply inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60; }
.btn-disabled { @apply inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-100 px-3 py-2 text-sm font-medium text-gray-400 cursor-not-allowed; }
</style>
