const mongoose = require('mongoose');

const debtSchema = new mongoose.Schema(
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
    reimbursed: {
      type: Number,
      default: 0,
      min: 0
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
  { timestamps: true, collection: 'debts' }
);

module.exports = mongoose.model('Debt', debtSchema);
