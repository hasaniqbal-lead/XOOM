import { Car, Bike, CircleDot } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Vehicle {
  id: string;
  name: string;
  icon: React.ReactNode;
  capacity: number;
  basePrice: string;
}

const vehicles: Vehicle[] = [
  { id: "bike", name: "Bike", icon: <Bike className="w-6 h-6" />, capacity: 1, basePrice: "₹ 50" },
  { id: "rickshaw", name: "Rickshaw", icon: <CircleDot className="w-6 h-6" />, capacity: 3, basePrice: "₹ 80" },
  { id: "car", name: "Car", icon: <Car className="w-6 h-6" />, capacity: 4, basePrice: "₹ 120" },
  { id: "ac-car", name: "AC Car", icon: <Car className="w-6 h-6" />, capacity: 4, basePrice: "₹ 150" },
  { id: "chinchi", name: "Chinchi", icon: <CircleDot className="w-6 h-6" />, capacity: 6, basePrice: "₹ 100" },
];

interface VehicleSelectorProps {
  selectedVehicle: string | null;
  onSelectVehicle: (vehicleId: string) => void;
}

const VehicleSelector = ({ selectedVehicle, onSelectVehicle }: VehicleSelectorProps) => {
  return (
    <div className="overflow-x-auto scrollbar-hide">
      <div className="flex gap-3 pb-2">
        {vehicles.map((vehicle) => (
          <Card
            key={vehicle.id}
            onClick={() => onSelectVehicle(vehicle.id)}
            className={cn(
              "xoom-surface-elevated p-4 cursor-pointer transition-all hover:scale-105 flex-shrink-0 w-32",
              selectedVehicle === vehicle.id && "border-primary xoom-glow"
            )}
          >
            <div className="flex flex-col items-center text-center gap-2">
              <div className={cn(
                "p-3 rounded-full bg-secondary",
                selectedVehicle === vehicle.id && "bg-primary text-primary-foreground"
              )}>
                {vehicle.icon}
              </div>
              <div>
                <p className="font-semibold text-sm">{vehicle.name}</p>
                <p className="text-xs text-muted-foreground">Up to {vehicle.capacity}</p>
                <p className="text-primary font-bold mt-1">{vehicle.basePrice}+</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default VehicleSelector;
