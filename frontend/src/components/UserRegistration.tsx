import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

interface UserRegistrationProps {
  onBack: () => void;
  onGuestContinue: (name: string, contact: string) => void;
}

const UserRegistration = ({ onBack, onGuestContinue }: UserRegistrationProps) => {
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    email: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuestMode) {
      onGuestContinue(formData.name, formData.contact);
    } else {
      // Handle full registration
      console.log("Full registration:", formData);
    }
  };

  return (
    <div className="min-h-screen xoom-bg p-4">
      <div className="max-w-md mx-auto">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="xoom-surface-elevated p-6">
          <h1 className="text-2xl font-bold mb-6 text-center">
            {isGuestMode ? "Continue as Guest" : "Rider Registration"}
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">Contact Number / WhatsApp</Label>
              <Input
                id="contact"
                type="tel"
                value={formData.contact}
                onChange={(e) => setFormData({...formData, contact: e.target.value})}
                required
              />
            </div>

            {!isGuestMode && (
              <div className="space-y-2">
                <Label htmlFor="email">Email Address (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            )}

            <Button type="submit" className="w-full xoom-gradient">
              {isGuestMode ? "Continue as Guest" : "Register"}
            </Button>

            {isGuestMode && (
              <p className="text-sm text-muted-foreground text-center">
                Note: Guest riders won't receive offers or packages
              </p>
            )}
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsGuestMode(!isGuestMode)}
              className="w-full"
            >
              {isGuestMode ? "Register for full account" : "Continue as Guest instead"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UserRegistration;
