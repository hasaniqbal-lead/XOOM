import { useState, useEffect } from "react";
import { MapPin, Users, Navigation, Clock, Share2, Loader2, Target, Home as HomeIcon, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AddressSearch from "./AddressSearch";
import VehicleSelector from "./VehicleSelector";
import PassengerCounter from "./PassengerCounter";
import Map from "./Map";
import { ridesAPI } from "@/services/api";
import { useSocket } from "@/contexts/SocketContext";
import { toast } from "sonner";
import { geocodingService } from "@/services/geocoding";
import { locationHistoryService, SavedLocation } from "@/services/locationHistory";

const RiderView = () => {
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropLocation, setDropLocation] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showShared, setShowShared] = useState(false);
  const [loading, setLoading] = useState(false);
  const [estimatedFare, setEstimatedFare] = useState<number | null>(null);
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(null);

  // Map state
  const [currentLocation, setCurrentLocation] = useState<[number, number]>([31.5204, 74.3587]); // Default: Lahore
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [dropCoords, setDropCoords] = useState<[number, number] | null>(null);
  const [routeGeometry, setRouteGeometry] = useState<Array<[number, number]> | null>(null);

  // Location features state
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(false);
  const [savedLocations, setSavedLocations] = useState<{
    home: SavedLocation | null;
    work: SavedLocation | null;
    recent: SavedLocation[];
  }>({ home: null, work: null, recent: [] });
  const [showLocationOptions, setShowLocationOptions] = useState<'pickup' | 'drop' | null>(null);

  const { socket } = useSocket();

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.log("Geolocation error:", error);
        }
      );
    }
  }, []);

  // Load saved locations
  useEffect(() => {
    setSavedLocations({
      home: locationHistoryService.getHome(),
      work: locationHistoryService.getWork(),
      recent: locationHistoryService.getRecent(),
    });
  }, []);

  // Fetch route and calculate fare when pickup and drop locations are set
  useEffect(() => {
    if (pickupCoords && dropCoords) {
      fetchRoute();
    } else {
      setEstimatedFare(null);
      setEstimatedDuration(null);
      setRouteGeometry(null);
    }
  }, [pickupCoords, dropCoords]);

  const fetchRoute = async () => {
    if (!pickupCoords || !dropCoords) return;

    try {
      const route = await geocodingService.getRoute([
        { lat: pickupCoords[0], lng: pickupCoords[1] },
        { lat: dropCoords[0], lng: dropCoords[1] },
      ]);

      // Set route geometry for map
      setRouteGeometry(route.geometry);

      // Calculate fare using actual route distance
      const distanceKm = route.distance / 1000; // meters to km
      const baseFare = 50;
      const perKm = 15;
      const minimumFare = 80;
      const fare = Math.max(baseFare + distanceKm * perKm, minimumFare);

      setEstimatedFare(Math.round(fare));
      setEstimatedDuration(Math.round(route.duration / 60)); // seconds to minutes
    } catch (error) {
      console.error('Route fetch error:', error);
      // Fallback to Haversine distance if route fails
      const distance = calculateDistance(
        pickupCoords[0],
        pickupCoords[1],
        dropCoords[0],
        dropCoords[1]
      );
      const baseFare = 50;
      const perKm = 15;
      const minimumFare = 80;
      const fare = Math.max(baseFare + distance * perKm, minimumFare);
      setEstimatedFare(Math.round(fare));
      setRouteGeometry(null);
    }
  };

  // Socket.IO listeners
  useEffect(() => {
    if (!socket) return;

    socket.on("ride_assigned", (...args: unknown[]) => {
      const data = args[0] as { driver: { name: string } };
      toast.success(`Driver ${data.driver.name} is on the way!`);
    });

    socket.on("driver_accepted", () => {
      toast.info("Driver accepted your ride!");
    });

    socket.on("ride_started", () => {
      toast.info("Your ride has started!");
    });

    socket.on("ride_completed", () => {
      toast.success("Ride completed!");
      // Reset form
      setPickupCoords(null);
      setDropCoords(null);
      setPickupLocation("");
      setDropLocation("");
      setSelectedVehicle(null);
    });

    return () => {
      socket.off("ride_assigned");
      socket.off("driver_accepted");
      socket.off("ride_started");
      socket.off("ride_completed");
    };
  }, [socket]);

  // Haversine formula for distance calculation
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleRequestRide = async () => {
    if (!pickupLocation || !dropLocation || !selectedVehicle || !pickupCoords || !dropCoords) {
      toast.error("Please select pickup and drop locations");
      return;
    }

    try {
      setLoading(true);

      const rideData = {
        pickup_lat: pickupCoords[0],
        pickup_lng: pickupCoords[1],
        drop_lat: dropCoords[0],
        drop_lng: dropCoords[1],
        passengers,
        vehicle_type: selectedVehicle,
      };

      // Create ride via API
      const response = await ridesAPI.createRide(rideData);
      const ride = response.data;

      toast.success("Ride requested! Looking for drivers...");

      // Emit real-time event
      socket?.emit("request_ride", ride);
    } catch (error) {
      toast.error("Failed to request ride. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle map click to set location
  const handleMapClick = async (latlng: { lat: number; lng: number }) => {
    try {
      setLoading(true);
      const result = await geocodingService.reverseGeocode(latlng.lat, latlng.lng);
      
      if (!pickupCoords) {
        // Set as pickup
        setPickupLocation(result.display_name);
        setPickupCoords([latlng.lat, latlng.lng]);
        toast.success("Pickup location set");
      } else if (!dropCoords) {
        // Set as drop
        setDropLocation(result.display_name);
        setDropCoords([latlng.lat, latlng.lng]);
        toast.success("Drop location set");
        
        // Save to recent
        locationHistoryService.save({
          type: 'recent',
          name: result.display_name,
          address: result.display_name,
          lat: latlng.lat,
          lng: latlng.lng,
        });
      }
    } catch (error) {
      toast.error("Could not get address for this location");
    } finally {
      setLoading(false);
    }
  };

  // Handle marker drag
  const handleMarkerDrag = async (type: "pickup" | "dropoff", latlng: { lat: number; lng: number }) => {
    try {
      const result = await geocodingService.reverseGeocode(latlng.lat, latlng.lng);
      
      if (type === "pickup") {
        setPickupLocation(result.display_name);
        setPickupCoords([latlng.lat, latlng.lng]);
        toast.success("Pickup location updated");
      } else {
        setDropLocation(result.display_name);
        setDropCoords([latlng.lat, latlng.lng]);
        toast.success("Drop location updated");
      }
    } catch (error) {
      toast.error("Could not update address");
    }
  };

  // Use current GPS location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsUsingCurrentLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const result = await geocodingService.reverseGeocode(latitude, longitude);
          
          if (showLocationOptions === 'pickup') {
            setPickupLocation(result.display_name);
            setPickupCoords([latitude, longitude]);
          } else {
            setDropLocation(result.display_name);
            setDropCoords([latitude, longitude]);
          }
          
          setCurrentLocation([latitude, longitude]);
          toast.success("Current location set");
        } catch (error) {
          toast.error("Could not get address");
        } finally {
          setIsUsingCurrentLocation(false);
          setShowLocationOptions(null);
        }
      },
      (error) => {
        toast.error("Could not get your location");
        setIsUsingCurrentLocation(false);
        setShowLocationOptions(null);
      }
    );
  };

  // Handle saved location selection
  const handleSavedLocationSelect = (location: SavedLocation, type: 'pickup' | 'drop') => {
    if (type === 'pickup') {
      setPickupLocation(location.address);
      setPickupCoords([location.lat, location.lng]);
    } else {
      setDropLocation(location.address);
      setDropCoords([location.lat, location.lng]);
    }
    setShowLocationOptions(null);
  };

  // Prepare markers for the map
  const markers = [];
  if (pickupCoords) {
    markers.push({ position: pickupCoords, type: "pickup" as const, label: "Pickup Location" });
  }
  if (dropCoords) {
    markers.push({ position: dropCoords, type: "dropoff" as const, label: "Drop Location" });
  }

  const handlePickupSelect = (result: {
    address: string;
    lat: number;
    lng: number;
    display_name: string;
  }) => {
    setPickupLocation(result.display_name);
    setPickupCoords([result.lat, result.lng]);
  };

  const handleDropSelect = (result: {
    address: string;
    lat: number;
    lng: number;
    display_name: string;
  }) => {
    setDropLocation(result.display_name);
    setDropCoords([result.lat, result.lng]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Map Area */}
      <div className="relative h-[45vh] bg-xoom-surface border-b border-border">
        <Map
          center={currentLocation}
          zoom={13}
          markers={markers.map(m => ({
            ...m,
            draggable: true,
          }))}
          route={routeGeometry || undefined}
          routeColor="#3b82f6"
          className="w-full h-full"
          onMapClick={handleMapClick}
          onMarkerDrag={handleMarkerDrag}
        />

        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-background/80 to-transparent z-[100]">
          <div className="flex gap-2">
            <Button
              variant={showSchedule ? "default" : "secondary"}
              size="sm"
              onClick={() => setShowSchedule(!showSchedule)}
              className="flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Schedule
            </Button>
            <Button
              variant={showShared ? "default" : "secondary"}
              size="sm"
              onClick={() => setShowShared(!showShared)}
              className="flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Shared Ride
            </Button>
          </div>
        </div>
      </div>

      {/* Booking Panel */}
      <div className="animate-slide-up">
        <div className="px-4 py-6 space-y-4">
          {/* Quick Location Actions */}
          <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowLocationOptions('pickup');
                handleUseCurrentLocation();
              }}
              disabled={isUsingCurrentLocation}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              {isUsingCurrentLocation ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Target className="w-4 h-4" />
              )}
              Current Location
            </Button>
            
            {savedLocations.home && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSavedLocationSelect(savedLocations.home!, 'pickup')}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <HomeIcon className="w-4 h-4" />
                Home
              </Button>
            )}
            
            {savedLocations.work && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSavedLocationSelect(savedLocations.work!, 'pickup')}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <Briefcase className="w-4 h-4" />
                Work
              </Button>
            )}
          </div>

          {/* Location Inputs */}
          <div className="space-y-3">
            <AddressSearch
              icon={<Navigation className="w-5 h-5 text-primary" />}
              placeholder="Search pickup location"
              value={pickupLocation}
              onSelect={handlePickupSelect}
              userLocation={currentLocation ? { lat: currentLocation[0], lng: currentLocation[1] } : undefined}
            />
            <AddressSearch
              icon={<MapPin className="w-5 h-5 text-destructive" />}
              placeholder="Search drop location"
              value={dropLocation}
              onSelect={handleDropSelect}
              userLocation={currentLocation ? { lat: currentLocation[0], lng: currentLocation[1] } : undefined}
            />
          </div>

          {/* Passenger Counter */}
          <PassengerCounter value={passengers} onChange={setPassengers} />

          {/* Vehicle Selection */}
          <div>
            <h3 className="font-display text-lg font-semibold mb-3">Select XOOM Type</h3>
            <VehicleSelector 
              selectedVehicle={selectedVehicle}
              onSelectVehicle={setSelectedVehicle}
            />
          </div>

          {/* Price Estimate */}
          {selectedVehicle && pickupLocation && dropLocation && estimatedFare && (
            <Card className="xoom-surface-elevated p-4 animate-fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-muted-foreground text-sm">Estimated Fare</p>
                  <p className="font-display text-2xl font-bold text-primary">
                    ₹ {estimatedFare}
                  </p>
                </div>
                <div className="text-right">
                  {estimatedDuration && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                      <Clock className="w-4 h-4" />
                      <span>~{estimatedDuration} mins</span>
                    </div>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {pickupCoords && dropCoords && routeGeometry ?
                      `~${Math.round(calculateDistance(pickupCoords[0], pickupCoords[1], dropCoords[0], dropCoords[1]))} km` :
                      "Calculating..."
                    }
                  </Badge>
                </div>
              </div>
            </Card>
          )}

          {/* Request Button */}
          <Button
            className="w-full h-14 text-lg font-semibold xoom-gradient hover:opacity-90 transition-opacity"
            size="lg"
            onClick={handleRequestRide}
            disabled={!pickupLocation || !dropLocation || !selectedVehicle || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Requesting...
              </>
            ) : (
              "Request a XOOM"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RiderView;
