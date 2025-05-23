import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, logout } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('********');

  // This effect ensures password is only available during current session
  useEffect(() => {
    if (user?.password) {
      setPassword(user.password);
    } else {
      setPassword('********');
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 ml-64 p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Profile</h1>
          <p>No user data available. Please login.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Profile</h1>
        
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center mb-6">
            <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-semibold">
              {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {user?.name || user?.email?.split('@')[0]}
              </h2>
              <p className="text-gray-500">{user?.email}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Your Name</h3>
              <p className="text-gray-900">{user?.name || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
              <p className="text-gray-900">{user?.email || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Date of Birth</h3>
              <p className="text-gray-900">
                {user?.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Permanent Address</h3>
              <p className="text-gray-900">{user?.permanent_address || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Postal Code</h3>
              <p className="text-gray-900">{user?.postal_code || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Password</h3>
              <div className="flex items-center">
                <p className="text-gray-900 mr-2">
                  {showPassword ? password : '********'}
                </p>
                {password !== '********' && (
                  <button 
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                )}
              </div>
              {password === '********' && (
                <p className="text-xs text-gray-500 mt-1">
                  Password only available during current session
                </p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Present Address</h3>
              <p className="text-gray-900">{user?.present_address || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">City</h3>
              <p className="text-gray-900">{user?.city || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Country</h3>
              <p className="text-gray-900">{user?.country || 'N/A'}</p>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-gray-200">
            <button 
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;