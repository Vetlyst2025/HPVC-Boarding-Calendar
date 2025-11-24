import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';          // ← THIS IS THE CORRECT PATH IN YOUR REPO
import { Reservation } from '../types';
import Calendar from './components/Calendar';
import ReservationModal from './components/ReservationModal';
import DailyHandover from './components/DailyHandover';
import SearchBar from './components/SearchBar';

function App() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [searchResults, setSearchResults] = useState<Set<string>>(new Set());

  // LOAD ALL RESERVATIONS FROM SUPABASE ON APP START
  useEffect(() => {
    const loadAllReservations = async () => {
      console.log('App started — loading ALL reservations from Supabase...');
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('startDate', { ascending: true });

      if (error) {
        console.error('Error loading reservations:', error);
        const local = localStorage.getItem('reservations');
        if (local) {
          const parsed = JSON.parse(local);
          setReservations(parsed);
          console.log('Fallback: loaded from localStorage', parsed.length);
        }
        return;
      }

      if (data && data.length > 0) {
        console.log(`Successfully loaded ${data.length} reservations from Supabase`);
        setReservations(data);
        localStorage.setItem('reservations', JSON.stringify(data));
      } else {
        console.log('No reservations found in Supabase');
      }
    };

    loadAllReservations();
  }, []); // ← Runs once when the app loads

  const saveReservation = async (reservation: Reservation) => {
    const { data, error } = await supabase
      .from('reservations')
      .upsert(reservation)
      .select()
      .single();

    if (error) {
      console.error('Supabase save error:', error);
      alert('Failed to save reservation');
      return;
    }

    const updated = reservations
      .filter(r => r.id !== reservation.id)
      .concat(data);

    setReservations(updated);
    localStorage.setItem('reservations', JSON.stringify(updated));
    setIsModalOpen(false);
    setEditingReservation(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-4xl font-bold text-cyan-600 mb-8 text-center">
          Healthy Pet Veterinary Clinic Boarding Calendar
        </h1>

        <SearchBar reservations={reservations} onResults={setSearchResults} />

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <Calendar
            currentDate={currentDate}
            reservations={reservations}
            onDateSelect={setSelectedDate}
            onAddReservation={(date) => {
              setSelectedDate(date);
              setEditingReservation(null);
              setIsModalOpen(true);
            }}
            onEditReservation={(res) => {
              setEditingReservation(res);
              setIsModalOpen(true);
            }}
            selectedDate={selectedDate}
            matchingReservationIds={searchResults}
          />
        </div>

        <DailyHandover reservations={reservations} selectedDate={selectedDate} />

        {isModalOpen && (
          <ReservationModal
            date={selectedDate}
            reservation={editingReservation || undefined}
            onSave={saveReservation}
            onClose={() => {
              setIsModalOpen(false);
              setEditingReservation(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

export default App;
