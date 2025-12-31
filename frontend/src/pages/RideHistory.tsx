import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Navigation, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ridesAPI } from "@/services/api";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface Ride {
  id: number;
  pickup_lat: number;
  pickup_lng: number;
  drop_lat: number;
  drop_lng: number;
  status: string;
  estimated_fare: number;
  final_fare: number;
  distance_km: number;
  created_at: string;
  completed_at: string;
  driver_name?: string;
  rider_name?: string;
  rating?: number;
}

const RideHistory = () => {
  const navigate = useNavigate();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    loadRides();
  }, [filter]);

  const loadRides = async () => {
    try {
      setLoading(true);
      const params = filter !== "all" ? { status: filter } : {};
      const response = await ridesAPI.getRides(params);
      setRides(response.data);
    } catch (error) {
      console.error("Failed to load rides:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-500";
      case "cancelled":
        return "bg-red-500/10 text-red-500";
      case "in_progress":
        return "bg-blue-500/10 text-blue-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  return (
    <div className="min-h-screen xoom-bg">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Ride History</h1>
              <p className="text-sm text-muted-foreground">View your past rides</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {["all", "completed", "cancelled", "in_progress"].map((status) => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(status)}
              className="capitalize"
            >
              {status.replace("_", " ")}
            </Button>
          ))}
        </div>
      </div>

      {/* Rides List */}
      <div className="container mx-auto px-4 pb-6 space-y-4">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="space-y-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-8 w-24" />
              </div>
            </Card>
          ))
        ) : rides.length === 0 ? (
          // Empty state
          <Card className="p-12 text-center">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No rides found</h3>
            <p className="text-muted-foreground">
              {filter === "all"
                ? "You haven't taken any rides yet"
                : `No ${filter.replace("_", " ")} rides`}
            </p>
          </Card>
        ) : (
          // Rides
          rides.map((ride) => (
            <Card
              key={ride.id}
              className="xoom-surface-elevated p-4 hover:border-primary transition-colors cursor-pointer"
              onClick={() => navigate(`/ride/${ride.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={getStatusColor(ride.status)}>
                      {ride.status}
                    </Badge>
                    {ride.completed_at && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(ride.completed_at), "MMM d, yyyy")}
                      </span>
                    )}
                  </div>
                  {ride.driver_name && (
                    <p className="text-sm text-muted-foreground">
                      Driver: {ride.driver_name}
                    </p>
                  )}
                  {ride.rider_name && (
                    <p className="text-sm text-muted-foreground">
                      Rider: {ride.rider_name}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">
                    PKR {ride.final_fare || ride.estimated_fare}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {ride.distance_km.toFixed(1)} km
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Navigation className="w-4 h-4 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Pickup</p>
                    <p className="text-sm">
                      {ride.pickup_lat.toFixed(4)}, {ride.pickup_lng.toFixed(4)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-destructive mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Drop-off</p>
                    <p className="text-sm">
                      {ride.drop_lat.toFixed(4)}, {ride.drop_lng.toFixed(4)}
                    </p>
                  </div>
                </div>
              </div>

              {ride.rating && (
                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{ride.rating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">rating</span>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default RideHistory;
