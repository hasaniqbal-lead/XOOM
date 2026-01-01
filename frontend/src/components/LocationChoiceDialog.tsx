import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LocationChoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: string;
  coordinates: [number, number];
  onSelectPickup: () => void;
  onSelectDrop: () => void;
}

const LocationChoiceDialog = ({
  open,
  onOpenChange,
  address,
  coordinates,
  onSelectPickup,
  onSelectDrop,
}: LocationChoiceDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="xoom-surface-elevated">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Navigation className="text-primary" />
            Use Current Location
          </DialogTitle>
          <DialogDescription>
            Choose how to use this location
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          {/* Address Preview */}
          <div className="p-3 bg-secondary/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Your location</p>
            <p className="text-sm font-medium">{address}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {coordinates[0].toFixed(6)}, {coordinates[1].toFixed(6)}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={onSelectPickup}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <MapPin className="w-5 h-5 mr-2" />
              Use as Pickup Location
            </Button>
            
            <Button
              onClick={onSelectDrop}
              className="w-full xoom-gradient"
              size="lg"
            >
              <MapPin className="w-5 h-5 mr-2" />
              Use as Drop-off Location
            </Button>
          </div>

          {/* Info text */}
          <p className="text-xs text-center text-muted-foreground">
            The map has been centered at your current location
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationChoiceDialog;

