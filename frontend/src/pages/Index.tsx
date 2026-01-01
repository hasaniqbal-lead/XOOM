import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import RiderView from "@/components/RiderView";
import DriverView from "@/components/DriverView";
import ModeToggle from "@/components/ModeToggle";
import DriverRegistration from "@/components/DriverRegistration";
import UserRegistration from "@/components/UserRegistration";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/config/currency";
import axios from "axios";

type ViewType = "main" | "driver-register" | "user-register";

const Index = () => {
  const [mode, setMode] = useState<"rider" | "driver">("rider");
  const [currentView, setCurrentView] = useState<ViewType>("main");
  const [guestData, setGuestData] = useState<{ name: string; contact: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [driverStats, setDriverStats] = useState<{ total_rides: number; earnings_today: number } | null>(null);
  const { user } = useAuth();

  // Fetch driver stats when user is a driver
  useEffect(() => {
    const fetchDriverStats = async () => {
      if (user && user.role === 'driver') {
        try {
          const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/driver/stats`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
          if (response.data.success) {
            setDriverStats(response.data.stats);
          }
        } catch (error) {
          console.error('Failed to fetch driver stats:', error);
        }
      }
    };

    fetchDriverStats();
  }, [user]);

  const handleGuestContinue = (name: string, contact: string) => {
    setGuestData({ name, contact });
    setCurrentView("main");
    setMenuOpen(false);
  };

  const handleRegisterClick = (type: ViewType) => {
    setCurrentView(type);
    setMenuOpen(false);
  };

  if (currentView === "driver-register") {
    return <DriverRegistration onBack={() => setCurrentView("main")} />;
  }

  if (currentView === "user-register") {
    return <UserRegistration onBack={() => setCurrentView("main")} onGuestContinue={handleGuestContinue} />;
  }

  return (
    <div className="mobile-app-container min-h-screen-mobile">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border safe-top">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-2xl font-bold">
              <span className="text-primary">X</span>
              <span className="text-foreground">OOM</span>
            </h1>

            <div className="flex items-center gap-4">
              <ModeToggle mode={mode} onModeChange={setMode} />
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="touch-target">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                    <SheetDescription>
                      Access registration and other options
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    {!guestData && (
                      <>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => handleRegisterClick("user-register")}
                        >
                          Register as Rider
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => handleRegisterClick("driver-register")}
                        >
                          Register as Driver
                        </Button>
                      </>
                    )}
                    {mode === "driver" && user && user.role === "driver" && (
                      <div className="pt-4 border-t border-border space-y-2">
                        <h3 className="font-semibold text-sm text-muted-foreground">Driver Stats</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Total Rides:</span>
                            <span className="font-semibold">{driverStats?.total_rides || 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Earnings Today:</span>
                            <span className="font-semibold text-primary">{formatCurrency(driverStats?.earnings_today || 0)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Rating:</span>
                            <span className="font-semibold">{user?.average_rating?.toFixed(1) || "N/A"} ⭐</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="animate-fade-in">
        {mode === "rider" ? <RiderView guestData={guestData} /> : <DriverView />}
      </main>
    </div>
  );
};

export default Index;
