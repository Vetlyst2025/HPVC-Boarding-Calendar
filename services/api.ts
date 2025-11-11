import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Reservation } from '../types';
import { config } from '../config';

let supabase: SupabaseClient | null = null;

// --- SUPABASE CLIENT SETUP ---

const getSupabaseClient = (): SupabaseClient | null => {
    if (supabase) {
        return supabase;
    }

    if (config.supabaseUrl && config.supabaseAnonKey) {
        supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
        return supabase;
    }

    // Warning is already logged by config.ts
    return null;
}


// --- LOCAL STORAGE API IMPLEMENTATION ---

const LOCAL_STORAGE_KEY = 'vet-boarding-reservations';

export const getLocalReservations = async (): Promise<Reservation[]> => {
    console.log('API: Fetching reservations from Local Storage...');
    const json = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!json) return [];
    
    const reservations = JSON.parse(json) as any[];
    return reservations.map(r => ({
        ...r,
        startDate: new Date(r.startDate),
        endDate: new Date(r.endDate),
    }));
};

export const saveLocalReservation = async (reservation: Omit<Reservation, 'id' | 'created_at'> & { id?: string }): Promise<Reservation> => {
    console.log('API: Saving reservation to Local Storage...');
    const reservations = await getLocalReservations();
    
    if (reservation.id) {
        // Update
        const index = reservations.findIndex(r => r.id === reservation.id);
        if (index !== -1) {
            const updatedReservation = { ...reservations[index], ...reservation, startDate: new Date(reservation.startDate), endDate: new Date(reservation.endDate) };
            reservations[index] = updatedReservation;
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reservations));
            return updatedReservation;
        }
    }
    
    // Create
    const newReservation: Reservation = {
        ...reservation,
        id: new Date().getTime().toString(), // Simple unique ID for local
        created_at: new Date().toISOString(),
        status: reservation.status || 'active',
        startDate: new Date(reservation.startDate),
        endDate: new Date(reservation.endDate),
    };

    const updatedReservations = [...reservations, newReservation];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedReservations));
    return newReservation;
};


export const deleteLocalReservation = async (id: string): Promise<void> => {
    console.log('API: Deleting reservation from Local Storage...');
    const reservations = await getLocalReservations();
    const updatedReservations = reservations.filter(r => r.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedReservations));
};


// --- SUPABASE API IMPLEMENTATION ---

const formatDateForSupabase = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

export const getReservations = async (): Promise<Reservation[]> => {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase is not configured.");

  console.log('API: Fetching all reservations from Supabase...');
  const { data, error } = await client
    .from('reservations')
    .select('*')
    .order('startDate', { ascending: true });

  if (error) {
    console.error('Error fetching reservations:', error);
    throw error;
  }
  
  return data.map((r: any) => ({
    ...r,
    startDate: new Date(r.startDate),
    endDate: new Date(r.endDate),
  }));
};

export const saveReservation = async (reservation: Omit<Reservation, 'id' | 'created_at'> & { id?: string }): Promise<Reservation> => {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase is not configured.");
  
  const { id, ...reservationData } = reservation;

  const preparedData = {
      ...reservationData,
      startDate: formatDateForSupabase(new Date(reservation.startDate)),
      endDate: formatDateForSupabase(new Date(reservation.endDate)),
      status: reservation.status || 'active',
  };

  if (id) {
    console.log(`API: Updating reservation ${id} in Supabase...`);
    const { data, error } = await client
      .from('reservations')
      .update(preparedData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating reservation:', error);
      throw error;
    }
     return { ...data, startDate: new Date(data.startDate), endDate: new Date(data.endDate) };
  } else {
    console.log('API: Creating new reservation in Supabase...');
    const { data, error } = await client
      .from('reservations')
      .insert([preparedData])
      .select()
      .single();

    if (error) {
      console.error('Error creating reservation:', error);
      throw error;
    }
    return { ...data, startDate: new Date(data.startDate), endDate: new Date(data.endDate) };
  }
};

export const deleteReservation = async (id: string): Promise<void> => {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase is not configured.");

  console.log(`API: Deleting reservation ${id} from Supabase...`);
  const { error } = await client
    .from('reservations')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting reservation:', error);
    throw error;
  }
};

// --- DIAGNOSTICS ---

export interface DiagnosticResults {
    secrets: { status: 'success' | 'error', message: string };
    network: { status: 'pending' | 'success' | 'error', message: string };
    query: { status: 'pending' | 'success' | 'error', message: string };
}

export async function runDiagnostics(): Promise<DiagnosticResults> {
    const results: DiagnosticResults = {
        secrets: { status: 'error', message: 'Checking secrets...' },
        network: { status: 'pending', message: 'Waiting for secrets check...' },
        query: { status: 'pending', message: 'Waiting for network check...' },
    };

    // 1. Secrets Check
    if (config.supabaseUrl && config.supabaseAnonKey) {
        results.secrets.status = 'success';
        results.secrets.message = `Supabase URL found and appears valid.`;
    } else {
        results.secrets.message = 'Supabase URL or Anon Key not found. Please add them as secrets and redeploy.';
        return results; // Stop here if secrets are missing
    }

    const client = getSupabaseClient();
    if (!client) {
        results.secrets.message = 'Could not initialize Supabase client despite secrets being present.';
        return results;
    }
    
    // 2. Network & Query Check (combined)
    try {
        const { error } = await client.from('reservations').select('id', { count: 'exact', head: true });
        
        // If we get here, the network request succeeded.
        results.network.status = 'success';
        results.network.message = 'Successfully connected to the Supabase project.';
        
        if (error) {
            // This is a database-level error (e.g., table not found, RLS)
            results.query.status = 'error';
            if (error.message.includes('relation "public.reservations" does not exist')) {
                 results.query.message = 'The "reservations" table was not found. The setup script needs to be run.';
            } else if (error.message.includes('violates row-level security policy')) {
                 results.query.message = 'Row Level Security (RLS) is preventing access. Ensure the policies from the setup script are active.';
            } else {
                 results.query.message = `The database returned an error: "${error.message}"`;
            }
        } else {
            // No error! Everything works.
            results.query.status = 'success';
            results.query.message = 'Successfully accessed the "reservations" table.';
        }
    } catch (e: any) {
        // This is a fundamental network error (e.g., fetch failed, CORS, project paused/inactive)
        results.network.status = 'error';
        results.network.message = `Failed to reach Supabase. The project might be paused, or there could be a network (CORS) issue.`;
        results.query.message = 'Could not be tested due to network failure.';
    }

    return results;
}