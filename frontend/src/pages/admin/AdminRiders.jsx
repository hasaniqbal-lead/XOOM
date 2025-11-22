import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Ban, CheckCircle } from 'lucide-react';
import Navbar from '../../components/Navbar';
import toast from 'react-hot-toast';

const AdminRiders = () => {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRiders();
  }, []);

  const loadRiders = async () => {
    try {
      const response = await adminAPI.getRiders();
      setRiders(response.data);
    } catch (error) {
      toast.error('Failed to load riders');
    } finally {
      setLoading(false);
    }
  };

  const toggleBlock = async (riderId, isBlocked) => {
    try {
      if (isBlocked) {
        await adminAPI.unblockUser(riderId);
        toast.success('Rider unblocked');
      } else {
        await adminAPI.blockUser(riderId);
        toast.success('Rider blocked');
      }
      loadRiders();
    } catch (error) {
      toast.error('Action failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Manage Riders</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {riders.map((rider) => (
                  <tr key={rider.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{rider.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{rider.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(rider.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {rider.is_blocked ? (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Blocked</span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleBlock(rider.id, rider.is_blocked)}
                        className={`px-3 py-1 rounded text-white text-sm ${
                          rider.is_blocked ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                        }`}
                      >
                        {rider.is_blocked ? 'Unblock' : 'Block'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRiders;
