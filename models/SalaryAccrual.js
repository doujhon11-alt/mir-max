const mongoose = require('mongoose');

const salaryAccrualSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'EmployeeId обязателен']
    },
    objectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Object',
      default: null,
      set: value => value || null
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
    comment: {
      type: String,
      default: ''
    }
  },
  { timestamps: true, collection: 'salaryAccruals' }
);

module.exports = mongoose.model('SalaryAccrual', salaryAccrualSchema);
