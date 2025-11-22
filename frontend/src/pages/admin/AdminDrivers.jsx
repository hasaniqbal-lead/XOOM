import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { CheckCircle, XCircle, FileText } from 'lucide-react';
import Navbar from '../../components/Navbar';
import toast from 'react-hot-toast';

const AdminDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState(null);

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      const response = await adminAPI.getDrivers();
      setDrivers(response.data);
    } catch (error) {
      toast.error('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const verifyDriver = async (driverId, status) => {
    try {
      await adminAPI.verifyDriver(driverId, { status });
      toast.success(`Driver ${status}`);
      loadDrivers();
      setSelectedDriver(null);
    } catch (error) {
      toast.error('Verification failed');
    }
  };

  const toggleBlock = async (driverId, isBlocked) => {
    try {
      if (isBlocked) {
        await adminAPI.unblockUser(driverId);
        toast.success('Driver unblocked');
      } else {
        await adminAPI.blockUser(driverId);
        toast.success('Driver blocked');
      }
      loadDrivers();
    } catch (error) {
      toast.error('Action failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Manage Drivers</h1>

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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doc Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verified</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {drivers.map((driver) => (
                  <tr key={driver.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{driver.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{driver.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {driver.vehicle_type || 'N/A'} - {driver.vehicle_number || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {driver.doc_status === 'verified' && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Verified</span>
                      )}
                      {driver.doc_status === 'pending' && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Pending</span>
                      )}
                      {driver.doc_status === 'rejected' && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Rejected</span>
                      )}
                      {!driver.doc_status && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">No Docs</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {driver.is_verified ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-400" />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap space-x-2">
                      {driver.doc_status === 'pending' && (
                        <>
                          <button
                            onClick={() => verifyDriver(driver.id, 'verified')}
                            className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => verifyDriver(driver.id, 'rejected')}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => toggleBlock(driver.id, driver.is_blocked)}
                        className={`px-3 py-1 rounded text-white text-sm ${
                          driver.is_blocked ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                        }`}
                      >
                        {driver.is_blocked ? 'Unblock' : 'Block'}
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

export default AdminDrivers;
