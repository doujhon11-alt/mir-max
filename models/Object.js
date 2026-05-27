const mongoose = require('mongoose');

const objectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Название объекта обязательно'],
      trim: true
    },
    clientName: {
      type: String,
      required: [true, 'Имя клиента обязательно'],
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    contractAmount: {
      type: Number,
      default: 0
    },
    startDate: Date,
    deadline: Date,
    status: {
      type: String,
      default: 'В работе',
      trim: true
    },
    comment: {
      type: String,
      default: ''
    }
  },
  { timestamps: true, collection: 'objects' }
);

module.exports = mongoose.model('Object', objectSchema);
