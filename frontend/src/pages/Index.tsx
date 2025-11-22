import { useState } from "react";
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

type ViewType = "main" | "driver-register" | "user-register";

const Index = () => {
  const [mode, setMode] = useState<"rider" | "driver">("rider");
  const [currentView, setCurrentView] = useState<ViewType>("main");
  const [guestData, setGuestData] = useState<{ name: string; contact: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
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
                  <Button variant="ghost" size="icon">
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
                    {mode === "driver" && (
                      <div className="pt-4 border-t border-border space-y-2">
                        <h3 className="font-semibold text-sm text-muted-foreground">Driver Stats</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Total Rides:</span>
                            <span className="font-semibold">142</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Earnings Today:</span>
                            <span className="font-semibold text-primary">₹ 2,450</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Rating:</span>
                            <span className="font-semibold">4.8 ⭐</span>
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
        {mode === "rider" ? <RiderView /> : <DriverView />}
      </main>
    </div>
  );
};

export default Index;
