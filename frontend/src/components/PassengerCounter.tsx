import { Minus, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PassengerCounterProps {
  value: number;
  onChange: (value: number) => void;
}

const PassengerCounter = ({ value, onChange }: PassengerCounterProps) => {
  const increment = () => onChange(Math.min(value + 1, 8));
  const decrement = () => onChange(Math.max(value - 1, 1));

  return (
    <Card className="xoom-surface-elevated p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-primary" />
          <div>
            <p className="font-semibold">Passengers</p>
            <p className="text-xs text-muted-foreground">How many are riding?</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="icon"
            onClick={decrement}
            disabled={value <= 1}
            className="h-8 w-8 rounded-full"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <span className="text-xl font-bold w-8 text-center">{value}</span>
          <Button
            variant="secondary"
            size="icon"
            onClick={increment}
            disabled={value >= 8}
            className="h-8 w-8 rounded-full"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default PassengerCounter;
