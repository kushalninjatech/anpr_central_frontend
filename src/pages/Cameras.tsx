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

export default function Cameras() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);

  // Fetch organizations for dropdown
  const { data: orgsData } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationApi.getAll(0, 1000),
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
      camera.organization_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      camera.location_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group cameras by organization
  const camerasByOrg = filteredCameras.reduce((acc, camera) => {
    const orgName = camera.organization_name;
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-xl">
              <Camera className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalCameras}</p>
              <p className="text-sm text-gray-500">Total Cameras</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-50 p-3 rounded-xl">
              <Video className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{activeCameras}</p>
              <p className="text-sm text-gray-500">Active Cameras</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="bg-purple-50 p-3 rounded-xl">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalDetections.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Total Detections</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search cameras..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Organization Filter */}
          <div className="relative min-w-[250px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={selectedOrgId || ''}
              onChange={(e) => setSelectedOrgId(e.target.value ? Number(e.target.value) : null)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
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
      </div>

      {/* Cameras List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredCameras.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
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
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
                  >
                    {/* Camera Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-50 p-2.5 rounded-xl">
                          <Camera className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{camera.camera_name}</h3>
                          <p className="text-sm text-gray-500">ID: {camera.camera_id}</p>
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                          camera.is_active
                            ? 'bg-emerald-100 text-emerald-700'
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
                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-purple-500" />
                          <span className="text-sm font-medium text-gray-900">
                            {camera.detection_count.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Detections</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
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
                    <div className="pt-4 border-t border-gray-100">
                      <span className="text-xs text-gray-400">
                        Created {format(new Date(camera.created_at), 'MMM dd, yyyy')}
                      </span>
                    </div>
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
