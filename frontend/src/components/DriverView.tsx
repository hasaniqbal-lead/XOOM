import { useState, useEffect } from "react";
import { MapPin, Navigation, Clock, Phone, MessageSquare, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import Map from "./Map";

interface RideRequest {
  id: string;
  pickup: string;
  dropoff: string;
  distance: string;
  fare: string;
  passengers: number;
  vehicleType: string;
}

const mockRequests: RideRequest[] = [
  {
    id: "1",
    pickup: "Central Mall, Main Street",
    dropoff: "Airport Terminal 2",
    distance: "12.5 km",
    fare: "₹ 245",
    passengers: 2,
    vehicleType: "AC Car"
  },
  {
    id: "2",
    pickup: "Railway Station",
    dropoff: "City Hospital",
    distance: "8.3 km",
    fare: "₹ 165",
    passengers: 1,
    vehicleType: "Car"
  }
];

const DriverView = () => {
  const [radius, setRadius] = useState([20]);
  const [acceptedRide, setAcceptedRide] = useState<RideRequest | null>(null);
  const [declineCount, setDeclineCount] = useState(0);

  // Map state
  const [currentLocation, setCurrentLocation] = useState<[number, number]>([31.5204, 74.3587]); // Default: Lahore

  // Get driver's current location
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

      // Update location every 10 seconds
      const interval = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCurrentLocation([position.coords.latitude, position.coords.longitude]);
            // TODO: Send location to backend via Socket.IO
          }
        );
      }, 10000);

      return () => clearInterval(interval);
    }
  }, []);

  const handleAccept = (request: RideRequest) => {
    setAcceptedRide(request);
  };

  const handleDecline = () => {
    setDeclineCount(prev => prev + 1);
  };

  const handleCompleteRide = () => {
    setAcceptedRide(null);
  };

  // Prepare markers for the map
  const markers = [
    { position: currentLocation, type: "driver" as const, label: "Your Location" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Map Area */}
      <div className="relative h-[40vh] bg-xoom-surface border-b border-border">
        <Map
          center={currentLocation}
          zoom={14}
          markers={markers}
          className="w-full h-full"
        />

        {/* Stats Bar */}
        <div className="absolute top-4 left-4 right-4 z-[1000]">
          <Card className="xoom-surface-elevated p-3">
            <div className="flex justify-between items-center">
              <div className="text-center flex-1">
                <p className="text-xs text-muted-foreground">Today's Rides</p>
                <p className="text-xl font-bold text-primary">8</p>
              </div>
              <div className="text-center flex-1 border-x border-border">
                <p className="text-xs text-muted-foreground">Earnings</p>
                <p className="text-xl font-bold text-primary">₹ 1,240</p>
              </div>
              <div className="text-center flex-1">
                <p className="text-xs text-muted-foreground">Rating</p>
                <p className="text-xl font-bold text-primary">4.8 ⭐</p>
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
                    {acceptedRide.vehicleType}
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{acceptedRide.fare}</p>
                  <p className="text-xs text-muted-foreground">{acceptedRide.distance}</p>
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

              <div className="flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Call
                </Button>
                <Button variant="secondary" size="sm" className="flex-1 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  WhatsApp
                </Button>
              </div>
            </Card>

            <Button 
              className="w-full h-12 xoom-gradient hover:opacity-90 transition-opacity"
              onClick={handleCompleteRide}
            >
              Complete Ride
            </Button>
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

            {mockRequests.map((request, index) => (
              <Card 
                key={request.id} 
                className="xoom-surface-elevated p-4 animate-slide-up border-l-4 border-l-primary"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <Badge variant="secondary" className="mb-2">
                      {request.vehicleType}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {request.passengers} passenger{request.passengers > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary">{request.fare}</p>
                    <p className="text-xs text-muted-foreground">{request.distance}</p>
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
                    onClick={handleDecline}
                  >
                    Decline
                  </Button>
                  <Button 
                    className="flex-1 xoom-gradient hover:opacity-90"
                    onClick={() => handleAccept(request)}
                  >
                    Accept
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverView;
