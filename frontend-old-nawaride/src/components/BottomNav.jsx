import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Home, History, FileText, DollarSign, User, Users, Car, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const BottomNav = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const getNavItems = () => {
    switch (user?.role) {
      case 'rider':
        return [
          { to: '/rider', icon: Home, label: t('home') || 'Home' },
          { to: '/rider/history', icon: History, label: t('ride_history') || 'History' },
          { to: '/rider/profile', icon: User, label: t('profile') || 'Profile' },
        ];
      case 'driver':
        return [
          { to: '/driver', icon: Home, label: t('home') || 'Home' },
          { to: '/driver/earnings', icon: DollarSign, label: t('earnings') || 'Earnings' },
          { to: '/driver/documents', icon: FileText, label: t('documents') || 'Docs' },
          { to: '/driver/profile', icon: User, label: t('profile') || 'Profile' },
        ];
      case 'admin':
        return [
          { to: '/admin', icon: Home, label: 'Dashboard' },
          { to: '/admin/riders', icon: Users, label: 'Riders' },
          { to: '/admin/drivers', icon: Car, label: 'Drivers' },
          { to: '/admin/settings', icon: Settings, label: 'Settings' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-50 shadow-lg">
      <div className="max-w-md mx-auto flex justify-around items-center h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive
                  ? 'text-primary-600'
                  : 'text-gray-500 active:text-primary-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
