import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Phone, Star, LogOut, History, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
  });

  const handleSave = () => {
    // TODO: Call API to update profile
    toast.success("Profile updated successfully!");
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen xoom-bg">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Profile</h1>
              <p className="text-sm text-muted-foreground">Manage your account</p>
            </div>
            {!isEditing && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6 max-w-2xl">
        {/* Profile Info Card */}
        <Card className="xoom-surface-elevated p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-sm text-muted-foreground capitalize">
                {user.role}
              </p>
              {user.average_rating > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">
                    {user.average_rating.toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({user.total_ratings || 0} ratings)
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator className="my-6" />

          {/* Editable Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                disabled={!isEditing}
              />
            </div>

            {isEditing && (
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setFormData({
                      name: user.name,
                      phone: user.phone,
                    });
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 xoom-gradient"
                  onClick={handleSave}
                >
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="xoom-surface-elevated p-4">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => navigate("/history")}
            >
              <History className="w-5 h-5 mr-3" />
              Ride History
            </Button>
            {user.role === "driver" && (
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => navigate("/earnings")}
              >
                <Star className="w-5 h-5 mr-3" />
                My Earnings
              </Button>
            )}
          </div>
        </Card>

        {/* Account Actions */}
        <Card className="xoom-surface-elevated p-4">
          <h3 className="font-semibold mb-4">Account</h3>
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </div>
        </Card>

        {/* App Info */}
        <div className="text-center text-sm text-muted-foreground py-4">
          <p className="font-display font-bold">
            <span className="text-primary">X</span>OOM
          </p>
          <p>Version 1.0.0</p>
          <p className="mt-2">
            Made with ❤️ for better rides
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
