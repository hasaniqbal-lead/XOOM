import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { authAPI } from "@/services/api";

interface UserRegistrationProps {
  onBack: () => void;
  onGuestContinue: (name: string, contact: string) => void;
}

const UserRegistration = ({ onBack, onGuestContinue }: UserRegistrationProps) => {
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    password: "",
    email: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isGuestMode) {
      onGuestContinue(formData.name, formData.contact);
      return;
    }

    // Handle full registration
    try {
      setLoading(true);
      
      // Format phone number to Pakistani format (+92...)
      let phone = formData.contact.replace(/\D/g, ''); // Remove non-digits
      if (phone.startsWith('0')) {
        phone = '92' + phone.substring(1);
      } else if (!phone.startsWith('92')) {
        phone = '92' + phone;
      }
      phone = '+' + phone;

      const response = await authAPI.signup({
        name: formData.name,
        phone: phone,
        password: formData.password,
        role: 'rider'
      });

      if (response.data) {
        toast.success("Registration successful! Please login.");
        setTimeout(() => onBack(), 1500);
      }
    } catch (error: any) {
      const message = error.response?.data?.error || "Registration failed. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-app-container min-h-screen-mobile xoom-bg p-4 safe-top">
      <div className="max-w-md mx-auto">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 touch-target"
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
                placeholder="03XX XXXXXXX"
                value={formData.contact}
                onChange={(e) => setFormData({...formData, contact: e.target.value})}
                required
              />
            </div>

            {!isGuestMode && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </>
            )}

            <Button type="submit" className="w-full xoom-gradient" disabled={loading}>
              {loading ? "Registering..." : isGuestMode ? "Continue as Guest" : "Register"}
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
