import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
  ScanLine,
  Eye,
  X,
  Calendar,
  Filter,
  Search,
  ArrowDownCircle,
  ArrowUpCircle,
  Camera,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RotateCcw,
  Save,
  Image as ImageIcon,
  ChevronDown,
  Trash2,
  ZoomIn,
  Maximize2,
} from 'lucide-react';
import { staticApi, API_BASE_URL } from '../services/api';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  retrying: 'bg-orange-100 text-orange-700',
  success: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

const STATUS_ICONS: Record<string, typeof AlertCircle> = {
  pending: AlertCircle,
  processing: Clock,
  retrying: RotateCcw,
  success: CheckCircle,
  failed: XCircle,
};

function StatusBadge({ status }: { status: string }) {
  const Icon = STATUS_ICONS[status];
  const style = STATUS_STYLES[status] || 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${style}`}>
      {Icon && <Icon className="h-3 w-3" />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function ActivityBadge({ type }: { type: string | null }) {
  if (type === 'in') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-md text-xs font-semibold">
        <ArrowDownCircle className="h-3 w-3" /> IN
      </span>
    );
  }
  if (type === 'out') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold">
        <ArrowUpCircle className="h-3 w-3" /> OUT
      </span>
    );
  }
  return <span className="text-gray-300 text-xs">—</span>;
}

export default function StaticNumberplate() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(100);
  const [orgId, setOrgId] = useState('');
  const [cameraId, setCameraId] = useState('');
  const [activityType, setActivityType] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [plateSearch, setPlateSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [selectedDetectionId, setSelectedDetectionId] = useState<number | null>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [plateInput, setPlateInput] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Image zoom/pan state
  const [imgScale, setImgScale] = useState(1);
  const [imgOffset, setImgOffset] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const imgContainerRef = useRef<HTMLDivElement>(null);

  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  // List query
  const { data: listData, isLoading: listLoading, error: listError } = useQuery({
    queryKey: ['static-detections', page, pageSize, orgId, cameraId, activityType, statusFilter, plateSearch, startDate, endDate],
    queryFn: () => {
      const params: any = { page: page + 1, page_size: pageSize };
      if (orgId) params.organization_id = parseInt(orgId);
      if (cameraId) params.camera_id = cameraId;
      if (activityType) params.activity_type = activityType;
      if (statusFilter) params.status_filter = statusFilter;
      if (plateSearch) params.plate = plateSearch;
      if (startDate) params.start_date = new Date(startDate).toISOString();
      if (endDate) params.end_date = new Date(endDate + 'T23:59:59').toISOString();
      return staticApi.listDetections(params);
    },
  });

  const detections = listData?.data.detections || [];
  const totalDetections = listData?.data.total || 0;
  const totalPages = Math.ceil(totalDetections / pageSize);

  // Detail query — onSuccess was removed in React Query v5, use useEffect instead
  const { data: detailQueryData, isLoading: detailLoading } = useQuery({
    queryKey: ['static-detection', selectedDetectionId],
    queryFn: () => staticApi.getDetection(selectedDetectionId!),
    enabled: !!selectedDetectionId,
  });

  useEffect(() => {
    if (detailQueryData?.data) {
      setDetailData(detailQueryData.data);
      setPlateInput(detailQueryData.data.numberplate_text || '');
      setSaveStatus('idle');
      setSaveMessage('');
    }
  }, [detailQueryData]);

  // Reset page when filters change
  const resetPage = () => setPage(0);

  const openDetail = (detectionId: number) => {
    setSelectedDetectionId(detectionId);
    setDetailData(null);
    setPlateInput('');
    setSaveStatus('idle');
    setSaveMessage('');
  };

  const closeDetail = () => {
    setSelectedDetectionId(null);
    setDetailData(null);
  };

  const handleSave = async () => {
    if (!detailData) return;
    setSaveStatus('saving');
    setSaveMessage('');
    try {
      const res = await staticApi.updateNumberplate(detailData.detection_id, plateInput);
      const updated = res.data.detection;

      // Patch the matching row in the cached list without refetching
      queryClient.setQueryData(
        ['static-detections', page, pageSize, orgId, cameraId, activityType, statusFilter, plateSearch, startDate, endDate],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            data: {
              ...old.data,
              detections: old.data.detections.map((d: any) =>
                d.detection_id === updated.detection_id
                  ? { ...d, numberplate_text: updated.numberplate_text }
                  : d
              ),
            },
          };
        }
      );

      closeDetail();
    } catch (err: any) {
      setSaveStatus('error');
      setSaveMessage(err?.response?.data?.detail || 'Failed to update numberplate');
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await staticApi.deleteDetection(id);
      queryClient.setQueryData(
        ['static-detections', page, pageSize, orgId, cameraId, activityType, statusFilter, plateSearch, startDate, endDate],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            data: {
              ...old.data,
              detections: old.data.detections.map((d: any) =>
                d.detection_id === id
                  ? { ...d, is_deleted: true, deleted_status: 'Deleted' }
                  : d
              ),
            },
          };
        }
      );
    } catch {
      // silently ignore — row status unchanged if delete fails
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const resetZoom = useCallback(() => {
    setImgScale(1);
    setImgOffset({ x: 0, y: 0 });
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setImgScale(prev => Math.min(8, Math.max(1, prev - e.deltaY * 0.002)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (imgScale <= 1) return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX - imgOffset.x, y: e.clientY - imgOffset.y };
  }, [imgScale, imgOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    setImgOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  }, []);

  const handleMouseUp = useCallback(() => { isDragging.current = false; }, []);

  // Reset zoom whenever a new detection is opened
  useEffect(() => { resetZoom(); }, [selectedDetectionId, resetZoom]);

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    const date = parseISO(dateString);
    return { time: format(date, 'HH:mm:ss'), date: format(date, 'dd-MM-yyyy') };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
            <ScanLine className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Numberplate Entry</h1>
            <p className="text-xs text-gray-500">Review detections and enter numberplate text</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-gray-500">Public Access</span>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-6 py-6 space-y-5">
        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Page size */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white shadow-sm">
              <span className="text-xs font-medium text-gray-500">Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(parseInt(e.target.value)); resetPage(); }}
                className="border-none bg-transparent text-sm font-medium text-gray-700 focus:outline-none focus:ring-0"
              >
                {PAGE_SIZE_OPTIONS.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </div>

            {/* Org ID */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white shadow-sm">
              <Building2 className="h-4 w-4 text-gray-400" />
              <input
                type="number"
                placeholder="Org ID"
                value={orgId}
                onChange={(e) => { setOrgId(e.target.value); resetPage(); }}
                className="border-none bg-transparent text-sm font-medium text-gray-700 focus:outline-none focus:ring-0 w-20 placeholder:text-gray-400"
              />
            </div>

            {/* Camera ID */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white shadow-sm">
              <Camera className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Camera ID"
                value={cameraId}
                onChange={(e) => { setCameraId(e.target.value); resetPage(); }}
                className="border-none bg-transparent text-sm font-medium text-gray-700 focus:outline-none focus:ring-0 w-28 placeholder:text-gray-400"
              />
            </div>

            {/* Activity type */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white shadow-sm">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={activityType}
                onChange={(e) => { setActivityType(e.target.value); resetPage(); }}
                className="border-none bg-transparent text-sm font-medium text-gray-700 focus:outline-none focus:ring-0"
              >
                <option value="">All Activities</option>
                <option value="in">IN</option>
                <option value="out">OUT</option>
              </select>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white shadow-sm">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); resetPage(); }}
                className="border-none bg-transparent text-sm font-medium text-gray-700 focus:outline-none focus:ring-0"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="retrying">Retrying</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Plate search */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white shadow-sm">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search plate..."
                value={plateSearch}
                onChange={(e) => { setPlateSearch(e.target.value); resetPage(); }}
                className="border-none bg-transparent text-sm font-medium text-gray-700 focus:outline-none focus:ring-0 w-32 placeholder:text-gray-400"
              />
            </div>

            {/* Start date */}
            <div
              className="relative flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white shadow-sm cursor-pointer"
              onClick={() => startDateRef.current?.showPicker()}
            >
              <input
                ref={startDateRef}
                type="date"
                value={startDate}
                max={format(new Date(), 'yyyy-MM-dd')}
                onChange={(e) => { setStartDate(e.target.value); resetPage(); }}
                className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
              />
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className={`text-sm font-medium ${startDate ? 'text-gray-700' : 'text-gray-400'}`}>
                {startDate ? format(new Date(startDate), 'dd-MM-yyyy') : 'Start Date'}
              </span>
            </div>

            {/* End date */}
            <div
              className="relative flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white shadow-sm cursor-pointer"
              onClick={() => endDateRef.current?.showPicker()}
            >
              <input
                ref={endDateRef}
                type="date"
                value={endDate}
                min={startDate || undefined}
                max={format(new Date(), 'yyyy-MM-dd')}
                onChange={(e) => { setEndDate(e.target.value); resetPage(); }}
                className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
              />
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className={`text-sm font-medium ${endDate ? 'text-gray-700' : 'text-gray-400'}`}>
                {endDate ? format(new Date(endDate), 'dd-MM-yyyy') : 'End Date'}
              </span>
            </div>

            {/* Clear */}
            {(orgId || cameraId || activityType || statusFilter || plateSearch || startDate || endDate) && (
              <button
                onClick={() => {
                  setOrgId(''); setCameraId(''); setActivityType('');
                  setStatusFilter(''); setPlateSearch('');
                  setStartDate(''); setEndDate(''); resetPage();
                }}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                title="Clear all filters"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            <div className="ml-auto">
              <span className="text-xs font-medium text-gray-400">{totalDetections.toLocaleString()} results</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {listError ? (
            <div className="p-12 text-center">
              <XCircle className="h-12 w-12 text-red-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Failed to load detections</p>
              <p className="text-sm text-red-500 mt-1">
                {listError instanceof Error ? listError.message : 'Unknown error'}
              </p>
            </div>
          ) : listLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" text="Loading detections..." />
            </div>
          ) : detections.length === 0 ? (
            <div className="p-12 text-center">
              <ScanLine className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No detections found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting the filters above</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                      <th className="px-4 py-3.5 text-left text-xs font-bold text-indigo-600 uppercase tracking-wider w-14">#</th>
                      <th className="px-4 py-3.5 text-left text-xs font-bold text-indigo-600 uppercase tracking-wider">Detection ID</th>
                      <th className="px-4 py-3.5 text-left text-xs font-bold text-indigo-600 uppercase tracking-wider">Organization</th>
                      <th className="px-4 py-3.5 text-left text-xs font-bold text-indigo-600 uppercase tracking-wider">Camera</th>
                      <th className="px-4 py-3.5 text-left text-xs font-bold text-indigo-600 uppercase tracking-wider">Numberplate</th>
                      <th className="px-4 py-3.5 text-left text-xs font-bold text-indigo-600 uppercase tracking-wider">Activity</th>
                      <th className="px-4 py-3.5 text-left text-xs font-bold text-indigo-600 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3.5 text-center text-xs font-bold text-indigo-600 uppercase tracking-wider">Deleted</th>
                      <th className="px-4 py-3.5 text-left text-xs font-bold text-indigo-600 uppercase tracking-wider">Detected At</th>
                      <th className="px-4 py-3.5 text-center text-xs font-bold text-indigo-600 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {detections.map((d: any, index: number) => {
                      const dt = formatDateTime(d.detected_at || d.created_at);
                      return (
                        <tr
                          key={d.detection_id}
                          className={`hover:bg-indigo-50/40 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                        >
                          <td className="px-4 py-3 text-sm font-bold text-gray-500">{d.serial_no}</td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-gray-900 text-sm">#{d.detection_id}</span>
                            {d.client_detection_id && (
                              <div className="text-[11px] text-gray-400 truncate max-w-[120px]">{d.client_detection_id}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                              <span className="text-sm text-gray-700">{d.organization_name || `Org #${d.organization_id}`}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-800">{d.camera_name || d.camera_id}</div>
                            <div className="text-[11px] text-gray-400">ID: {d.camera_id}</div>
                          </td>
                          <td className="px-4 py-3">
                            {d.numberplate_text ? (
                              <span className="font-mono text-sm font-bold text-gray-900 bg-yellow-50 px-2.5 py-1 rounded border border-yellow-200 tracking-wide">
                                {d.numberplate_text}
                              </span>
                            ) : (
                              <span className="text-gray-300 text-sm italic">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <ActivityBadge type={d.activity_type} />
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={d.status} />
                          </td>
                          <td className="px-4 py-3 text-center">
                            {d.is_deleted ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                {d.deleted_status || 'Deleted'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                Active
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {dt ? (
                              <div>
                                <span className="text-sm text-gray-800 font-medium">{dt.time}</span>
                                <span className="text-[11px] text-gray-400 ml-1.5">{dt.date}</span>
                              </div>
                            ) : (
                              <span className="text-gray-300 text-sm">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openDetail(d.detection_id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-medium transition-colors"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                View
                              </button>

                              {confirmDeleteId === d.detection_id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleDelete(d.detection_id)}
                                    disabled={deletingId === d.detection_id}
                                    className="px-2.5 py-1.5 bg-red-600 text-white hover:bg-red-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                                  >
                                    {deletingId === d.detection_id ? '...' : 'Confirm'}
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="px-2.5 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg text-xs font-medium transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmDeleteId(d.detection_id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-medium transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-4 border-t border-gray-100">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={totalDetections}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  label="detections"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedDetectionId !== null && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          onClick={closeDetail}
        >
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
            <div
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <ScanLine className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">
                      {detailData ? `Detection #${detailData.detection_id}` : 'Loading...'}
                    </h3>
                    {detailData?.client_detection_id && (
                      <p className="text-sm text-white/70">{detailData.client_detection_id}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={closeDetail}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal body */}
              {detailLoading && !detailData ? (
                <div className="flex items-center justify-center h-64">
                  <LoadingSpinner size="lg" text="Loading detection..." />
                </div>
              ) : detailData ? (
                <div className="p-5 space-y-4">
                  {/* Image — scroll to zoom, drag to pan */}
                  {detailData.image_url ? (
                    <div className="relative rounded-xl overflow-hidden bg-gray-900 select-none" style={{ height: '60vh' }}>
                      {/* Zoom controls */}
                      <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
                        <span className="px-2 py-1 bg-black/50 text-white text-xs font-mono rounded-lg backdrop-blur-sm">
                          {Math.round(imgScale * 100)}%
                        </span>
                        {imgScale > 1 && (
                          <button
                            onClick={resetZoom}
                            className="p-1.5 bg-black/50 text-white hover:bg-black/70 rounded-lg backdrop-blur-sm transition-colors"
                            title="Reset zoom"
                          >
                            <Maximize2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Hint */}
                      {imgScale === 1 && (
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-black/40 text-white/80 text-xs rounded-full backdrop-blur-sm pointer-events-none">
                          <ZoomIn className="h-3 w-3" />
                          Scroll to zoom · Drag to pan
                        </div>
                      )}

                      {/* Zoomable container */}
                      <div
                        ref={imgContainerRef}
                        className="w-full h-full flex items-center justify-center overflow-hidden"
                        style={{ cursor: imgScale > 1 ? (isDragging.current ? 'grabbing' : 'grab') : 'default' }}
                        onWheel={handleWheel}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                      >
                        <img
                          src={`${API_BASE_URL}${detailData.image_url}`}
                          alt="Vehicle Detection"
                          draggable={false}
                          style={{
                            transform: `scale(${imgScale}) translate(${imgOffset.x / imgScale}px, ${imgOffset.y / imgScale}px)`,
                            transformOrigin: 'center center',
                            transition: isDragging.current ? 'none' : 'transform 0.1s ease-out',
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                          }}
                          onError={(e) => {
                            const el = e.target as HTMLImageElement;
                            el.style.display = 'none';
                            el.parentElement!.innerHTML =
                              '<div class="flex flex-col items-center justify-center h-full"><svg class="w-12 h-12 mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><p class="text-sm text-gray-500">Image not available</p></div>';
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 flex flex-col items-center justify-center py-16">
                      <ImageIcon className="h-12 w-12 text-gray-300 mb-2" />
                      <p className="text-sm text-gray-400">No image available</p>
                    </div>
                  )}

                  {/* Numberplate input + save */}
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={plateInput}
                      onChange={(e) => { setPlateInput(e.target.value.toUpperCase()); setSaveStatus('idle'); setSaveMessage(''); }}
                      maxLength={20}
                      placeholder="Enter numberplate e.g. MH12AB1234"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-lg font-bold tracking-widest uppercase text-center"
                    />
                    <button
                      onClick={handleSave}
                      disabled={saveStatus === 'saving' || !plateInput.trim()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-indigo-600 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saveStatus === 'saving' ? (
                        <><LoadingSpinner size="sm" />Saving...</>
                      ) : (
                        <><Save className="h-4 w-4" />Save Numberplate</>
                      )}
                    </button>

                    {saveStatus === 'success' && (
                      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                        <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                        <p className="text-sm text-green-800 font-medium">{saveMessage}</p>
                      </div>
                    )}
                    {saveStatus === 'error' && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                        <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                        <p className="text-sm text-red-800 font-medium">{saveMessage}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
