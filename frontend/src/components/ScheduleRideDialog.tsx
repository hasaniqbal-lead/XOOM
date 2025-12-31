import { useState } from "react";
import { Clock, Calendar, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ScheduleRideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedule: (scheduledTime: Date) => void;
  loading?: boolean;
}

const ScheduleRideDialog = ({
  open,
  onOpenChange,
  onSchedule,
  loading = false,
}: ScheduleRideDialogProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleSchedule = () => {
    if (!selectedDate || !selectedTime) {
      setError("Please select both date and time");
      return;
    }

    const [hours, minutes] = selectedTime.split(":").map(Number);
    const scheduledDateTime = new Date(selectedDate);
    scheduledDateTime.setHours(hours, minutes, 0, 0);

    const now = new Date();
    const maxDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (scheduledDateTime <= now) {
      setError("Scheduled time must be in the future");
      return;
    }

    if (scheduledDateTime > maxDate) {
      setError("Cannot schedule more than 7 days in advance");
      return;
    }

    setError("");
    onSchedule(scheduledDateTime);
  };

  const handleCancel = () => {
    setSelectedDate(undefined);
    setSelectedTime("");
    setError("");
    onOpenChange(false);
  };

  // Disable past dates
  const disablePastDates = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Disable dates more than 7 days in future
  const disableFarFuture = (date: Date) => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);
    return date > maxDate;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="xoom-surface-elevated max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Schedule Your Ride
          </DialogTitle>
          <DialogDescription>
            Choose a date and time for your ride (up to 7 days in advance)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date Selection */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Select Date</Label>
            <div className="border rounded-lg p-2 xoom-surface">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => disablePastDates(date) || disableFarFuture(date)}
                className="rounded-md"
              />
            </div>
          </div>

          {/* Time Selection */}
          <div>
            <Label htmlFor="time" className="text-sm font-medium mb-2 block">
              Select Time
            </Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="time"
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Preview */}
          {selectedDate && selectedTime && (
            <div className="p-3 bg-primary/10 rounded-lg">
              <p className="text-sm font-medium text-primary">Scheduled for:</p>
              <p className="text-sm mt-1">
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              <p className="text-sm">at {selectedTime}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
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
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
          <Button
            onClick={handleSchedule}
            disabled={!selectedDate || !selectedTime || loading}
            className="flex-1 xoom-gradient"
          >
            <Check className="w-4 h-4 mr-1" />
            {loading ? "Scheduling..." : "Schedule Ride"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleRideDialog;

