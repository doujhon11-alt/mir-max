const mongoose = require('mongoose');

const salaryPaymentSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'EmployeeId обязателен']
    },
    amount: {
      type: Number,
      required: [true, 'Сумма обязательна'],
      min: 0
    },
    period: {
      type: String,
      default: 'Месяц'
    },
    date: {
      type: Date,
      default: Date.now
    },
    paymentType: {
      type: String,
      default: 'Зарплата',
      trim: true
    },
    comment: {
      type: String,
      default: ''
    }
  },
  { timestamps: true, collection: 'salaryPayments' }
);

module.exports = mongoose.model('SalaryPayment', salaryPaymentSchema);
