import { useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

interface CancelRideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string, customReason?: string) => void;
  loading?: boolean;
  rideStatus?: string;
}

const CANCEL_REASONS = [
  { value: "driver_late", label: "Driver is taking too long" },
  { value: "wrong_location", label: "Wrong pickup location" },
  { value: "changed_plans", label: "My plans changed" },
  { value: "found_alternative", label: "Found alternative transport" },
  { value: "driver_issue", label: "Issue with driver" },
  { value: "other", label: "Other reason" },
];

const CancelRideDialog = ({
  open,
  onOpenChange,
  onConfirm,
  loading = false,
  rideStatus = "requested",
}: CancelRideDialogProps) => {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");

  const handleConfirm = () => {
    if (!selectedReason) return;
    onConfirm(selectedReason, customReason || undefined);
    // Reset state
    setSelectedReason("");
    setCustomReason("");
  };

  const handleCancel = () => {
    setSelectedReason("");
    setCustomReason("");
    onOpenChange(false);
  };

  // Show cancellation fee warning for certain statuses
  const showFeeWarning = ["accepted", "arrived", "on_trip"].includes(rideStatus);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="xoom-surface-elevated max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            Cancel Ride
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this ride?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {showFeeWarning && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">
                ⚠ Cancellation Fee May Apply
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Cancelling after driver acceptance may incur a small fee.
              </p>
            </div>
          )}

          <div>
            <Label className="text-sm font-medium mb-2 block">
              Reason for Cancellation
            </Label>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
              <div className="space-y-2">
                {CANCEL_REASONS.map((reason) => (
                  <div key={reason.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={reason.value} id={reason.value} />
                    <Label
                      htmlFor={reason.value}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {reason.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {selectedReason === "other" && (
            <div>
              <Label htmlFor="custom-reason" className="text-sm font-medium mb-2 block">
                Please specify
              </Label>
              <Textarea
                id="custom-reason"
                placeholder="Tell us why you're cancelling..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="flex-1"
          >
            Keep Ride
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!selectedReason || loading}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-1" />
            {loading ? "Cancelling..." : "Cancel Ride"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CancelRideDialog;

