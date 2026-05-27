const mongoose = require('mongoose');

const objectAdvanceSchema = new mongoose.Schema(
  {
    objectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Object',
      required: [true, 'ObjectId обязателен']
    },
    amount: {
      type: Number,
      required: [true, 'Сумма аванса обязательна'],
      min: 0
    },
    date: {
      type: Date,
      default: Date.now
    },
    paymentMethod: {
      type: String,
      default: 'Наличные',
      trim: true
    },
    status: {
      type: String,
      default: 'Получен',
      trim: true
    },
    comment: {
      type: String,
      default: ''
    }
  },
  { timestamps: true, collection: 'objectAdvances' }
);

module.exports = mongoose.model('ObjectAdvance', objectAdvanceSchema);
