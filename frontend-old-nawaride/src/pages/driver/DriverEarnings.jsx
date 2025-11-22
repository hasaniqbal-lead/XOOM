import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Star, Calendar } from 'lucide-react';
import { rideAPI } from '../../services/api';
import Navbar from '../../components/Navbar';
import toast from 'react-hot-toast';

const DriverEarnings = () => {
  const [rides, setRides] = useState([]);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    ridesCompleted: 0,
    points: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      const response = await rideAPI.getHistory();
      const completedRides = response.data.filter(r => r.status === 'completed');
      setRides(completedRides);

      const totalEarnings = completedRides.reduce((sum, ride) => sum + parseFloat(ride.final_fare || 0), 0);
      setStats({
        totalEarnings,
        ridesCompleted: completedRides.length,
        points: completedRides.length * 10, // Simple calculation
      });
    } catch (error) {
      toast.error('Failed to load earnings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Earnings & Stats</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
                <p className="text-3xl font-bold text-green-600">
                  PKR {stats.totalEarnings.toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Rides Completed</p>
                <p className="text-3xl font-bold text-blue-600">{stats.ridesCompleted}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Points Earned</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.points}</p>
              </div>
              <Star className="w-12 h-12 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Rides History */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">Recent Rides</h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="spinner"></div>
            </div>
          ) : rides.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No completed rides yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {rides.map((ride) => (
                <div key={ride.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {new Date(ride.completed_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">
                        {ride.rider_name || 'Anonymous Rider'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {ride.distance_km} km
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        PKR {ride.final_fare}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverEarnings;
