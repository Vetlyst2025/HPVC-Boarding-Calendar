import React, { useState, useRef, useEffect } from 'react';

interface DatePickerProps {
  selectedDate: Date | null;
  onChange: (date: Date) => void;
  minDate?: Date;
}

const DatePicker: React.FC<DatePickerProps> = ({ selectedDate, onChange, minDate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);
  
  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

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
  while (days.length % 7 !== 0) {
    const lastDay = days[days.length - 1];
    days.push(new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate() + 1));
  }

  const handleDateSelect = (date: Date) => {
    onChange(date);
    setIsOpen(false);
  };
  
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };
  
  const formatDate = (date: Date | null) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <input
        type="text"
        readOnly
        value={formatDate(selectedDate)}
        onClick={() => setIsOpen(!isOpen)}
        className="mt-1 block w-full bg-white text-black border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 cursor-pointer"
        required
      />
      {isOpen && (
        <div className="absolute z-20 mt-1 w-64 bg-white border border-gray-300 rounded-md shadow-lg p-2">
          <div className="flex justify-between items-center mb-2">
            <button type="button" onClick={goToPreviousMonth} className="p-1 rounded-full hover:bg-gray-100" aria-label="Previous month">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
            </button>
            <span className="font-semibold">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
            <button type="button" onClick={goToNextMonth} className="p-1 rounded-full hover:bg-gray-100" aria-label="Next month">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                 <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
               </svg>
            </button>
          </div>
          <div className="grid grid-cols-7 text-center text-xs text-gray-500">
            {daysOfWeek.map(day => <div key={day} className="font-medium">{day}</div>)}
          </div>
          <div className="grid grid-cols-7 mt-1">
            {days.map((day, index) => {
              const isCurrentMonthDay = day.getMonth() === month;
              const isSelectedDay = selectedDate && day.toDateString() === selectedDate.toDateString();
              const isDisabled = minDate && new Date(day.toDateString()) < new Date(minDate.toDateString());

              return (
                <button
                  key={index}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleDateSelect(day)}
                  className={`w-8 h-8 flex items-center justify-center text-sm rounded-full transition-colors
                    ${isCurrentMonthDay ? 'text-gray-700' : 'text-gray-300'}
                    ${isSelectedDay ? 'bg-cyan-600 text-white font-semibold' : ''}
                    ${!isSelectedDay && isCurrentMonthDay && !isDisabled ? 'hover:bg-gray-200' : ''}
                    ${isDisabled ? 'text-gray-300 cursor-not-allowed' : ''}
                  `}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;