import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2 } from "lucide-react";
import { reviewsAPI } from "@/services/api";
import { toast } from "sonner";

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  rideId: number;
  revieweeId: number;
  revieweeName: string;
  revieweeRole: "rider" | "driver";
}

const ReviewModal = ({
  open,
  onClose,
  rideId,
  revieweeId,
  revieweeName,
  revieweeRole,
}: ReviewModalProps) => {
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await reviewsAPI.createReview({
        ride_id: rideId,
        reviewee_id: revieweeId,
        rating,
        review_text: reviewText,
      });
      toast.success("Review submitted! Thank you for your feedback.");
      onClose();
    } catch (error) {
      toast.error("Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate your {revieweeRole}</DialogTitle>
          <DialogDescription>
            How was your experience with {revieweeName}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Rating Text */}
            <p className="text-sm font-medium">
              {rating === 5 && "Excellent"}
              {rating === 4 && "Good"}
              {rating === 3 && "Average"}
              {rating === 2 && "Below Average"}
              {rating === 1 && "Poor"}
            </p>
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Additional Comments (Optional)
            </label>
            <Textarea
              placeholder={`Share your experience with ${revieweeName}...`}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full xoom-gradient hover:opacity-90"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Review"
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={loading}
            className="w-full"
          >
            Skip for now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewModal;
