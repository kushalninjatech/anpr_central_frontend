import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Camera,
  Search,
  Building2,
  MapPin,
  Activity,
  Video,
  Clock,
  Filter
} from 'lucide-react';
import { cameraApi, organizationApi } from '../services/api';
import type { Camera as CameraType } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import StatCard from '../components/StatCard';

export default function Cameras() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);

  // Fetch organizations for dropdown
  const { data: orgsData } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationApi.getAll(1, 1000),
  });

  // Fetch cameras with optional organization filter
  const { data: camerasData, isLoading } = useQuery({
    queryKey: ['cameras', selectedOrgId],
    queryFn: () => cameraApi.getAll(0, 1000, selectedOrgId || undefined),
  });

  const organizations = orgsData?.data.organizations || [];
  const cameras = camerasData?.data.cameras || [];

  // Filter cameras by search query
  const filteredCameras = cameras.filter(
    (camera) =>
      camera.camera_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (camera.organization_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (camera.location_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group cameras by organization
  const camerasByOrg = filteredCameras.reduce((acc, camera) => {
    const orgName = camera.organization_name || 'Unknown';
    if (!acc[orgName]) {
      acc[orgName] = [];
    }
    acc[orgName].push(camera);
    return acc;
  }, {} as Record<string, CameraType[]>);

  // Stats
  const totalCameras = cameras.length;
  const activeCameras = cameras.filter(c => c.is_active).length;
  const totalDetections = cameras.reduce((sum, c) => sum + c.detection_count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cameras</h1>
          <p className="text-gray-500 mt-1">View cameras across all organizations</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Cameras"
          value={totalCameras}
          icon={Camera}
          color="blue"
          change="All registered cameras"
          changeType="neutral"
        />
        <StatCard
          title="Active Cameras"
          value={activeCameras}
          icon={Video}
          color="green"
          change={`${totalCameras > 0 ? Math.round((activeCameras / totalCameras) * 100) : 0}% online`}
          changeType="increase"
        />
        <StatCard
          title="Total Detections"
          value={totalDetections.toLocaleString()}
          icon={Activity}
          color="purple"
          change="Across all cameras"
          changeType="neutral"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search cameras..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={selectedOrgId || ''}
            onChange={(e) => setSelectedOrgId(e.target.value ? Number(e.target.value) : null)}
            className="border-none bg-transparent text-sm font-medium text-gray-700 focus:outline-none focus:ring-0 min-w-[180px]"
          >
            <option value="">All Organizations</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cameras List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" text="Loading cameras..." />
        </div>
      ) : filteredCameras.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 border border-white/50 p-12 text-center">
          <Camera className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No cameras found</h3>
          <p className="text-gray-500">
            {searchQuery || selectedOrgId
              ? 'Try adjusting your filters'
              : 'No cameras have been registered yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(camerasByOrg).map(([orgName, orgCameras]) => (
            <div key={orgName} className="space-y-4">
              {/* Organization Header */}
              <div className="flex items-center gap-3">
                <div className="bg-indigo-50 p-2 rounded-lg">
                  <Building2 className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{orgName}</h2>
                <span className="text-sm text-gray-500">({orgCameras.length} cameras)</span>
              </div>

              {/* Camera Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orgCameras.map((camera) => (
                  <div
                    key={camera.id}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl border border-white/50 p-6 transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Camera Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl shadow-lg">
                          <Camera className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{camera.camera_name}</h3>
                          <p className="text-sm text-gray-500">ID: {camera.camera_id}</p>
                        </div>
                      </div>
                      <span
                        className={`badge ${
                          camera.is_active
                            ? 'badge-success'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {camera.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Camera Details */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{camera.location_name}</span>
                      </div>

                      {camera.stream_url && (
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <Video className="h-4 w-4 text-gray-400 mt-0.5" />
                          <span className="truncate font-mono text-xs bg-gray-50 px-2 py-1 rounded">
                            {camera.stream_url}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-3 border border-purple-100">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-purple-500" />
                          <span className="text-sm font-medium text-gray-900">
                            {camera.detection_count.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Detections</p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-100">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium text-gray-900">
                            {camera.last_detection
                              ? format(new Date(camera.last_detection), 'MMM dd')
                              : 'Never'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Last Detection</p>
                      </div>
                    </div>

                    {/* Footer */}
                    {camera.created_at && (
                      <div className="pt-4 border-t border-gray-100">
                        <span className="text-xs text-gray-400">
                          Created {format(new Date(camera.created_at), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
