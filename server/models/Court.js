const mongoose = require('mongoose');

const CourtSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  courtNumber: {
    type: Number,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Indoor', 'Outdoor'],
    default: 'Indoor'
  }
});

module.exports = mongoose.model('Court', CourtSchema);
