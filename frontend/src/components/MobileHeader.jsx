import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Bell, Settings as SettingsIcon, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const MobileHeader = ({ title, showBack, rightAction, onRightAction }) => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [showLangMenu, setShowLangMenu] = useState(false);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ur' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
    setShowLangMenu(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 safe-area-top z-50 shadow-sm">
      <div className="max-w-md mx-auto flex items-center justify-between h-14 px-4">
        {/* Left */}
        <div className="w-10">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 active:bg-gray-100 rounded-full"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Center - Title */}
        <h1 className="text-lg font-bold text-gray-800 truncate px-2">
          {title || t('app_name')}
        </h1>

        {/* Right */}
        <div className="flex items-center space-x-2 w-10 justify-end relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="p-2 active:bg-gray-100 rounded-full"
          >
            <Globe className="w-5 h-5" />
          </button>

          {showLangMenu && (
            <div className="absolute top-12 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-2 w-32">
              <button
                onClick={() => {
                  i18n.changeLanguage('en');
                  localStorage.setItem('language', 'en');
                  setShowLangMenu(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-100"
              >
                English
              </button>
              <button
                onClick={() => {
                  i18n.changeLanguage('ur');
                  localStorage.setItem('language', 'ur');
                  setShowLangMenu(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-100"
              >
                اردو
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;
