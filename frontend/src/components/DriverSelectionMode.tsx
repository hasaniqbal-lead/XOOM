import { useState, useEffect } from "react";
import { X, Send, Radio, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NearbyDriver } from "@/hooks/useNearbyDrivers";
import { cn } from "@/lib/utils";

interface DriverSelectionModeProps {
  selectedDriverIds: number[];
  onDriverIdsChange: (ids: number[]) => void;
  drivers: NearbyDriver[];
  onSendDirect: () => void;
  onFallbackToBroadcast: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const DriverSelectionMode = ({
  selectedDriverIds,
  onDriverIdsChange,
  drivers,
  onSendDirect,
  onFallbackToBroadcast,
  onCancel,
  loading = false,
}: DriverSelectionModeProps) => {
  const [timeLeft, setTimeLeft] = useState(60);
  const [timerActive, setTimerActive] = useState(false);

  const maxSelection = 2;
  const selectedDrivers = drivers.filter(d => selectedDriverIds.includes(d.id));

  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timerActive, timeLeft]);

  const handleToggleDriver = (driverId: number) => {
    if (selectedDriverIds.includes(driverId)) {
      onDriverIdsChange(selectedDriverIds.filter(id => id !== driverId));
    } else if (selectedDriverIds.length < maxSelection) {
      onDriverIdsChange([...selectedDriverIds, driverId]);
    }
  };

  const handleSend = () => {
    setTimerActive(true);
    onSendDirect();
  };

  return (
    <Card className="xoom-surface-elevated p-4 border-2 border-primary">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">Select Drivers</h3>
          <Badge variant="secondary" className="text-xs">
            {selectedDriverIds.length}/{maxSelection}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-8 w-8 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {selectedDrivers.length > 0 ? (
        <div className="space-y-2 mb-3">
          {selectedDrivers.map(driver => (
            <div
              key={driver.id}
              className="flex items-center justify-between p-2 bg-primary/10 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <div>
                  <p className="text-sm font-medium capitalize">{driver.vehicle_type}</p>
                  <p className="text-xs text-muted-foreground">{driver.distance_km.toFixed(1)} km away</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggleDriver(driver.id)}
                className="h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-3 bg-secondary/50 rounded-lg mb-3 text-center">
          <p className="text-sm text-muted-foreground">
            Select {maxSelection} drivers from the map or list
          </p>
        </div>
      )}

      {timerActive && (
        <div className="mb-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-yellow-600" />
              <span className="text-yellow-700 dark:text-yellow-300">Waiting for response...</span>
            </div>
            <Badge variant="outline" className="text-yellow-700 dark:text-yellow-300 border-yellow-500/30">
              {timeLeft}s
            </Badge>
          </div>
          {timeLeft <= 10 && (
            <p className="text-xs text-muted-foreground mt-1">
              Will broadcast to all drivers if no response
            </p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {!timerActive ? (
          <>
            <Button
              onClick={handleSend}
              disabled={selectedDriverIds.length === 0 || loading}
              className="flex-1 xoom-gradient"
            >
              <Send className="w-4 h-4 mr-2" />
              Send to {selectedDriverIds.length || 0}
            </Button>
            
            <Button
              variant="outline"
              onClick={onFallbackToBroadcast}
              className="flex-1"
            >
              <Radio className="w-4 h-4 mr-2" />
              Broadcast Instead
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            onClick={onFallbackToBroadcast}
            className="w-full"
            disabled={timeLeft > 50}
          >
            <Radio className="w-4 h-4 mr-2" />
            Broadcast to All Now
          </Button>
        )}
      </div>
    </Card>
  );
};

export default DriverSelectionMode;

