import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Hardcoded admin credentials
  const ADMIN_CREDENTIALS = {
    email: 'admin@gmail.com',
    password: 'Admin@123',
    id: 'admin-001',
    name: 'Administrator',
    role: 'admin'
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      const response = await axios.get(
        'https://bursting-gelding-24.hasura.app/api/rest/profile',
        {
          headers: {
            'content-type': 'application/json',
            'x-hasura-admin-secret': 'g08A3qQy00y8yFDq3y6N1ZQnhOPOa4msdie5EtKS1hFStar01JzPKrtKEzYY2BtF',
            'x-hasura-role': 'user',
            'x-hasura-user-id': userId.toString()
          }
        }
      );
      return response.data.users[0];
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      // Check for admin login first
      if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        setUser(ADMIN_CREDENTIALS);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(ADMIN_CREDENTIALS));
        navigate('/admin/dashboard');
        return ADMIN_CREDENTIALS;
      }

      // Regular user login with API
      const authResponse = await axios.post(
        'https://bursting-gelding-24.hasura.app/api/rest/get-user-id',
        { 
          email, 
          password 
        },
        {
          headers: {
            'content-type': 'application/json',
            'x-hasura-admin-secret': 'g08A3qQy00y8yFDq3y6N1ZQnhOPOa4msdie5EtKS1hFStar01JzPKrtKEzYY2BtF'
          }
        }
      );

      // Handle API response
      const authData = authResponse.data?.get_user_id?.[0];
      if (!authData?.id) {
        throw new Error('User not found or invalid credentials');
      }

      // Fetch user profile
      const profileData = await fetchUserProfile(authData.id);
      
      // Combine user data
      const userData = {
        id: authData.id,
        email,
        role: 'user',
        ...profileData
      };

      // Update state and storage
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Navigate to home page
      navigate('/');
      
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed';
      if (error.response) {
        // Handle different HTTP status codes
        if (error.response.status === 400) {
          errorMessage = 'Invalid request format';
        } else if (error.response.status === 401) {
          errorMessage = 'Invalid credentials';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoading, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);