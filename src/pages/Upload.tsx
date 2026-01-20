import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Upload as UploadIcon, Image, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { anprApi } from '../services/api';

export default function Upload() {
  const [formData, setFormData] = useState({
    client_detection_id: '',
    camera_id: '',
    camera_name: '',
    vehicle_class: '',
    vehicle_track_id: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: (data: FormData) => anprApi.upload(data),
    onSuccess: () => {
      // Reset form on success
      setFormData({
        client_detection_id: '',
        camera_id: '',
        camera_name: '',
        vehicle_class: '',
        vehicle_track_id: '',
      });
      setImageFile(null);
      setImagePreview(null);
    },
  });

  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please upload an image file');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageFile) {
      alert('Please select an image');
      return;
    }

    const data = new FormData();
    data.append('image', imageFile);
    data.append('client_detection_id', formData.client_detection_id);
    data.append('camera_id', formData.camera_id);
    if (formData.camera_name) data.append('camera_name', formData.camera_name);
    if (formData.vehicle_class) data.append('vehicle_class', formData.vehicle_class);
    if (formData.vehicle_track_id) data.append('vehicle_track_id', formData.vehicle_track_id);

    uploadMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Test ANPR Upload</h1>
        <p className="text-gray-500 mt-1">Upload vehicle detection image for ANPR processing</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-50 p-2 rounded-xl">
              <UploadIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Upload Detection</h2>
              <p className="text-sm text-gray-500">Fill in the details and upload image</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image Upload with Drag & Drop */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Image <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                  required
                />
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('image-upload')?.click()}
                  className={`flex items-center justify-center w-full px-4 py-8 border-2 border-dashed rounded-xl transition-all cursor-pointer ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50'
                      : imagePreview
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-300 hover:border-indigo-500 hover:bg-gray-50'
                  }`}
                >
                  {imagePreview ? (
                    <div className="text-center">
                      <img src={imagePreview} alt="Preview" className="max-h-40 rounded-lg mx-auto mb-2" />
                      <p className="text-xs text-gray-600">Click or drop to replace</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Image className={`h-12 w-12 mx-auto mb-2 ${isDragging ? 'text-indigo-500' : 'text-gray-400'}`} />
                      <p className={`text-sm font-medium ${isDragging ? 'text-indigo-600' : 'text-gray-600'}`}>
                        {isDragging ? 'Drop image here' : 'Click or drag & drop to upload'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 10MB</p>
                    </div>
                  )}
                </div>
              </div>
              {imageFile && (
                <p className="text-xs text-gray-600 mt-2">
                  ✓ Selected: {imageFile.name} ({(imageFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            {/* Client Detection ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Detection ID <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.client_detection_id}
                onChange={(e) => setFormData({ ...formData, client_detection_id: e.target.value })}
                placeholder="e.g., 1, det_001"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Camera ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Camera ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.camera_id}
                onChange={(e) => setFormData({ ...formData, camera_id: e.target.value })}
                placeholder="e.g., 1, cam_gate_01"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            {/* Camera Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Camera Name <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.camera_name}
                onChange={(e) => setFormData({ ...formData, camera_name: e.target.value })}
                placeholder="e.g., Gate Camera, Main Entrance"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Vehicle Class */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Class <span className="text-gray-400">(Optional)</span>
              </label>
              <select
                value={formData.vehicle_class}
                onChange={(e) => setFormData({ ...formData, vehicle_class: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select vehicle class</option>
                <option value="two wheeler">Two Wheeler</option>
                <option value="car">Car</option>
                <option value="truck">Truck</option>
                <option value="bus">Bus</option>
                <option value="auto">Auto</option>
              </select>
            </div>

            {/* Vehicle Track ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Track ID <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.vehicle_track_id}
                onChange={(e) => setFormData({ ...formData, vehicle_track_id: e.target.value })}
                placeholder="e.g., 102, track_001"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploadMutation.isPending}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 text-white py-3 px-4 rounded-xl font-medium hover:from-indigo-700 hover:to-indigo-600 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploadMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <UploadIcon className="h-5 w-5" />
                  Upload Detection
                </>
              )}
            </button>
          </form>
        </div>

        {/* Response Info */}
        <div className="space-y-6">
          {/* Success/Error Message */}
          {uploadMutation.isSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">Upload Successful!</h3>
                  <div className="space-y-2 text-sm text-green-800">
                    <p><strong>Detection ID:</strong> {uploadMutation.data?.data.detection_id}</p>
                    {uploadMutation.data?.data.client_detection_id && (
                      <p><strong>Client Detection ID:</strong> {uploadMutation.data.data.client_detection_id}</p>
                    )}
                    <p><strong>Status:</strong> <span className="px-2 py-1 bg-green-100 rounded">{uploadMutation.data?.data.status}</span></p>
                    <p><strong>Received At:</strong> {new Date(uploadMutation.data?.data.received_at || '').toLocaleString()}</p>
                    <p className="text-xs text-green-700 mt-3">{uploadMutation.data?.data.message}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {uploadMutation.isError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <div className="bg-red-100 p-2 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-900 mb-2">Upload Failed</h3>
                  <p className="text-sm text-red-800 mb-2">
                    {(uploadMutation.error as any)?.response?.data?.detail ||
                     (uploadMutation.error instanceof Error ? uploadMutation.error.message : 'Failed to upload detection')}
                  </p>
                  {(uploadMutation.error as any)?.response?.status === 401 && (
                    <p className="text-xs text-red-700 mt-2">
                      Authentication failed. Please check your super admin token in the login page.
                    </p>
                  )}
                  {(uploadMutation.error as any)?.response?.status !== 401 && (
                    <p className="text-xs text-red-700 mt-2">
                      Please verify all required fields and try again.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Info Panel */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">How it works</h3>
                <ul className="space-y-2 text-xs text-blue-800">
                  <li>• Upload a vehicle image for ANPR processing</li>
                  <li>• Image will be sent to the central server</li>
                  <li>• AI/LLM will process and extract numberplate</li>
                  <li>• Check Detections page for results</li>
                  <li>• Uses your current super admin token</li>
                </ul>
              </div>
            </div>
          </div>

          {/* API Endpoint Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">API Endpoint</h3>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-xs font-mono text-gray-600 mb-2">POST /api/v1/anpr/upload</p>
              <p className="text-xs text-gray-500">Content-Type: multipart/form-data</p>
              <p className="text-xs text-gray-500">Header: X-API-Token</p>
            </div>
            <div className="mt-3 space-y-1">
              <p className="text-xs text-gray-600"><strong>Required Fields:</strong></p>
              <ul className="text-xs text-gray-500 ml-4 space-y-0.5">
                <li>• image (file)</li>
                <li>• camera_id</li>
              </ul>
              <p className="text-xs text-gray-600 mt-2"><strong>Optional Fields:</strong></p>
              <ul className="text-xs text-gray-500 ml-4 space-y-0.5">
                <li>• client_detection_id</li>
                <li>• camera_name</li>
                <li>• vehicle_class</li>
                <li>• vehicle_track_id</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
