import React, { useState, useEffect, useRef } from 'react';
import { Reservation, AnimalType } from '../types';
import DatePicker from './DatePicker';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reservation: Omit<Reservation, 'id'> & { id?: string }) => void;
  onDelete: (id: string) => void;
  onComplexDelete: (reservation: Reservation, dateToDelete: Date) => void;
  reservation: Partial<Reservation> | null;
  allReservations: Reservation[];
  selectedDate: Date;
}

const ReservationModal: React.FC<ReservationModalProps> = ({ 
    isOpen, 
    onClose, 
    onSave, 
    onDelete, 
    onComplexDelete,
    reservation, 
    allReservations,
    selectedDate 
}) => {
  const [formData, setFormData] = useState<Partial<Reservation>>({});
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [suggestions, setSuggestions] = useState<Reservation[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const notesTextAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && reservation) {
      setFormData({
        ...reservation,
        // Ensure values are Date objects for the date picker state
        startDate: reservation.startDate ? new Date(reservation.startDate) : undefined,
        endDate: reservation.endDate ? new Date(reservation.endDate) : undefined,
      });
      setIsConfirmingDelete(false); // Reset confirmation on open
      setShowSuggestions(false);
    } else {
      setFormData({});
    }
  }, [isOpen, reservation]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [suggestionsRef]);


  if (!isOpen) return null;

  const handleDateChange = (name: 'startDate' | 'endDate', date: Date) => {
    setFormData(prev => {
        const newFormData = { ...prev, [name]: date };
        // Ensure end date is not before start date
        if (name === 'startDate' && newFormData.endDate && newFormData.endDate < date) {
            newFormData.endDate = date;
        }
        return newFormData;
    });
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Autocomplete logic for new reservations only
    if (name === 'animalName' && !formData.id) {
        if (value.length > 0) {
            const lowerCaseValue = value.toLowerCase();

            // Create a map of unique pets based on name and owner, keeping the most recent reservation
            const uniquePets = new Map<string, Reservation>();
            allReservations
                .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()) // Sort by most recent first
                .forEach(res => {
                    const key = `${res.animalName.toLowerCase()}|${res.ownerLastName.toLowerCase()}`;
                    if (!uniquePets.has(key)) {
                        uniquePets.set(key, res);
                    }
                });
            
            const filteredSuggestions = Array.from(uniquePets.values())
                .filter(pet => pet.animalName.toLowerCase().includes(lowerCaseValue));
            
            setSuggestions(filteredSuggestions);
            setShowSuggestions(filteredSuggestions.length > 0);
        } else {
            setShowSuggestions(false);
        }
    }
  };
  
  const handleSuggestionClick = (suggestion: Reservation) => {
    setFormData(prev => ({
        ...prev,
        animalName: suggestion.animalName,
        animalType: suggestion.animalType,
        ownerFirstName: suggestion.ownerFirstName,
        ownerLastName: suggestion.ownerLastName,
    }));
    setShowSuggestions(false);
  };

  const handleAddMedication = () => {
    const medicationTemplate = "- MEDICATION: [Name], [Dosage], [Frequency]";
    setFormData(prev => {
      const existingNotes = (prev.notes || '').trim();
      const newNotes = existingNotes ? `${existingNotes}\n${medicationTemplate}` : medicationTemplate;
      return {
        ...prev,
        notes: newNotes,
      };
    });
    // Focus the textarea after adding the template
    setTimeout(() => {
      notesTextAreaRef.current?.focus();
      // Move cursor to the end of the text
      const len = notesTextAreaRef.current?.value.length;
      if (len) {
          notesTextAreaRef.current?.setSelectionRange(len, len);
      }
    }, 0);
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isConfirmingDelete) return; // Don't submit form in confirmation state
    const dataToSave = {
        ...formData,
        startDate: new Date(formData.startDate as Date),
        endDate: new Date(formData.endDate as Date),
    }
    onSave(dataToSave as Omit<Reservation, 'id'> & { id?: string });
  };
  
  const handleConfirmFullDelete = () => {
    if (formData.id) {
        onDelete(formData.id);
    }
  };

  const handleConfirmPartialDelete = () => {
    if (formData.id) {
        const originalReservation = allReservations.find(r => r.id === formData.id);
        if (originalReservation) {
            onComplexDelete(originalReservation, selectedDate);
        }
    }
  };

  const isMultiDay = () => {
    if (!formData.startDate || !formData.endDate) return false;
    const start = new Date(formData.startDate as Date);
    const end = new Date(formData.endDate as Date);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return start.getTime() !== end.getTime();
  };

  const formattedSelectedDate = selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  const startDateValue = formData.startDate ? new Date(formData.startDate) : null;
  const endDateValue = formData.endDate ? new Date(formData.endDate) : null;

  // For the end date picker, the minimum date should be the start date
  const minEndDate = startDateValue ? new Date(startDateValue) : undefined;


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 m-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4">{formData.id ? 'Edit Reservation' : 'New Reservation'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative" ref={suggestionsRef}>
              <label className="block text-sm font-medium text-gray-700">Animal Name</label>
              <input type="text" name="animalName" value={formData.animalName || ''} onChange={handleChange} className="mt-1 block w-full bg-white text-black border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500" required autoComplete="off" />
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                    {suggestions.map((pet) => (
                        <li 
                            key={`${pet.id}-${pet.animalName}`}
                            className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSuggestionClick(pet)}
                        >
                            {pet.animalName} ({pet.ownerLastName})
                        </li>
                    ))}
                </ul>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Animal Type</label>
              <select name="animalType" value={formData.animalType || ''} onChange={handleChange} className="mt-1 block w-full bg-white text-black border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500" required>
                <option value="" disabled>Select a type</option>
                {Object.values(AnimalType).map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Owner First Name</label>
              <input type="text" name="ownerFirstName" value={formData.ownerFirstName || ''} onChange={handleChange} className="mt-1 block w-full bg-white text-black border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Owner Last Name</label>
              <input type="text" name="ownerLastName" value={formData.ownerLastName || ''} onChange={handleChange} className="mt-1 block w-full bg-white text-black border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500" required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <DatePicker 
                selectedDate={startDateValue}
                onChange={(date) => handleDateChange('startDate', date)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
               <DatePicker 
                selectedDate={endDateValue}
                onChange={(date) => handleDateChange('endDate', date)}
                minDate={minEndDate}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <button
                    type="button"
                    onClick={handleAddMedication}
                    className="text-xs font-semibold text-cyan-700 bg-cyan-100 px-2 py-1 rounded-full hover:bg-cyan-200 transition-colors flex items-center gap-1"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Medication
                </button>
            </div>
            <textarea ref={notesTextAreaRef} name="notes" value={formData.notes || ''} onChange={handleChange} rows={3} className="mt-1 block w-full bg-white text-black border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"></textarea>
          </div>
          <div className="flex justify-between items-center pt-4">
            {isConfirmingDelete ? (
               <div className="w-full flex flex-col items-center bg-red-50 p-3 rounded-md gap-3">
                  <p className="text-red-800 font-semibold text-center">
                    {isMultiDay() 
                        ? 'This is a multi-day reservation. What would you like to delete?' 
                        : 'Are you sure you want to delete this reservation?'}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 w-full">
                      <button 
                          type="button" 
                          onClick={() => setIsConfirmingDelete(false)} 
                          className="flex-grow px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300 transition-colors order-last sm:order-first"
                      >
                          Cancel
                      </button>
                      {isMultiDay() && (
                          <button 
                              type="button" 
                              onClick={handleConfirmPartialDelete} 
                              className="flex-grow px-4 py-2 bg-yellow-500 text-white font-semibold rounded-md hover:bg-yellow-600 transition-colors"
                          >
                              Delete Only {formattedSelectedDate}
                          </button>
                      )}
                      <button 
                          type="button" 
                          onClick={handleConfirmFullDelete} 
                          className="flex-grow px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors"
                      >
                          {isMultiDay() ? 'Delete Entire Reservation' : 'Confirm Delete'}
                      </button>
                  </div>
              </div>
            ) : (
              <>
                <div>
                  {formData.id && (
                    <button type="button" onClick={() => setIsConfirmingDelete(true)} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors">
                      Delete
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-cyan-600 text-white font-semibold rounded-md hover:bg-cyan-700 transition-colors">
                    Save
                  </button>
                </div>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReservationModal;