import React from 'react';
import { Reservation, AnimalType } from '../types';
import AnimalIcon from './AnimalIcon';

interface CalendarProps {
  currentDate: Date;
  reservations: Reservation[];
  onDateSelect: (date: Date) => void;
  onAddReservation: (date: Date) => void;
  onEditReservation: (reservation: Reservation) => void;
  selectedDate: Date;
  matchingReservationIds: Set<string>;
}

const getAnimalColorClasses = (animalType: AnimalType) => {
  switch (animalType) {
    case AnimalType.Cat:
      return { bg: 'bg-orange-100', text: 'text-orange-800', icon: 'text-orange-500' };
    case AnimalType.Ferret:
      return { bg: 'bg-indigo-100', text: 'text-indigo-800', icon: 'text-indigo-500' };
    case AnimalType.Rabbit:
      return { bg: 'bg-pink-100', text: 'text-pink-800', icon: 'text-pink-500' };
    case AnimalType.GuineaPig:
      return { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: 'text-yellow-600' };
    case AnimalType.Chinchilla:
      return { bg: 'bg-gray-200', text: 'text-gray-800', icon: 'text-gray-500' };
    case AnimalType.Rat:
      return { bg: 'bg-purple-100', text: 'text-purple-800', icon: 'text-purple-500' };
    case AnimalType.Other:
    default:
      return { bg: 'bg-green-100', text: 'text-green-800', icon: 'text-green-500' };
  }
};


const Calendar: React.FC<CalendarProps> = ({ currentDate, reservations, onDateSelect, onAddReservation, onEditReservation, selectedDate, matchingReservationIds }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startingDayOfWeek = firstDayOfMonth.getDay();
  const totalDaysInMonth = lastDayOfMonth.getDate();
  
  const days: Date[] = [];
  
  // Previous month's padding
  for (let i = 0; i < startingDayOfWeek; i++) {
    const date = new Date(year, month, i - startingDayOfWeek + 1);
    days.push(date);
  }

  // Current month's days
  for (let i = 1; i <= totalDaysInMonth; i++) {
    days.push(new Date(year, month, i));
  }
  
  // Next month's padding
  const gridCells = 42; // 6 rows * 7 columns
  while (days.length < gridCells) {
    const lastDay = days[days.length - 1];
    days.push(new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate() + 1));
  }
  
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const getReservationsForDay = (date: Date) => {
    return reservations.filter(res => {
        const start = new Date(res.startDate);
        start.setHours(0,0,0,0);
        const end = new Date(res.endDate);
        end.setHours(0,0,0,0);
        const current = new Date(date);
        current.setHours(0,0,0,0);
        return res.status !== 'checked-out' && current >= start && current <= end;
    });
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-7 gap-px text-center font-semibold text-gray-600 border-b">
        {weekdays.map(day => (
          <div key={day} className="py-2">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {days.map((day, index) => {
          const isCurrentMonth = day.getMonth() === month;
          const dayReservations = getReservationsForDay(day);
          const reservationsSummary = dayReservations.reduce((acc, res) => {
            if (!acc[res.animalType]) {
                acc[res.animalType] = { count: 0 };
            }
            acc[res.animalType].count++;
            return acc;
          }, {} as Record<AnimalType, { count: number }>);

          const hasMatch = dayReservations.some(res => matchingReservationIds.has(res.id));
          const hasSearchTerm = matchingReservationIds.size > 0;

          return (
            <div
              key={index}
              className={`relative flex flex-col p-2 bg-white transition-all duration-200 group min-h-[120px] ${isCurrentMonth ? 'text-gray-800' : 'text-gray-400 bg-gray-50'} ${isSelected(day) ? 'ring-2 ring-cyan-500 z-10' : 'hover:bg-gray-100'} ${hasMatch ? 'bg-cyan-50' : ''} ${hasSearchTerm && !hasMatch && isCurrentMonth ? 'opacity-50' : ''}`}
              onClick={() => onDateSelect(day)}
            >
              <div className="flex justify-between items-center">
                <span className={`text-sm font-medium ${isToday(day) ? 'bg-cyan-600 text-white rounded-full h-6 w-6 flex items-center justify-center' : ''}`}>
                  {day.getDate()}
                </span>
                 <button onClick={(e) => { e.stopPropagation(); onAddReservation(day); }} className="opacity-0 group-hover:opacity-100 transition-opacity text-cyan-500 hover:text-cyan-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                 </button>
              </div>
              {isCurrentMonth && (
                <div className="mt-1 space-y-1">
                  {Object.entries(reservationsSummary).map(([animalType, data]) => {
                    const colors = getAnimalColorClasses(animalType as AnimalType);
                    return (
                      <div
                        key={animalType}
                        className={`flex items-center gap-1.5 p-1 rounded-md text-xs ${colors.bg} ${colors.text}`}
                      >
                        <AnimalIcon animalType={animalType as AnimalType} className={`h-4 w-4 flex-shrink-0 ${colors.icon}`} />
                        <span className="truncate font-medium">{animalType} ({(data as { count: number }).count})</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;