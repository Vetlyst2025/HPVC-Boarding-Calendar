import React, { useState } from 'react';

const sqlScript = `-- This script sets up the "reservations" table and permissions.
-- 1. Create the table for storing reservations.
-- It uses UUIDs for IDs and sets defaults for timestamps and status.
CREATE TABLE public.reservations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  "animalName" text NOT NULL,
  "animalType" text NOT NULL,
  "ownerFirstName" text NOT NULL,
  "ownerLastName" text NOT NULL,
  "startDate" date NOT NULL,
  "endDate" date NOT NULL,
  notes text NULL,
  status text NULL DEFAULT 'active'::text,
  CONSTRAINT reservations_pkey PRIMARY KEY (id)
);

-- 2. Enable Row Level Security (RLS).
-- This is a key security feature in Supabase.
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- 3. Create policies to allow public access.
-- These policies are required for the app to work with the database.

-- Allow anonymous users to view all reservations.
CREATE POLICY "Allow public read access"
ON public.reservations
FOR SELECT
TO anon
USING (true);

-- Allow anonymous users to create new reservations.
CREATE POLICY "Allow public insert access"
ON public.reservations
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anonymous users to update any reservation.
CREATE POLICY "Allow public update access"
ON public.reservations
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Allow anonymous users to delete any reservation.
CREATE POLICY "Allow public delete access"
ON public.reservations
FOR DELETE
TO anon
USING (true);
`;

const SetupGuideModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlScript).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center border-b pb-3">
            <h2 className="text-2xl font-bold">Supabase Setup Guide</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
        <div className="my-4 overflow-y-auto pr-2">
            <p className="text-gray-700 mb-4">
                Follow these steps to ensure your Supabase database is set up correctly for this application. The most common connection errors are caused by a missing table or incorrect security policies.
            </p>
            <ol className="list-decimal list-inside space-y-4">
                <li>
                    <strong className="font-semibold">Navigate to the SQL Editor</strong> in your Supabase project dashboard. You can find it in the left sidebar with a database icon.
                </li>
                <li>
                    <strong className="font-semibold">Copy the SQL script below.</strong> This script will create the necessary <code className="bg-gray-200 px-1 py-0.5 rounded">reservations</code> table with the correct columns and enable the required access policies. If you already have a table named <code className="bg-gray-200 px-1 py-0.5 rounded">reservations</code>, you may need to delete it first.
                    <div className="relative bg-gray-900 text-white p-4 rounded-md mt-2 font-mono text-sm">
                        <button onClick={handleCopy} className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white font-sans text-xs font-semibold py-1 px-3 rounded">
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                        <pre className="whitespace-pre-wrap overflow-x-auto"><code>{sqlScript}</code></pre>
                    </div>
                </li>
                 <li>
                    <strong className="font-semibold">Run the script.</strong> Paste the script into the Supabase SQL Editor and click the "Run" button.
                </li>
                <li>
                    <strong className="font-semibold">Refresh this application.</strong> After the script finishes, come back to this page and reload it. The connection error should be resolved.
                </li>
            </ol>
        </div>
         <div className="border-t pt-4 text-right">
             <button onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300 transition-colors">
                Close
             </button>
         </div>
      </div>
    </div>
  );
};

export default SetupGuideModal;
