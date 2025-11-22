import { User, CarFront } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModeToggleProps {
  mode: "rider" | "driver";
  onModeChange: (mode: "rider" | "driver") => void;
}

const ModeToggle = ({ mode, onModeChange }: ModeToggleProps) => {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onModeChange("rider")}
        className={cn(
          "p-2 rounded-full transition-all",
          mode === "rider" 
            ? "xoom-gradient text-primary-foreground" 
            : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
        )}
        title="Rider Mode"
      >
        <User className="w-5 h-5" />
      </button>
      <button
        onClick={() => onModeChange("driver")}
        className={cn(
          "p-2 rounded-full transition-all",
          mode === "driver" 
            ? "xoom-gradient text-primary-foreground" 
            : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
        )}
        title="Driver Mode"
      >
        <CarFront className="w-5 h-5" />
      </button>
    </div>
  );
};

export default ModeToggle;
