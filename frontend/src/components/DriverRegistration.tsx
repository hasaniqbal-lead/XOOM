import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Upload, ArrowLeft } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface DriverRegistrationProps {
  onBack: () => void;
}

const DriverRegistration = ({ onBack }: DriverRegistrationProps) => {
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    email: "",
    vehicleDetails: "",
  });
  
  const [files, setFiles] = useState({
    carPhoto: null as File | null,
    cnicPhoto: null as File | null,
    selfieWithCnic: null as File | null,
  });

  const handleFileChange = (field: keyof typeof files, file: File | null) => {
    setFiles(prev => ({ ...prev, [field]: file }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle registration logic
    console.log("Driver registration:", formData, files);
  };

  return (
    <div className="min-h-screen xoom-bg p-4">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="xoom-surface-elevated p-6">
          <h1 className="text-2xl font-bold mb-6 text-center">Driver Registration</h1>
          
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

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicleDetails">Vehicle Details</Label>
              <Textarea
                id="vehicleDetails"
                placeholder="Make, model, year, license plate..."
                value={formData.vehicleDetails}
                onChange={(e) => setFormData({...formData, vehicleDetails: e.target.value})}
                required
              />
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="font-semibold text-lg">Verification Documents</h3>
              
              <div className="space-y-2">
                <Label htmlFor="carPhoto">Vehicle Photo</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="carPhoto"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange('carPhoto', e.target.files?.[0] || null)}
                    required
                    className="flex-1"
                  />
                  <Upload className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnicPhoto">CNIC Photo</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="cnicPhoto"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange('cnicPhoto', e.target.files?.[0] || null)}
                    required
                    className="flex-1"
                  />
                  <Upload className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="selfieWithCnic">Selfie with CNIC</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="selfieWithCnic"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange('selfieWithCnic', e.target.files?.[0] || null)}
                    required
                    className="flex-1"
                  />
                  <Upload className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full xoom-gradient">
              Submit Registration
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default DriverRegistration;
