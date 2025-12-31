import { MapPin, MapPinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PinModeSelectorProps {
  pinMode: 'pickup' | 'drop' | null;
  onModeChange: (mode: 'pickup' | 'drop' | null) => void;
  pickupSet: boolean;
  dropSet: boolean;
}

const PinModeSelector = ({ pinMode, onModeChange, pickupSet, dropSet }: PinModeSelectorProps) => {
  return (
    <Card className="xoom-surface-elevated p-3 mb-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-2">
            {pinMode ? "Tap map to set location" : "Choose location to set"}
          </p>
          <div className="flex gap-2">
            <Button
              variant={pinMode === 'pickup' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onModeChange(pinMode === 'pickup' ? null : 'pickup')}
              className={cn(
                "flex-1 transition-all",
                pickupSet && "border-green-500",
                pinMode === 'pickup' && "xoom-gradient"
              )}
            >
              <MapPin className="w-4 h-4 mr-1" />
              {pickupSet ? "✓ Pickup" : "Set Pickup"}
            </Button>
            
            <Button
              variant={pinMode === 'drop' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onModeChange(pinMode === 'drop' ? null : 'drop')}
              className={cn(
                "flex-1 transition-all",
                dropSet && "border-green-500",
                pinMode === 'drop' && "xoom-gradient"
              )}
            >
              <MapPin className="w-4 h-4 mr-1" />
              {dropSet ? "✓ Drop" : "Set Drop"}
            </Button>
          </div>
        </div>
        
        {pinMode && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onModeChange(null)}
            className="shrink-0"
          >
            <MapPinOff className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      {pinMode && (
        <div className="mt-2 p-2 bg-primary/10 rounded-md animate-pulse">
          <p className="text-xs text-primary font-medium text-center">
            👆 Tap the map to set {pinMode} location
          </p>
        </div>
      )}
    </Card>
  );
};

export default PinModeSelector;

