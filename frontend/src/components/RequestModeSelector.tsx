import { Target, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface RequestModeSelectorProps {
  mode: 'direct' | 'broadcast' | null;
  onModeChange: (mode: 'direct' | 'broadcast') => void;
  nearbyDriversCount: number;
}

const RequestModeSelector = ({ mode, onModeChange, nearbyDriversCount }: RequestModeSelectorProps) => {
  return (
    <Card className="xoom-surface-elevated p-4 mb-3">
      <h3 className="font-semibold mb-3 text-sm">Choose Request Method</h3>
      
      <div className="space-y-2">
        <Button
          variant={mode === 'direct' ? 'default' : 'outline'}
          onClick={() => onModeChange('direct')}
          className={cn(
            "w-full justify-start h-auto p-4 transition-all",
            mode === 'direct' && "xoom-gradient"
          )}
        >
          <div className="flex items-start gap-3 w-full">
            <Target className="w-5 h-5 mt-0.5 shrink-0" />
            <div className="text-left flex-1">
              <div className="font-semibold">Send to Specific Drivers</div>
              <div className="text-xs opacity-90 mt-1">
                Select 1-2 drivers you prefer. Higher acceptance rate.
              </div>
              {nearbyDriversCount === 0 && (
                <div className="text-xs text-yellow-300 mt-1">
                  ⚠ No drivers available to select
                </div>
              )}
            </div>
          </div>
        </Button>
        
        <Button
          variant={mode === 'broadcast' ? 'default' : 'outline'}
          onClick={() => onModeChange('broadcast')}
          className={cn(
            "w-full justify-start h-auto p-4 transition-all",
            mode === 'broadcast' && "xoom-gradient"
          )}
        >
          <div className="flex items-start gap-3 w-full">
            <Radio className="w-5 h-5 mt-0.5 shrink-0" />
            <div className="text-left flex-1">
              <div className="font-semibold">Broadcast to All Nearby</div>
              <div className="text-xs opacity-90 mt-1">
                Send request to all drivers nearby. First to accept gets the ride.
              </div>
            </div>
          </div>
        </Button>
      </div>

      {mode === 'direct' && (
        <div className="mt-3 p-2 bg-primary/10 rounded-md">
          <p className="text-xs text-primary font-medium">
            📍 Tap driver icons on the map or list to select (max 2)
          </p>
        </div>
      )}
    </Card>
  );
};

export default RequestModeSelector;

