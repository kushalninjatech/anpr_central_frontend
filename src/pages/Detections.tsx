import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
  ScanLine,
  Filter,
  ChevronLeft,
  ChevronRight,
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
  RotateCcw
} from 'lucide-react';
import { detectionApi, organizationApi } from '../services/api';
import type { ProcessingStatus, Detection } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8010';

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
  const [statusFilter, setStatusFilter] = useState<ProcessingStatus | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedImage, setSelectedImage] = useState<Detection | null>(null);
  const pageSize = 20;

  const { data: orgsData } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationApi.getAll(0, 1000),
  });

  const { data: detectionsData, isLoading, error } = useQuery({
    queryKey: ['detections', currentPage, selectedOrg, statusFilter, startDate, endDate, startTime, endTime],
    queryFn: async () => {
      try {
        console.log('Fetching detections with params:', {
          skip: currentPage * pageSize,
          limit: pageSize,
          statusFilter: statusFilter || undefined,
          orgId: selectedOrg || undefined
        });
        const response = await detectionApi.getAll(
          currentPage * pageSize,
          pageSize,
          statusFilter || undefined,
          undefined,
          selectedOrg || undefined
        );
        console.log('Detections response:', response);
        // Backend returns array directly in response.data
        return response.data;
      } catch (err: any) {
        console.error('Error fetching detections:', err);
        console.error('Error response:', err.response?.data);
        console.error('Error status:', err.response?.status);
        throw err;
      }
    },
  });

  const organizations = orgsData?.data.organizations || [];
  const detections = detectionsData || [];
  const totalDetections = detections.length;

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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={selectedOrg}
                onChange={(e) => {
                  setSelectedOrg(e.target.value ? parseInt(e.target.value) : '');
                  setCurrentPage(0);
                }}
                className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white min-w-[180px]"
              >
                <option value="">All Organizations</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as ProcessingStatus | '');
                  setCurrentPage(0);
                }}
                className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white min-w-[140px]"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="retrying">Retrying</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {/* Date and Time Range Filter */}
          <div className="flex flex-col lg:flex-row gap-4 border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Start:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(0);
                }}
                className="px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <input
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  setCurrentPage(0);
                }}
                className="px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">End:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(0);
                }}
                className="px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <input
                type="time"
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  setCurrentPage(0);
                }}
                className="px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            {(startDate || endDate || startTime || endTime) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setStartTime('');
                  setEndTime('');
                  setCurrentPage(0);
                }}
                className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Clear Dates
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span>Total: {totalDetections.toLocaleString()} detections</span>
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
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
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Object Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Activity
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Camera
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Organization
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Client Time
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Server Time
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {detections.map((detection) => (
                    <tr key={detection.detection_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-purple-50 p-2 rounded-lg">
                            <ScanLine className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <span className="font-medium text-gray-900">#{detection.detection_id}</span>
                            {detection.client_detection_id && (
                              <div className="text-xs text-gray-500">{detection.client_detection_id}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600 capitalize">
                            {detection.object_type || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {detection.activity_type === 'in' ? (
                          <div className="flex items-center gap-1.5 text-green-600">
                            <ArrowDownCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">IN</span>
                          </div>
                        ) : detection.activity_type === 'out' ? (
                          <div className="flex items-center gap-1.5 text-blue-600">
                            <ArrowUpCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">OUT</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-gray-900 font-medium">
                            {detection.camera_name || detection.camera_id}
                          </div>
                          <div className="text-xs text-gray-500">ID: {detection.camera_id}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">
                            {detection.organization_name || `Org #${detection.organization_id}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(detection.status)}
                        {detection.error_message && (
                          <div className="text-xs text-red-600 mt-1" title={detection.error_message}>
                            Error (retry: {detection.retry_count})
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const formattedDate = formatDateTime(detection.detected_at);
                          return formattedDate ? (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <div>
                                <div className="text-gray-900">
                                  {formattedDate.time}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formattedDate.date}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const formattedDate = formatDateTime(detection.created_at);
                          return formattedDate ? (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <div>
                                <div className="text-gray-900">
                                  {formattedDate.time}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formattedDate.date}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        {detection.image_url ? (
                          <button
                            onClick={() => setSelectedImage(detection)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                          >
                            <ImageIcon className="h-4 w-4" />
                            <span className="text-xs font-medium">View Image</span>
                          </button>
                        ) : (
                          <span className="text-gray-400 text-sm">No image</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {currentPage * pageSize + 1} to{' '}
                  {Math.min((currentPage + 1) * pageSize, totalDetections)} of{' '}
                  {totalDetections.toLocaleString()} results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-6xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <ScanLine className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Detection #{selectedImage.detection_id}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedImage.client_detection_id || 'No client ID'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              {/* Image */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700 uppercase">Vehicle Image</h4>
                <div className="relative bg-gray-100 rounded-xl overflow-hidden">
                  <img
                    src={`${API_BASE_URL}${selectedImage.image_url}`}
                    alt="Vehicle Detection"
                    className="w-full h-auto object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="%23f3f4f6"/><text x="50%" y="50%" text-anchor="middle" fill="%236b7280">Image not found</text></svg>';
                    }}
                  />
                </div>
              </div>

              {/* Details */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 uppercase">Detection Details</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedImage.status)}</div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Activity</label>
                    <div className="mt-1">
                      {selectedImage.activity_type === 'in' ? (
                        <div className="flex items-center gap-1.5 text-green-600">
                          <ArrowDownCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">IN</span>
                        </div>
                      ) : selectedImage.activity_type === 'out' ? (
                        <div className="flex items-center gap-1.5 text-blue-600">
                          <ArrowUpCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">OUT</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Number Plate</label>
                    <div className="mt-1">
                      {selectedImage.numberplate_available ? (
                        <div className="text-sm text-gray-600">
                          Color: <span className="capitalize">{selectedImage.numberplate_color || 'Unknown'}</span> •
                          Side: <span className="capitalize">{selectedImage.vehicle_side || 'Unknown'}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Not available</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 uppercase">Object Info</label>
                    <div className="mt-1 text-sm text-gray-900">
                      <div>Type: <span className="capitalize">{selectedImage.object_type || 'Unknown'}</span></div>
                      {selectedImage.vehicle_track_id && (
                        <div className="text-xs text-gray-500">Track ID: {selectedImage.vehicle_track_id}</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 uppercase">Camera</label>
                    <div className="mt-1 text-sm text-gray-900">
                      {selectedImage.camera_name || selectedImage.camera_id}
                      <div className="text-xs text-gray-500">ID: {selectedImage.camera_id}</div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 uppercase">Organization</label>
                    <div className="mt-1 text-sm text-gray-900">
                      {selectedImage.organization_name || `Org #${selectedImage.organization_id}`}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 uppercase">Timestamps</label>
                    <div className="mt-1 text-sm text-gray-900 space-y-0.5">
                      {(() => {
                        const clientTime = formatDateTime(selectedImage.detected_at);
                        return clientTime && (
                          <div>
                            <span className="text-gray-500">Client Detected:</span> {clientTime.full}
                          </div>
                        );
                      })()}
                      {(() => {
                        const serverTime = formatDateTime(selectedImage.created_at);
                        return serverTime && (
                          <div>
                            <span className="text-gray-500">Server Received:</span> {serverTime.full}
                          </div>
                        );
                      })()}
                      {(() => {
                        const updatedTime = formatDateTime(selectedImage.updated_at);
                        return updatedTime && (
                          <div className="text-xs text-gray-500">
                            Updated: {updatedTime.full}
                          </div>
                        );
                      })()}
                    </div>
                  </div>


                  {selectedImage.llm_confidence && (
                    <div>
                      <label className="text-xs text-gray-500 uppercase">LLM Confidence</label>
                      <div className="mt-1 text-sm text-gray-600">
                        {selectedImage.llm_confidence}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
