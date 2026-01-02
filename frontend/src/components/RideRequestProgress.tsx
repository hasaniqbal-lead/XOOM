import { useState, useEffect } from "react";
import { MapPin, Car, Users, Clock, X, Edit2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/config/currency";

interface RideRequestProgressProps {
  ride: {
    id: number;
    pickup_address: string;
    drop_address: string;
    vehicle_type: string;
    passengers: number;
    estimated_fare: number;
    created_at: string;
    status: string;
  };
  timeoutSeconds?: number;
  onCancel: () => void;
  onEdit: () => void;
}

const RideRequestProgress = ({
  ride,
  timeoutSeconds = 300, // 5 minutes default
  onCancel,
  onEdit,
}: RideRequestProgressProps) => {
  const [secondsRemaining, setSecondsRemaining] = useState(timeoutSeconds);
  const [isExpired, setIsExpired] = useState(false);

  // Calculate seconds remaining based on created_at
  useEffect(() => {
    const createdAt = new Date(ride.created_at).getTime();
    const expiresAt = createdAt + timeoutSeconds * 1000;
    
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setSecondsRemaining(remaining);
      
      if (remaining <= 0) {
        setIsExpired(true);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [ride.created_at, timeoutSeconds]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate progress percentage (100% = just started, 0% = expired)
  const progressPercent = (secondsRemaining / timeoutSeconds) * 100;

  // Get vehicle display name
  const getVehicleDisplay = (type: string) => {
    const vehicles: Record<string, string> = {
      car: "Car",
      "ac-car": "AC Car",
      rickshaw: "Rikshaw",
      bike: "Bike",
      chinchi: "Chinchi",
    };
    return vehicles[type] || "Car";
  };

  // Truncate address for display
  const truncateAddress = (address: string, maxLength = 30) => {
    if (address.length <= maxLength) return address;
    return address.substring(0, maxLength) + "...";
  };

  if (isExpired) {
    return (
      <Card className="xoom-surface-elevated p-6 border-destructive/50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <Clock className="w-8 h-8 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Request Expired</h3>
            <p className="text-muted-foreground text-sm">
              No drivers available. Please try again.
            </p>
          </div>
          <Button onClick={onEdit} className="w-full xoom-gradient">
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="xoom-surface-elevated overflow-hidden">
      {/* Progress Bar */}
      <div className="relative">
        <Progress 
          value={progressPercent} 
          className="h-2 rounded-none"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent animate-pulse" />
      </div>

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold">Looking for drivers...</h3>
              <p className="text-sm text-muted-foreground">
                {formatTime(secondsRemaining)} remaining
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-primary font-display">
              {formatCurrency(ride.estimated_fare)}
            </span>
          </div>
        </div>

        {/* Route Summary */}
        <div className="bg-secondary/30 rounded-lg p-3 space-y-2">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Pickup</p>
              <p className="text-sm font-medium">{truncateAddress(ride.pickup_address)}</p>
            </div>
          </div>
          <div className="ml-1 border-l-2 border-dashed border-muted h-3" />
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-primary mt-2" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Drop-off</p>
              <p className="text-sm font-medium">{truncateAddress(ride.drop_address)}</p>
            </div>
          </div>
        </div>

        {/* Ride Details */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Car className="w-4 h-4" />
            <span>{getVehicleDisplay(ride.vehicle_type)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{ride.passengers} passenger{ride.passengers > 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onEdit}
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onCancel}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default RideRequestProgress;

