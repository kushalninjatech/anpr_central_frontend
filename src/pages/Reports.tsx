import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  FileDown,
  Building2,
  Camera as CameraIcon,
  Calendar,
  Download,
  Filter,
  FileSpreadsheet,
} from 'lucide-react';
import { organizationApi } from '../services/api';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8010';

export default function Reports() {
  const [dateFilter, setDateFilter] = useState<string>('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<number | ''>('');
  const [selectedCamera, setSelectedCamera] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  const { data: orgsData } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationApi.getAll(0, 1000),
  });

  const organizations = orgsData?.data.organizations || [];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Build query params
      const params = new URLSearchParams();

      if (dateFilter && dateFilter !== 'custom') {
        params.append('date_filter', dateFilter);
      }

      if (dateFilter === 'custom') {
        params.append('date_filter', 'custom');
        if (startDate) params.append('start_date', new Date(startDate).toISOString());
        if (endDate) params.append('end_date', new Date(endDate).toISOString());
      }

      if (selectedOrg) params.append('organization_id', selectedOrg.toString());
      if (selectedCamera) params.append('camera_id', selectedCamera);
      if (selectedActivity) params.append('activity_type', selectedActivity);

      // Get user's timezone offset in minutes (negative of getTimezoneOffset)
      // getTimezoneOffset returns minutes BEHIND UTC, so we need to negate it
      // e.g., IST is UTC+5:30, getTimezoneOffset returns -330, so we negate to get 330
      const timezoneOffset = -new Date().getTimezoneOffset();
      params.append('timezone_offset', timezoneOffset.toString());

      console.log('Export request URL:', `${API_BASE_URL}/api/v1/anpr/reports/export?${params.toString()}`);
      console.log('Timezone offset (minutes from UTC):', timezoneOffset);

      // Fetch the CSV
      const response = await fetch(
        `${API_BASE_URL}/api/v1/anpr/reports/export?${params.toString()}`
      );

      console.log('Export response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Export error response:', errorText);
        throw new Error(`Failed to export report: ${response.status} ${response.statusText}`);
      }

      // Download the file
      const blob = await response.blob();
      console.log('Export blob size:', blob.size);

      if (blob.size === 0) {
        alert('No data to export. The report is empty.');
        return;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `detections_report_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log('Export completed successfully');
      alert('Report exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Failed to export report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Detection Reports</h1>
        <p className="text-gray-500 mt-1">Export detection data with flexible filters</p>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Filter className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Report Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Date Range
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Range */}
          {dateFilter === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </>
          )}

          {/* Organization Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building2 className="inline h-4 w-4 mr-1" />
              Organization
            </label>
            <select
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value ? parseInt(e.target.value) : '')}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Organizations</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          {/* Camera Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CameraIcon className="inline h-4 w-4 mr-1" />
              Camera ID
            </label>
            <input
              type="text"
              placeholder="Enter camera ID"
              value={selectedCamera}
              onChange={(e) => setSelectedCamera(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Activity Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Activity Type
            </label>
            <select
              value={selectedActivity}
              onChange={(e) => setSelectedActivity(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Activities</option>
              <option value="in">IN</option>
              <option value="out">OUT</option>
            </select>
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-sm border border-indigo-100 p-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileSpreadsheet className="h-6 w-6 text-indigo-600" />
              <h3 className="text-xl font-semibold text-gray-900">Export Report</h3>
            </div>
            <p className="text-gray-600">
              Download filtered detection data as CSV file
            </p>
            <div className="mt-4 text-sm text-gray-500 space-y-1">
              <p>• Includes: Detection ID, Organization, Camera, Object Type, Activity, Times, Status, Image URL</p>
              <p>• Format: CSV (Excel compatible)</p>
              <p>• Applied filters: {getFilterSummary(dateFilter, selectedOrg, selectedCamera, selectedActivity, organizations)}</p>
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                Export CSV
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 rounded-2xl border border-blue-100 p-6">
        <div className="flex gap-4">
          <FileDown className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Report Information</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Reports include all detection data: timestamps, organization, camera, object type, activity, and status</li>
              <li>• Image URLs are included so you can access detection images</li>
              <li>• CSV files can be opened in Excel, Google Sheets, or any spreadsheet application</li>
              <li>• Apply filters to narrow down the data you want to export</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function getFilterSummary(
  dateFilter: string,
  orgId: number | '',
  cameraId: string,
  activity: string,
  organizations: any[]
): string {
  const filters: string[] = [];

  if (dateFilter === 'today') filters.push('Today');
  else if (dateFilter === 'yesterday') filters.push('Yesterday');
  else if (dateFilter === 'this_week') filters.push('This Week');
  else if (dateFilter === 'this_month') filters.push('This Month');
  else if (dateFilter === 'custom') filters.push('Custom Date Range');

  if (orgId) {
    const org = organizations.find(o => o.id === orgId);
    filters.push(org ? org.name : `Org #${orgId}`);
  }

  if (cameraId) filters.push(`Camera: ${cameraId}`);
  if (activity) filters.push(`Activity: ${activity.toUpperCase()}`);

  return filters.length > 0 ? filters.join(', ') : 'None';
}
