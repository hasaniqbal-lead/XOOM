import { Target, Clock, Share2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LocationActionBarProps {
  onCurrentLocation: () => void;
  onSchedule: () => void;
  onShareRide: () => void;
  showSchedule: boolean;
  showShared: boolean;
  isLoadingLocation: boolean;
}

const LocationActionBar = ({
  onCurrentLocation,
  onSchedule,
  onShareRide,
  showSchedule,
  showShared,
  isLoadingLocation,
}: LocationActionBarProps) => {
  return (
    <div className="sticky top-0 z-50 bg-gradient-to-b from-background to-background/95 border-b border-border shadow-sm">
      <div className="flex items-center justify-around px-2 py-3 gap-2">
        {/* Current Location Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onCurrentLocation}
          disabled={isLoadingLocation}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 transition-all",
            "hover:bg-primary/10"
          )}
        >
          {isLoadingLocation ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Target className="w-4 h-4" />
          )}
          <span className="text-xs sm:text-sm font-medium">Current</span>
        </Button>

        {/* Schedule Ride Button */}
        <Button
          variant={showSchedule ? "default" : "outline"}
          size="sm"
          onClick={onSchedule}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 transition-all",
            showSchedule ? "xoom-gradient" : "hover:bg-primary/10"
          )}
        >
          <Clock className="w-4 h-4" />
          <span className="text-xs sm:text-sm font-medium">Schedule</span>
        </Button>

        {/* Share Ride Button */}
        <Button
          variant={showShared ? "default" : "outline"}
          size="sm"
          onClick={onShareRide}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 transition-all",
            showShared ? "xoom-gradient" : "hover:bg-primary/10"
          )}
        >
          <Share2 className="w-4 h-4" />
          <span className="text-xs sm:text-sm font-medium">Share</span>
        </Button>
      </div>
    </div>
  );
};

export default LocationActionBar;

