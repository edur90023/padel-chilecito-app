import React, { useState } from 'react';
import BookingGrid from '../components/BookingGrid';

function BookingPage() {
  // The state for the selected date will be managed here
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <div className="container mx-auto p-4 animate-fade-in">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-white">Reservar Cancha</h1>
        <p className="text-text-secondary mt-2">
          Selecciona un día y un horario para jugar.
        </p>
      </header>

      <div className="bg-dark-secondary p-6 rounded-lg shadow-xl">
        <div className="mb-6">
          <label htmlFor="date-picker" className="block text-lg font-medium text-white mb-2">
            Seleccionar Fecha:
          </label>
          <input
            type="date"
            id="date-picker"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="w-full md:w-auto bg-dark-tertiary text-white p-2 rounded-md border border-gray-600 focus:ring-primary focus:border-primary"
          />
        </div>

        <BookingGrid selectedDate={selectedDate} />
      </div>
    </div>
  );
}

export default BookingPage;
