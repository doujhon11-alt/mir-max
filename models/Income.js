const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema(
  {
    objectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Object',
      required: [true, 'ObjectId обязателен']
    },
    amount: {
      type: Number,
      required: [true, 'Сумма обязательна'],
      min: 0
    },
    status: {
      type: String,
      enum: ['Получено', 'Ожидается'],
      default: 'Ожидается'
    },
    date: {
      type: Date,
      default: Date.now
    },
    paymentMethod: {
      type: String,
      default: 'Наличные'
    },
    comment: {
      type: String,
      default: ''
    }
  },
  { timestamps: true, collection: 'incomes' }
);

module.exports = mongoose.model('Income', incomeSchema);
