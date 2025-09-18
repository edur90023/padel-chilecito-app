import React, { useState } from 'react';
import axios from '../api/axiosConfig';

const BookingModal = ({ slotInfo, onClose, onBookingSuccess }) => {
  const [customerName, setCustomerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!slotInfo) return null;

  const { court, time, date } = slotInfo;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError('Por favor, ingresa un nombre.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const bookingData = {
        courtId: court._id,
        date: date.toISOString().split('T')[0],
        startTime: time,
        customerName: customerName.trim(),
      };

      await axios.post('/bookings', bookingData);

      onBookingSuccess(); // This function will be passed to refresh the grid
      console.log('Booking successful!');
      onClose(); // Close the modal on success

    } catch (err) {
      setError('No se pudo crear la reserva. Inténtelo de nuevo.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in-fast">
      <div className="bg-dark-secondary rounded-lg shadow-xl p-8 max-w-md w-full transform transition-all duration-300 scale-100">
        <h2 className="text-2xl font-bold text-white mb-4">Confirmar Reserva</h2>
        <div className="text-text-secondary mb-6 space-y-2">
          <p><span className="font-semibold text-white">Cancha:</span> {court.name}</p>
          <p><span className="font-semibold text-white">Fecha:</span> {date.toLocaleDateString()}</p>
          <p><span className="font-semibold text-white">Horario:</span> {time}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="customerName" className="block text-lg font-medium text-white mb-2">
              Nombre del Titular
            </label>
            <input
              type="text"
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-dark-tertiary text-white p-2 rounded-md border border-gray-600 focus:ring-primary focus:border-primary"
              required
            />
          </div>

          {error && <p className="text-red-400 mb-4">{error}</p>}

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Reservando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
