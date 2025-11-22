import { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { driverAPI } from '../../services/api';
import toast from 'react-hot-toast';
import Navbar from '../../components/Navbar';

const DriverDocuments = () => {
  const [documents, setDocuments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_number: '',
    vehicle_type: 'bike',
  });
  const [files, setFiles] = useState({
    cnic_front: null,
    cnic_back: null,
    license_front: null,
    license_back: null,
  });

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await driverAPI.getDocuments();
      setDocuments(response.data);
      if (response.data) {
        setFormData({
          vehicle_number: response.data.vehicle_number || '',
          vehicle_type: response.data.vehicle_type || 'bike',
        });
      }
    } catch (error) {
      // No documents yet
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles[0]) {
      setFiles(prev => ({ ...prev, [name]: selectedFiles[0] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all files are selected
    const requiredFiles = ['cnic_front', 'cnic_back', 'license_front', 'license_back'];
    const missingFiles = requiredFiles.filter(key => !files[key]);

    if (missingFiles.length > 0) {
      toast.error('Please upload all required documents');
      return;
    }

    setUploading(true);

    try {
      const formDataObj = new FormData();
      Object.keys(files).forEach(key => {
        if (files[key]) formDataObj.append(key, files[key]);
      });
      formDataObj.append('vehicle_number', formData.vehicle_number);
      formDataObj.append('vehicle_type', formData.vehicle_type);

      await driverAPI.uploadDocuments(formDataObj);
      toast.success('Documents uploaded successfully! Awaiting admin verification.');
      loadDocuments();
    } catch (error) {
      toast.error('Failed to upload documents');
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      verified: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Verified' },
      rejected: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Rejected' },
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full ${badge.color}`}>
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{badge.label}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Driver Documents</h1>
            {documents?.status && getStatusBadge(documents.status)}
          </div>

          {documents?.status === 'rejected' && documents.rejection_reason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
              <p className="text-sm text-red-700 mt-1">{documents.rejection_reason}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Vehicle Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Number
                </label>
                <input
                  type="text"
                  value={formData.vehicle_number}
                  onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                  placeholder="ABC-1234"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              {/* Vehicle Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Type
                </label>
                <select
                  value={formData.vehicle_type}
                  onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="bike">Bike</option>
                  <option value="car">Car</option>
                  <option value="auto">Auto Rickshaw</option>
                </select>
              </div>
            </div>

            {/* File Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { name: 'cnic_front', label: 'CNIC Front' },
                { name: 'cnic_back', label: 'CNIC Back' },
                { name: 'license_front', label: 'License Front' },
                { name: 'license_back', label: 'License Back' },
              ].map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      name={field.name}
                      onChange={handleFileChange}
                      accept="image/*,.pdf"
                      className="hidden"
                      id={field.name}
                    />
                    <label
                      htmlFor={field.name}
                      className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 transition"
                    >
                      {files[field.name] ? (
                        <div className="text-center">
                          <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">{files[field.name].name}</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Click to upload</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={uploading || documents?.status === 'verified'}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : documents?.status === 'verified' ? 'Documents Verified' : 'Upload Documents'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DriverDocuments;
