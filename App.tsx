import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Calendar from './components/Calendar';
import Header from './components/Header';
import ReservationModal from './components/ReservationModal';
import DailySummary from './components/DailySummary';
import SetupGuideModal from './components/SetupGuideModal';
import ConnectionDiagnostics from './components/ConnectionDiagnostics';
import { Reservation } from './types';
import { config } from './config';
import { 
  getReservations as getSupabaseReservations, 
  saveReservation as saveSupabaseReservation, 
  deleteReservation as deleteSupabaseReservation,
  getLocalReservations,
  saveLocalReservation,
  deleteLocalReservation,
  runDiagnostics,
} from './services/api';

interface ConfigurationScreenProps {
  onUseDemoMode: () => void;
  onShowSetupGuide: () => void;
  error?: string | null;
}

const ConfigurationScreen: React.FC<ConfigurationScreenProps> = ({ onUseDemoMode, onShowSetupGuide, error }) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
    <div className="p-8 bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-auto">
      <div className="flex flex-col items-center text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h1 className="mt-4 text-3xl font-bold text-gray-800">Connection Failed</h1>
        <p className="mt-2 text-gray-600">
            The application could not connect to your Supabase database.
            Run the diagnostic tool below to identify the issue.
        </p>
      </div>
      
      <ConnectionDiagnostics 
        runDiagnostics={runDiagnostics} 
        onShowSetupGuide={onShowSetupGuide}
      />

       <div className="mt-6 border-t pt-6 text-center">
        <p className="text-sm text-gray-600 mb-3">Alternatively, you can try the app without a database connection:</p>
        <button
          onClick={onUseDemoMode}
          className="w-full sm:w-auto px-6 py-2 font-semibold text-cyan-700 bg-cyan-100 rounded-md hover:bg-cyan-200 transition-all duration-200"
        >
          Continue in Demo Mode
        </button>
        <p className="mt-2 text-xs text-gray-500">Your data will be stored only in this browser.</p>
      </div>
    </div>
  </div>
);


const LoadingScreen: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center justify-center h-screen bg-gray-100">
    <div className="text-center">
      <svg className="animate-spin mx-auto h-12 w-12 text-cyan-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="mt-4 text-lg font-semibold text-gray-700">{message}</p>
    </div>
  </div>
);


const App: React.FC = () => {
  const [appStatus, setAppStatus] = useState<'configuring' | 'testing' | 'ready' | 'config_error'>('configuring');
  const [configError, setConfigError] = useState<string | null>(null);
  const [storageMode, setStorageMode] = useState<'supabase' | 'local'>('local');
  const [isSetupGuideOpen, setIsSetupGuideOpen] = useState(false);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);

  const getReservations = useCallback(async () => {
    if (storageMode === 'local') return getLocalReservations();
    return getSupabaseReservations();
  }, [storageMode]);

  const saveReservation = useCallback(async (reservation: Omit<Reservation, 'id'> & { id?: string }) => {
    if (storageMode === 'local') return saveLocalReservation(reservation);
    return saveSupabaseReservation(reservation);
  }, [storageMode]);

  const deleteReservation = useCallback(async (id: string) => {
    if (storageMode === 'local') return deleteLocalReservation(id);
    return deleteSupabaseReservation(id);
  }, [storageMode]);

  const refreshReservations = useCallback(async () => {
      setIsLoading(true);
      try {
        const data = await getReservations();
        setReservations(data);
      } catch (error) {
        console.error("Failed to refresh reservations:", error);
        // Potentially handle UI feedback here
      } finally {
        setIsLoading(false);
      }
  }, [getReservations]);

  useEffect(() => {
    const startApp = async () => {
        if (config.isConfigured) {
            setStorageMode('supabase');
            setAppStatus('testing');
            try {
                // We just need to check if the connection works, no need to fetch all data yet.
                await getSupabaseReservations();
                setAppStatus('ready');
                refreshReservations(); // Now fetch the data for the app
            } catch (err: any) {
                console.error("Supabase connection test failed:", err);
                const errorMessage = err.message 
                    ? `The Supabase client returned the following error: "${err.message}"`
                    : `An unknown error occurred while connecting to Supabase. Please verify your URL and that the Supabase project is active.`;
                setConfigError(errorMessage);
                setAppStatus('config_error');
            }
        } else {
            setAppStatus('configuring');
        }
        setIsLoading(false);
    };
    startApp();
  }, [refreshReservations]);

  const handleUseDemoMode = async () => {
    setStorageMode('local');
    setIsLoading(true);
    const localData = await getLocalReservations();
    setReservations(localData);
    setAppStatus('ready');
    setIsLoading(false);
  };

  if (appStatus === 'testing' || (isLoading && appStatus === 'ready')) {
    const message = appStatus === 'testing' ? 'Testing database connection...' : 'Loading reservations...';
    return <LoadingScreen message={message} />;
  }

  // A dedicated screen for when secrets are missing entirely.
  if (appStatus === 'configuring') {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="p-8 bg-white rounded-lg shadow-2xl max-w-2xl mx-4">
                <div className="flex flex-col items-center text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <h1 className="mt-4 text-3xl font-bold text-gray-800">Configuration Required</h1>
                    <p className="mt-2 text-gray-600">
                        Please provide your Supabase credentials to connect to your database.
                    </p>
                </div>
                 <div className="mt-6 text-left bg-gray-50 p-4 rounded-lg border">
                    <p className="font-semibold text-gray-700">Required Secrets:</p>
                    <ul className="mt-2 list-disc list-inside space-y-2 text-sm">
                    <li>
                        <strong>Name:</strong> <code className="bg-gray-200 px-1 py-0.5 rounded">SUPABASE_URL</code><br />
                        <strong>Value:</strong> Your Supabase Project URL
                    </li>
                    <li>
                        <strong>Name:</strong> <code className="bg-gray-200 px-1 py-0.5 rounded">SUPABASE_ANON_KEY</code><br />
                        <strong>Value:</strong> Your Supabase Project "anon" (public) key
                    </li>
                    </ul>
                    <p className="mt-4 text-xs text-gray-500">
                    You can find these in Supabase under <code className="bg-gray-200 px-1 py-0.5 rounded">Project Settings {'>'} API</code>.
                    After adding secrets, you must redeploy the application.
                    </p>
                </div>
                <div className="mt-6 border-t pt-6 text-center">
                    <p className="text-sm text-gray-600 mb-3">Alternatively, you can try the app without a database connection:</p>
                    <button
                        onClick={handleUseDemoMode}
                        className="w-full sm:w-auto px-6 py-2 font-semibold text-cyan-700 bg-cyan-100 rounded-md hover:bg-cyan-200 transition-all duration-200"
                    >
                        Continue in Demo Mode
                    </button>
                    <p className="mt-2 text-xs text-gray-500">Your data will be stored only in this browser.</p>
                </div>
            </div>
        </div>
    );
  }


  if (appStatus === 'config_error') {
    return (
        <>
            <ConfigurationScreen 
                error={configError}
                onUseDemoMode={handleUseDemoMode} 
                onShowSetupGuide={() => setIsSetupGuideOpen(true)}
            />
            <SetupGuideModal isOpen={isSetupGuideOpen} onClose={() => setIsSetupGuideOpen(false)} />
        </>
    );
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };
  
  const handleAddReservation = (date: Date) => {
    setEditingReservation(null);
    const newRes: Partial<Reservation> = {
        startDate: date,
        endDate: new Date(date.getTime() + 24 * 60 * 60 * 1000), // Default to one day later
    };
    setEditingReservation(newRes as Reservation);
    setIsModalOpen(true);
  };

  const handleEditReservation = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setIsModalOpen(true);
  };

  const handleSaveReservation = async (reservation: Omit<Reservation, 'id'> & { id?: string }) => {
    try {
      await saveReservation(reservation);
      await refreshReservations();
    } catch (error) {
        console.error("Failed to save reservation:", error);
        alert("There was an error saving the reservation. Please try again.");
    }
    setIsModalOpen(false);
    setEditingReservation(null);
  };

  const handleDeleteReservation = async (id: string) => {
     try {
      await deleteReservation(id);
      await refreshReservations();
    } catch (error) {
        console.error("Failed to delete reservation:", error);
        alert("There was an error deleting the reservation. Please try again.");
    }
    setIsModalOpen(false);
    setEditingReservation(null);
  };

  const handleComplexDelete = async (reservationToDelete: Reservation, dateToDelete: Date) => {
    try {
        const start = new Date(reservationToDelete.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(reservationToDelete.endDate);
        end.setHours(0, 0, 0, 0);
        const delDate = new Date(dateToDelete);
        delDate.setHours(0, 0, 0, 0);

        if (delDate.getTime() === start.getTime() && start.getTime() < end.getTime()) {
            const newStartDate = new Date(start);
            newStartDate.setDate(start.getDate() + 1);
            await saveReservation({ ...reservationToDelete, startDate: newStartDate });
        } 
        else if (delDate.getTime() === end.getTime() && start.getTime() < end.getTime()) {
            const newEndDate = new Date(end);
            newEndDate.setDate(end.getDate() - 1);
            await saveReservation({ ...reservationToDelete, endDate: newEndDate });
        } 
        else if (delDate.getTime() > start.getTime() && delDate.getTime() < end.getTime()) {
            const firstPartEndDate = new Date(delDate);
            firstPartEndDate.setDate(delDate.getDate() - 1);
            await saveReservation({ ...reservationToDelete, endDate: firstPartEndDate });

            const secondPartStartDate = new Date(delDate);
            secondPartStartDate.setDate(delDate.getDate() + 1);
            const { id, ...restOfReservation } = reservationToDelete;
            const newReservationData = {
                ...restOfReservation,
                startDate: secondPartStartDate,
                endDate: new Date(reservationToDelete.endDate),
            };
            await saveReservation(newReservationData);
        }
        
        await refreshReservations();

    } catch (error) {
        console.error("Failed to perform complex delete:", error);
        alert("There was an error updating the reservation. Please try again.");
    }

    setIsModalOpen(false);
    setEditingReservation(null);
  };
  
  const handleCheckOutReservation = async (reservation: Reservation) => {
    if (reservation.status === 'checked-out') return;
    try {
      const updatedReservation = { ...reservation, status: 'checked-out' as const };
      await saveReservation(updatedReservation);
      await refreshReservations();
    } catch (error) {
      console.error("Failed to check out reservation:", error);
      alert("There was an error checking out the reservation. Please try again.");
    }
  };

  const matchingReservationIds = useMemo(() => {
    if (!searchQuery) return new Set<string>();
    const lowercasedQuery = searchQuery.toLowerCase();
    const matching = reservations
      .filter(res => 
        res.animalName.toLowerCase().includes(lowercasedQuery) ||
        res.ownerFirstName.toLowerCase().includes(lowercasedQuery) ||
        res.ownerLastName.toLowerCase().includes(lowercasedQuery)
      )
      .map(res => res.id);
    return new Set(matching);
  }, [searchQuery, reservations]);
  
  const reservationsForSelectedDay = useMemo(() => {
    const dailyReservations = reservations.filter(res => {
        const start = new Date(res.startDate);
        start.setHours(0,0,0,0);
        const end = new Date(res.endDate);
        end.setHours(0,0,0,0);
        const selected = new Date(selectedDate);
        selected.setHours(0,0,0,0);
        return selected >= start && selected <= end;
    });

    if (!searchQuery) {
        return dailyReservations;
    }

    const lowercasedQuery = searchQuery.toLowerCase();
    return dailyReservations.filter(res => 
        res.animalName.toLowerCase().includes(lowercasedQuery) ||
        res.ownerFirstName.toLowerCase().includes(lowercasedQuery) ||
        res.ownerLastName.toLowerCase().includes(lowercasedQuery)
    );
  }, [reservations, selectedDate, searchQuery]);
  
  const handleGoToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  return (
    <div className="h-screen w-screen flex flex-col font-sans text-gray-800 p-4 gap-4 bg-gray-50">
      <Header
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        onAddReservation={() => handleAddReservation(selectedDate)}
        onGoToToday={handleGoToToday}
        isDemoMode={storageMode === 'local'}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-4 flex flex-col overflow-y-auto">
            <Calendar
              currentDate={currentDate}
              reservations={reservations}
              onDateSelect={handleDateSelect}
              onAddReservation={handleAddReservation}
              onEditReservation={handleEditReservation}
              selectedDate={selectedDate}
              matchingReservationIds={matchingReservationIds}
            />
        </div>
        <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-4 flex flex-col">
            <DailySummary
                selectedDate={selectedDate}
                reservations={reservationsForSelectedDay}
                onEditReservation={handleEditReservation}
                onCheckOut={handleCheckOutReservation}
                allReservations={reservations}
                searchQuery={searchQuery}
            />
        </div>
      </main>
      
      {isModalOpen && (
        <ReservationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveReservation}
          onDelete={handleDeleteReservation}
          onComplexDelete={handleComplexDelete}
          reservation={editingReservation}
          allReservations={reservations}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
};

export default App;