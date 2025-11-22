import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { DollarSign } from 'lucide-react';
import Navbar from '../../components/Navbar';
import toast from 'react-hot-toast';

const AdminFare = () => {
  const [fareSettings, setFareSettings] = useState({
    base_fare: 50,
    per_km: 15,
    minimum_fare: 80,
    surge_multiplier: 1.0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFareSettings();
  }, []);

  const loadFareSettings = async () => {
    try {
      const response = await adminAPI.getFare();
      if (response.data) {
        setFareSettings(response.data);
      }
    } catch (error) {
      toast.error('Failed to load fare settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await adminAPI.updateFare(fareSettings);
      toast.success('Fare settings updated successfully');
    } catch (error) {
      toast.error('Failed to update fare settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFareSettings(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            <DollarSign className="w-8 h-8 text-primary-500" />
            <h1 className="text-3xl font-bold text-gray-800">Fare Settings</h1>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="spinner"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Fare (PKR)
                </label>
                <input
                  type="number"
                  name="base_fare"
                  value={fareSettings.base_fare}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Initial charge for every ride</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Per Kilometer Rate (PKR)
                </label>
                <input
                  type="number"
                  name="per_km"
                  value={fareSettings.per_km}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Charge per kilometer traveled</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Fare (PKR)
                </label>
                <input
                  type="number"
                  name="minimum_fare"
                  value={fareSettings.minimum_fare}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Minimum charge for any ride</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Surge Multiplier
                </label>
                <input
                  type="number"
                  name="surge_multiplier"
                  value={fareSettings.surge_multiplier}
                  onChange={handleChange}
                  min="1"
                  max="5"
                  step="0.1"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Multiplier for surge pricing (1.0 = no surge)</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">Example Calculation</h3>
                <p className="text-sm text-gray-600">
                  For a 5 km ride: {fareSettings.base_fare} + (5 × {fareSettings.per_km}) × {fareSettings.surge_multiplier} = PKR{' '}
                  {(fareSettings.base_fare + (5 * fareSettings.per_km)) * fareSettings.surge_multiplier}
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Update Fare Settings'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminFare;
