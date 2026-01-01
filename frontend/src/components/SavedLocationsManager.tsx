import { useState, useEffect } from "react";
import { MapPin, Plus, Trash2, Edit2, Home, Briefcase, Star, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { locationsAPI } from "@/services/api";
import { toast } from "sonner";

interface SavedLocation {
  id: number;
  label: string;
  address: string;
  lat: number;
  lng: number;
  icon: string;
  is_default_pickup: boolean;
  is_default_drop: boolean;
}

const iconOptions = [
  { value: "home", label: "Home", icon: Home },
  { value: "work", label: "Work", icon: Briefcase },
  { value: "star", label: "Favorite", icon: Star },
  { value: "pin", label: "Pin", icon: MapPin },
];

const getIconComponent = (iconName: string) => {
  const option = iconOptions.find(o => o.value === iconName);
  if (option) {
    const IconComponent = option.icon;
    return <IconComponent className="w-5 h-5" />;
  }
  return <MapPin className="w-5 h-5" />;
};

const SavedLocationsManager = () => {
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingLocation, setEditingLocation] = useState<SavedLocation | null>(null);
  const [formData, setFormData] = useState({
    label: "",
    address: "",
    lat: "",
    lng: "",
    icon: "pin"
  });
  const [saving, setSaving] = useState(false);

  // Fetch saved locations
  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await locationsAPI.getAll();
      setLocations(response.data.locations || []);
    } catch (error) {
      console.error("Error fetching locations:", error);
      toast.error("Failed to load saved locations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  // Reset form
  const resetForm = () => {
    setFormData({
      label: "",
      address: "",
      lat: "",
      lng: "",
      icon: "pin"
    });
    setEditingLocation(null);
  };

  // Open add dialog
  const handleOpenAdd = () => {
    resetForm();
    setShowAddDialog(true);
  };

  // Open edit dialog
  const handleOpenEdit = (location: SavedLocation) => {
    setFormData({
      label: location.label,
      address: location.address,
      lat: location.lat.toString(),
      lng: location.lng.toString(),
      icon: location.icon || "pin"
    });
    setEditingLocation(location);
    setShowAddDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setShowAddDialog(false);
    resetForm();
  };

  // Save location (create or update)
  const handleSave = async () => {
    if (!formData.label.trim() || !formData.address.trim()) {
      toast.error("Please fill in label and address");
      return;
    }

    try {
      setSaving(true);

      const data = {
        label: formData.label.trim(),
        address: formData.address.trim(),
        lat: parseFloat(formData.lat) || 0,
        lng: parseFloat(formData.lng) || 0,
        icon: formData.icon
      };

      if (editingLocation) {
        await locationsAPI.update(editingLocation.id, data);
        toast.success("Location updated");
      } else {
        await locationsAPI.create(data);
        toast.success("Location saved");
      }

      handleCloseDialog();
      fetchLocations();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Failed to save location");
    } finally {
      setSaving(false);
    }
  };

  // Delete location
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this location?")) return;

    try {
      await locationsAPI.delete(id);
      toast.success("Location deleted");
      fetchLocations();
    } catch (error) {
      toast.error("Failed to delete location");
    }
  };

  // Set as default pickup
  const handleSetDefaultPickup = async (id: number) => {
    try {
      await locationsAPI.setDefaultPickup(id);
      toast.success("Set as default pickup");
      fetchLocations();
    } catch (error) {
      toast.error("Failed to set default pickup");
    }
  };

  // Set as default drop
  const handleSetDefaultDrop = async (id: number) => {
    try {
      await locationsAPI.setDefaultDrop(id);
      toast.success("Set as default drop-off");
      fetchLocations();
    } catch (error) {
      toast.error("Failed to set default drop-off");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Saved Locations</h2>
        <Button onClick={handleOpenAdd} size="sm" className="xoom-gradient">
          <Plus className="w-4 h-4 mr-2" />
          Add Location
        </Button>
      </div>

      {locations.length === 0 ? (
        <Card className="xoom-surface-elevated p-8 text-center">
          <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No saved locations yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Save your frequently visited places for quick selection
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {locations.map((location) => (
            <Card key={location.id} className="xoom-surface-elevated p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary/10 text-primary">
                    {getIconComponent(location.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{location.label}</h3>
                      {location.is_default_pickup && (
                        <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">
                          Default Pickup
                        </span>
                      )}
                      {location.is_default_drop && (
                        <span className="text-xs bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full">
                          Default Drop
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {location.address}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenEdit(location)}
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(location.id)}
                    className="text-destructive hover:text-destructive"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Default actions */}
              <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                <Button
                  variant={location.is_default_pickup ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => handleSetDefaultPickup(location.id)}
                  disabled={location.is_default_pickup}
                  className="flex-1"
                >
                  {location.is_default_pickup ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Default Pickup
                    </>
                  ) : (
                    "Set as Pickup"
                  )}
                </Button>
                <Button
                  variant={location.is_default_drop ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => handleSetDefaultDrop(location.id)}
                  disabled={location.is_default_drop}
                  className="flex-1"
                >
                  {location.is_default_drop ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Default Drop
                    </>
                  ) : (
                    "Set as Drop"
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="xoom-surface-elevated">
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? "Edit Location" : "Add Saved Location"}
            </DialogTitle>
            <DialogDescription>
              {editingLocation
                ? "Update the details of your saved location"
                : "Save a location for quick access when booking rides"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                placeholder="e.g., Home, Work, Gym"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Full address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lat">Latitude</Label>
                <Input
                  id="lat"
                  type="number"
                  step="any"
                  placeholder="e.g., 24.8607"
                  value={formData.lat}
                  onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lng">Longitude</Label>
                <Input
                  id="lng"
                  type="number"
                  step="any"
                  placeholder="e.g., 67.0011"
                  value={formData.lng}
                  onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <Select
                value={formData.icon}
                onValueChange={(value) => setFormData({ ...formData, icon: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="w-4 h-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="xoom-gradient">
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              {editingLocation ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SavedLocationsManager;

