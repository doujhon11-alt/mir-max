const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Имя клиента обязательно'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Телефон обязателен'],
      trim: true
    },
    area: {
      type: Number,
      default: null
    },
    cableLength: {
      type: Number,
      default: null
    },
    withShield: {
      type: Boolean,
      default: false
    },
    total: {
      type: Number,
      default: null
    },
    comment: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['new', 'processed', 'completed', 'canceled'],
      default: 'new'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Request', requestSchema);
