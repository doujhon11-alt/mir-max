<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
      <div v-for="card in kpiCards" :key="card.label" class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between gap-3">
          <div class="rounded-xl p-2 text-lg" :class="card.iconClass">{{ card.icon }}</div>
          <span class="text-xs font-medium uppercase tracking-wide text-gray-400">{{ card.short }}</span>
        </div>
        <div class="mt-4 text-sm font-medium text-gray-500">{{ card.label }}</div>
        <div class="mt-1 text-2xl font-semibold" :class="card.valueClass">{{ formatMoney(card.value) }}</div>
      </div>
    </div>

    <section class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div class="mb-4 flex flex-wrap gap-2">
        <button type="button" class="quick-link" @click="$emit('open-section', 'expenses')">К расходам объекта</button>
        <button type="button" class="quick-link" @click="$emit('open-section', 'expenses')">К расходам сотрудников</button>
        <button type="button" class="quick-link" @click="$emit('open-section', 'expenses')">К общим расходам</button>
      </div>
      <div class="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="text-lg font-semibold text-gray-950">Сводка по объектам</h2>
          <p class="text-sm text-gray-500">Расчеты берутся из frontend composable, MongoDB хранит только сырые данные</p>
        </div>
      </div>

      <div v-if="!objects.length" class="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
        Пока нет данных. Добавьте первый объект.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="sticky top-0 bg-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th class="p-3">Объект</th>
              <th class="p-3">Клиент</th>
              <th class="p-3 text-right">Договор</th>
              <th class="p-3 text-right">Получено</th>
              <th class="p-3 text-right">Ожидается</th>
              <th class="p-3 text-right">Расходы</th>
              <th class="p-3 text-right">Прибыль</th>
              <th class="p-3 text-right">Маржа</th>
              <th class="p-3">Статус</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="object in objects" :key="object._id" class="border-t hover:bg-gray-50">
              <td class="p-3 font-medium text-gray-900">{{ object.name }}</td>
              <td class="p-3 text-gray-600">{{ object.clientName || '-' }}</td>
              <td class="p-3 text-right">{{ formatMoney(object.contractAmount) }}</td>
              <td class="p-3 text-right">{{ formatMoney(stats.getObjectReceived(object._id)) }}</td>
              <td class="p-3 text-right">{{ formatMoney(stats.getObjectExpected(object._id)) }}</td>
              <td class="p-3 text-right">{{ formatMoney(stats.getObjectExpenses(object._id)) }}</td>
              <td class="p-3 text-right font-semibold" :class="stats.getObjectProfit(object._id) >= 0 ? 'text-green-700' : 'text-red-700'">
                {{ formatMoney(stats.getObjectProfit(object._id)) }}
              </td>
              <td class="p-3 text-right">{{ formatPercent(stats.getObjectMargin(object._id)) }}</td>
              <td class="p-3"><span class="badge" :class="objectStatusClass(object.status)">{{ objectStatusLabel(object.status) }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <div class="operation-card">
        <h3 class="operation-title">Последние доходы</h3>
        <div v-if="!latestIncomes.length" class="operation-empty">Пока нет данных</div>
        <div v-for="income in latestIncomes" :key="income._id" class="operation-row">
          <div>
            <div class="font-medium text-gray-900">{{ objectName(income.objectId) }}</div>
            <div class="text-xs text-gray-500">{{ formatDate(income.date) }} · {{ income.status }}</div>
          </div>
          <div class="font-semibold text-green-700">{{ formatMoney(income.amount) }}</div>
        </div>
      </div>

      <div class="operation-card">
        <h3 class="operation-title">Последние расходы</h3>
        <div v-if="!latestExpenses.length" class="operation-empty">Пока нет данных</div>
        <div v-for="expense in latestExpenses" :key="expense._id" class="operation-row">
          <div>
            <div class="font-medium text-gray-900">{{ expense.title }}</div>
            <div class="text-xs text-gray-500">{{ objectName(expense.objectId) }} · {{ expense.category || '-' }}</div>
          </div>
          <div class="font-semibold text-red-700">{{ formatMoney(toNumber(expense.quantity) * toNumber(expense.price)) }}</div>
        </div>
      </div>

      <div class="operation-card">
        <h3 class="operation-title">Последние выплаты</h3>
        <div v-if="!latestPayments.length" class="operation-empty">Пока нет данных</div>
        <div v-for="payment in latestPayments" :key="payment._id" class="operation-row">
          <div>
            <div class="font-medium text-gray-900">{{ payment.paymentType }}</div>
            <div class="text-xs text-gray-500">{{ formatDate(payment.date) }}</div>
          </div>
          <div class="font-semibold text-slate-700">{{ formatMoney(payment.amount) }}</div>
        </div>
      </div>

      <div class="operation-card xl:col-span-3">
        <h3 class="operation-title">Последние займы сотрудникам</h3>
        <div v-if="!latestEmployeeLoans.length" class="operation-empty">Пока нет данных</div>
        <div v-for="loan in latestEmployeeLoans" :key="loan._id" class="operation-row">
          <div>
            <div class="font-medium text-gray-900">{{ loan.status }}</div>
            <div class="text-xs text-gray-500">{{ formatDate(loan.issueDate) }}</div>
          </div>
          <div class="text-right">
            <div class="font-semibold text-orange-700">{{ formatMoney(loanRest(loan)) }}</div>
            <div class="text-xs text-gray-500">из {{ formatMoney(loan.issuedAmount) }}</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { formatDate, formatMoney, formatPercent, toNumber } from '../utils/format';

defineEmits(['open-section']);

const props = defineProps({
  stats: { type: Object, required: true },
  objects: { type: Array, default: () => [] },
  incomes: { type: Array, default: () => [] },
  expenses: { type: Array, default: () => [] },
  salaryPayments: { type: Array, default: () => [] },
  employeeLoans: { type: Array, default: () => [] },
  objectAdvances: { type: Array, default: () => [] }
});

const sortLatest = (items) => [...items].sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0)).slice(0, 5);
const latestIncomes = computed(() => sortLatest(props.incomes));
const latestExpenses = computed(() => sortLatest(props.expenses));
const latestPayments = computed(() => sortLatest(props.salaryPayments));
const latestEmployeeLoans = computed(() => sortLatest(props.employeeLoans));
const loanRest = (loan) => {
  if (loan.status === 'Списан' || loan.status === 'Отменён') return 0;
  const rest = toNumber(loan.issuedAmount) - toNumber(loan.returnedAmount);
  return rest > 0 ? rest : 0;
};

const kpiCards = computed(() => [
  { label: 'Доходы получено', short: 'IN', icon: '↗', value: props.stats.receivedIncome.value, valueClass: 'text-green-700', iconClass: 'bg-green-50 text-green-700' },
  { label: 'Доходы ожидается', short: 'WAIT', icon: '…', value: props.stats.expectedIncome.value, valueClass: 'text-blue-700', iconClass: 'bg-blue-50 text-blue-700' },
  { label: 'Авансы получено', short: 'ADV', icon: '↘', value: props.stats.receivedAdvances.value, valueClass: 'text-emerald-700', iconClass: 'bg-emerald-50 text-emerald-700' },
  { label: 'Расходы по объектам', short: 'OBJ', icon: '−', value: props.stats.totalObjectExpenses.value, valueClass: 'text-red-700', iconClass: 'bg-red-50 text-red-700' },
  { label: 'Расходы на сотрудников', short: 'EMP EXP', icon: '⌁', value: props.stats.totalEmployeeExpenses.value, valueClass: 'text-orange-700', iconClass: 'bg-orange-50 text-orange-700' },
  { label: 'Общие расходы компании', short: 'GEN', icon: '□', value: props.stats.totalGeneralCompanyExpenses.value, valueClass: 'text-slate-700', iconClass: 'bg-slate-100 text-slate-700' },
  { label: 'Зарплата начислена', short: 'ACC', icon: '≡', value: props.stats.totalSalaryAccrued.value, valueClass: 'text-indigo-700', iconClass: 'bg-indigo-50 text-indigo-700' },
  { label: 'Зарплата выплачена', short: 'PAY', icon: '✓', value: props.stats.totalSalaryPaid.value, valueClass: 'text-teal-700', iconClass: 'bg-teal-50 text-teal-700' },
  { label: 'Долг по зарплате', short: 'SAL', icon: '!', value: props.stats.salaryDebt.value, valueClass: props.stats.salaryDebt.value > 0 ? 'text-orange-700' : 'text-green-700', iconClass: 'bg-orange-50 text-orange-700' },
  { label: 'Компания должна сотрудникам', short: 'PAYABLE', icon: '•', value: props.stats.totalCompanyOwesEmployees.value, valueClass: props.stats.totalCompanyOwesEmployees.value > 0 ? 'text-purple-700' : 'text-green-700', iconClass: 'bg-purple-50 text-purple-700' },
  { label: 'Сотрудники должны компании', short: 'LOAN', icon: '↙', value: props.stats.totalEmployeesOweCompany.value, valueClass: props.stats.totalEmployeesOweCompany.value > 0 ? 'text-orange-700' : 'text-green-700', iconClass: 'bg-orange-50 text-orange-700' },
  { label: 'Все расходы', short: 'EXP', icon: 'Σ', value: props.stats.totalExpenses.value, valueClass: 'text-red-700', iconClass: 'bg-red-50 text-red-700' },
  { label: 'Чистая прибыль', short: 'NET', icon: '₸', value: props.stats.netProfit.value, valueClass: props.stats.netProfit.value >= 0 ? 'text-green-700' : 'text-red-700', iconClass: 'bg-slate-100 text-slate-700' }
]);

const objectName = (objectId) => props.objects.find(object => String(object._id) === String(objectId))?.name || 'Неизвестный объект';
const objectStatusLabel = (status) => ({
  active: 'В работе',
  completed: 'Завершён',
  paused: 'Приостановлен',
  canceled: 'Отменён',
  'В работе': 'В работе',
  'Завершён': 'Завершён',
  'Приостановлен': 'Приостановлен',
  'Отменён': 'Отменён'
}[status] || status || '-');
const objectStatusClass = (status) => ({
  active: 'bg-green-100 text-green-800',
  'В работе': 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  'Завершён': 'bg-blue-100 text-blue-800',
  paused: 'bg-yellow-100 text-yellow-800',
  'Приостановлен': 'bg-yellow-100 text-yellow-800',
  canceled: 'bg-red-100 text-red-800',
  'Отменён': 'bg-red-100 text-red-800'
}[status] || 'bg-gray-100 text-gray-700');
</script>

<style scoped>
.badge { @apply rounded-full px-2.5 py-1 text-xs font-medium; }
.operation-card { @apply rounded-2xl border border-gray-200 bg-white p-5 shadow-sm; }
.operation-title { @apply mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500; }
.operation-row { @apply flex items-center justify-between gap-3 border-t border-gray-100 py-3 text-sm first:border-t-0 first:pt-0 last:pb-0; }
.operation-empty { @apply rounded-xl border border-dashed border-gray-300 p-5 text-center text-sm text-gray-500; }
.quick-link { @apply rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50; }
</style>
