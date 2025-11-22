import { useState, useEffect } from 'react';
import { rideAPI } from '../../services/api';
import { Calendar, MapPin, DollarSign, User } from 'lucide-react';
import { format } from 'date-fns';
import Navbar from '../../components/Navbar';
import toast from 'react-hot-toast';

const RiderHistory = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await rideAPI.getHistory();
      setRides(response.data);
    } catch (error) {
      toast.error('Failed to load ride history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      on_trip: 'bg-blue-100 text-blue-800',
      assigned: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Ride History</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner"></div>
          </div>
        ) : rides.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No rides yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rides.map((ride) => (
              <div key={ride.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {format(new Date(ride.created_at), 'MMM dd, yyyy hh:mm a')}
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(ride.status)}`}>
                    {ride.status.replace('_', ' ')}
                  </span>
                </div>

                {ride.driver_name && (
                  <div className="flex items-center space-x-2 mb-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">Driver: {ride.driver_name}</span>
                  </div>
                )}

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 mt-1 text-green-500" />
                    <div>
                      <p className="font-medium">Pickup</p>
                      <p>{ride.pickup_address || `${ride.pickup_lat}, ${ride.pickup_lng}`}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 mt-1 text-red-500" />
                    <div>
                      <p className="font-medium">Drop</p>
                      <p>{ride.drop_address || `${ride.drop_lat}, ${ride.drop_lng}`}</p>
                    </div>
                  </div>
                </div>

                {ride.final_fare && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center space-x-2 text-primary-600 font-semibold">
                      <DollarSign className="w-5 h-5" />
                      <span>PKR {ride.final_fare}</span>
                    </div>
                    <span className="text-sm text-gray-500">{ride.distance_km} km</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RiderHistory;
