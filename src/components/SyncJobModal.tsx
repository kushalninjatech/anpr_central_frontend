import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import type { SyncJobCreate } from '../types';

interface SyncJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SyncJobCreate) => void;
  isLoading?: boolean;
}

export default function SyncJobModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: SyncJobModalProps) {
  // datetime-local values, e.g. "2026-06-20T00:00"
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Reset the form whenever the modal is (re)opened
    setFromValue('');
    setToValue('');
    setError('');
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fromValue || !toValue) {
      setError('Both From and To datetimes are required.');
      return;
    }

    const fromDate = new Date(fromValue);
    const toDate = new Date(toValue);

    if (fromDate >= toDate) {
      setError('"From" must be earlier than "To".');
      return;
    }

    setError('');
    // Convert local datetime input to UTC ISO (contract expects Z)
    onSubmit({
      from_datetime: fromDate.toISOString(),
      to_datetime: toDate.toISOString(),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Start Sync Job</h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="text-sm text-gray-500 -mt-4 mb-6">
            Sync detection records to the external service within the selected datetime range.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From *
              </label>
              <input
                type="datetime-local"
                required
                value={fromValue}
                onChange={(e) => setFromValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To *
              </label>
              <input
                type="datetime-local"
                required
                value={toValue}
                onChange={(e) => setToValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Starting...' : 'Start Sync'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
