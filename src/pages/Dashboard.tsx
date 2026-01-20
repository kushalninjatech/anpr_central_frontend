import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi, healthApi, analyticsApi, organizationApi } from '../services/api';
import {
  Building2,
  ScanLine,
  Clock,
  Server,
  Activity,
  Camera,
  TrendingUp,
  Calendar,
  PieChart as PieChartIcon,
} from 'lucide-react';
import PieChart from '../components/charts/PieChart';
import AnimatedCounter from '../components/AnimatedCounter';

export default function Dashboard() {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState<number | ''>('');

  // Get current date range for API calls
  const getDateRangeParams = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (dateRange === 'today') {
      return {
        start: today.toISOString(),
        end: now.toISOString(),
      };
    } else if (dateRange === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return {
        start: weekAgo.toISOString(),
        end: now.toISOString(),
      };
    } else if (dateRange === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return {
        start: monthAgo.toISOString(),
        end: now.toISOString(),
      };
    } else if (dateRange === 'custom' && startDate && endDate) {
      return {
        start: new Date(startDate).toISOString(),
        end: new Date(endDate).toISOString(),
      };
    }
    return { start: today.toISOString(), end: now.toISOString() };
  };

  // Get organizations list for filter
  const { data: orgsData } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationApi.getAll(0, 1000),
  });

  const organizations = orgsData?.data.organizations || [];

  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: () => healthApi.check().then((res) => res.data),
    refetchInterval: 3000,
  });

  const { data: stats, isLoading } = useQuery({
    queryKey: ['system-stats', dateRange],
    queryFn: () => {
      // Map dateRange to backend date_filter
      let filter = 'today';
      if (dateRange === 'week') filter = 'this_week';
      else if (dateRange === 'month') filter = 'this_month';
      else if (dateRange === 'custom') filter = 'all_time'; // For custom, we show all time for now
      return adminApi.getSystemStats(filter).then((res) => res.data);
    },
    refetchInterval: 3000,
  });

  // Analytics queries with org filter
  const { data: hourlyData } = useQuery({
    queryKey: ['analytics-hourly', dateRange, selectedOrgId],
    queryFn: () => {
      const params = getDateRangeParams();
      return analyticsApi.hourly(params.start, params.end, selectedOrgId || undefined).then((res) => res.data);
    },
    refetchInterval: 3000,
  });

  const { data: vehicleTypesData } = useQuery({
    queryKey: ['analytics-vehicle-types', dateRange, selectedOrgId],
    queryFn: () => {
      const params = getDateRangeParams();
      return analyticsApi.vehicleTypes(params.start, params.end, selectedOrgId || undefined).then((res) => res.data);
    },
    refetchInterval: 3000,
  });

  const { data: cameraPerformanceData } = useQuery({
    queryKey: ['analytics-camera-performance', dateRange, selectedOrgId],
    queryFn: () => {
      const params = getDateRangeParams();
      return analyticsApi.cameraPerformance(params.start, params.end, selectedOrgId || undefined, 10).then((res) => res.data);
    },
    refetchInterval: 3000,
  });

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Get last 5 hours data (current hour + previous 4 hours) in descending order
  const last5HoursData = useMemo(() => {
    if (!hourlyData || hourlyData.length === 0) return [];

    const now = new Date();
    const last5Hours = [];

    // Start from current hour (i=0) to 4 hours ago (i=4) - descending order
    for (let i = 0; i <= 4; i++) {
      const targetTime = new Date(now.getTime() - i * 60 * 60 * 1000); // Subtract i hours
      const utcHour = targetTime.getUTCHours();
      const localHour = targetTime.getHours();

      const hourData = hourlyData.find((h: any) => h.hour === utcHour);

      // Format time as 12:00 PM, 11:00 AM, etc.
      const period = localHour >= 12 ? 'PM' : 'AM';
      const displayHour = localHour === 0 ? 12 : localHour > 12 ? localHour - 12 : localHour;
      const timeLabel = `${displayHour}:00 ${period}`;

      last5Hours.push({
        hour: utcHour,
        timeLabel,
        total: hourData?.total || 0,
        in_count: hourData?.in_count || 0,
        out_count: hourData?.out_count || 0,
        isCurrent: i === 0, // Mark the current hour
      });
    }

    return last5Hours;
  }, [hourlyData]);

  const vehicleColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Header with Date Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Central Object Detection Server - Analytics & Insights</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Organization Filter */}
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200">
            <Building2 className="h-4 w-4 text-gray-400" />
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value ? parseInt(e.target.value) : '')}
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

          {/* Date Range Filter */}
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200">
            <Calendar className="h-4 w-4 text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="border-none bg-transparent text-sm font-medium text-gray-700 focus:outline-none focus:ring-0"
            >
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {dateRange === 'custom' && (
            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Stats Grid - First Row: Organizations */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-2">Total Organizations</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-bold text-gray-900">{stats?.total_organizations || 0}</h3>
                    <span className="text-sm text-gray-500">
                      ({stats?.active_organizations || 0} active)
                    </span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-2">Total Cameras</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-bold text-gray-900">{stats?.total_cameras || 0}</h3>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-3 rounded-xl shadow-lg">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Second Row: Detections and Activity */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-2">Total Detections</p>
                  <h3 className="text-3xl font-bold text-gray-900">
                    <AnimatedCounter value={stats?.total_detections || 0} duration={800} />
                  </h3>
                </div>
                <div className="bg-gradient-to-br from-violet-500 to-violet-600 p-3 rounded-xl shadow-lg">
                  <ScanLine className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-2">Total In</p>
                  <h3 className="text-3xl font-bold text-gray-900">{stats?.total_in || 0}</h3>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-2">Total Out</p>
                  <h3 className="text-3xl font-bold text-gray-900">{stats?.total_out || 0}</h3>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
                  <Activity className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-2">Active Occupancy</p>
                  <h3 className="text-3xl font-bold text-gray-900">{stats?.active_occupancy || 0}</h3>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl shadow-lg">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Hourly Analytics - Table Format */}
          {last5HoursData && last5HoursData.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-50 p-2 rounded-xl">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Hourly Activity (Last 5 Hours)</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Hour
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <span className="inline-flex items-center gap-1">
                          <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                          In
                        </span>
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <span className="inline-flex items-center gap-1">
                          <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                          Out
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {last5HoursData.map((hourData: any) => (
                      <tr
                        key={hourData.hour}
                        className={`${
                          hourData.isCurrent
                            ? 'bg-indigo-50 border-l-4 border-indigo-500'
                            : 'hover:bg-gray-50'
                        } transition-colors`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className={`font-medium ${
                              hourData.isCurrent ? 'text-indigo-700' : 'text-gray-900'
                            }`}>
                              {hourData.timeLabel}
                            </span>
                            {hourData.isCurrent && (
                              <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-700 rounded-full">
                                Current
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-lg font-bold text-gray-900">
                            {hourData.total.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-lg font-bold text-green-600">
                            {hourData.in_count.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-lg font-bold text-blue-600">
                            {hourData.out_count.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Two-column layout for Vehicle Types and Camera Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vehicle Type Distribution */}
            {vehicleTypesData && vehicleTypesData.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-orange-50 p-2 rounded-xl">
                    <PieChartIcon className="h-5 w-5 text-orange-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Vehicle Type Distribution</h2>
                </div>
                <PieChart
                  data={vehicleTypesData}
                  nameKey="vehicle_type"
                  valueKey="count"
                  colors={vehicleColors}
                  height={350}
                />
              </div>
            )}

            {/* Top Cameras Performance */}
            {cameraPerformanceData && cameraPerformanceData.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-amber-50 p-2 rounded-xl">
                    <Camera className="h-5 w-5 text-amber-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Top 10 Cameras by Activity</h2>
                </div>
                <div className="space-y-3 max-h-[350px] overflow-y-auto">
                  {cameraPerformanceData.map((camera: any, index: number) => (
                    <div key={camera.camera_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-lg font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{camera.camera_name}</p>
                          <p className="text-xs text-gray-500">ID: {camera.camera_id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{camera.total.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">detections</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* System Health */}
          {health && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-emerald-50 p-2 rounded-xl">
                  <Server className="h-5 w-5 text-emerald-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">System Health</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <p className="text-lg font-semibold text-green-600 capitalize">{health.status}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Uptime</p>
                  <p className="text-lg font-semibold text-gray-900">{formatUptime(health.uptime_seconds)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">CPU Usage</p>
                  <p className="text-lg font-semibold text-gray-900">{health.cpu_usage.toFixed(1)}%</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">RAM Usage</p>
                  <p className="text-lg font-semibold text-gray-900">{health.ram_usage.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
