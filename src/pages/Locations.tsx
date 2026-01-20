import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  MapPin,
  Plus,
  Search,
  Edit2,
  Trash2,
  Building2,
  Globe,
  Filter
} from 'lucide-react';
import { locationApi, organizationApi } from '../services/api';
import LocationModal from '../components/LocationModal';
import ConfirmModal from '../components/ConfirmModal';
import type { Location, LocationCreate, LocationUpdate } from '../types';

export default function Locations() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<number | ''>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const { data: locationsData, isLoading } = useQuery({
    queryKey: ['locations', selectedOrgFilter],
    queryFn: () => locationApi.getAll(0, 1000, selectedOrgFilter || undefined),
  });

  const { data: orgsData } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationApi.getAll(0, 1000),
  });

  const createMutation = useMutation({
    mutationFn: (data: LocationCreate) => locationApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setIsModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: LocationUpdate }) =>
      locationApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setIsModalOpen(false);
      setSelectedLocation(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => locationApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setIsDeleteModalOpen(false);
      setSelectedLocation(null);
    },
  });

  const locations = locationsData?.data.locations || [];
  const organizations = orgsData?.data.organizations || [];

  const filteredLocations = locations.filter(
    (location) =>
      location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (formData: LocationCreate | LocationUpdate) => {
    if (selectedLocation) {
      updateMutation.mutate({ id: selectedLocation.id, data: formData as LocationUpdate });
    } else {
      createMutation.mutate(formData as LocationCreate);
    }
  };

  const handleEdit = (location: Location) => {
    setSelectedLocation(location);
    setIsModalOpen(true);
  };

  const handleDelete = (location: Location) => {
    setSelectedLocation(location);
    setIsDeleteModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedLocation(null);
    setIsModalOpen(true);
  };

  const getOrgName = (orgId: number) => {
    const org = organizations.find((o) => o.id === orgId);
    return org?.name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Locations</h1>
          <p className="text-gray-500 mt-1">Manage detection locations</p>
        </div>
        <button
          onClick={handleAddNew}
          disabled={organizations.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-5 w-5" />
          Add Location
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={selectedOrgFilter}
              onChange={(e) => setSelectedOrgFilter(e.target.value ? parseInt(e.target.value) : '')}
              className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
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

      {/* Locations Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : organizations.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations yet</h3>
          <p className="text-gray-500">Create an organization first before adding locations</p>
        </div>
      ) : filteredLocations.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery ? 'Try a different search term' : 'Get started by creating your first location'}
          </p>
          {!searchQuery && (
            <button
              onClick={handleAddNew}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Location
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLocations.map((location) => (
            <div
              key={location.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-50 p-2.5 rounded-xl">
                    <MapPin className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{location.name}</h3>
                    <p className="text-sm text-gray-500">{location.code}</p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                    location.is_active
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {location.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Building2 className="h-4 w-4" />
                  <span>{getOrgName(location.organization_id)}</span>
                </div>
                {(location.city || location.country) && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Globe className="h-4 w-4" />
                    <span>
                      {[location.city, location.state, location.country]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                )}
                {location.address && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{location.address}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  Created {format(new Date(location.created_at), 'MMM dd, yyyy')}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(location)}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(location)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Location Modal */}
      <LocationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLocation(null);
        }}
        onSubmit={handleSubmit}
        location={selectedLocation}
        organizations={organizations}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedLocation(null);
        }}
        onConfirm={() => selectedLocation && deleteMutation.mutate(selectedLocation.id)}
        title="Delete Location"
        message={`Are you sure you want to delete "${selectedLocation?.name}"? This will also delete all associated detections.`}
        confirmText="Delete"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
}
