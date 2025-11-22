import { useState, useEffect } from 'react';
import { Users, Car, MapPin, DollarSign } from 'lucide-react';
import { adminAPI } from '../../services/api';
import Navbar from '../../components/Navbar';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await adminAPI.getDashboard();
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
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

      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Riders</p>
                <p className="text-3xl font-bold text-blue-600">{stats?.total_riders || 0}</p>
              </div>
              <Users className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Drivers</p>
                <p className="text-3xl font-bold text-green-600">{stats?.total_drivers || 0}</p>
              </div>
              <Car className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Rides Today</p>
                <p className="text-3xl font-bold text-purple-600">{stats?.rides_today || 0}</p>
              </div>
              <MapPin className="w-12 h-12 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Revenue Today</p>
                <p className="text-3xl font-bold text-yellow-600">PKR {stats?.revenue_today || 0}</p>
              </div>
              <DollarSign className="w-12 h-12 text-yellow-500" />
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Active Drivers</h2>
          <p className="text-gray-600">
            {stats?.active_drivers || 0} drivers currently online
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
