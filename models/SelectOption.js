const mongoose = require('mongoose');

const selectOptionSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: [true, 'Категория обязательна'],
      trim: true
    },
    name: {
      type: String,
      required: [true, 'Название обязательно'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true, collection: 'selectOptions' }
);

selectOptionSchema.index({ category: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('SelectOption', selectOptionSchema);
