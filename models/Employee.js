const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Ф.И.О. обязательно'],
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    position: {
      type: String,
      trim: true
    },
    salary: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['active', 'fired'],
      default: 'active'
    },
    birthDate: Date,
    iin: {
      type: String,
      trim: true
    },
    documentNumber: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    hireDate: Date,
    fireDate: Date,
    paymentMethod: {
      type: String,
      trim: true
    },
    bankName: {
      type: String,
      trim: true
    },
    cardNumber: {
      type: String,
      trim: true
    },
    emergencyContact: {
      type: String,
      trim: true
    },
    emergencyPhone: {
      type: String,
      trim: true
    },
    comment: {
      type: String,
      default: ''
    }
  },
  { timestamps: true, collection: 'employees' }
);

module.exports = mongoose.model('Employee', employeeSchema);
