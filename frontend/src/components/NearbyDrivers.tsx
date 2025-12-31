import { Car, Bike, CircleDot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { NearbyDriver } from "@/hooks/useNearbyDrivers";

interface NearbyDriversProps {
  drivers: NearbyDriver[];
  onDriverSelect?: (driverId: number) => void;
  selectedDriverIds?: number[];
}

const NearbyDrivers = ({ drivers, onDriverSelect, selectedDriverIds = [] }: NearbyDriversProps) => {
  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'bike':
        return <Bike className="w-4 h-4" />;
      case 'car':
      case 'ac-car':
        return <Car className="w-4 h-4" />;
      case 'rickshaw':
      case 'chinchi':
        return <CircleDot className="w-4 h-4" />;
      default:
        return <Car className="w-4 h-4" />;
    }
  };

  if (drivers.length === 0) {
    return (
      <Card className="xoom-surface-elevated p-4">
        <div className="text-center text-muted-foreground">
          <Car className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No drivers nearby</p>
          <p className="text-xs mt-1">Drivers will appear when they come online</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="xoom-surface-elevated p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Nearby Drivers</h3>
        <Badge variant="secondary" className="text-xs">
          {drivers.length} online
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
        {drivers.map((driver) => {
          const isSelected = selectedDriverIds.includes(driver.id);
          
          return (
            <button
              key={driver.id}
              onClick={() => onDriverSelect?.(driver.id)}
              className={`p-2 rounded-lg border transition-all text-left ${
                isSelected
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/50 hover:bg-secondary/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-full ${isSelected ? 'bg-primary text-white' : 'bg-secondary'}`}>
                  {getVehicleIcon(driver.vehicle_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium capitalize truncate">
                    {driver.vehicle_type}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {driver.distance_km.toFixed(1)} km
                  </p>
                </div>
                {driver.is_verified && (
                  <div className="w-2 h-2 bg-green-500 rounded-full" title="Verified" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
};

export default NearbyDrivers;

