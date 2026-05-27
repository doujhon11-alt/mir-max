import { computed } from 'vue';

export function useFinanceStats(incomes, expenses, salaryAccruals, salaryPayments, debts) {
  const toNumber = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  };

  const receivedIncome = computed(() => {
    return incomes.value
      .filter(i => i.status === 'Получено')
      .reduce((sum, i) => sum + toNumber(i.amount), 0);
  });

  const expectedIncome = computed(() => {
    return incomes.value
      .filter(i => i.status === 'Ожидается')
      .reduce((sum, i) => sum + toNumber(i.amount), 0);
  });

  const totalIncomes = computed(() => receivedIncome.value + expectedIncome.value);

  const totalObjectExpenses = computed(() => {
    return expenses.value
      .reduce((sum, e) => {
        const expenseAmount = toNumber(e.quantity) * toNumber(e.price);
        return sum + expenseAmount;
      }, 0);
  });

  const getObjectReceived = (objectId) => {
    return incomes.value
      .filter(i => String(i.objectId) === String(objectId) && i.status === 'Получено')
      .reduce((sum, i) => sum + toNumber(i.amount), 0);
  };

  const getObjectExpected = (objectId) => {
    return incomes.value
      .filter(i => String(i.objectId) === String(objectId) && i.status === 'Ожидается')
      .reduce((sum, i) => sum + toNumber(i.amount), 0);
  };

  const getObjectExpenses = (objectId) => {
    return expenses.value
      .filter(e => String(e.objectId) === String(objectId))
      .reduce((sum, e) => sum + (toNumber(e.quantity) * toNumber(e.price)), 0);
  };

  const getObjectProfit = (objectId) => {
    const received = getObjectReceived(objectId);
    const expensesAmount = getObjectExpenses(objectId);
    return received - expensesAmount;
  };

  const getObjectMargin = (objectId) => {
    const received = getObjectReceived(objectId);
    if (received === 0) return 0;
    const profit = getObjectProfit(objectId);
    return ((profit / received) * 100).toFixed(2);
  };

  const totalSalaryAccrued = computed(() => {
    return salaryAccruals.value
      .reduce((sum, a) => sum + toNumber(a.amount), 0);
  });

  const totalSalaryPaid = computed(() => {
    return salaryPayments.value
      .reduce((sum, p) => sum + toNumber(p.amount), 0);
  });

  const salaryDebt = computed(() => {
    return totalSalaryAccrued.value - totalSalaryPaid.value;
  });

  const totalPersonalExpenses = computed(() => {
    return debts.value
      .reduce((sum, d) => sum + toNumber(d.amount), 0);
  });

  const totalReimbursed = computed(() => {
    return debts.value
      .reduce((sum, d) => sum + toNumber(d.reimbursed), 0);
  });

  const totalDebt = computed(() => {
    return totalPersonalExpenses.value - totalReimbursed.value;
  });

  const totalExpenses = computed(() => {
    return totalObjectExpenses.value + totalSalaryAccrued.value;
  });

  const netProfit = computed(() => {
    return receivedIncome.value - totalExpenses.value;
  });

  const formatCurrency = (value) => {
    const num = Number(value) || 0;
    return new Intl.NumberFormat('ru-KZ', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('ru-KZ');
  };

  return {
    receivedIncome,
    expectedIncome,
    totalIncomes,
    totalObjectExpenses,
    getObjectReceived,
    getObjectExpected,
    getObjectExpenses,
    getObjectProfit,
    getObjectMargin,
    totalSalaryAccrued,
    totalSalaryPaid,
    salaryDebt,
    totalPersonalExpenses,
    totalReimbursed,
    totalDebt,
    totalExpenses,
    netProfit,
    formatCurrency,
    formatDate
  };
}
