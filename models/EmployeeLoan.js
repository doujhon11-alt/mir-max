const mongoose = require('mongoose');

const employeeLoanSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'EmployeeId обязателен']
    },
    issuedAmount: {
      type: Number,
      required: [true, 'Сумма выданного долга обязательна'],
      min: 0
    },
    issueDate: {
      type: Date,
      default: Date.now
    },
    returnedAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    returnDate: {
      type: Date,
      default: null,
      set: value => value || null
    },
    status: {
      type: String,
      default: 'Активен',
      trim: true
    },
    comment: {
      type: String,
      default: ''
    }
  },
  { timestamps: true, collection: 'employeeLoans' }
);

module.exports = mongoose.model('EmployeeLoan', employeeLoanSchema);
