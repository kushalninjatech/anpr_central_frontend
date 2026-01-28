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
  TrendingDown,
  Calendar,
  Users,
} from 'lucide-react';
import PieChart from '../components/charts/PieChart';
import AnimatedCounter from '../components/AnimatedCounter';
import StatCard from '../components/StatCard';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge from '../components/Badge';

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Central Object Detection Server - Analytics & Insights
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Organization Filter */}
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm">
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
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm">
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
              className="input !w-auto !py-2"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input !w-auto !py-2"
            />
          </div>
        )}
      </div>

      {/* Stats Grid - First Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          title="Total Organizations"
          value={stats?.total_organizations || 0}
          icon={Building2}
          color="blue"
          change={`${stats?.active_organizations || 0} active`}
          changeType="neutral"
        />
        <StatCard
          title="Total Cameras"
          value={stats?.total_cameras || 0}
          icon={Camera}
          color="yellow"
          change="Across all organizations"
          changeType="neutral"
        />
      </div>

      {/* Stats Grid - Second Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Detections"
          value={<AnimatedCounter value={stats?.total_detections || 0} duration={800} />}
          icon={ScanLine}
          color="purple"
          change="All time"
          changeType="neutral"
        />
        <StatCard
          title="Total IN"
          value={stats?.total_in || 0}
          icon={TrendingUp}
          color="green"
          change="Objects moving in"
          changeType="increase"
        />
        <StatCard
          title="Total OUT"
          value={stats?.total_out || 0}
          icon={TrendingDown}
          color="blue"
          change="Objects moving out"
          changeType="neutral"
        />
        <StatCard
          title="Active Occupancy"
          value={stats?.active_occupancy || 0}
          icon={Users}
          color="purple"
          change="Currently inside"
          changeType="neutral"
        />
      </div>

      {/* Hourly Analytics Table */}
      {last5HoursData && last5HoursData.length > 0 && (
        <Card title="Hourly Activity" subtitle="Last 5 hours detection trend">
          <div className="overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Hour</th>
                  <th className="text-center">Total</th>
                  <th className="text-center">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      In
                    </span>
                  </th>
                  <th className="text-center">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      Out
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {last5HoursData.map((hourData: any) => (
                  <tr
                    key={hourData.hour}
                    className={hourData.isCurrent ? '!bg-primary-50/50 border-l-4 border-primary-500' : ''}
                  >
                    <td>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className={`font-medium ${hourData.isCurrent ? 'text-primary-700' : 'text-gray-900'}`}>
                          {hourData.timeLabel}
                        </span>
                        {hourData.isCurrent && (
                          <Badge variant="info" size="sm">Current</Badge>
                        )}
                      </div>
                    </td>
                    <td className="text-center">
                      <span className="text-lg font-bold text-gray-900">
                        {hourData.total.toLocaleString()}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="text-lg font-bold text-green-600">
                        {hourData.in_count.toLocaleString()}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="text-lg font-bold text-blue-600">
                        {hourData.out_count.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Two-column layout for Vehicle Types and Camera Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicle Type Distribution */}
        {vehicleTypesData && vehicleTypesData.length > 0 && (
          <Card title="Vehicle Type Distribution" subtitle="Detection breakdown by vehicle type">
            <PieChart
              data={vehicleTypesData}
              nameKey="vehicle_type"
              valueKey="count"
              colors={vehicleColors}
              height={350}
            />
          </Card>
        )}

        {/* Top Cameras Performance */}
        {cameraPerformanceData && cameraPerformanceData.length > 0 && (
          <Card title="Top 10 Cameras" subtitle="Ranked by detection activity">
            <div className="space-y-3 max-h-[350px] overflow-y-auto">
              {cameraPerformanceData.map((camera: any, index: number) => (
                <div
                  key={camera.camera_id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-100 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-primary-500 to-purple-500 text-white rounded-lg font-bold text-sm shadow-lg">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{camera.camera_name}</p>
                      <p className="text-xs text-gray-500">ID: {camera.camera_id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">{camera.total.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">detections</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* System Health */}
      {health && (
        <Card title="System Health" subtitle="Server status and resource usage">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-100">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-emerald-600" />
                <p className="text-sm font-medium text-gray-600">Status</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="text-lg font-bold text-emerald-600 capitalize">{health.status}</p>
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-medium text-gray-600">Uptime</p>
              </div>
              <p className="text-lg font-bold text-blue-600">{formatUptime(health.uptime_seconds)}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100">
              <div className="flex items-center gap-2 mb-2">
                <Server className="h-4 w-4 text-amber-600" />
                <p className="text-sm font-medium text-gray-600">CPU Usage</p>
              </div>
              <p className="text-lg font-bold text-amber-600">{health.cpu_usage.toFixed(1)}%</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-purple-600" />
                <p className="text-sm font-medium text-gray-600">RAM Usage</p>
              </div>
              <p className="text-lg font-bold text-purple-600">{health.ram_usage.toFixed(1)}%</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
