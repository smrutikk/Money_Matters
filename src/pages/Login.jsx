import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Mail, Lock } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    }
  };

  return (
  <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-100 to-teal-50 p-4">
    <Toaster position="top-center" />
    
    <motion.div
      className="bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl overflow-hidden w-full max-w-md flex border border-emerald-100 hover:shadow-2xl transition-all duration-300"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: 'spring' }}
    >
      <div className="w-full p-8 md:p-10 relative flex flex-col">
        <div className="flex-1 flex flex-col justify-between">
          <AnimatePresence mode='wait'>
            <motion.div
              key="login"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="mb-8"
            >
              <div className="inline-flex items-center justify-center bg-emerald-100 rounded-full p-4 mb-4">
                <LogIn className="text-emerald-600" size={36} />
              </div>
              <h2 className="text-2xl font-bold text-emerald-900 mb-2">Money Matters</h2>
            </motion.div>
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-200/50 to-teal-200/50 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center gap-3 bg-white backdrop-blur-sm rounded-xl px-4 py-3 border border-emerald-200">
                  <Mail className="text-lg text-emerald-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent text-emerald-900 placeholder-emerald-400/70 focus:outline-none text-sm"
                    placeholder="Email address"
                  />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-200/50 to-teal-200/50 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center gap-3 bg-white backdrop-blur-sm rounded-xl px-4 py-3 border border-emerald-200">
                  <Lock className="text-lg text-emerald-400" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent text-emerald-900 placeholder-emerald-400/70 focus:outline-none text-sm"
                    placeholder="Password"
                  />
                </div>
              </div>
            </motion.div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-medium py-3 rounded-xl relative overflow-hidden group mt-4 shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10 flex items-center justify-center gap-2 text-sm">
                Sign in
              </span>
            </motion.button>
          </form>
        </div>
      </div>
    </motion.div>
  </div>
);
};

export default Login;