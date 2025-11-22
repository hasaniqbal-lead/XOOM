import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { MapPin, Clock, User } from 'lucide-react';
import Navbar from '../../components/Navbar';
import toast from 'react-hot-toast';

const AdminRides = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRides();
  }, []);

  const loadRides = async () => {
    try {
      const response = await adminAPI.getActiveRides();
      setRides(response.data);
    } catch (error) {
      toast.error('Failed to load rides');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      requested: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      on_trip: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Active Rides</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner"></div>
          </div>
        ) : rides.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">No active rides</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rides.map((ride) => (
              <div key={ride.id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-sm font-medium text-gray-600">Ride #{ride.id}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(ride.status)}`}>
                    {ride.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start space-x-2 text-sm">
                    <User className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-700">Rider</p>
                      <p className="text-gray-600">{ride.rider_name}</p>
                      <p className="text-gray-500 text-xs">{ride.rider_phone}</p>
                    </div>
                  </div>

                  {ride.driver_name && (
                    <div className="flex items-start space-x-2 text-sm">
                      <User className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-700">Driver</p>
                        <p className="text-gray-600">{ride.driver_name}</p>
                        <p className="text-gray-500 text-xs">{ride.driver_phone}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start space-x-2 text-sm">
                    <MapPin className="w-4 h-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-gray-600">Pickup</p>
                      <p className="text-gray-500 text-xs">{ride.pickup_lat}, {ride.pickup_lng}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 text-sm">
                    <MapPin className="w-4 h-4 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-gray-600">Drop</p>
                      <p className="text-gray-500 text-xs">{ride.drop_lat}, {ride.drop_lng}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-sm pt-2 border-t">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {new Date(ride.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRides;
