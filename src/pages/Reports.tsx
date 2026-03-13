import { useState, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { format, parseISO } from 'date-fns';
import {
  Building2,
  Camera as CameraIcon,
  Calendar,
  Download,
  Filter,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  X,
  ScanLine,
  Car,
  CheckCircle,
  XCircle,
  AlertCircle,
  RotateCcw,
  TrendingUp,
  BarChart3,
  Search,
} from 'lucide-react';
import { organizationApi, cameraApi, detectionApi, analyticsApi, API_BASE_URL } from '../services/api';
import type { ProcessingStatus, Detection } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
import StatCard from '../components/StatCard';
import Card from '../components/Card';
import BarChart from '../components/charts/BarChart';
import PieChart from '../components/charts/PieChart';

export default function Reports() {
  const [dateFilter, setDateFilter] = useState<string>('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<number | ''>('');
  const [selectedCamera, setSelectedCamera] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<ProcessingStatus | ''>('');
  const [plateSearch, setPlateSearch] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  const { data: orgsData } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationApi.getAll(1, 1000),
  });

  const { data: camerasData } = useQuery({
    queryKey: ['cameras', selectedOrg],
    queryFn: () => cameraApi.getAll(1, 1000, selectedOrg as number),
    enabled: !!selectedOrg,
  });

  const organizations = orgsData?.data.organizations || [];
  const cameras = camerasData?.data.cameras || [];
  const [previewPage, setPreviewPage] = useState(0);
  const previewPageSize = 10;

  // Build date range for preview query
  const getPreviewDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (dateFilter === 'today') {
      return { start: today.toISOString(), end: now.toISOString() };
    } else if (dateFilter === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { start: yesterday.toISOString(), end: today.toISOString() };
    } else if (dateFilter === 'this_week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return { start: weekAgo.toISOString(), end: now.toISOString() };
    } else if (dateFilter === 'this_month') {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return { start: monthAgo.toISOString(), end: now.toISOString() };
    } else if (dateFilter === 'custom' && startDate && endDate) {
      return { start: new Date(startDate).toISOString(), end: new Date(endDate + 'T23:59:59').toISOString() };
    }
    return { start: today.toISOString(), end: now.toISOString() };
  };

  const { data: previewData, isLoading: isPreviewLoading } = useQuery({
    queryKey: ['report-preview', dateFilter, startDate, endDate, selectedOrg, selectedCamera, selectedActivity, selectedStatus, plateSearch, previewPage],
    queryFn: () => {
      const page = previewPage + 1;
      const range = getPreviewDateRange();
      return detectionApi.getAll(
        page,
        previewPageSize,
        selectedStatus || undefined,
        selectedCamera || undefined,
        selectedOrg || undefined,
        range.start,
        range.end,
        selectedActivity || undefined,
        plateSearch || undefined
      );
    },
    enabled: dateFilter !== 'custom' || (!!startDate && !!endDate),
  });

  const previewDetections = previewData?.data.detections || [];
  const totalPreview = previewData?.data.total || 0;
  const totalPreviewPages = Math.ceil(totalPreview / previewPageSize);

  // Analytics queries for charts
  const dateRange = getPreviewDateRange();

  const { data: dailyData } = useQuery({
    queryKey: ['report-daily', dateFilter, startDate, endDate, selectedOrg, selectedCamera, selectedActivity, selectedStatus, plateSearch],
    queryFn: () => {
      const days = dateFilter === 'today' || dateFilter === 'yesterday' ? 7 : dateFilter === 'this_week' ? 7 : 30;
      if (dateFilter === 'custom' && startDate && endDate) {
        return analyticsApi.daily(365, selectedOrg || undefined, new Date(startDate).toISOString(), new Date(endDate + 'T23:59:59').toISOString(), selectedCamera || undefined, selectedActivity || undefined, selectedStatus || undefined, plateSearch || undefined).then(r => r.data);
      }
      return analyticsApi.daily(days, selectedOrg || undefined, undefined, undefined, selectedCamera || undefined, selectedActivity || undefined, selectedStatus || undefined, plateSearch || undefined).then(r => r.data);
    },
    enabled: dateFilter !== 'custom' || (!!startDate && !!endDate),
  });

  const { data: vehicleTypesData } = useQuery({
    queryKey: ['report-vehicle-types', dateFilter, startDate, endDate, selectedOrg, selectedCamera, selectedActivity, selectedStatus, plateSearch],
    queryFn: () => analyticsApi.vehicleTypes(dateRange.start, dateRange.end, selectedOrg || undefined, selectedCamera || undefined, selectedActivity || undefined, selectedStatus || undefined, plateSearch || undefined).then(r => r.data),
    enabled: dateFilter !== 'custom' || (!!startDate && !!endDate),
  });

  const { data: hourlyData } = useQuery({
    queryKey: ['report-hourly', dateFilter, startDate, endDate, selectedOrg, selectedCamera, selectedActivity, selectedStatus, plateSearch],
    queryFn: () => analyticsApi.hourly(dateRange.start, dateRange.end, selectedOrg || undefined, selectedCamera || undefined, selectedActivity || undefined, selectedStatus || undefined, plateSearch || undefined).then(r => r.data),
    enabled: dateFilter === 'today',
  });

  const { data: cameraPerformanceData } = useQuery({
    queryKey: ['report-camera-performance', dateFilter, startDate, endDate, selectedOrg, selectedCamera, selectedActivity, selectedStatus, plateSearch],
    queryFn: () => analyticsApi.cameraPerformance(dateRange.start, dateRange.end, selectedOrg || undefined, 10, selectedCamera || undefined, selectedActivity || undefined, selectedStatus || undefined, plateSearch || undefined).then(r => r.data),
    enabled: dateFilter !== 'custom' || (!!startDate && !!endDate),
  });

  // Prepare bar chart data
  const barChartData = useMemo(() => {
    if (dateFilter === 'today' && hourlyData) {
      return hourlyData
        .map((h: any) => {
          // Convert UTC hour to local
          const d = new Date();
          d.setUTCHours(h.hour, 0, 0, 0);
          const localHour = d.getHours();
          const period = localHour >= 12 ? 'PM' : 'AM';
          const displayHour = localHour === 0 ? 12 : localHour > 12 ? localHour - 12 : localHour;
          return { label: `${displayHour} ${period}`, IN: h.in_count || 0, OUT: h.out_count || 0, Total: h.total || 0 };
        })
        .slice(-12);
    }
    if (dailyData && dailyData.length > 0) {
      return [...dailyData]
        .sort((a: any, b: any) => a.date.localeCompare(b.date))
        .slice(-14)
        .map((d: any) => ({
          label: format(parseISO(d.date), 'dd MMM'),
          IN: d.in_count || 0,
          OUT: d.out_count || 0,
          Total: d.total || 0,
        }));
    }
    return [];
  }, [dailyData, hourlyData, dateFilter]);

  // Summary stats from daily data
  const summaryStats = useMemo(() => {
    const data = dailyData || [];
    let totalIn = 0, totalOut = 0, totalDetections = 0, successCount = 0;
    data.forEach((d: any) => {
      totalIn += d.in_count || 0;
      totalOut += d.out_count || 0;
      totalDetections += d.total || 0;
      successCount += d.success || 0;
    });
    const successRate = totalDetections > 0 ? Math.round((successCount / totalDetections) * 100) : 0;
    return { totalDetections, totalIn, totalOut, successRate };
  }, [dailyData]);

  const vehicleColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const formatDetectionTime = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    const date = parseISO(dateString);
    return { time: format(date, 'HH:mm:ss'), date: format(date, 'dd-MM-yyyy') };
  };

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
    if (!Icon) return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">{status}</span>;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${styles[status]}`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

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
      if (selectedStatus) params.append('status_filter', selectedStatus);
      if (plateSearch) params.append('plate', plateSearch);

      // Get user's timezone offset in minutes (negative of getTimezoneOffset)
      // getTimezoneOffset returns minutes BEHIND UTC, so we need to negate it
      // e.g., IST is UTC+5:30, getTimezoneOffset returns -330, so we negate to get 330
      const timezoneOffset = -new Date().getTimezoneOffset();
      params.append('timezone_offset', timezoneOffset.toString());

      // Fetch the CSV with auth token
      const token = localStorage.getItem('api_token');
      const response = await fetch(
        `${API_BASE_URL}/api/v1/anpr/reports/export?${params.toString()}`,
        {
          headers: token ? { 'X-API-Token': token } : {},
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to export report: ${response.status} ${response.statusText}`);
      }

      // Download the file
      const blob = await response.blob();

      if (blob.size === 0) {
        toast.warning('No data to export. The report is empty.');
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

      toast.success('Report exported successfully!');
    } catch (error) {
      toast.error(`Failed to export report: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Date Range */}
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm">
          <Calendar className="h-4 w-4 text-gray-400" />
          <select
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setPreviewPage(0); }}
            className="border-none bg-transparent text-sm font-medium text-gray-700 focus:outline-none focus:ring-0"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {/* Custom Date Pickers */}
        {dateFilter === 'custom' && (
          <>
            <div
              className="relative flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm cursor-pointer"
              onClick={() => startDateRef.current?.showPicker()}
            >
              <input
                ref={startDateRef}
                type="date"
                value={startDate}
                max={format(new Date(), 'yyyy-MM-dd')}
                onChange={(e) => { setStartDate(e.target.value); setPreviewPage(0); }}
                className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
              />
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className={`text-sm font-medium ${startDate ? 'text-gray-700' : 'text-gray-400'}`}>
                {startDate ? format(new Date(startDate), 'dd-MM-yyyy') : 'Start Date'}
              </span>
            </div>

            <span className="text-xs font-medium text-gray-400">to</span>

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
                onChange={(e) => { setEndDate(e.target.value); setPreviewPage(0); }}
                className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
              />
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className={`text-sm font-medium ${endDate ? 'text-gray-700' : 'text-gray-400'}`}>
                {endDate ? format(new Date(endDate), 'dd-MM-yyyy') : 'End Date'}
              </span>
            </div>
          </>
        )}

        <div className="h-6 w-px bg-gray-200" />

        {/* Organization */}
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm">
          <Building2 className="h-4 w-4 text-gray-400" />
          <select
            value={selectedOrg}
            onChange={(e) => { setSelectedOrg(e.target.value ? parseInt(e.target.value) : ''); setSelectedCamera(''); setPreviewPage(0); }}
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

        {/* Camera */}
        <div className={`flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm ${!selectedOrg ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <CameraIcon className="h-4 w-4 text-gray-400" />
          <select
            value={selectedCamera}
            onChange={(e) => { setSelectedCamera(e.target.value); setPreviewPage(0); }}
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

        {/* Status Filter */}
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value as ProcessingStatus | ''); setPreviewPage(0); }}
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

        {/* Activity Type */}
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={selectedActivity}
            onChange={(e) => { setSelectedActivity(e.target.value); setPreviewPage(0); }}
            className="border-none bg-transparent text-sm font-medium text-gray-700 focus:outline-none focus:ring-0"
          >
            <option value="">All Activities</option>
            <option value="in">IN</option>
            <option value="out">OUT</option>
          </select>
        </div>

        {/* Numberplate Search */}
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search Plate..."
            value={plateSearch}
            onChange={(e) => { setPlateSearch(e.target.value); setPreviewPage(0); }}
            className="border-none bg-transparent text-sm font-medium text-gray-700 focus:outline-none focus:ring-0 w-28 placeholder:text-gray-400"
          />
        </div>

        {/* Clear All */}
        {(selectedOrg || selectedCamera || selectedActivity || selectedStatus || plateSearch || dateFilter !== 'today' || startDate || endDate) && (
          <button
            onClick={() => {
              setDateFilter('today');
              setStartDate('');
              setEndDate('');
              setSelectedOrg('');
              setSelectedCamera('');
              setSelectedActivity('');
              setSelectedStatus('');
              setPlateSearch('');
              setPreviewPage(0);
            }}
            className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            title="Reset all filters"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Export Button */}
        <div className="ml-auto">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="btn btn-primary flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <LoadingSpinner size="sm" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export CSV
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Records"
          value={totalPreview.toLocaleString()}
          icon={ScanLine}
          color="purple"
          change="Filtered results"
          changeType="neutral"
        />
        <StatCard
          title="Success Rate"
          value={`${summaryStats.successRate}%`}
          icon={CheckCircle}
          color="green"
          change={`${summaryStats.successRate >= 90 ? 'Healthy' : 'Needs attention'}`}
          changeType={summaryStats.successRate >= 90 ? 'increase' : 'decrease'}
        />
        <StatCard
          title="Total IN"
          value={summaryStats.totalIn.toLocaleString()}
          icon={ArrowDownCircle}
          color="green"
          change="Objects moving in"
          changeType="increase"
        />
        <StatCard
          title="Total OUT"
          value={summaryStats.totalOut.toLocaleString()}
          icon={ArrowUpCircle}
          color="blue"
          change="Objects moving out"
          changeType="neutral"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detection Trend Bar Chart */}
        <div className="lg:col-span-2">
          <Card
            title={dateFilter === 'today' ? 'Hourly Detection Trend' : 'Daily Detection Trend'}
            subtitle="IN vs OUT activity over time"
          >
            {barChartData.length > 0 ? (
              <BarChart
                data={barChartData}
                xKey="label"
                bars={[
                  { key: 'IN', name: 'IN', color: '#10b981' },
                  { key: 'OUT', name: 'OUT', color: '#3b82f6' },
                ]}
                height={280}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-[280px] text-center">
                <BarChart3 className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No trend data available</p>
                <p className="text-sm text-gray-400 mt-1">Adjust filters to see detection trends</p>
              </div>
            )}
          </Card>
        </div>

        {/* Vehicle Type Pie Chart */}
        <Card
          title="Vehicle Types"
          subtitle="Detection breakdown by vehicle"
        >
          {vehicleTypesData && vehicleTypesData.length > 0 ? (
            <PieChart
              data={vehicleTypesData}
              nameKey="vehicle_type"
              valueKey="count"
              colors={vehicleColors}
              height={280}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-[280px] text-center">
              <Car className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No vehicle data</p>
              <p className="text-sm text-gray-400 mt-1">No vehicle types found for this period</p>
            </div>
          )}
        </Card>
      </div>

      {/* Camera Performance */}
      {cameraPerformanceData && cameraPerformanceData.length > 0 && (
        <Card
          title="Top Cameras by Detections"
          subtitle="Camera performance breakdown"
        >
          <BarChart
            data={cameraPerformanceData.map((c: any) => ({
              label: c.camera_name || c.camera_id,
              Success: c.success || 0,
              Failed: c.failed || 0,
            }))}
            xKey="label"
            bars={[
              { key: 'Success', name: 'Success', color: '#10b981' },
              { key: 'Failed', name: 'Failed', color: '#ef4444' },
            ]}
            height={280}
          />
        </Card>
      )}

      {/* Data Preview */}
      <Card
        title="Data Preview"
        subtitle={totalPreview > 0 ? `${totalPreview.toLocaleString()} records found` : undefined}
        noPadding
      >
        {dateFilter === 'custom' && (!startDate || !endDate) ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Select a date range</p>
            <p className="text-sm text-gray-400 mt-1">Please select both start and end dates to preview data</p>
          </div>
        ) : isPreviewLoading ? (
          <div className="flex items-center justify-center h-48">
            <LoadingSpinner size="lg" text="Loading preview..." />
          </div>
        ) : previewDetections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ScanLine className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No detections found</p>
            <p className="text-sm text-gray-400 mt-1">No data matches the selected filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Vehicle</th>
                    <th>Numberplate</th>
                    <th>Camera</th>
                    <th>Organization</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {previewDetections.map((d: Detection) => (
                    <tr key={d.detection_id}>
                      <td>
                        <span className="font-semibold text-gray-900 text-sm">#{d.detection_id}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Car className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-sm text-gray-700 capitalize">{d.object_type || '—'}</span>
                          <span className="text-gray-300">|</span>
                          {d.activity_type === 'in' ? (
                            <span className="badge badge-success text-xs">
                              <ArrowDownCircle className="h-3 w-3" /> IN
                            </span>
                          ) : d.activity_type === 'out' ? (
                            <span className="badge badge-info text-xs">
                              <ArrowUpCircle className="h-3 w-3" /> OUT
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </div>
                      </td>
                      <td>
                        {d.numberplate_text ? (
                          <span className="font-mono text-sm font-bold text-gray-900 bg-yellow-50 px-2.5 py-0.5 rounded border border-yellow-200 tracking-wide">
                            {d.numberplate_text}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-sm">—</span>
                        )}
                      </td>
                      <td>
                        <span className="text-sm text-gray-700">{d.camera_name || d.camera_id}</span>
                      </td>
                      <td>
                        <span className="text-sm text-gray-700">{d.organization_name || `Org #${d.organization_id}`}</span>
                      </td>
                      <td>
                        {getStatusBadge(d.status)}
                      </td>
                      <td>
                        {(() => {
                          const t = formatDetectionTime(d.detected_at || d.created_at);
                          return t ? (
                            <div>
                              <span className="text-sm text-gray-800 font-medium">{t.time}</span>
                              <span className="text-[11px] text-gray-400 ml-1.5">{t.date}</span>
                            </div>
                          ) : <span className="text-gray-300 text-sm">—</span>;
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-100">
              <Pagination
                currentPage={previewPage}
                totalPages={totalPreviewPages}
                totalItems={totalPreview}
                pageSize={previewPageSize}
                onPageChange={setPreviewPage}
                label="detections"
              />
            </div>
          </>
        )}
      </Card>

    </div>
  );
}
