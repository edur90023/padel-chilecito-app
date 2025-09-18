const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Court = require('../models/Court');
const mongoose = require('mongoose');

// GET /api/bookings?date=YYYY-MM-DD
// Get all bookings for a specific day, organized by court
router.get('/', async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ message: 'Date query parameter is required' });
  }

  try {
    const searchDate = new Date(date);
    if (isNaN(searchDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date format provided.' });
    }

    // Set to the beginning of the day in UTC for consistent querying
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const bookings = await Booking.find({
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $ne: 'cancelled' }
    }).populate('court', 'name courtNumber');

    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Server error while fetching bookings' });
  }
});

// POST /api/bookings
// Create a new booking
router.post('/', async (req, res) => {
  const { courtId, date, startTime, customerName } = req.body;

  if (!courtId || !date || !startTime || !customerName) {
    return res.status(400).json({ message: 'Missing required fields for booking' });
  }

  if (!mongoose.Types.ObjectId.isValid(courtId)) {
      return res.status(400).json({ message: 'Invalid Court ID format.' });
  }

  try {
    const bookingDate = new Date(date);
    if (isNaN(bookingDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date format for booking.' });
    }

    const newBooking = new Booking({
      court: courtId,
      date: bookingDate,
      startTime,
      customerName,
      // user: req.user ? req.user.id : null // Optional: if auth is implemented
    });

    await newBooking.save();
    res.status(201).json(newBooking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Server error while creating booking' });
  }
});

// DELETE /api/bookings/:id
// Cancel a booking
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Booking ID format.' });
  }

  try {
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Instead of deleting, we mark it as cancelled
    booking.status = 'cancelled';
    await booking.save();

    // await Booking.findByIdAndDelete(id);

    res.status(200).json({ message: 'Booking successfully cancelled' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ message: 'Server error while deleting booking' });
  }
});


module.exports = router;
