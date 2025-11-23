import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Reservation } from '../types';
import { config } from '../config';

let supabase: SupabaseClient | null = null;

const getSupabaseClient = (): SupabaseClient | null => {
    if (supabase) return supabase;
    if (config.supabaseUrl && config.supabaseAnonKey) {
        supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
        return supabase;
    }
    return null;
};

// --- LOCAL STORAGE (unchanged) ---
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
        const index = reservations.findIndex(r => r.id === reservation.id);
        if (index !== -1) {
            const updated = { ...reservations[index], ...reservation, startDate: new Date(reservation.startDate), endDate: new Date(reservation.endDate) };
            reservations[index] = updated;
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reservations));
            return updated;
        }
    }
    const newReservation: Reservation = {
        ...reservation,
        id: new Date().getTime().toString(),
        created_at: new Date().toISOString(),
        status: reservation.status || 'active',
        startDate: new Date(reservation.startDate),
        endDate: new Date(reservation.endDate),
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([...reservations, newReservation]));
    return newReservation;
};

export const deleteLocalReservation = async (id: string): Promise<void> => {
    const reservations = await getLocalReservations();
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reservations.filter(r => r.id !== id)));
};

// --- SUPABASE (FIXED FOR CAMELCASE COLUMNS) ---
const formatDateForSupabase = (date: Date): string => date.toISOString().split('T')[0];

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
        id: r.id,
        created_at: r.created_at,
        animalName: r.animalName,
        animalType: (r.animalType as any) ?? undefined,
        ownerFirstName: r.ownerFirstName,
        ownerLastName: r.ownerLastName,
        startDate: new Date(r.startDate),
        endDate: new Date(r.endDate),
        notes: r.notes ?? undefined,
        status: r.status ?? 'active',
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
        const { data, error } = await client
            .from('reservations')
            .update(preparedData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            created_at: data.created_at,
            animalName: data.animalName,
            animalType: data.animalType ?? undefined,
            ownerFirstName: data.ownerFirstName,
            ownerLastName: data.ownerLastName,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            notes: data.notes,
            status: data.status ?? 'active',
        };
    } else {
        const { data, error } = await client
            .from('reservations')
            .insert([preparedData])
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            created_at: data.created_at,
            animalName: data.animalName,
            animalType: data.animalType ?? undefined,
            ownerFirstName: data.ownerFirstName,
            ownerLastName: data.ownerLastName,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            notes: data.notes,
            status: data.status ?? 'active',
        };
    }
};

export const deleteReservation = async (id: string): Promise<void> => {
    const client = getSupabaseClient();
    if (!client) throw new Error("Supabase is not configured.");
    const { error } = await client.from('reservations').delete().eq('id', id);
    if (error) throw error;
};

// --- DIAGNOSTICS (unchanged) ---
export interface DiagnosticResults {
    secrets: { status: 'success' | 'error', message: string };
    network: { status: 'pending' | 'success' | 'error', message: string };
    query: { status: 'pending' | 'success' | 'error', message: string };
}

export async function runDiagnostics(): Promise<DiagnosticResults> {
    // ... (unchanged — keep exactly as you had it)
    const results: DiagnosticResults = {
        secrets: { status: 'error', message: 'Checking secrets...' },
        network: { status: 'pending', message: 'Waiting for secrets check...' },
        query: { status: 'pending', message: 'Waiting for network check...' },
    };

    if (config.supabaseUrl && config.supabaseAnonKey) {
        results.secrets.status = 'success';
        results.secrets.message = `Supabase URL found and appears valid.`;
    } else {
        results.secrets.message = 'Supabase URL or Anon Key not found. Please add them as secrets and redeploy.';
        return results;
    }

    const client = getSupabaseClient();
    if (!client) {
        results.secrets.message = 'Could not initialize Supabase client despite secrets being present.';
        return results;
    }

    try {
        const { error } = await client.from('reservations').select('id', { count: 'exact', head: true });
        results.network.status = 'success';
        results.network.message = 'Successfully connected to the Supabase project.';
        if (error) {
            results.query.status = 'error';
            results.query.message = error.message.includes('relation "public.reservations" does not exist')
                ? 'The "reservations" table was not found.'
                : error.message.includes('violates row-level security policy')
                  ? 'RLS is preventing access.'
                  : `Database error: "${error.message}"`;
        } else {
            results.query.status = 'success';
            results.query.message = 'Successfully accessed the "reservations" table.';
        }
    } catch (e: any) {
        results.network.status = 'error';
        results.network.message = 'Failed to reach Supabase.';
        results.query.message = 'Could not be tested.';
    }

    return results;
}
