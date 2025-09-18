const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  court: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Court',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Not all bookings might be by a registered user initially
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String, // e.g., "09:00"
    required: true
  },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'pending'],
    default: 'confirmed'
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'unpaid'],
    default: 'unpaid'
  }
}, {
  timestamps: true
});

// Index to quickly find bookings by date
BookingSchema.index({ date: 1 });

module.exports = mongoose.model('Booking', BookingSchema);
