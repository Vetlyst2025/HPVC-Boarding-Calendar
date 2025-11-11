import React from 'react';

interface HeaderProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  onAddReservation: () => void;
  onGoToToday: () => void;
  isDemoMode: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ currentDate, setCurrentDate, onAddReservation, onGoToToday, isDemoMode, searchQuery, setSearchQuery }) => {
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <>
      {isDemoMode && (
          <div className="bg-yellow-100 text-yellow-800 text-center p-2 rounded-t-lg shadow-md text-sm font-medium">
              You are in Demo Mode. Your data is saved locally in this browser.
          </div>
      )}
      <header className={`flex items-center justify-between p-4 bg-white shadow-md ${isDemoMode ? 'rounded-b-lg' : 'rounded-lg'}`}>
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <h1 className="text-2xl font-bold text-gray-700 hidden lg:block">Healthy Pet Veterinary Clinic Boarding Calendar</h1>
          </div>
           <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              placeholder="Search by pet or owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full max-w-xs border border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onAddReservation}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span className="hidden sm:inline">New Reservation</span>
          </button>
          <button
            onClick={onGoToToday}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
          >
            Today
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousMonth}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors"
              aria-label="Previous month"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <span className="text-lg font-semibold w-32 text-center">{`${monthName} ${year}`}</span>
            <button
              onClick={goToNextMonth}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors"
              aria-label="Next month"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;