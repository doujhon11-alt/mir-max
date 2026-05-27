<template>
  <div v-if="stats" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="bg-white p-6 rounded-lg shadow">
      <div class="text-gray-500 text-sm font-medium">Получено доходов</div>
      <div class="text-2xl font-bold text-green-600 mt-2">
        {{ stats.formatCurrency(stats.receivedIncome.value) }}
      </div>
    </div>

    <div class="bg-white p-6 rounded-lg shadow">
      <div class="text-gray-500 text-sm font-medium">Ожидается доходов</div>
      <div class="text-2xl font-bold text-blue-600 mt-2">
        {{ stats.formatCurrency(stats.expectedIncome.value) }}
      </div>
    </div>

    <div class="bg-white p-6 rounded-lg shadow">
      <div class="text-gray-500 text-sm font-medium">Всего расходов</div>
      <div class="text-2xl font-bold text-red-600 mt-2">
        {{ stats.formatCurrency(stats.totalExpenses.value) }}
      </div>
    </div>

    <div class="bg-white p-6 rounded-lg shadow">
      <div class="text-gray-500 text-sm font-medium">Чистая прибыль</div>
      <div :class="`text-2xl font-bold mt-2 ${stats.netProfit.value >= 0 ? 'text-green-600' : 'text-red-600'}`">
        {{ stats.formatCurrency(stats.netProfit.value) }}
      </div>
    </div>

    <div class="bg-white p-6 rounded-lg shadow">
      <div class="text-gray-500 text-sm font-medium">Долг по зарплате</div>
      <div class="text-2xl font-bold text-orange-600 mt-2">
        {{ stats.formatCurrency(stats.salaryDebt.value) }}
      </div>
    </div>

    <div class="bg-white p-6 rounded-lg shadow">
      <div class="text-gray-500 text-sm font-medium">Долг сотрудников</div>
      <div class="text-2xl font-bold text-purple-600 mt-2">
        {{ stats.formatCurrency(stats.totalDebt.value) }}
      </div>
    </div>

    <div class="bg-white p-6 rounded-lg shadow">
      <div class="text-gray-500 text-sm font-medium">Всего начислено</div>
      <div class="text-2xl font-bold text-indigo-600 mt-2">
        {{ stats.formatCurrency(stats.totalSalaryAccrued.value) }}
      </div>
    </div>

    <div class="bg-white p-6 rounded-lg shadow">
      <div class="text-gray-500 text-sm font-medium">Всего выплачено</div>
      <div class="text-2xl font-bold text-teal-600 mt-2">
        {{ stats.formatCurrency(stats.totalSalaryPaid.value) }}
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  stats: {
    type: Object,
    required: true
  }
});
</script>
