import React, { useState, useCallback, useMemo } from 'react';
import { Reservation } from '../types';
import AnimalIcon from './AnimalIcon';
import { generateDailySummary } from '../services/geminiService';

interface DailySummaryProps {
  selectedDate: Date;
  reservations: Reservation[];
  onEditReservation: (reservation: Reservation) => void;
  onCheckOut: (reservation: Reservation) => void;
  allReservations: Reservation[];
  searchQuery?: string;
}

const createReportHtml = (summaryText: string, date: Date): string => {
  const formattedDate = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const sanitizedSummary = summaryText
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Daily Handover Report</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-100 font-sans">
      <div class="container mx-auto p-4 md:p-8">
        <div class="bg-white p-6 rounded-lg shadow-lg">
          <h1 class="text-3xl font-bold text-gray-800 mb-2">Daily Handover Report</h1>
          <h2 class="text-xl text-gray-600 mb-6">${formattedDate}</h2>
          <div class="text-gray-700 text-base whitespace-pre-wrap">${sanitizedSummary}</div>
        </div>
      </div>
    </body>
    </html>
  `;
};

interface ReservationListItemProps {
    reservation: Reservation;
    onEditReservation: (res: Reservation) => void;
    onCheckOut: (res: Reservation) => void;
    isDeparting: boolean;
}

const ReservationListItem: React.FC<ReservationListItemProps> = ({ reservation, onEditReservation, onCheckOut, isDeparting }) => (
    <li 
      className={`p-3 bg-gray-50 rounded-lg border transition-colors ${reservation.status === 'checked-out' ? 'opacity-60' : 'cursor-pointer hover:bg-cyan-50'}`}
      onClick={() => reservation.status !== 'checked-out' && onEditReservation(reservation)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
            <AnimalIcon animalType={reservation.animalType} className="h-6 w-6 text-cyan-600 flex-shrink-0" />
            <div className="flex-1">
            <p className="font-semibold text-gray-800">{reservation.ownerLastName}, "{reservation.animalName}" <span className="text-sm font-normal text-gray-500">({reservation.animalType})</span></p>
            <p className="text-sm text-gray-600">{reservation.ownerFirstName} {reservation.ownerLastName}</p>
            </div>
        </div>
        {isDeparting && (
            reservation.status === 'checked-out' ? (
                 <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Checked Out
                </span>
            ) : (
                <button 
                    onClick={(e) => { e.stopPropagation(); onCheckOut(reservation); }}
                    className="text-xs font-semibold text-orange-800 bg-orange-200 px-3 py-1 rounded-full hover:bg-orange-300 transition-colors"
                >
                    Check Out
                </button>
            )
        )}
      </div>
      {reservation.notes && <p className="mt-2 text-sm text-gray-700 bg-yellow-100 p-2 rounded-md">Notes: {reservation.notes}</p>}
    </li>
);

const DailySummary: React.FC<DailySummaryProps> = ({ selectedDate, reservations, onEditReservation, onCheckOut, allReservations, searchQuery }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateSummary = useCallback(async () => {
    if (reservations.length === 0) {
      alert("No reservations for this day to generate a summary.");
      return;
    }
    setIsLoading(true);
    try {
      const result = await generateDailySummary(reservations, selectedDate, allReservations);
      const reportHtml = createReportHtml(result, selectedDate);
      const reportWindow = window.open('', '_blank');
      
      if (reportWindow) {
        reportWindow.document.write(reportHtml);
        reportWindow.document.close();
      } else {
        alert('Please allow pop-ups for this site to view the report.');
      }

    } catch (e) {
      alert('Failed to generate summary. Please check your API key and try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [reservations, selectedDate, allReservations]);
  
  const { arrivingToday, departingToday, stayingOvernight } = useMemo(() => {
    const isSameDay = (d1: Date, d2: Date) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

    const arriving = reservations.filter(r => isSameDay(new Date(r.startDate), selectedDate));
    const departing = reservations.filter(r => isSameDay(new Date(r.endDate), selectedDate));
    const staying = reservations.filter(r => 
        !isSameDay(new Date(r.startDate), selectedDate) && 
        !isSameDay(new Date(r.endDate), selectedDate)
    );
    
    return { arrivingToday: arriving, departingToday: departing, stayingOvernight: staying };
  }, [reservations, selectedDate]);


  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-bold text-gray-700 border-b pb-2">
        Daily Details: {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </h2>
      
      <div className="flex-1 overflow-y-auto mt-4 pr-2">
        {reservations.length > 0 ? (
          <div className="space-y-6">
            {arrivingToday.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-green-700 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l.293.293a1 1 0 001.414-1.414l-3-3z" clipRule="evenodd" /></svg>
                        Arriving Today ({arrivingToday.length})
                    </h3>
                    <ul className="mt-2 space-y-3">
                        {arrivingToday.map(res => <ReservationListItem key={res.id} reservation={res} onEditReservation={onEditReservation} onCheckOut={onCheckOut} isDeparting={false} />)}
                    </ul>
                </div>
            )}
            {departingToday.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-orange-600 flex items-center gap-2">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.707-4.707a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 1.414L9 10.586V7a1 1 0 10-2 0v3.586l-.293-.293a1 1 0 00-1.414 1.414l3 3z" clipRule="evenodd" /></svg>
                        Departing Today ({departingToday.length})
                    </h3>
                    <ul className="mt-2 space-y-3">
                        {departingToday.map(res => <ReservationListItem key={res.id} reservation={res} onEditReservation={onEditReservation} onCheckOut={onCheckOut} isDeparting={true} />)}
                    </ul>
                </div>
            )}
            {stayingOvernight.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-blue-700 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
                        Staying Overnight ({stayingOvernight.length})
                    </h3>
                    <ul className="mt-2 space-y-3">
                        {stayingOvernight.map(res => <ReservationListItem key={res.id} reservation={res} onEditReservation={onEditReservation} onCheckOut={onCheckOut} isDeparting={false} />)}
                    </ul>
                </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {searchQuery ? (
              <p>No matching reservations for "{searchQuery}" on this day.</p>
            ) : (
              <p>No reservations for this day.</p>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t">
        <h3 className="font-bold text-lg mb-2">AI Daily Handover</h3>
        <button
          onClick={handleGenerateSummary}
          disabled={isLoading}
          className="w-full bg-cyan-600 text-white font-bold py-2 px-4 rounded-md hover:bg-cyan-700 disabled:bg-cyan-300 transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : 'Generate Daily Summary'}
        </button>
      </div>
    </div>
  );
};

export default DailySummary;