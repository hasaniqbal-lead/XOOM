import { useState, useEffect } from "react";
import { MapPin, Navigation, Clock, Phone, MessageSquare, Settings, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import Map from "./Map";
import { ridesAPI } from "@/services/api";
import { useSocket } from "@/contexts/SocketContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { geocodingService } from "@/services/geocoding";
import { formatCurrency } from "@/config/currency";

interface RideRequest {
  id: string;
  pickup: string;
  dropoff: string;
  pickup_lat: number;
  pickup_lng: number;
  drop_lat: number;
  drop_lng: number;
  distance_km: number;
  estimated_fare: number;
  passengers: number;
  vehicle_type: string;
  rider_id: number;
}

const DriverView = () => {
  const [radius, setRadius] = useState([20]);
  const [acceptedRide, setAcceptedRide] = useState<RideRequest | null>(null);
  const [declineCount, setDeclineCount] = useState(0);
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [todayRides, setTodayRides] = useState(0);
  const [todayEarnings, setTodayEarnings] = useState(0);

  // Map state
  const [currentLocation, setCurrentLocation] = useState<[number, number]>([31.5204, 74.3587]);
  const [routeToPickup, setRouteToPickup] = useState<Array<[number, number]> | null>(null);
  const [etaToPickup, setEtaToPickup] = useState<number | null>(null);

  const { socket } = useSocket();
  const { user } = useAuth();

  // Get driver's current location and send to backend
  useEffect(() => {
    if (!user || user.role !== 'driver') return;

    if (navigator.geolocation) {
      const updateLocation = (position: GeolocationPosition) => {
        const coords: [number, number] = [
          position.coords.latitude,
          position.coords.longitude
        ];
        setCurrentLocation(coords);

        // Send to backend via Socket.IO
        socket?.emit("driver_location", {
          lat: coords[0],
          lng: coords[1],
          is_available: !acceptedRide // Available if no active ride
        });
      };

      navigator.geolocation.getCurrentPosition(updateLocation);

      // Update location every 10 seconds
      const interval = setInterval(() => {
        navigator.geolocation.getCurrentPosition(updateLocation);
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [user, socket, acceptedRide]);

  // Socket.IO listeners
  useEffect(() => {
    if (!socket) return;

    socket.on("new_ride", (...args: unknown[]) => {
      const ride = args[0] as RideRequest;
      toast.info(`New ride request! ${ride.distance_km.toFixed(1)} km away`);
      setRideRequests(prev => [...prev, ride]);
    });

    socket.on("ride_cancelled", (...args: unknown[]) => {
      const data = args[0] as { ride_id: string };
      toast.warning("Ride was cancelled by rider");
      setRideRequests(prev => prev.filter(r => r.id !== data.ride_id));
      if (acceptedRide?.id === data.ride_id) {
        setAcceptedRide(null);
      }
    });

    return () => {
      socket.off("new_ride");
      socket.off("ride_cancelled");
    };
  }, [socket, acceptedRide]);

  // Fetch route to pickup when ride is accepted
  useEffect(() => {
    if (acceptedRide && currentLocation) {
      fetchRouteToPickup();
    } else {
      setRouteToPickup(null);
      setEtaToPickup(null);
    }
  }, [acceptedRide, currentLocation]);

  const fetchRouteToPickup = async () => {
    if (!acceptedRide || !currentLocation) return;

    try {
      const route = await geocodingService.getRoute([
        { lat: currentLocation[0], lng: currentLocation[1] },
        { lat: acceptedRide.pickup_lat, lng: acceptedRide.pickup_lng },
      ]);

      setRouteToPickup(route.geometry);
      setEtaToPickup(Math.round(route.duration / 60)); // seconds to minutes
    } catch (error) {
      console.error('Route fetch error:', error);
      setRouteToPickup(null);
      setEtaToPickup(null);
    }
  };

  const handleAccept = async (request: RideRequest) => {
    try {
      setLoading(true);
      await ridesAPI.acceptRide(request.id);
      setAcceptedRide(request);
      setRideRequests(prev => prev.filter(r => r.id !== request.id));
      toast.success("Ride accepted!");
    } catch (error) {
      toast.error("Failed to accept ride");
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = (requestId: string) => {
    setRideRequests(prev => prev.filter(r => r.id !== requestId));
    setDeclineCount(prev => prev + 1);
    toast.info("Ride declined");
  };

  const handleStartRide = async () => {
    if (!acceptedRide) return;

    try {
      setLoading(true);
      await ridesAPI.startRide(acceptedRide.id);
      toast.success("Ride started!");
    } catch (error) {
      toast.error("Failed to start ride");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRide = async () => {
    if (!acceptedRide) return;

    try {
      setLoading(true);
      await ridesAPI.completeRide(acceptedRide.id);
      toast.success("Ride completed!");
      setTodayRides(prev => prev + 1);
      setTodayEarnings(prev => prev + acceptedRide.estimated_fare);
      setAcceptedRide(null);
      // TODO: Show review modal
    } catch (error) {
      toast.error("Failed to complete ride");
    } finally {
      setLoading(false);
    }
  };

  // Prepare markers for the map
  const markers = [
    { position: currentLocation, type: "driver" as const, label: "Your Location" }
  ];

  if (acceptedRide) {
    markers.push(
      { position: [acceptedRide.pickup_lat, acceptedRide.pickup_lng], type: "pickup" as const, label: "Pickup" },
      { position: [acceptedRide.drop_lat, acceptedRide.drop_lng], type: "dropoff" as const, label: "Drop-off" }
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Map Area */}
      <div className="relative h-[40vh] bg-xoom-surface border-b border-border">
        <Map
          center={currentLocation}
          zoom={14}
          markers={markers}
          route={routeToPickup || undefined}
          routeColor="#10b981"
          className="w-full h-full"
        />

        {/* Stats Bar */}
        <div className="absolute top-4 left-4 right-4 z-[100]">
          <Card className="xoom-surface-elevated p-3">
            <div className="flex justify-between items-center">
              <div className="text-center flex-1">
                <p className="text-xs text-muted-foreground">Today's Rides</p>
                <p className="text-xl font-bold text-primary">{todayRides}</p>
              </div>
              <div className="text-center flex-1 border-x border-border">
                <p className="text-xs text-muted-foreground">Earnings</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(todayEarnings)}</p>
              </div>
              <div className="text-center flex-1">
                <p className="text-xs text-muted-foreground">Rating</p>
                <p className="text-xl font-bold text-primary">{user?.average_rating.toFixed(1) || "4.8"} ⭐</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-4 py-6 space-y-4">
        {/* Radius Control */}
        <Card className="xoom-surface-elevated p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              <span className="font-semibold">Search Radius</span>
            </div>
            <Badge variant="secondary">{radius[0]} km</Badge>
          </div>
          <Slider
            value={radius}
            onValueChange={setRadius}
            min={5}
            max={40}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>5 km</span>
            <span>~{Math.round(radius[0] * 2)} min reach</span>
            <span>40 km</span>
          </div>
        </Card>

        {/* Active Ride or Incoming Requests */}
        {acceptedRide ? (
          <div className="animate-fade-in space-y-4">
            <Card className="xoom-surface-elevated p-4 border-primary">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Badge className="mb-2">Active Ride</Badge>
                  <h3 className="font-display text-lg font-semibold">
                    {acceptedRide.vehicle_type}
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{formatCurrency(acceptedRide.estimated_fare)}</p>
                  <div className="flex items-center gap-2 justify-end">
                    {etaToPickup && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{etaToPickup} min</span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">{acceptedRide.distance_km.toFixed(1)} km</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-3">
                  <Navigation className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Pickup</p>
                    <p className="font-medium">{acceptedRide.pickup}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-destructive mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Drop-off</p>
                    <p className="font-medium">{acceptedRide.dropoff}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                <Button variant="secondary" size="sm" className="flex-1 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Call
                </Button>
                <Button variant="secondary" size="sm" className="flex-1 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  WhatsApp
                </Button>
              </div>

              <div className="space-y-2">
                <Button
                  className="w-full xoom-gradient hover:opacity-90"
                  onClick={handleStartRide}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Start Ride
                </Button>
                <Button
                  className="w-full"
                  onClick={handleCompleteRide}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Complete Ride
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">Incoming Requests</h3>
              {declineCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {declineCount}/3 declines today
                </Badge>
              )}
            </div>

            {rideRequests.length === 0 ? (
              <Card className="xoom-surface-elevated p-8 text-center">
                <Navigation className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Waiting for ride requests...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Make sure you're in an active area
                </p>
              </Card>
            ) : (
              rideRequests.map((request, index) => (
                <Card
                  key={request.id}
                  className="xoom-surface-elevated p-4 animate-slide-up border-l-4 border-l-primary"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Badge variant="secondary" className="mb-2">
                        {request.vehicle_type}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {request.passengers} passenger{request.passengers > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary">PKR {request.estimated_fare}</p>
                      <p className="text-xs text-muted-foreground">{request.distance_km.toFixed(1)} km</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2">
                      <Navigation className="w-4 h-4 text-primary mt-0.5" />
                      <p className="text-sm">{request.pickup}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-destructive mt-0.5" />
                      <p className="text-sm">{request.dropoff}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => handleDecline(request.id)}
                      disabled={loading}
                    >
                      Decline
                    </Button>
                    <Button
                      className="flex-1 xoom-gradient hover:opacity-90"
                      onClick={() => handleAccept(request)}
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Accept
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverView;
