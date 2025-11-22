import { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface LocationInputProps {
  icon: ReactNode;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

const LocationInput = ({ icon, placeholder, value, onChange }: LocationInputProps) => {
  return (
    <Card className="xoom-surface-elevated p-1">
      <div className="flex items-center gap-3 px-3">
        {icon}
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-12"
        />
      </div>
    </Card>
  );
};

export default LocationInput;
