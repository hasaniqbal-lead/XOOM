import { useState, useEffect } from "react";
import { MapPin, Users, Navigation, Clock, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LocationInput from "./LocationInput";
import VehicleSelector from "./VehicleSelector";
import PassengerCounter from "./PassengerCounter";
import Map from "./Map";

const RiderView = () => {
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropLocation, setDropLocation] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showShared, setShowShared] = useState(false);

  // Map state
  const [currentLocation, setCurrentLocation] = useState<[number, number]>([31.5204, 74.3587]); // Default: Lahore
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [dropCoords, setDropCoords] = useState<[number, number] | null>(null);

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

  const handleRequestRide = () => {
    if (!pickupLocation || !dropLocation || !selectedVehicle) {
      return;
    }
    // Handle ride request logic
    console.log("Requesting ride...", { pickupLocation, dropLocation, passengers, selectedVehicle });
  };

  // Prepare markers for the map
  const markers = [];
  if (pickupCoords) {
    markers.push({ position: pickupCoords, type: "pickup" as const, label: "Pickup Location" });
  }
  if (dropCoords) {
    markers.push({ position: dropCoords, type: "dropoff" as const, label: "Drop Location" });
  }

  const handleMapClick = (latlng: { lat: number; lng: number }) => {
    // Set pickup first, then drop
    if (!pickupCoords) {
      setPickupCoords([latlng.lat, latlng.lng]);
      setPickupLocation(`${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`);
    } else if (!dropCoords) {
      setDropCoords([latlng.lat, latlng.lng]);
      setDropLocation(`${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Map Area */}
      <div className="relative h-[45vh] bg-xoom-surface border-b border-border">
        <Map
          center={currentLocation}
          zoom={13}
          markers={markers}
          onMapClick={handleMapClick}
          className="w-full h-full"
        />

        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-background/80 to-transparent z-[1000]">
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
          {/* Location Inputs */}
          <div className="space-y-3">
            <LocationInput
              icon={<Navigation className="w-5 h-5 text-primary" />}
              placeholder="Pickup location"
              value={pickupLocation}
              onChange={setPickupLocation}
            />
            <LocationInput
              icon={<MapPin className="w-5 h-5 text-destructive" />}
              placeholder="Drop location"
              value={dropLocation}
              onChange={setDropLocation}
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
          {selectedVehicle && pickupLocation && dropLocation && (
            <Card className="xoom-surface-elevated p-4 animate-fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-muted-foreground text-sm">Estimated Fare</p>
                  <p className="font-display text-2xl font-bold text-primary">₹ 145</p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  ~15 min
                </Badge>
              </div>
            </Card>
          )}

          {/* Request Button */}
          <Button 
            className="w-full h-14 text-lg font-semibold xoom-gradient hover:opacity-90 transition-opacity"
            size="lg"
            onClick={handleRequestRide}
            disabled={!pickupLocation || !dropLocation || !selectedVehicle}
          >
            Request a XOOM
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RiderView;
