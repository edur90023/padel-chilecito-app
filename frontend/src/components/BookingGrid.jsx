import React, { useState, useEffect } from 'react';
import axios from '../api/axiosConfig'; // Using the custom axios instance
import BookingModal from './BookingModal';

const BookingGrid = ({ selectedDate }) => {
  const [bookings, setBookings] = useState([]);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for the modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Define time slots for the day
  const timeSlots = Array.from({ length: 15 }, (_, i) => {
    const hour = 9 + i;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  useEffect(() => {
    const fetchBookingData = async () => {
      if (!selectedDate) return;
      setLoading(true);
      setError(null);

      try {
        const dateString = selectedDate.toISOString().split('T')[0];

        // Fetch bookings for the selected date
        const bookingsRes = await axios.get(`/bookings?date=${dateString}`);
        setBookings(bookingsRes.data);

        // This is a temporary solution. Ideally, courts are fetched once.
        // For now, I assume an endpoint /courts exists or will be created.
        // As a fallback, I will hardcode the courts if the endpoint fails.
        try {
          const courtsRes = await axios.get('/courts'); // This endpoint doesn't exist yet
          setCourts(courtsRes.data);
        } catch (courtError) {
          console.warn("Could not fetch courts, using hardcoded data. Create a GET /api/courts endpoint.");
          setCourts([
            { _id: '1', name: 'Cancha 1' },
            { _id: '2', name: 'Cancha 2' },
            { _id: '3', name: 'Cancha 3' },
            { _id: '4', name: 'Cancha 4' },
          ]);
        }

      } catch (err) {
        setError('No se pudieron cargar las reservas. Inténtelo de nuevo más tarde.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingData();
  }, [selectedDate]);

  const fetchBookingData = async () => {
    if (!selectedDate) return;
    setLoading(true);
    setError(null);

    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      const bookingsRes = await axios.get(`/bookings?date=${dateString}`);
      setBookings(bookingsRes.data);

      try {
        const courtsRes = await axios.get('/courts');
        setCourts(courtsRes.data);
      } catch (courtError) {
        console.warn("Could not fetch courts, using hardcoded data. Create a GET /api/courts endpoint.");
        setCourts([
            { _id: '1', name: 'Cancha 1' },
            { _id: '2', name: 'Cancha 2' },
            { _id: '3', name: 'Cancha 3' },
            { _id: '4', name: 'Cancha 4' },
        ]);
      }

    } catch (err) {
      setError('No se pudieron cargar las reservas. Inténtelo de nuevo más tarde.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotClick = (court, time) => {
    const isBooked = bookings.some(b => b.court._id === court._id && b.startTime === time);
    if (!isBooked) {
      setSelectedSlot({ court, time, date: selectedDate });
      setIsModalOpen(true);
    }
  };

  const handleBookingSuccess = () => {
    setIsModalOpen(false);
    fetchBookingData(); // Re-fetch data to show the new booking
  };

  if (loading) {
    return <div className="loading-spinner mx-auto mt-10"></div>;
  }

  if (error) {
    return <div className="text-red-400 text-center mt-10">{error}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-center border-collapse">
        <thead>
          <tr className="bg-dark-tertiary">
            <th className="p-3 text-white font-semibold border-b border-gray-700">Horario</th>
            {courts.map(court => (
              <th key={court._id} className="p-3 text-white font-semibold border-b border-gray-700">{court.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map(time => (
            <tr key={time} className="even:bg-dark-secondary odd:bg-opacity-50">
              <td className="p-3 text-text-secondary font-medium border-r border-gray-700">{time}</td>
              {courts.map(court => {
                const isBooked = bookings.some(b => b.court._id === court._id && b.startTime === time);
                return (
                  <td key={court._id} className="p-3 border-r border-gray-700">
                    {isBooked ? (
                      <div className="bg-red-500 text-white p-2 rounded-md cursor-not-allowed">
                        Reservado
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSlotClick(court, time)}
                        className="bg-green-500 text-white p-2 rounded-md hover:bg-green-600 transition-colors duration-200"
                      >
                        Disponible
                      </button>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && (
        <BookingModal
          slotInfo={selectedSlot}
          onClose={() => setIsModalOpen(false)}
          onBookingSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
};

export default BookingGrid;
