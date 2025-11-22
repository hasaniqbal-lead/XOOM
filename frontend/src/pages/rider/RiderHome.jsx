import { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, DollarSign } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { rideAPI } from '../../services/api';
import toast from 'react-hot-toast';
import Navbar from '../../components/Navbar';
import Map from '../../components/Map';

const RiderHome = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropLocation, setDropLocation] = useState(null);
  const [activeRide, setActiveRide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectingLocation, setSelectingLocation] = useState(null); // 'pickup' or 'drop'

  useEffect(() => {
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setPickupLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Please enable location services');
          // Default to Lahore
          setCurrentLocation({ lat: 31.5204, lng: 74.3587 });
        }
      );
    }
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Listen for ride updates
    socket.on('ride_assigned', (data) => {
      toast.success(`Driver ${data.driver.name} is on the way!`);
      setActiveRide((prev) => ({ ...prev, ...data, status: 'assigned' }));
    });

    socket.on('ride_update', (data) => {
      setActiveRide((prev) => (prev?.id === data.ride_id ? { ...prev, status: data.status } : prev));
      toast.info(`Ride status: ${data.status}`);
    });

    socket.on('ride_completed', (data) => {
      toast.success(`Ride completed! Fare: PKR ${data.fare}`);
      setActiveRide(null);
      setPickupLocation(currentLocation);
      setDropLocation(null);
    });

    socket.on('ride_cancelled', (data) => {
      toast.error(`Ride cancelled: ${data.reason}`);
      setActiveRide(null);
    });

    return () => {
      socket.off('ride_assigned');
      socket.off('ride_update');
      socket.off('ride_completed');
      socket.off('ride_cancelled');
    };
  }, [socket, currentLocation]);

  const handleMapClick = (latlng) => {
    if (selectingLocation === 'pickup') {
      setPickupLocation({ lat: latlng.lat, lng: latlng.lng });
      setSelectingLocation(null);
    } else if (selectingLocation === 'drop') {
      setDropLocation({ lat: latlng.lat, lng: latlng.lng });
      setSelectingLocation(null);
    }
  };

  const requestRide = async () => {
    if (!pickupLocation || !dropLocation) {
      toast.error('Please select pickup and drop locations');
      return;
    }

    setLoading(true);
    try {
      const response = await rideAPI.create({
        pickup_lat: pickupLocation.lat,
        pickup_lng: pickupLocation.lng,
        drop_lat: dropLocation.lat,
        drop_lng: dropLocation.lng,
      });

      setActiveRide(response.data);
      toast.success('Ride requested! Finding nearby drivers...');
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to request ride';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const cancelRide = async () => {
    if (!activeRide) return;

    try {
      await rideAPI.cancel(activeRide.id, { reason: 'Cancelled by rider' });
      setActiveRide(null);
      toast.success('Ride cancelled');
    } catch (error) {
      toast.error('Failed to cancel ride');
    }
  };

  const markers = [];
  if (pickupLocation) {
    markers.push({ ...pickupLocation, popup: 'Pickup Location' });
  }
  if (dropLocation) {
    markers.push({ ...dropLocation, popup: 'Drop Location' });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row">
        {/* Map Section */}
        <div className="w-full md:w-2/3 h-1/2 md:h-full relative">
          {currentLocation ? (
            <Map
              center={[currentLocation.lat, currentLocation.lng]}
              markers={markers}
              onMapClick={handleMapClick}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="spinner"></div>
            </div>
          )}

          {selectingLocation && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-primary-500 text-white px-4 py-2 rounded-lg shadow-lg">
              Click on map to select {selectingLocation} location
            </div>
          )}
        </div>

        {/* Controls Section */}
        <div className="w-full md:w-1/3 h-1/2 md:h-full overflow-y-auto bg-white shadow-lg">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Request a Ride</h2>

            {!activeRide ? (
              <>
                {/* Location Inputs */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pickup Location
                    </label>
                    <button
                      onClick={() => setSelectingLocation('pickup')}
                      className="w-full flex items-center space-x-2 px-4 py-3 border-2 border-primary-500 rounded-lg hover:bg-primary-50 transition"
                    >
                      <MapPin className="w-5 h-5 text-primary-500" />
                      <span className="text-gray-700">
                        {pickupLocation ? 'Pickup set on map' : 'Select on map'}
                      </span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Drop Location
                    </label>
                    <button
                      onClick={() => setSelectingLocation('drop')}
                      className="w-full flex items-center space-x-2 px-4 py-3 border-2 border-primary-500 rounded-lg hover:bg-primary-50 transition"
                    >
                      <Navigation className="w-5 h-5 text-primary-500" />
                      <span className="text-gray-700">
                        {dropLocation ? 'Drop set on map' : 'Select on map'}
                      </span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={requestRide}
                  disabled={loading || !pickupLocation || !dropLocation}
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Requesting...' : 'Request Ride'}
                </button>
              </>
            ) : (
              <>
                {/* Active Ride Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-800">Ride Status</span>
                    <span className="px-3 py-1 bg-blue-500 text-white text-sm rounded-full capitalize">
                      {activeRide.status}
                    </span>
                  </div>

                  {activeRide.driver && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm text-gray-700">
                        <strong>Driver:</strong> {activeRide.driver.name}
                      </p>
                      <p className="text-sm text-gray-700">
                        <strong>Phone:</strong> {activeRide.driver.phone}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 flex items-center space-x-2 text-sm text-gray-600">
                    <DollarSign className="w-4 h-4" />
                    <span>Estimated Fare: PKR {activeRide.estimated_fare}</span>
                  </div>
                </div>

                {activeRide.status === 'requested' && (
                  <button
                    onClick={cancelRide}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg transition"
                  >
                    Cancel Ride
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiderHome;
