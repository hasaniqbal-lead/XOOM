import { useState, useEffect, useRef } from "react";
import { Car, Bike, CircleDot, ChevronLeft, ChevronRight } from "lucide-react";
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
  { id: "bike", name: "Bike", icon: <Bike className="w-6 h-6" />, capacity: 1, basePrice: "PKR 50" },
  { id: "rickshaw", name: "Rickshaw", icon: <CircleDot className="w-6 h-6" />, capacity: 3, basePrice: "PKR 80" },
  { id: "car", name: "Car", icon: <Car className="w-6 h-6" />, capacity: 4, basePrice: "PKR 120" },
  { id: "ac-car", name: "AC Car", icon: <Car className="w-6 h-6" />, capacity: 4, basePrice: "PKR 150" },
  { id: "chinchi", name: "Chinchi", icon: <CircleDot className="w-6 h-6" />, capacity: 6, basePrice: "PKR 100" },
];

interface VehicleSelectorProps {
  selectedVehicle: string | null;
  onSelectVehicle: (vehicleId: string) => void;
}

const VehicleSelector = ({ selectedVehicle, onSelectVehicle }: VehicleSelectorProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Check if content overflows and update scroll indicators
  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftScroll(scrollLeft > 5);
      setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    checkScroll();
    const handleResize = () => checkScroll();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll buttons
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Mouse drag to scroll
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
    scrollRef.current.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      if (scrollRef.current) {
        scrollRef.current.style.cursor = 'grab';
      }
    }
  };

  return (
    <div className="relative group">
      {/* Left Scroll Button */}
      {showLeftScroll && (
        <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center pointer-events-none">
          <button
            onClick={() => scroll('left')}
            className="pointer-events-auto bg-background/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-background hover:scale-110 transition-all ml-1 border border-border"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 text-primary" />
          </button>
        </div>
      )}
      
      {/* Left Fade Gradient */}
      {showLeftScroll && (
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background via-background/50 to-transparent pointer-events-none z-[5]" />
      )}

      {/* Scrollable Container */}
      <div 
        ref={scrollRef}
        onScroll={checkScroll}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className="overflow-x-auto scrollbar-hide scroll-smooth"
        style={{ 
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div className="flex gap-3 pb-2 px-1">
          {vehicles.map((vehicle) => (
            <Card
              key={vehicle.id}
              onClick={() => !isDragging && onSelectVehicle(vehicle.id)}
              className={cn(
                "xoom-surface-elevated p-4 cursor-pointer transition-all hover:scale-105 flex-shrink-0 w-32 select-none",
                selectedVehicle === vehicle.id && "border-primary xoom-glow ring-2 ring-primary/20"
              )}
            >
              <div className="flex flex-col items-center text-center gap-2">
                <div className={cn(
                  "p-3 rounded-full bg-secondary transition-colors",
                  selectedVehicle === vehicle.id && "bg-primary text-primary-foreground"
                )}>
                  {vehicle.icon}
                </div>
                <div>
                  <p className="font-semibold text-sm">{vehicle.name}</p>
                  <p className="text-xs text-muted-foreground">Up to {vehicle.capacity}</p>
                  <p className="text-primary font-bold mt-1 text-sm">{vehicle.basePrice}+</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Right Fade Gradient */}
      {showRightScroll && (
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background via-background/50 to-transparent pointer-events-none z-[5]" />
      )}

      {/* Right Scroll Button */}
      {showRightScroll && (
        <div className="absolute right-0 top-0 bottom-0 z-10 flex items-center pointer-events-none">
          <button
            onClick={() => scroll('right')}
            className="pointer-events-auto bg-background/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-background hover:scale-110 transition-all mr-1 border border-border"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 text-primary" />
          </button>
        </div>
      )}

      {/* Mobile Swipe Hint (appears briefly on first load) */}
      {showRightScroll && (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground opacity-50 animate-pulse md:hidden">
          Swipe to see more →
        </div>
      )}
    </div>
  );
};

export default VehicleSelector;
