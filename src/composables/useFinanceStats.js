import { computed } from 'vue';

export const EMPLOYEE_EXPENSE_CATEGORIES = [
  'Квартира сотрудника',
  'Продукты сотрудника',
  'Транспорт сотрудника',
  'Бытовые расходы сотрудника'
];

export function useFinanceStats(incomes, expenses, salaryAccruals, salaryPayments, debts, employeeLoans = { value: [] }, objectAdvances = { value: [] }) {
  const toNumber = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  };

  const expenseTotal = (expense) => toNumber(expense.quantity) * toNumber(expense.price);
  const isEmployeeExpense = (expense) => EMPLOYEE_EXPENSE_CATEGORIES.includes(expense.category);
  const isObjectExpense = (expense) => Boolean(expense.objectId) && !isEmployeeExpense(expense);
  const isGeneralCompanyExpense = (expense) => !expense.objectId && !isEmployeeExpense(expense);
  const isReceivedAdvance = (advance) => ['Получен', 'Учтён'].includes(advance.status);

  const receivedIncomeFromIncomes = computed(() => incomes.value
    .filter(i => i.status === 'Получено')
    .reduce((sum, i) => sum + toNumber(i.amount), 0));

  const receivedAdvances = computed(() => objectAdvances.value
    .filter(isReceivedAdvance)
    .reduce((sum, advance) => sum + toNumber(advance.amount), 0));

  const receivedIncome = computed(() => receivedIncomeFromIncomes.value + receivedAdvances.value);

  const expectedIncome = computed(() => incomes.value
    .filter(i => i.status === 'Ожидается')
    .reduce((sum, i) => sum + toNumber(i.amount), 0));

  const totalIncomes = computed(() => receivedIncome.value + expectedIncome.value);

  const totalObjectExpenses = computed(() => expenses.value
    .filter(isObjectExpense)
    .reduce((sum, e) => sum + expenseTotal(e), 0));

  const totalEmployeeExpenses = computed(() => expenses.value
    .filter(isEmployeeExpense)
    .reduce((sum, e) => sum + expenseTotal(e), 0));

  const totalGeneralCompanyExpenses = computed(() => expenses.value
    .filter(isGeneralCompanyExpense)
    .reduce((sum, e) => sum + expenseTotal(e), 0));

  const totalCompanyExpenses = computed(() => totalObjectExpenses.value + totalEmployeeExpenses.value + totalGeneralCompanyExpenses.value);

  const getObjectReceived = (objectId) => {
    const incomeReceived = incomes.value
      .filter(i => String(i.objectId) === String(objectId) && i.status === 'Получено')
      .reduce((sum, i) => sum + toNumber(i.amount), 0);

    const advanceReceived = objectAdvances.value
      .filter(advance => String(advance.objectId) === String(objectId) && isReceivedAdvance(advance))
      .reduce((sum, advance) => sum + toNumber(advance.amount), 0);

    return incomeReceived + advanceReceived;
  };

  const getObjectExpected = (objectId) => incomes.value
    .filter(i => String(i.objectId) === String(objectId) && i.status === 'Ожидается')
    .reduce((sum, i) => sum + toNumber(i.amount), 0);

  const getObjectExpenses = (objectId) => expenses.value
    .filter(e => String(e.objectId) === String(objectId) && !isEmployeeExpense(e))
    .reduce((sum, e) => sum + expenseTotal(e), 0);

  const getObjectAllExpenses = (objectId) => expenses.value
    .filter(e => String(e.objectId) === String(objectId))
    .reduce((sum, e) => sum + expenseTotal(e), 0);

  const getObjectProfit = (objectId) => getObjectReceived(objectId) - getObjectExpenses(objectId);

  const getObjectMargin = (objectId) => {
    const received = getObjectReceived(objectId);
    if (received === 0) return 0;
    return ((getObjectProfit(objectId) / received) * 100).toFixed(2);
  };

  const totalSalaryAccrued = computed(() => salaryAccruals.value.reduce((sum, a) => sum + toNumber(a.amount), 0));
  const totalSalaryPaid = computed(() => salaryPayments.value.reduce((sum, p) => sum + toNumber(p.amount), 0));
  const salaryDebt = computed(() => totalSalaryAccrued.value - totalSalaryPaid.value);

  const periodKey = (value) => String(value || 'Месяц').trim() || 'Месяц';

  const salaryReport = computed(() => {
    const rows = new Map();
    const ensureRow = (employeeId, period) => {
      const key = String(employeeId || 'unknown') + '::' + periodKey(period);
      if (!rows.has(key)) rows.set(key, { key, employeeId, period: periodKey(period), accrued: 0, paid: 0, debt: 0, status: 'Закрыто' });
      return rows.get(key);
    };

    salaryAccruals.value.forEach((accrual) => { ensureRow(accrual.employeeId, accrual.period).accrued += toNumber(accrual.amount); });
    salaryPayments.value.forEach((payment) => { ensureRow(payment.employeeId, payment.period).paid += toNumber(payment.amount); });

    return Array.from(rows.values()).map((row) => {
      const debt = row.accrued - row.paid;
      return { ...row, debt, status: debt > 0 ? 'Есть долг' : debt < 0 ? 'Переплата' : 'Закрыто' };
    }).sort((a, b) => String(b.period).localeCompare(String(a.period)) || String(a.employeeId).localeCompare(String(b.employeeId)));
  });

  const totalPersonalExpenses = computed(() => debts.value.reduce((sum, d) => sum + toNumber(d.amount), 0));
  const totalReimbursed = computed(() => debts.value.reduce((sum, d) => sum + toNumber(d.reimbursed), 0));
  const totalDebt = computed(() => totalPersonalExpenses.value - totalReimbursed.value);
  const totalCompanyOwesEmployees = computed(() => totalDebt.value);

  const loanRest = (loan) => {
    if (loan.status === 'Списан' || loan.status === 'Отменён') return 0;
    const rest = toNumber(loan.issuedAmount) - toNumber(loan.returnedAmount);
    return rest > 0 ? rest : 0;
  };

  const totalEmployeeLoansIssued = computed(() => employeeLoans.value.reduce((sum, loan) => sum + toNumber(loan.issuedAmount), 0));
  const totalEmployeeLoansReturned = computed(() => employeeLoans.value.reduce((sum, loan) => sum + toNumber(loan.returnedAmount), 0));
  const totalEmployeesOweCompany = computed(() => employeeLoans.value.reduce((sum, loan) => sum + loanRest(loan), 0));

  const totalExpenses = computed(() => totalCompanyExpenses.value + totalSalaryAccrued.value);
  const netProfit = computed(() => receivedIncome.value - totalExpenses.value);

  const formatCurrency = (value) => {
    const num = Number(value) || 0;
    return new Intl.NumberFormat('ru-KZ', { style: 'currency', currency: 'KZT', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('ru-KZ');
  };

  return {
    receivedIncome,
    receivedIncomeFromIncomes,
    receivedAdvances,
    expectedIncome,
    totalIncomes,
    totalObjectExpenses,
    totalEmployeeExpenses,
    totalGeneralCompanyExpenses,
    totalCompanyExpenses,
    getObjectReceived,
    getObjectExpected,
    getObjectExpenses,
    getObjectAllExpenses,
    getObjectProfit,
    getObjectMargin,
    totalSalaryAccrued,
    totalSalaryPaid,
    salaryDebt,
    salaryReport,
    totalPersonalExpenses,
    totalReimbursed,
    totalDebt,
    totalCompanyOwesEmployees,
    totalEmployeeLoansIssued,
    totalEmployeeLoansReturned,
    totalEmployeesOweCompany,
    totalExpenses,
    netProfit,
    formatCurrency,
    formatDate,
    expenseTotal,
    isEmployeeExpense,
    isObjectExpense,
    isGeneralCompanyExpense
  };
}
