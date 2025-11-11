import React, { useState } from 'react';
import { runDiagnostics, DiagnosticResults } from '../services/api';

interface ConnectionDiagnosticsProps {
  onShowSetupGuide: () => void;
  runDiagnostics: () => Promise<DiagnosticResults>;
}

type Status = 'pending' | 'running' | 'success' | 'error' | 'idle';

const getStatusIcon = (status: Status) => {
  switch (status) {
    case 'running':
      return <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
    case 'success':
      return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
    case 'error':
      return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>;
    default:
      return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>;
  }
};

const DiagnosticStep: React.FC<{ title: string; status: Status; message: string; isError: boolean }> = ({ title, status, message, isError }) => (
  <div className={`p-3 rounded-md border ${isError ? 'bg-red-50 border-red-200' : 'bg-gray-50'}`}>
    <div className="flex items-center gap-3">
      {getStatusIcon(status)}
      <p className="font-semibold text-gray-800">{title}</p>
    </div>
    <p className={`mt-1 text-sm pl-8 ${isError ? 'text-red-700' : 'text-gray-600'}`}>
      {message}
    </p>
  </div>
);


const ConnectionDiagnostics: React.FC<ConnectionDiagnosticsProps> = ({ onShowSetupGuide, runDiagnostics }) => {
  const [status, setStatus] = useState<Status>('idle');
  const [results, setResults] = useState<DiagnosticResults | null>(null);

  const handleRunDiagnostics = async () => {
    setStatus('running');
    setResults(null);
    const diagnosticResults = await runDiagnostics();
    setResults(diagnosticResults);
    setStatus('idle');
  };

  return (
    <div className="mt-6 w-full text-left">
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="text-lg font-bold text-gray-800">Connection Diagnostics</h3>
        <p className="text-sm text-gray-600 mt-1 mb-4">
          This tool will test the connection step-by-step to find the problem.
        </p>

        <div className="space-y-3">
           <DiagnosticStep 
                title="1. Check for Secrets"
                status={status === 'running' ? 'running' : (results?.secrets.status ?? 'pending')}
                message={results?.secrets.message ?? 'Awaiting test...'}
                isError={results?.secrets.status === 'error'}
            />
             <DiagnosticStep 
                title="2. Connect to Supabase"
                status={status === 'running' && results?.secrets.status === 'success' ? 'running' : (results?.network.status ?? 'pending')}
                message={results?.network.message ?? 'Awaiting test...'}
                isError={results?.network.status === 'error'}
            />
             <DiagnosticStep 
                title="3. Access 'reservations' Table"
                status={status === 'running' && results?.network.status === 'success' ? 'running' : (results?.query.status ?? 'pending')}
                message={results?.query.message ?? 'Awaiting test...'}
                isError={results?.query.status === 'error'}
            />
        </div>

        {results?.query.status === 'error' && results.query.message.includes('not found') && (
            <div className="mt-4 text-center">
                 <p className="text-sm text-gray-600 mb-2">The table seems to be missing. Use the setup guide to create it:</p>
                <button
                  onClick={onShowSetupGuide}
                  className="w-full px-6 py-2 font-semibold text-white bg-cyan-600 rounded-md hover:bg-cyan-700 transition-all duration-200"
                >
                  Show Supabase Setup Guide
                </button>
            </div>
        )}

      </div>
      <div className="mt-4">
        <button
          onClick={handleRunDiagnostics}
          disabled={status === 'running'}
          className="w-full px-6 py-2.5 font-semibold text-white bg-gray-700 rounded-md hover:bg-gray-800 disabled:bg-gray-400 transition-all duration-200 flex items-center justify-center gap-2"
        >
           {status === 'running' ? 'Running...' : 'Run Diagnostics'}
        </button>
      </div>
    </div>
  );
};

export default ConnectionDiagnostics;