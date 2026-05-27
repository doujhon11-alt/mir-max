const mongoose = require('mongoose');

const expenseTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Название вида расхода обязательно'],
      unique: true,
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true, collection: 'expenseTypes' }
);

module.exports = mongoose.model('ExpenseType', expenseTypeSchema);
