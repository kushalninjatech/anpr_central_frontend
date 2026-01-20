import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  MapPin
} from 'lucide-react';
import { organizationApi } from '../services/api';
import OrganizationModal from '../components/OrganizationModal';
import OrganizationViewModal from '../components/OrganizationViewModal';
import ConfirmModal from '../components/ConfirmModal';
import type { Organization, OrganizationCreate, OrganizationUpdate } from '../types';

export default function Organizations() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationApi.getAll(0, 1000),
  });

  const createMutation = useMutation({
    mutationFn: (data: OrganizationCreate) => organizationApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setIsModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: OrganizationUpdate }) =>
      organizationApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setIsModalOpen(false);
      setSelectedOrg(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => organizationApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setIsDeleteModalOpen(false);
      setSelectedOrg(null);
    },
  });

  const organizations = data?.data.organizations || [];
  const filteredOrgs = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (formData: OrganizationCreate | OrganizationUpdate) => {
    if (selectedOrg) {
      updateMutation.mutate({ id: selectedOrg.id, data: formData as OrganizationUpdate });
    } else {
      createMutation.mutate(formData as OrganizationCreate);
    }
  };

  const handleView = (org: Organization) => {
    setSelectedOrg(org);
    setIsViewModalOpen(true);
  };

  const handleEdit = (org: Organization) => {
    setSelectedOrg(org);
    setIsModalOpen(true);
  };

  const handleDelete = (org: Organization) => {
    setSelectedOrg(org);
    setIsDeleteModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedOrg(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
          <p className="text-gray-500 mt-1">Manage client organizations</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25"
        >
          <Plus className="h-5 w-5" />
          Add Organization
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search organizations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Organizations Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredOrgs.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery ? 'Try a different search term' : 'Get started by creating your first organization'}
          </p>
          {!searchQuery && (
            <button
              onClick={handleAddNew}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Organization
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrgs.map((org) => (
            <div
              key={org.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-50 p-2.5 rounded-xl">
                    <Building2 className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{org.name}</h3>
                    <p className="text-sm text-gray-500">{org.code}</p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                    org.is_active
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {org.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {org.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{org.description}</p>
              )}

              <div className="space-y-2 mb-4">
                {org.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{org.location}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  Created {format(new Date(org.created_at), 'MMM dd, yyyy')}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleView(org)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(org)}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(org)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Organization Modal (Create/Edit) */}
      <OrganizationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedOrg(null);
        }}
        onSubmit={handleSubmit}
        organization={selectedOrg}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Organization View Modal */}
      <OrganizationViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedOrg(null);
        }}
        organization={selectedOrg}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedOrg(null);
        }}
        onConfirm={() => selectedOrg && deleteMutation.mutate(selectedOrg.id)}
        title="Delete Organization"
        message={`Are you sure you want to delete "${selectedOrg?.name}"? This will also delete all associated locations and detections.`}
        confirmText="Delete"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
}
