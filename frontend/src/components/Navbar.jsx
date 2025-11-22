import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Car, LogOut, Menu, X, User, History, FileText, DollarSign } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleLinks = () => {
    switch (user?.role) {
      case 'rider':
        return [
          { to: '/rider', icon: Car, label: 'Home' },
          { to: '/rider/history', icon: History, label: 'History' },
        ];
      case 'driver':
        return [
          { to: '/driver', icon: Car, label: 'Home' },
          { to: '/driver/documents', icon: FileText, label: 'Documents' },
          { to: '/driver/earnings', icon: DollarSign, label: 'Earnings' },
        ];
      case 'admin':
        return [
          { to: '/admin', icon: Car, label: 'Dashboard' },
          { to: '/admin/riders', icon: User, label: 'Riders' },
          { to: '/admin/drivers', icon: Car, label: 'Drivers' },
          { to: '/admin/rides', icon: History, label: 'Rides' },
          { to: '/admin/fare', icon: DollarSign, label: 'Fare' },
        ];
      default:
        return [];
    }
  };

  const links = getRoleLinks();

  return (
    <nav className="bg-primary-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Car className="w-8 h-8" />
            <span className="text-xl font-bold">NawaRide</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-primary-700 transition"
              >
                <link.icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            ))}

            <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-primary-500">
              <User className="w-4 h-4" />
              <span className="text-sm">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-red-600 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md hover:bg-primary-700"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-primary-500">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-primary-700"
              >
                <link.icon className="w-5 h-5" />
                <span>{link.label}</span>
              </Link>
            ))}
            <div className="border-t border-primary-500 pt-2 mt-2">
              <div className="flex items-center space-x-2 px-3 py-2 text-sm">
                <User className="w-4 h-4" />
                <span>{user?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-red-600 w-full"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
