import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Mail, CheckCircle2, XCircle } from 'lucide-react';
import axios from 'axios';

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('Processing your request...');
  
  const contactId = searchParams.get('id');

  useEffect(() => {
    if (!contactId) {
      setStatus('error');
      setMessage('Invalid unsubscribe link. Please check the URL.');
      return;
    }

    const unsubscribe = async () => {
      try {
        await axios.post('http://localhost:3000/api/email/unsubscribe', { contactId });
        setStatus('success');
        setMessage('You have been successfully unsubscribed from our mailing list.');
      } catch (error) {
        console.error('Unsubscribe failed:', error);
        setStatus('error');
        setMessage('Failed to process your request. Please try again later.');
      }
    };

    unsubscribe();
  }, [contactId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-surface/30 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-brand-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
        <div className="inline-flex p-4 rounded-full bg-brand-surface dark:bg-gray-700 mb-6">
          <Mail className="w-8 h-8 text-brand-primary" />
        </div>

        {status === 'loading' && (
          <>
            <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-brand-dark dark:text-brand-white mb-2">Unsubscribing...</h2>
            <p className="text-brand-muted dark:text-gray-400">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-brand-dark dark:text-brand-white mb-2">Unsubscribed</h2>
            <p className="text-brand-muted dark:text-gray-400 mb-6">{message}</p>
            <p className="text-sm text-brand-muted dark:text-gray-500">
              We're sorry to see you go. You won't receive any further marketing emails from us.
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-brand-dark dark:text-brand-white mb-2">Error</h2>
            <p className="text-brand-muted dark:text-gray-400">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}

