import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
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
        // Fallback to localStorage if offline or error
        const local = localStorage.getItem('reservations');
        if (local) {
          const parsed = JSON.parse(local);
          setReservations(parsed);
          console.log('Loaded from localStorage:', parsed.length);
        }
        return;
      }

      if (data && data.length > 0) {
        console.log(`Loaded ${data.length} reservations from Supabase`);
        setReservations(data);
        localStorage.setItem('reservations', JSON.stringify(data));
      } else {
        console.log('No reservations in Supabase yet');
      }
    };

    loadAllReservations();
  }, []); // Runs once when app loads

  // Save to Supabase + localStorage when adding/updating
  const saveReservation = async (reservation: Reservation) => {
    const { data, error } = await supabase
      .from('reservations')
      .upsert(reservation)
      .select()
      .single();

    if (error) {
      console.error('Supabase save error:', error);
      alert('Failed to save. Check console.');
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

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleAddReservation = (date: Date) => {
    setSelectedDate(date);
    setEditingReservation(null);
    setIsModalOpen(true);
  };

  const handleEditReservation = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setIsModalOpen(true);
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
            onDateSelect={handleDateSelect}
            onAddReservation={handleAddReservation}
            onEditReservation={handleEditReservation}
            selectedDate={selectedDate}
            matchingReservationIds={searchResults}
          />
        </div>

        <DailyHandover
          reservations={reservations}
          selectedDate={selectedDate}
        />

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
