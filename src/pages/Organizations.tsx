import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  MapPin,
} from 'lucide-react';
import { organizationApi } from '../services/api';
import OrganizationModal from '../components/OrganizationModal';
import OrganizationViewModal from '../components/OrganizationViewModal';
import ConfirmModal from '../components/ConfirmModal';
import type { Organization, OrganizationCreate, OrganizationUpdate } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';

export default function Organizations() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 9;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['organizations', currentPage, pageSize, searchQuery],
    queryFn: () => {
      const page = currentPage + 1;
      if (searchQuery.trim()) {
        return organizationApi.search(searchQuery.trim(), page, pageSize);
      }
      return organizationApi.getAll(page, pageSize);
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: OrganizationCreate) => organizationApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organization created successfully');
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to create organization');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: OrganizationUpdate }) =>
      organizationApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organization updated successfully');
      setIsModalOpen(false);
      setSelectedOrg(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to update organization');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => organizationApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organization deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedOrg(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to delete organization');
    },
  });

  const organizations = data?.data.organizations || [];
  const totalOrgs = data?.data.total || 0;
  const totalPages = Math.ceil(totalOrgs / pageSize);

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
          <h1 className="text-3xl font-bold text-gray-900">
            Organizations
            {totalOrgs > 0 && (
              <span className="ml-2 text-lg font-medium text-gray-400">({totalOrgs})</span>
            )}
          </h1>
          <p className="text-gray-500 mt-1">Manage client organizations</p>
        </div>
        <button
          onClick={handleAddNew}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Organization
        </button>
      </div>

      {/* Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search organizations..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(0); }}
            className="w-full pl-10 pr-4 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm"
          />
        </div>
      </div>

      {/* Organizations Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" text="Loading organizations..." />
        </div>
      ) : organizations.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 border border-white/50 p-12 text-center">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery ? 'Try a different search term' : 'Get started by creating your first organization'}
          </p>
          {!searchQuery && (
            <button
              onClick={handleAddNew}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Organization
            </button>
          )}
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <div
              key={org.id}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl border border-white/50 p-6 transition-all duration-300 hover:-translate-y-1 min-h-[220px] flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl shadow-lg">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{org.name}</h3>
                    <p className="text-sm text-gray-500">{org.code}</p>
                  </div>
                </div>
                <span
                  className={`badge ${
                    org.is_active
                      ? 'badge-success'
                      : 'badge-danger'
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

              <div className="pt-4 border-t border-gray-100 space-y-3 mt-auto">
                <span className="text-xs text-gray-400">
                  Created {format(new Date(org.created_at), 'MMM dd, yyyy')}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleView(org)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-xl transition-colors border border-blue-100"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </button>
                  <button
                    onClick={() => handleEdit(org)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-indigo-600 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 rounded-xl transition-colors border border-indigo-100"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(org)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-gradient-to-r from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 rounded-xl transition-colors border border-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalOrgs}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          label="organizations"
        />
        </>
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
