import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-toastify';
import {
  RefreshCw,
  Clock,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RotateCcw,
  Ban,
  Inbox,
  ArrowRight,
  X,
  Database,
  SkipForward,
  CloudUpload,
  CalendarClock,
  Eye,
} from 'lucide-react';
import { syncJobApi } from '../services/api';
import type { SyncJob, SyncJobStatus, SyncJobCreate } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
import SyncJobModal from '../components/SyncJobModal';
import ConfirmModal from '../components/ConfirmModal';

const ACTIVE_STATUSES: SyncJobStatus[] = ['pending', 'running', 'cancelling'];
const isActive = (status?: SyncJobStatus) => !!status && ACTIVE_STATUSES.includes(status);

const REFRESH_SECONDS = 30;
const PROGRESS_POLL_MS = 5000;

const STATUS_LABELS: Record<SyncJobStatus, string> = {
  pending: 'Pending',
  running: 'Running',
  cancelling: 'Cancelling',
  completed: 'Completed',
  completed_with_errors: 'Completed with errors',
  cancelled: 'Cancelled',
  failed: 'Failed',
};

const STATUS_STYLES: Record<SyncJobStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700 ring-yellow-200',
  running: 'bg-blue-100 text-blue-700 ring-blue-200',
  cancelling: 'bg-orange-100 text-orange-700 ring-orange-200',
  completed: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  completed_with_errors: 'bg-amber-100 text-amber-700 ring-amber-200',
  cancelled: 'bg-gray-100 text-gray-600 ring-gray-200',
  failed: 'bg-red-100 text-red-700 ring-red-200',
};

const STATUS_ICONS: Record<SyncJobStatus, typeof AlertCircle> = {
  pending: AlertCircle,
  running: Clock,
  cancelling: RotateCcw,
  completed: CheckCircle,
  completed_with_errors: AlertTriangle,
  cancelled: Ban,
  failed: XCircle,
};

const fmt = (s: string | null | undefined) =>
  s ? format(parseISO(s), 'MMM dd, yyyy · HH:mm') : '—';

function StatusBadge({ status, size = 'sm' }: { status: SyncJobStatus; size?: 'sm' | 'md' }) {
  const Icon = STATUS_ICONS[status];
  const pad = size === 'md' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs';
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${pad} font-semibold rounded-full ring-1 ring-inset ${STATUS_STYLES[status]}`}
    >
      <Icon className={`${size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'} ${status === 'cancelling' ? 'animate-spin' : ''}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}

export default function SyncRecords() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(0); // 0-indexed for Pagination component
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [countdown, setCountdown] = useState(REFRESH_SECONDS);
  const pageSize = 50;

  // Current / most-recent job — polls quickly while active for a smooth progress bar
  const {
    data: current,
    error: currentError,
    isLoading: currentLoading,
  } = useQuery({
    queryKey: ['sync-job-current'],
    queryFn: () => syncJobApi.getCurrent().then((r) => r.data),
    refetchInterval: (query) =>
      isActive((query.state.data as SyncJob | undefined)?.status) ? PROGRESS_POLL_MS : false,
    retry: false, // 404 = no job ever → empty state
  });

  // History listing
  const {
    data: list,
    isLoading: listLoading,
    refetch: refetchList,
  } = useQuery({
    queryKey: ['sync-jobs', page],
    queryFn: () => syncJobApi.getList(page + 1, pageSize).then((r) => r.data),
  });

  const refreshAll = () => {
    refetchList();
    queryClient.invalidateQueries({ queryKey: ['sync-job-current'] });
    setCountdown(REFRESH_SECONDS);
  };

  // Visible 30s countdown tick
  useEffect(() => {
    const id = setInterval(() => {
      setCountdown((prev) => (prev <= 0 ? REFRESH_SECONDS : prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // When the countdown hits 0, refresh the listing + current
  useEffect(() => {
    if (countdown === 0) {
      refetchList();
      queryClient.invalidateQueries({ queryKey: ['sync-job-current'] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  const createMutation = useMutation({
    mutationFn: (data: SyncJobCreate) => syncJobApi.create(data),
    onSuccess: () => {
      toast.success('Sync job started');
      setIsModalOpen(false);
      refreshAll();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to start sync job');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => syncJobApi.cancel(),
    onSuccess: () => {
      toast.success('Cancellation requested');
      setIsCancelOpen(false);
      refreshAll();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to cancel sync job');
    },
  });

  const jobs = list?.jobs || [];
  const total = list?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  // 404 (or no data) → empty current-job card
  const hasCurrent = !!current && !currentError;
  const liveActive = hasCurrent && isActive((current as SyncJob).status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100">
      {/* Top accent line */}
      <div className="h-1 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500" />

      {/* Sticky header */}
      <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-white/60 shadow-sm shadow-gray-200/40">
        <div className="w-full px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl shadow-lg shadow-primary-500/30">
              <CloudUpload className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Sync Records</h1>
              <p className="text-sm text-gray-500">Push detection records to the external service</p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <RefreshCw className="h-5 w-5" />
            Sync Records
          </button>
        </div>
      </header>

      <main className="w-full px-6 py-8 space-y-8">
        {/* Current job section */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${liveActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Current Job</h2>
          </div>

          {currentLoading ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 border border-white/50 p-10 flex items-center justify-center">
              <LoadingSpinner size="md" text="Loading current job..." />
            </div>
          ) : hasCurrent ? (
            <CurrentJobCard job={current as SyncJob} onCancel={() => setIsCancelOpen(true)} />
          ) : (
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <Inbox className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No current job running</h3>
              <p className="text-gray-500 mt-1">Start a sync to watch its progress here in real time.</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn btn-primary inline-flex items-center gap-2 mt-5"
              >
                <RefreshCw className="h-4 w-4" />
                Start a Sync
              </button>
            </div>
          )}
        </section>

        {/* History section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
              Job History
              {total > 0 && <span className="ml-2 text-gray-400 normal-case font-medium">({total})</span>}
            </h2>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-white/70 border border-gray-200 rounded-full px-3 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500" />
                </span>
                Auto-refresh in {countdown}s
              </span>
              <button
                onClick={refreshAll}
                className="btn btn-secondary btn-sm flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>

          {listLoading ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 border border-white/50 p-12 flex items-center justify-center">
              <LoadingSpinner size="lg" text="Loading jobs..." />
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <Inbox className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No sync jobs yet</h3>
              <p className="text-gray-500 mt-1">Jobs you start will be listed here.</p>
            </div>
          ) : (
            <>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 border border-white/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">Job</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">Window</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">Progress</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">Synced</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">Skipped</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">Failed</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">Total</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">Started</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">Finished</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {jobs.map((job) => (
                        <tr key={job.id} className="transition-colors duration-150 hover:bg-primary-50/30">
                          <td className="px-4 py-3 whitespace-nowrap font-bold text-gray-900">#{job.id}</td>
                          <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={job.status} /></td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {fmt(job.from_datetime)}
                            <ArrowRight className="inline h-3 w-3 mx-1.5 text-gray-300" />
                            {fmt(job.to_datetime)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap w-[160px]">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full"
                                  style={{ width: `${Math.min(100, Math.max(0, job.progress_percent || 0))}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-gray-500 w-9 text-right shrink-0">
                                {(job.progress_percent || 0).toFixed(0)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right font-semibold text-emerald-600">{job.success_count}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-gray-500">{job.skipped_count}</td>
                          <td className={`px-4 py-3 whitespace-nowrap text-right font-semibold ${job.fail_count > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                            {job.fail_count}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-gray-700 font-medium">{job.total_records}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{fmt(job.started_at)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{fmt(job.finished_at)}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {job.has_logs ? (
                              <button
                                onClick={() => navigate(`/sync-records/${job.id}/logs`)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                View
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400 italic">No logs available</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                pageSize={pageSize}
                onPageChange={setPage}
                label="jobs"
              />
            </>
          )}
        </section>
      </main>

      {/* Modals */}
      <SyncJobModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />
      <ConfirmModal
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onConfirm={() => cancelMutation.mutate()}
        title="Cancel Sync Job"
        message="Are you sure you want to cancel the running sync job? It will stop after the current record."
        confirmText="Cancel Job"
        cancelText="Keep Running"
        isLoading={cancelMutation.isPending}
        variant="danger"
      />
    </div>
  );
}

function CurrentJobCard({ job, onCancel }: { job: SyncJob; onCancel: () => void }) {
  const active = isActive(job.status);
  const calculating = active && job.total_records === 0;
  const pct = Math.min(100, Math.max(0, job.progress_percent || 0));
  const processed = job.success_count + job.fail_count + job.skipped_count;

  return (
    <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 border border-white/50 p-6 overflow-hidden">
      {/* Accent glow when active */}
      {active && (
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-primary-400/10 rounded-full blur-3xl pointer-events-none" />
      )}

      <div className="relative flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <StatusBadge status={job.status} size="md" />
            <span className="text-sm font-medium text-gray-400">Job #{job.id}</span>
          </div>
          <p className="text-sm text-gray-600 flex items-center flex-wrap gap-1.5">
            <CalendarClock className="h-4 w-4 text-gray-400" />
            {fmt(job.from_datetime)}
            <ArrowRight className="inline h-3.5 w-3.5 text-gray-300" />
            {fmt(job.to_datetime)}
          </p>
        </div>
        {active && (
          <button
            onClick={onCancel}
            disabled={job.status === 'cancelling'}
            className="btn btn-danger btn-sm flex items-center gap-2 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            {job.status === 'cancelling' ? 'Cancelling...' : 'Cancel Job'}
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative mt-6">
        <div className="flex items-end justify-between mb-2">
          <span className="text-2xl font-bold text-gray-900">
            {calculating ? '—' : `${pct.toFixed(1)}%`}
          </span>
          <span className="text-sm text-gray-400">
            {calculating ? 'Calculating total…' : `${processed.toLocaleString()} / ${job.total_records.toLocaleString()} records`}
          </span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r from-primary-500 via-purple-500 to-primary-500 rounded-full transition-all duration-500 ${active ? 'animate-pulse-glow' : ''}`}
            style={{ width: calculating ? '4%' : `${pct}%` }}
          />
        </div>
      </div>

      {/* Counter tiles */}
      <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        <Counter icon={CheckCircle} label="Synced" value={job.success_count} tone="emerald" />
        <Counter icon={SkipForward} label="Skipped" value={job.skipped_count} tone="slate" />
        <Counter icon={XCircle} label="Failed" value={job.fail_count} tone="red" />
        <Counter icon={Database} label="Total" value={job.total_records} tone="indigo" />
      </div>

      {job.error_message && (
        <div className="relative mt-4 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{job.error_message}</span>
        </div>
      )}
    </div>
  );
}

const TONES: Record<string, { bg: string; icon: string; value: string }> = {
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-500', value: 'text-emerald-600' },
  slate: { bg: 'bg-slate-50', icon: 'text-slate-400', value: 'text-slate-600' },
  red: { bg: 'bg-red-50', icon: 'text-red-500', value: 'text-red-600' },
  indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-500', value: 'text-indigo-600' },
};

function Counter({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof CheckCircle;
  label: string;
  value: number;
  tone: keyof typeof TONES | string;
}) {
  const t = TONES[tone] || TONES.slate;
  return (
    <div className={`${t.bg} rounded-xl px-4 py-3.5 border border-white/60`}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`h-4 w-4 ${t.icon}`} />
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${t.value}`}>{value.toLocaleString()}</p>
    </div>
  );
}
