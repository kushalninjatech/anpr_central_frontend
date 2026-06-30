import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  SkipForward,
  XCircle,
  AlertCircle,
  Inbox,
  ChevronDown,
} from 'lucide-react';
import { syncJobApi } from '../services/api';
import type { SyncJobLogStatus } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';

const PAGE_SIZE_OPTIONS = [10, 20, 100] as const;

const STATUS_STYLES: Record<SyncJobLogStatus, string> = {
  sent: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  skipped: 'bg-slate-100 text-slate-600 ring-slate-200',
  failed: 'bg-red-100 text-red-700 ring-red-200',
};

const STATUS_ICONS: Record<SyncJobLogStatus, typeof CheckCircle> = {
  sent: CheckCircle,
  skipped: SkipForward,
  failed: XCircle,
};

function LogStatusBadge({ status }: { status: SyncJobLogStatus }) {
  const Icon = STATUS_ICONS[status] ?? AlertCircle;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ring-1 ring-inset capitalize ${STATUS_STYLES[status] ?? ''}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {status}
    </span>
  );
}

function UuidCell({ value }: { value: string | null }) {
  if (!value) return <span className="text-gray-400 text-sm">—</span>;
  return (
    <span
      className="block font-mono text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 truncate w-[130px]"
      title={value}
    >
      {value}
    </span>
  );
}

const fmt = (s: string | null | undefined) =>
  s ? format(parseISO(s), 'MMM dd, yyyy · HH:mm:ss') : '—';

export default function SyncJobLogs() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const jobId = Number(id);
  const [page, setPage] = useState(0); // 0-indexed
  const [pageSize, setPageSize] = useState<number>(10);

  const { data, isLoading, error } = useQuery({
    queryKey: ['sync-job-logs', jobId, page, pageSize],
    queryFn: () => syncJobApi.getLogs(jobId, page + 1, pageSize).then((r) => r.data),
    enabled: !!jobId,
  });

  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  const rangeStart = total === 0 ? 0 : page * pageSize + 1;
  const rangeEnd = Math.min((page + 1) * pageSize, total);

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(0);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100">
      {/* Top accent line */}
      <div className="h-1 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500" />

      {/* Sticky header */}
      <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-white/60 shadow-sm shadow-gray-200/40">
        <div className="w-full px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/sync-records')}
            className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl shadow-lg shadow-primary-500/30">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Sync Job #{jobId} — Logs
              </h1>
              <p className="text-sm text-gray-500">
                Per-record sync results
                {total > 0 && (
                  <span className="ml-1 text-gray-400">· {total.toLocaleString()} entries</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-6 py-8">
        {isLoading ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 border border-white/50 p-16 flex items-center justify-center">
            <LoadingSpinner size="lg" text="Loading logs..." />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-2xl px-6 py-4">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>Failed to load logs. Please go back and try again.</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Inbox className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No log entries</h3>
            <p className="text-gray-500 mt-1">No records were processed for this job.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <p className="text-sm text-gray-500">
                Showing <span className="font-semibold text-gray-700">{rangeStart}–{rangeEnd}</span> of{' '}
                <span className="font-semibold text-gray-700">{total.toLocaleString()}</span> entries
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Rows per page</span>
                <div className="relative">
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="appearance-none pl-3 pr-8 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer"
                  >
                    {PAGE_SIZE_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 border border-white/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">Log #</th>
                      {/* <th className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">Detection ID</th> */}
                      <th className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">Organization</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">Camera</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">Numberplate</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">Status</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">External Org</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">External Device</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">External Vehicle</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">Error</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {logs.map((log) => (
                      <tr key={log.id} className="transition-colors duration-150 hover:bg-primary-50/30">
                        {/* Log # */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="text-sm font-bold text-gray-900">#{log.id}</span>
                        </td>

                        {/* Detection ID */}
                        {/* <td className="px-3 py-3 whitespace-nowrap">
                          <span className="text-sm font-semibold text-indigo-600">
                            {log.detection_id ?? '—'}
                          </span>
                        </td> */}

                        {/* Organization Name */}
                        <td className="px-3 py-3 whitespace-nowrap max-w-[150px]">
                          <span
                            className="text-sm text-gray-700 font-medium truncate block"
                            title={log.organization_name ?? ''}
                          >
                            {log.organization_name ?? '—'}
                          </span>
                        </td>

                        {/* Camera */}
                        <td className="px-3 py-3 whitespace-nowrap max-w-[140px]">
                          {log.camera_id ? (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold truncate max-w-full"
                              title={log.camera_id}
                            >
                              {log.camera_id}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>

                        {/* Numberplate */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          {log.numberplate_text ? (
                            <span className="font-mono font-bold text-gray-900 bg-yellow-50 border border-yellow-200 text-sm px-2.5 py-1 rounded-md tracking-wide">
                              {log.numberplate_text}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          <LogStatusBadge status={log.log_status} />
                        </td>

                        {/* External Org UUID */}
                        <td className="px-3 py-3">
                          <UuidCell value={log.external_org_id} />
                        </td>

                        {/* External Device UUID */}
                        <td className="px-3 py-3">
                          <UuidCell value={log.external_device_id} />
                        </td>

                        {/* External Vehicle UUID */}
                        <td className="px-3 py-3">
                          <UuidCell value={log.external_vehicle_id} />
                        </td>

                        {/* Error message */}
                        <td className="px-3 py-3 min-w-[160px] max-w-[220px]">
                          {log.error_message ? (
                            <p
                              className="text-xs text-red-600 leading-relaxed whitespace-normal break-words"
                              title={log.error_message}
                            >
                              {log.error_message}
                            </p>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>

                        {/* Time */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-500">{fmt(log.created_at)}</span>
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
              label="entries"
            />
          </div>
        )}
      </main>
    </div>
  );
}
