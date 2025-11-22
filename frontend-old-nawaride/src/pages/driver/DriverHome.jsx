import { useState, useEffect } from 'react';
import { Power, Navigation, DollarSign, Star, AlertCircle } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { rideAPI, driverAPI } from '../../services/api';
import toast from 'react-hot-toast';
import Navbar from '../../components/Navbar';
import Map from '../../components/Map';

const DriverHome = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [isOnline, setIsOnline] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [activeRide, setActiveRide] = useState(null);
  const [pendingRide, setPendingRide] = useState(null);
  const [stats, setStats] = useState({ points: 0, ridestoday: 0 });

  useEffect(() => {
    // Get current location
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(location);

          // Update location on server if online
          if (isOnline) {
            driverAPI.updateLocation({ ...location, is_online: true }).catch(console.error);
            socket.updateLocation(location.lat, location.lng);
          }
        },
        (error) => console.error('Location error:', error),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isOnline, socket]);

  useEffect(() => {
    if (!socket) return;

    // Listen for new ride requests
    socket.on('new_ride', (data) => {
      setPendingRide(data.ride);
      toast.success('New ride request!', { duration: 10000 });
    });

    socket.on('ride_update', (data) => {
      if (activeRide?.id === data.ride_id) {
        setActiveRide(prev => ({ ...prev, status: data.status }));
      }
    });

    socket.on('ride_cancelled', () => {
      toast.error('Ride was cancelled');
      setActiveRide(null);
      setPendingRide(null);
    });

    return () => {
      socket.off('new_ride');
      socket.off('ride_update');
      socket.off('ride_cancelled');
    };
  }, [socket, activeRide]);

  const toggleOnline = async () => {
    try {
      const newStatus = !isOnline;
      await driverAPI.setStatus({ is_online: newStatus });
      setIsOnline(newStatus);
      toast.success(newStatus ? 'You are now online' : 'You are now offline');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const acceptRide = async () => {
    if (!pendingRide) return;

    try {
      const response = await rideAPI.accept(pendingRide.id);
      setActiveRide(response.data);
      setPendingRide(null);
      toast.success('Ride accepted!');
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to accept ride';
      toast.error(message);
      setPendingRide(null);
    }
  };

  const declineRide = () => {
    if (!pendingRide) return;
    socket.declineRide(pendingRide.id, 'Driver busy');
    setPendingRide(null);
    toast.info('Ride declined');
  };

  const updateRideStatus = async (status) => {
    if (!activeRide) return;

    try {
      let response;
      switch (status) {
        case 'arrived':
          response = await rideAPI.arrived(activeRide.id);
          break;
        case 'on_trip':
          response = await rideAPI.start(activeRide.id);
          break;
        case 'completed':
          const fare = activeRide.estimated_fare; // In real app, would calculate actual
          const distance = activeRide.distance_km;
          response = await rideAPI.complete(activeRide.id, { fare, distance_km: distance });
          setActiveRide(null);
          toast.success('Ride completed!');
          return;
        default:
          return;
      }
      setActiveRide(response.data);
      toast.success(`Status updated to ${status}`);
    } catch (error) {
      toast.error('Failed to update ride status');
    }
  };

  const markers = [];
  if (currentLocation) {
    markers.push({ ...currentLocation, popup: 'Your Location' });
  }
  if (activeRide) {
    markers.push({
      lat: activeRide.pickup_lat,
      lng: activeRide.pickup_lng,
      popup: 'Pickup',
    });
    markers.push({
      lat: activeRide.drop_lat,
      lng: activeRide.drop_lng,
      popup: 'Drop',
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row">
        {/* Map Section */}
        <div className="w-full md:w-2/3 h-1/2 md:h-full">
          {currentLocation ? (
            <Map center={[currentLocation.lat, currentLocation.lng]} markers={markers} zoom={14} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="spinner"></div>
            </div>
          )}
        </div>

        {/* Controls Section */}
        <div className="w-full md:w-1/3 h-1/2 md:h-full overflow-y-auto bg-white shadow-lg">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Driver Dashboard</h2>
              <button
                onClick={toggleOnline}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition ${
                  isOnline
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                }`}
              >
                <Power className="w-5 h-5" />
                <span>{isOnline ? 'Online' : 'Offline'}</span>
              </button>
            </div>

            {!user?.is_verified && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Account Pending Verification</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Please upload your documents to start accepting rides.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-blue-600 mb-1">
                  <Star className="w-5 h-5" />
                  <span className="text-sm font-medium">Points</span>
                </div>
                <p className="text-2xl font-bold text-blue-700">{stats.points}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-green-600 mb-1">
                  <DollarSign className="w-5 h-5" />
                  <span className="text-sm font-medium">Today</span>
                </div>
                <p className="text-2xl font-bold text-green-700">{stats.ridesToday || 0}</p>
              </div>
            </div>

            {/* Pending Ride Request */}
            {pendingRide && !activeRide && (
              <div className="bg-primary-50 border-2 border-primary-500 rounded-lg p-4 mb-4 animate-pulse">
                <h3 className="text-lg font-bold text-primary-800 mb-3">New Ride Request!</h3>
                <div className="space-y-2 text-sm mb-4">
                  <p>
                    <strong>Distance:</strong> {pendingRide.distance_km?.toFixed(1)} km
                  </p>
                  <p>
                    <strong>Fare:</strong> PKR {pendingRide.estimated_fare}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={acceptRide}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition"
                  >
                    Accept
                  </button>
                  <button
                    onClick={declineRide}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg transition"
                  >
                    Decline
                  </button>
                </div>
              </div>
            )}

            {/* Active Ride */}
            {activeRide && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-bold text-green-800 mb-3">Active Ride</h3>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-semibold capitalize">{activeRide.status.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fare:</span>
                    <span className="font-semibold">PKR {activeRide.estimated_fare}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {activeRide.status === 'assigned' && (
                    <button
                      onClick={() => updateRideStatus('arrived')}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition"
                    >
                      Mark Arrived
                    </button>
                  )}

                  {activeRide.status === 'arrived' && (
                    <button
                      onClick={() => updateRideStatus('on_trip')}
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 rounded-lg transition"
                    >
                      Start Trip
                    </button>
                  )}

                  {activeRide.status === 'on_trip' && (
                    <button
                      onClick={() => updateRideStatus('completed')}
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition"
                    >
                      Complete Ride
                    </button>
                  )}
                </div>
              </div>
            )}

            {!pendingRide && !activeRide && isOnline && (
              <div className="text-center py-8 text-gray-500">
                <Navigation className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Waiting for ride requests...</p>
              </div>
            )}

            {!isOnline && (
              <div className="text-center py-8 text-gray-500">
                <Power className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Go online to start receiving rides</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverHome;
