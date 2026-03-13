import { useState } from 'react';
import { X, Building2, MapPin, FileText, Camera, Activity, Key, Copy, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { organizationApi, adminApi } from '../services/api';
import type { Organization } from '../types';

interface OrganizationViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: Organization | null;
}

export default function OrganizationViewModal({
  isOpen,
  onClose,
  organization,
}: OrganizationViewModalProps) {
  const queryClient = useQueryClient();
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch org stats for accurate camera/detection counts
  const { data: orgStats } = useQuery({
    queryKey: ['org-stats', organization?.id],
    queryFn: () => adminApi.getOrganizationStats(organization!.id).then((res) => res.data),
    enabled: isOpen && !!organization,
  });

  const regenerateTokenMutation = useMutation({
    mutationFn: (id: number) => organizationApi.regenerateToken(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('API token regenerated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to regenerate token');
    },
  });

  const handleCopyToken = () => {
    if (organization?.token) {
      navigator.clipboard.writeText(organization.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegenerateToken = () => {
    if (organization && confirm('Are you sure you want to regenerate the API token? The old token will no longer work.')) {
      regenerateTokenMutation.mutate(organization.id);
    }
  };

  if (!isOpen || !organization) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-50 p-2.5 rounded-xl">
                <Building2 className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {organization.name}
                </h2>
                <p className="text-sm text-gray-500">{organization.code}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Camera className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700">
                    {orgStats?.camera_count ?? organization.camera_count ?? 0}
                  </p>
                  <p className="text-sm text-blue-600">Cameras</p>
                </div>
              </div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 p-2 rounded-lg">
                  <Activity className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-700">
                    {orgStats?.detection_count ?? organization.detection_count ?? 0}
                  </p>
                  <p className="text-sm text-emerald-600">Detections</p>
                </div>
              </div>
            </div>
          </div>

          {/* Organization Details */}
          <div className="space-y-4">
            {/* API Token */}
            {organization.token && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-yellow-100 p-2 rounded-lg">
                    <Key className="h-4 w-4 text-yellow-700" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-900 mb-2">API Token</p>
                    <div className="bg-white rounded-lg p-2 font-mono text-xs break-all border border-yellow-200">
                      {showToken ? organization.token : '•'.repeat(40)}
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => setShowToken(!showToken)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                      >
                        {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        {showToken ? 'Hide' : 'Show'}
                      </button>
                      <button
                        onClick={handleCopyToken}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                          copied
                            ? 'text-emerald-700 bg-emerald-50'
                            : 'text-blue-700 bg-blue-50 hover:bg-blue-100'
                        }`}
                      >
                        <Copy className="h-3.5 w-3.5" />
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                      <button
                        onClick={handleRegenerateToken}
                        disabled={regenerateTokenMutation.isPending}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${regenerateTokenMutation.isPending ? 'animate-spin' : ''}`} />
                        Regenerate
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {organization.location && (
              <div className="flex items-start gap-3">
                <div className="bg-gray-100 p-2 rounded-lg">
                  <MapPin className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Location</p>
                  <p className="text-sm text-gray-600">{organization.location}</p>
                </div>
              </div>
            )}

            {organization.description && (
              <div className="flex items-start gap-3">
                <div className="bg-gray-100 p-2 rounded-lg">
                  <FileText className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Description</p>
                  <p className="text-sm text-gray-600">{organization.description}</p>
                </div>
              </div>
            )}

            {/* Status */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                    organization.is_active
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {organization.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                Created {format(new Date(organization.created_at), 'MMM dd, yyyy')}
              </span>
            </div>
          </div>

          {/* Close Button */}
          <div className="mt-6">
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
