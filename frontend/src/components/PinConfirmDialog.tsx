import { MapPin, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PinConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pinType: 'pickup' | 'drop' | null;
  address: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const PinConfirmDialog = ({
  open,
  onOpenChange,
  pinType,
  address,
  onConfirm,
  onCancel,
}: PinConfirmDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="xoom-surface-elevated">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className={pinType === 'pickup' ? "text-green-500" : "text-red-500"} />
            Confirm {pinType === 'pickup' ? 'Pickup' : 'Drop'} Location
          </DialogTitle>
          <DialogDescription>
            Is this the correct location?
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="p-3 bg-secondary/50 rounded-lg">
            <p className="text-sm font-medium">{address}</p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 xoom-gradient"
          >
            <Check className="w-4 h-4 mr-1" />
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PinConfirmDialog;

