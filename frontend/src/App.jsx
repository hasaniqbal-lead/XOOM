import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';

// Auth pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';

// Rider pages
import RiderHome from './pages/rider/RiderHome';
import RiderHistory from './pages/rider/RiderHistory';
import Profile from './pages/Profile';

// Driver pages
import DriverHome from './pages/driver/DriverHome';
import DriverDocuments from './pages/driver/DriverDocuments';
import DriverEarnings from './pages/driver/DriverEarnings';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRiders from './pages/admin/AdminRiders';
import AdminDrivers from './pages/admin/AdminDrivers';
import AdminFare from './pages/admin/AdminFare';
import AdminRides from './pages/admin/AdminRides';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// App Routes Component
const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();

  // Redirect based on role
  const getHomeRoute = () => {
    if (!isAuthenticated) return '/login';
    switch (user?.role) {
      case 'admin':
        return '/admin';
      case 'driver':
        return '/driver';
      case 'rider':
      default:
        return '/rider';
    }
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Rider Routes */}
      <Route
        path="/rider"
        element={
          <ProtectedRoute allowedRoles={['rider']}>
            <RiderHome />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rider/history"
        element={
          <ProtectedRoute allowedRoles={['rider']}>
            <RiderHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rider/profile"
        element={
          <ProtectedRoute allowedRoles={['rider']}>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Driver Routes */}
      <Route
        path="/driver"
        element={
          <ProtectedRoute allowedRoles={['driver']}>
            <DriverHome />
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver/documents"
        element={
          <ProtectedRoute allowedRoles={['driver']}>
            <DriverDocuments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver/earnings"
        element={
          <ProtectedRoute allowedRoles={['driver']}>
            <DriverEarnings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver/profile"
        element={
          <ProtectedRoute allowedRoles={['driver']}>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/riders"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminRiders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/drivers"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDrivers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/fare"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminFare />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/rides"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminRides />
          </ProtectedRoute>
        }
      />

      {/* Default Route */}
      <Route path="/" element={<Navigate to={getHomeRoute()} replace />} />
      <Route path="*" element={<Navigate to={getHomeRoute()} replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppRoutes />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
