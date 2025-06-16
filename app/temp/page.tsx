'use client';

import React, { useState } from 'react';

export default function Page() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const ABSTRACT_API_KEY = process.env.NEXT_PUBLIC_ABSTRACT_API_KEY;

  const validateEmail = async (emailToCheck: string) => {
    const encoded = encodeURIComponent(emailToCheck.trim());
    const url = `https://emailvalidation.abstractapi.com/v1/?api_key=${ABSTRACT_API_KEY}&email=${encoded}`;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data && data.deliverability) {
        setResult(data);
      } else {
        throw new Error('Invalid response from Abstract API');
      }
    } catch (err: any) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      validateEmail(email);
    }
  };

  const renderValue = (label: string, value: any) => {
    let display = typeof value === 'object' ? value.text : value;

    let color = 'text-gray-700 dark:text-gray-300';
    if (display === 'TRUE') color = 'text-green-600 dark:text-green-400 font-semibold';
    if (display === 'FALSE') color = 'text-red-600 dark:text-red-400 font-semibold';
    if (display === 'UNKNOWN') color = 'text-yellow-600 dark:text-yellow-400 font-semibold';

    return (
      <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 py-2">
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        <span className={`text-sm ${color}`}>{display}</span>
      </div>
    );
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white text-black dark:bg-black dark:text-white px-4">
      <div className="w-full max-w-lg bg-gray-100 dark:bg-gray-900 p-8 rounded-2xl shadow-md border border-gray-300 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-center text-green-600 dark:text-green-400">
          📧 Abstract Email Validator
        </h2>

        <form onSubmit={handleSubmit} className="mb-6">
          <label className="block mb-4">
            <span className="text-sm">Enter Email or Text</span>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@domain.com"
              required
              className="w-full mt-1 px-4 py-2 rounded bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-400 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </label>

          <button
            type="submit"
            className="w-full py-2 rounded bg-green-500 hover:bg-green-600 text-white font-semibold transition"
            disabled={loading}
          >
            {loading ? 'Validating...' : 'Validate'}
          </button>
        </form>

        {/* Result */}
        {result && !result.error && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">🔍 Validation Result</h3>
            {renderValue('Email', result.email)}
            {renderValue('Deliverability', result.deliverability)}
            {renderValue('Quality Score', result.quality_score)}
            {renderValue('Valid Format', result.is_valid_format)}
            {renderValue('Free Email', result.is_free_email)}
            {renderValue('Disposable Email', result.is_disposable_email)}
            {renderValue('Role-based Email', result.is_role_email)}
            {renderValue('Catch-all Email', result.is_catchall_email)}
            {renderValue('MX Record Found', result.is_mx_found)}
            {renderValue('SMTP Valid', result.is_smtp_valid)}
          </div>
        )}

        {/* Error */}
        {result?.error && (
          <div className="mt-4 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 p-4 rounded">
            ❌ Error: {result.error}
          </div>
        )}
      </div>
    </div>
  );
}

