const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    objectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Object',
      required: [true, 'ObjectId обязателен']
    },
    category: {
      type: String,
      required: [true, 'Категория обязательна'],
      trim: true
    },
    title: {
      type: String,
      required: [true, 'Название обязательно'],
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    date: {
      type: Date,
      default: Date.now
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
      set: value => value || null
    },
    comment: {
      type: String,
      default: ''
    }
  },
  { timestamps: true, collection: 'expenses' }
);

module.exports = mongoose.model('Expense', expenseSchema);
