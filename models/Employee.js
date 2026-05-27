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
    comment: {
      type: String,
      default: ''
    }
  },
  { timestamps: true, collection: 'employees' }
);

module.exports = mongoose.model('Employee', employeeSchema);
