import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
  ScanLine,
  Filter,
  Car,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Building2,
  Image as ImageIcon,
  X,
  ArrowDownCircle,
  ArrowUpCircle,
  RotateCcw,
  Eye,
  Calendar,
  Camera
} from 'lucide-react';
import { detectionApi, organizationApi, cameraApi, API_BASE_URL } from '../services/api';
import type { ProcessingStatus, Detection } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';

// Helper function to format UTC datetime to local time
const formatDateTime = (dateString: string | null | undefined) => {
  if (!dateString) return null;
  // parseISO properly handles ISO 8601 UTC strings and converts to local time
  const date = parseISO(dateString);
  return {
    time: format(date, 'HH:mm:ss'),
    date: format(date, 'MMM dd, yyyy'),
    full: format(date, 'MMM dd, yyyy HH:mm:ss')
  };
};

export default function Detections() {
  const [selectedOrg, setSelectedOrg] = useState<number | ''>('');
  const [selectedCamera, setSelectedCamera] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProcessingStatus | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedImage, setSelectedImage] = useState<Detection | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<Detection | null>(null);
  const pageSize = 10;
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<HTMLInputElement>(null);
  const endTimeRef = useRef<HTMLInputElement>(null);

  const { data: orgsData } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationApi.getAll(1, 1000),
  });

  const { data: camerasData } = useQuery({
    queryKey: ['cameras', selectedOrg],
    queryFn: () => cameraApi.getAll(1, 1000, selectedOrg as number),
    enabled: !!selectedOrg,
  });

  const { data: detectionsData, isLoading, error } = useQuery({
    queryKey: ['detections', currentPage, selectedOrg, selectedCamera, statusFilter, startDate, endDate, startTime, endTime],
    queryFn: () => {
      const page = currentPage + 1;

      // Build ISO datetime strings from date + time inputs
      let startDateTime: string | undefined;
      let endDateTime: string | undefined;

      if (startDate) {
        const time = startTime || '00:00';
        startDateTime = `${startDate}T${time}:00`;
      }
      if (endDate) {
        const time = endTime || '23:59';
        endDateTime = `${endDate}T${time}:59`;
      }

      return detectionApi.getAll(
        page,
        pageSize,
        statusFilter || undefined,
        selectedCamera || undefined,
        selectedOrg || undefined,
        startDateTime,
        endDateTime
      );
    },
  });

  const organizations = orgsData?.data.organizations || [];
  const cameras = camerasData?.data.cameras || [];
  const detections = detectionsData?.data.detections || [];
  const totalDetections = detectionsData?.data.total || 0;

  const totalPages = Math.ceil(totalDetections / pageSize);

  const getStatusBadge = (status: ProcessingStatus) => {
    const styles: Record<ProcessingStatus, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-blue-100 text-blue-700',
      retrying: 'bg-orange-100 text-orange-700',
      success: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
    };
    const icons: Record<ProcessingStatus, typeof AlertCircle> = {
      pending: AlertCircle,
      processing: Clock,
      retrying: RotateCcw,
      success: CheckCircle,
      failed: XCircle,
    };
    const Icon = icons[status];

    if (!Icon) {
      return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">{status}</span>;
    }

    return (
      <span className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">ANPR Detections</h1>
        <p className="text-gray-500 mt-1">View all vehicle detections across all organizations</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Organization Filter */}
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm">
          <Building2 className="h-4 w-4 text-gray-400" />
          <select
            value={selectedOrg}
            onChange={(e) => {
              setSelectedOrg(e.target.value ? parseInt(e.target.value) : '');
              setSelectedCamera('');
              setCurrentPage(0);
            }}
            className="border-none bg-transparent text-sm font-medium text-gray-700 focus:outline-none focus:ring-0 min-w-[150px]"
          >
            <option value="">All Organizations</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as ProcessingStatus | '');
              setCurrentPage(0);
            }}
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

        {/* Camera Filter */}
        <div className={`flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm ${!selectedOrg ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <Camera className="h-4 w-4 text-gray-400" />
          <select
            value={selectedCamera}
            onChange={(e) => {
              setSelectedCamera(e.target.value);
              setCurrentPage(0);
            }}
            disabled={!selectedOrg}
            className="border-none bg-transparent text-sm font-medium text-gray-700 focus:outline-none focus:ring-0 min-w-[130px] disabled:cursor-not-allowed"
          >
            <option value="">{!selectedOrg ? 'Select Org First' : 'All Cameras'}</option>
            {cameras.map((cam) => (
              <option key={`${cam.organization_id}-${cam.camera_id}`} value={cam.camera_id}>
                {cam.camera_name}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div
          className="relative flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm cursor-pointer"
          onClick={() => startDateRef.current?.showPicker()}
        >
          <input
            ref={startDateRef}
            type="date"
            value={startDate}
            max={format(new Date(), 'yyyy-MM-dd')}
            onChange={(e) => { setStartDate(e.target.value); setCurrentPage(0); }}
            className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
          />
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className={`text-sm font-medium ${startDate ? 'text-gray-700' : 'text-gray-400'}`}>
            {startDate ? format(new Date(startDate), 'dd-MM-yyyy') : 'Start Date'}
          </span>
        </div>

        {/* Start Time */}
        <div
          className="relative flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm cursor-pointer"
          onClick={() => startTimeRef.current?.showPicker()}
        >
          <input
            ref={startTimeRef}
            type="time"
            value={startTime}
            onChange={(e) => { setStartTime(e.target.value); setCurrentPage(0); }}
            className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
          />
          <Clock className="h-4 w-4 text-gray-400" />
          <span className={`text-sm font-medium ${startTime ? 'text-gray-700' : 'text-gray-400'}`}>
            {startTime || 'Start Time'}
          </span>
        </div>

        <span className="text-xs font-medium text-gray-400">to</span>

        {/* End Date */}
        <div
          className="relative flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm cursor-pointer"
          onClick={() => endDateRef.current?.showPicker()}
        >
          <input
            ref={endDateRef}
            type="date"
            value={endDate}
            min={startDate || undefined}
            max={format(new Date(), 'yyyy-MM-dd')}
            onChange={(e) => { setEndDate(e.target.value); setCurrentPage(0); }}
            className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
          />
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className={`text-sm font-medium ${endDate ? 'text-gray-700' : 'text-gray-400'}`}>
            {endDate ? format(new Date(endDate), 'dd-MM-yyyy') : 'End Date'}
          </span>
        </div>

        {/* End Time */}
        <div
          className="relative flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm cursor-pointer"
          onClick={() => endTimeRef.current?.showPicker()}
        >
          <input
            ref={endTimeRef}
            type="time"
            value={endTime}
            onChange={(e) => { setEndTime(e.target.value); setCurrentPage(0); }}
            className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
          />
          <Clock className="h-4 w-4 text-gray-400" />
          <span className={`text-sm font-medium ${endTime ? 'text-gray-700' : 'text-gray-400'}`}>
            {endTime || 'End Time'}
          </span>
        </div>

        {/* Clear & Results */}
        {(startDate || endDate || startTime || endTime) && (
          <button
            onClick={() => { setStartDate(''); setEndDate(''); setStartTime(''); setEndTime(''); setCurrentPage(0); }}
            className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            title="Clear filters"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div className="ml-auto">
          <span className="text-xs font-medium text-gray-400">{totalDetections.toLocaleString()} results</span>
        </div>
      </div>

      {/* Detections Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {error ? (
          <div className="p-12 text-center">
            <XCircle className="h-12 w-12 text-red-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Detections</h3>
            <p className="text-red-600 mb-4">
              {error instanceof Error ? error.message : 'Failed to load detections'}
            </p>
            <p className="text-sm text-gray-500">
              Make sure you're logged in with a super admin token and the backend is running.
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" text="Loading detections..." />
          </div>
        ) : detections.length === 0 ? (
          <div className="p-12 text-center">
            <ScanLine className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No detections found</h3>
            <p className="text-gray-500">
              Detections will appear here when received from client systems
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-indigo-600 uppercase tracking-wider">
                      Detection
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-indigo-600 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-indigo-600 uppercase tracking-wider">
                      Numberplate
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-indigo-600 uppercase tracking-wider">
                      Camera
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-indigo-600 uppercase tracking-wider">
                      Organization
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-indigo-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-5 py-3.5 text-center text-xs font-bold text-indigo-600 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-indigo-600 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-5 py-3.5 text-center text-xs font-bold text-indigo-600 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {detections.map((detection, index) => (
                    <tr
                      key={detection.detection_id}
                      className={`hover:bg-indigo-50/40 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="bg-purple-100 p-1.5 rounded-lg">
                            <ScanLine className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 text-sm">#{detection.detection_id}</span>
                            {detection.client_detection_id && (
                              <div className="text-[11px] text-gray-400 truncate max-w-[120px]">{detection.client_detection_id}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5">
                            <Car className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-sm text-gray-700 capitalize font-medium">
                              {detection.object_type || 'Unknown'}
                            </span>
                          </div>
                          <span className="text-gray-300">|</span>
                          {detection.activity_type === 'in' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-md text-xs font-semibold">
                              <ArrowDownCircle className="h-3 w-3" /> IN
                            </span>
                          ) : detection.activity_type === 'out' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold">
                              <ArrowUpCircle className="h-3 w-3" /> OUT
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {detection.numberplate_text ? (
                          <span className="font-mono text-sm font-bold text-gray-900 bg-yellow-50 px-3 py-1 rounded-md border border-yellow-200 tracking-wide">
                            {detection.numberplate_text}
                          </span>
                        ) : detection.numberplate_available === false ? (
                          <span className="text-xs text-gray-400 italic bg-gray-50 px-2 py-1 rounded">Not visible</span>
                        ) : (
                          <span className="text-gray-300 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-sm font-medium text-gray-800">
                          {detection.camera_name || detection.camera_id}
                        </div>
                        <div className="text-[11px] text-gray-400">ID: {detection.camera_id}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-indigo-400" />
                          <span className="text-sm text-gray-700">
                            {detection.organization_name || `Org #${detection.organization_id}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {getStatusBadge(detection.status)}
                        {detection.error_message && (
                          <div className="text-[11px] text-red-500 mt-0.5" title={detection.error_message}>
                            retry: {detection.retry_count}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-center">
                        {detection.image_url ? (
                          <div
                            className="w-14 h-14 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-indigo-400 cursor-pointer transition-all hover:shadow-md inline-block"
                            onClick={() => setSelectedImage(detection)}
                          >
                            <img
                              src={`${API_BASE_URL}${detection.image_url}`}
                              alt="Detection"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full bg-gray-100 flex items-center justify-center"><svg class="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center inline-flex">
                            <ImageIcon className="h-5 w-5 text-gray-300" />
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {(() => {
                          const clientTime = formatDateTime(detection.detected_at);
                          const serverTime = formatDateTime(detection.created_at);
                          return clientTime || serverTime ? (
                            <div className="space-y-0.5">
                              {clientTime && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-medium text-gray-400 uppercase w-8">Client</span>
                                  <span className="text-sm text-gray-800 font-medium">{clientTime.time}</span>
                                  <span className="text-[11px] text-gray-400">{clientTime.date}</span>
                                </div>
                              )}
                              {serverTime && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-medium text-gray-400 uppercase w-8">Server</span>
                                  <span className="text-sm text-gray-600">{serverTime.time}</span>
                                  <span className="text-[11px] text-gray-400">{serverTime.date}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-300 text-sm">—</span>
                          );
                        })()}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => setSelectedDetail(detection)}
                          className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-gray-100">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalDetections}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                label="detections"
              />
            </div>
          </>
        )}
      </div>

      {/* Image Preview Modal - Only shows the full image */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 p-2 text-white/70 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-800">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-300 font-medium">Detection #{selectedImage.detection_id}</span>
                  {selectedImage.numberplate_text && (
                    <>
                      <span className="text-gray-600">|</span>
                      <span className="font-mono text-sm font-bold text-yellow-400">{selectedImage.numberplate_text}</span>
                    </>
                  )}
                </div>
                <button
                  onClick={() => { setSelectedImage(null); setSelectedDetail(selectedImage); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs font-medium"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View Details
                </button>
              </div>
              <div className="flex items-center justify-center p-4">
                <img
                  src={`${API_BASE_URL}${selectedImage.image_url}`}
                  alt="Vehicle Detection"
                  className="max-w-full max-h-[75vh] object-contain rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="%23f3f4f6"/><text x="50%" y="50%" text-anchor="middle" fill="%236b7280">Image not found</text></svg>';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail View Modal - Only shows detection details */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={() => setSelectedDetail(null)}>
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <ScanLine className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Detection #{selectedDetail.detection_id}</h3>
                    <p className="text-sm text-white/70">{selectedDetail.client_detection_id || 'No client ID'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDetail(null)}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Number Plate */}
                {selectedDetail.numberplate_text ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                    <p className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest mb-2">Number Plate</p>
                    <div className="font-mono text-2xl font-black text-gray-900 tracking-wider">
                      {selectedDetail.numberplate_text}
                    </div>
                    <div className="flex items-center justify-center gap-3 mt-2 text-xs text-yellow-700">
                      <span>Color: <span className="capitalize font-medium">{selectedDetail.numberplate_color || 'Unknown'}</span></span>
                      <span className="text-yellow-300">|</span>
                      <span>Side: <span className="capitalize font-medium">{selectedDetail.vehicle_side || 'Unknown'}</span></span>
                    </div>
                  </div>
                ) : selectedDetail.numberplate_available ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Number Plate</p>
                    <div className="text-sm text-gray-600">
                      Color: <span className="capitalize">{selectedDetail.numberplate_color || 'Unknown'}</span> | Side: <span className="capitalize">{selectedDetail.vehicle_side || 'Unknown'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400">Number plate not available</p>
                  </div>
                )}

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-green-500 uppercase tracking-wider mb-1">Status</p>
                    {getStatusBadge(selectedDetail.status)}
                    {selectedDetail.error_message && (
                      <p className="text-[11px] text-red-500 mt-1">Error (retry: {selectedDetail.retry_count})</p>
                    )}
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Activity</p>
                    {selectedDetail.activity_type === 'in' ? (
                      <span className="inline-flex items-center gap-1.5 text-green-700 font-semibold text-sm">
                        <ArrowDownCircle className="h-4 w-4" /> Entry (IN)
                      </span>
                    ) : selectedDetail.activity_type === 'out' ? (
                      <span className="inline-flex items-center gap-1.5 text-blue-700 font-semibold text-sm">
                        <ArrowUpCircle className="h-4 w-4" /> Exit (OUT)
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </div>

                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Vehicle Type</p>
                    <div className="flex items-center gap-1.5">
                      <Car className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-semibold text-gray-800 capitalize">{selectedDetail.object_type || 'Unknown'}</span>
                    </div>
                    {selectedDetail.vehicle_track_id && (
                      <p className="text-[11px] text-gray-400 mt-0.5">Track: {selectedDetail.vehicle_track_id}</p>
                    )}
                  </div>

                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Camera</p>
                    <p className="text-sm font-semibold text-gray-800">{selectedDetail.camera_name || selectedDetail.camera_id}</p>
                    <p className="text-[11px] text-gray-400">ID: {selectedDetail.camera_id}</p>
                  </div>
                </div>

                {/* Organization */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">Organization</p>
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-indigo-400" />
                    <span className="text-sm font-semibold text-gray-800">
                      {selectedDetail.organization_name || `Org #${selectedDetail.organization_id}`}
                    </span>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-2">Timestamps</p>
                  <div className="space-y-1.5">
                    {(() => {
                      const clientTime = formatDateTime(selectedDetail.detected_at);
                      return clientTime && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-indigo-400 font-medium text-xs">Client Detected</span>
                          <span className="text-gray-800 font-medium">{clientTime.full}</span>
                        </div>
                      );
                    })()}
                    {(() => {
                      const serverTime = formatDateTime(selectedDetail.created_at);
                      return serverTime && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-indigo-400 font-medium text-xs">Server Received</span>
                          <span className="text-gray-800 font-medium">{serverTime.full}</span>
                        </div>
                      );
                    })()}
                    {(() => {
                      const updatedTime = formatDateTime(selectedDetail.updated_at);
                      return updatedTime && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-indigo-400 font-medium text-xs">Last Updated</span>
                          <span className="text-gray-600">{updatedTime.full}</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* LLM Section */}
                {(selectedDetail.llm_confidence || selectedDetail.llm_reasoning) && (
                  <div className="bg-purple-50 border border-purple-100 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-2">AI Analysis</p>
                    {selectedDetail.llm_confidence && (
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-purple-400 font-medium text-xs">Confidence</span>
                        <span className="text-gray-800 font-semibold">{selectedDetail.llm_confidence}</span>
                      </div>
                    )}
                    {selectedDetail.llm_reasoning && (
                      <div className="bg-white rounded-lg p-3 border border-purple-100">
                        <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-gray-700">
                          {selectedDetail.llm_reasoning}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* View Image Button */}
                {selectedDetail.image_url && (
                  <button
                    onClick={() => { setSelectedDetail(null); setSelectedImage(selectedDetail); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                  >
                    <ImageIcon className="h-4 w-4" />
                    View Image
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
