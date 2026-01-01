import { useState, useEffect } from "react";
import { Clock, MapPin, DollarSign, Car, LogIn, Users, TrendingUp, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import axios from "axios";

interface PublicRideRequest {
  id: number;
  rider_name_masked: string;
  pickup_area: string;
  drop_area: string;
  distance_km: number;
  estimated_fare: number;
  vehicle_type: string;
  passengers: number;
  request_expires_at: string;
  seconds_remaining: number;
  created_at: string;
}

interface Stats {
  active_requests: string;
  completed_today: string;
  active_drivers_today: string;
}

const PublicDriverView = () => {
  const [requests, setRequests] = useState<PublicRideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestTimeout, setRequestTimeout] = useState(120);
  const [stats, setStats] = useState<Stats | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch initial requests and stats
    fetchActiveRequests();
    fetchStats();

    // Connect to public socket namespace
    const socketConnection = io('/public', {
      transports: ['websocket', 'polling'],
      path: '/socket.io'
    });

    socketConnection.on('connect', () => {
      console.log('Connected to public view');
    });

    socketConnection.on('active_requests_initial', (data) => {
      setRequests(data.requests || []);
      setRequestTimeout(data.request_timeout || 120);
      setLoading(false);
    });

    socketConnection.on('new_ride_public', (request: PublicRideRequest) => {
      setRequests(prev => [request, ...prev]);
    });

    socketConnection.on('ride_accepted_public', (data: { ride_id: number }) => {
      setRequests(prev => prev.filter(r => r.id !== data.ride_id));
    });

    socketConnection.on('ride_expired_public', (data: { ride_id: number }) => {
      setRequests(prev => prev.filter(r => r.id !== data.ride_id));
    });

    socketConnection.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    setSocket(socketConnection);

    return () => {
      socketConnection.disconnect();
    };
  }, []);

  // Update timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      setRequests(prev => 
        prev.map(req => ({
          ...req,
          seconds_remaining: Math.max(0, req.seconds_remaining - 1)
        }))
        .filter(req => req.seconds_remaining > 0) // Remove expired
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchActiveRequests = async () => {
    try {
      const response = await axios.get('/api/public/active-requests');
      setRequests(response.data.requests || []);
      setRequestTimeout(response.data.request_timeout || 120);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/public/stats');
      setStats(response.data.stats || null);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleRegisterDriver = () => {
    navigate('/register?role=driver');
  };

  const getUrgencyColor = (secondsRemaining: number) => {
    const percentage = (secondsRemaining / requestTimeout) * 100;
    if (percentage > 66) return "text-green-500 border-green-500";
    if (percentage > 33) return "text-yellow-500 border-yellow-500";
    return "text-red-500 border-red-500 animate-pulse";
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Clock className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg">Loading live ride requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <div className="xoom-gradient text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                See Live Ride Demand!
              </h1>
              <p className="text-xl opacity-90 mb-6">
                Join XOOM as a driver and start earning immediately. 
                Watch real ride requests happening right now.
              </p>
              <Button
                onClick={handleRegisterDriver}
                size="lg"
                variant="secondary"
                className="font-semibold text-lg h-14 px-8"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Register as Driver Now
              </Button>
            </div>
            <div className="hidden md:block">
              <Car className="w-32 h-32 opacity-20" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="xoom-surface-elevated p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <Activity className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active_requests}</p>
                  <p className="text-sm text-muted-foreground">Active Requests</p>
                </div>
              </div>
            </Card>
            
            <Card className="xoom-surface-elevated p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-green-500/10">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.completed_today}</p>
                  <p className="text-sm text-muted-foreground">Completed Today</p>
                </div>
              </div>
            </Card>
            
            <Card className="xoom-surface-elevated p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-blue-500/10">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active_drivers_today}</p>
                  <p className="text-sm text-muted-foreground">Active Drivers</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Active Requests Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Activity className="w-8 h-8 text-primary" />
            Live Ride Requests
          </h2>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {requests.length} Active
          </Badge>
        </div>

        {/* Requests Grid */}
        {requests.length === 0 ? (
          <Card className="p-12 text-center">
            <Clock className="w-20 h-20 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Active Requests</h3>
            <p className="text-muted-foreground mb-6">
              New ride requests will appear here in real-time when customers make requests
            </p>
            <Button onClick={handleRegisterDriver} variant="outline">
              <LogIn className="w-4 h-4 mr-2" />
              Register to Start Earning
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {requests.map((request) => (
              <Card
                key={request.id}
                className="xoom-surface-elevated p-5 relative overflow-hidden hover:shadow-lg transition-all"
              >
                {/* Timer Badge */}
                <div className="absolute top-3 right-3">
                  <Badge 
                    variant="outline" 
                    className={`${getUrgencyColor(request.seconds_remaining)} font-mono text-base px-3 py-1 font-bold`}
                  >
                    <Clock className="w-4 h-4 mr-1" />
                    {formatTime(request.seconds_remaining)}
                  </Badge>
                </div>

                {/* Rider Info (Masked) */}
                <div className="mb-4 pt-8">
                  <p className="text-sm text-muted-foreground">Rider</p>
                  <p className="font-semibold text-lg">{request.rider_name_masked}</p>
                </div>

                {/* Route Info */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">PICKUP</p>
                      <p className="text-sm font-medium truncate">{request.pickup_area}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">DROP</p>
                      <p className="text-sm font-medium truncate">{request.drop_area}</p>
                    </div>
                  </div>
                </div>

                {/* Trip Details */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="p-2 bg-secondary/50 rounded text-center">
                    <p className="text-xs text-muted-foreground">Distance</p>
                    <p className="text-sm font-bold">{request.distance_km.toFixed(1)} km</p>
                  </div>
                  <div className="p-2 bg-primary/10 rounded text-center">
                    <p className="text-xs text-muted-foreground">Fare</p>
                    <p className="text-sm font-bold text-primary">PKR {request.estimated_fare}</p>
                  </div>
                  <div className="p-2 bg-secondary/50 rounded text-center">
                    <p className="text-xs text-muted-foreground">Seats</p>
                    <p className="text-sm font-bold">{request.passengers}</p>
                  </div>
                </div>

                {/* Call to Action */}
                <Button
                  onClick={handleRegisterDriver}
                  className="w-full xoom-gradient font-semibold"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Register to Accept
                </Button>
              </Card>
            ))}
          </div>
        )}

        {/* Info Footer */}
        <Card className="mt-8 p-6 bg-secondary/30">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-primary/10 shrink-0">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">How it Works</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ <strong>Real-time visibility</strong> - See actual ride requests as they happen</li>
                <li>✓ <strong>Privacy protected</strong> - Personal information is hidden for security</li>
                <li>✓ <strong>Quick registration</strong> - Sign up in minutes and start earning today</li>
                <li>✓ <strong>Flexible schedule</strong> - Work when you want, wherever you are</li>
              </ul>
              <Button
                onClick={handleRegisterDriver}
                className="mt-4 xoom-gradient"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Join as Driver Now
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PublicDriverView;

