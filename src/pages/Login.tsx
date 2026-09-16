import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, User, Package } from 'lucide-react';
import { api } from '../utils/api';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const data = await api.post('/auth/login', { email, password });
        login(data.token, data.user);
        navigate('/');
      } else {
        const data = await api.post('/auth/register', { email, password, name });
        // Auto-login or redirect
        setIsLogin(true);
        setError('Registration successful! Please login.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-awwwards-light text-awwwards-text p-4 relative overflow-hidden">
      {/* Abstract Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-awwwards-primary rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse-glow"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-awwwards-secondary rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-awwwards-accent rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" as const }}
        className="w-full max-w-md"
      >
        <div className="glass-panel p-8 rounded-3xl relative z-10 w-full">
          <div className="text-center mb-8">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" as const, stiffness: 200 }}
              className="w-16 h-16 bg-gradient-to-br from-awwwards-primary to-awwwards-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_4px_20px_rgba(99,102,241,0.3)]"
            >
              <Package size={32} className="text-white" />
            </motion.div>
            <h1 className="text-3xl font-extrabold tracking-tight text-awwwards-text">Greenpart Auto</h1>
            <p className="text-awwwards-textMuted mt-2 text-sm font-semibold tracking-wide uppercase">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className={`p-3 text-sm rounded-lg ${error.includes('successful') ? 'bg-green-500/20 text-green-200 border border-green-500/30' : 'bg-red-500/20 text-red-200 border border-red-500/30'}`}
              >
                {error}
              </motion.div>
            )}

            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-awwwards-textMuted uppercase tracking-wider mb-2 ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/60 border border-awwwards-border text-awwwards-text rounded-xl px-12 py-3 focus:ring-2 focus:ring-awwwards-primary focus:border-transparent outline-none transition-all placeholder-gray-400"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-awwwards-textMuted uppercase tracking-wider mb-2 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/60 border border-awwwards-border text-awwwards-text rounded-xl px-12 py-3 focus:ring-2 focus:ring-awwwards-primary focus:border-transparent outline-none transition-all placeholder-gray-400"
                  placeholder="name@greenpart.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-awwwards-textMuted uppercase tracking-wider mb-2 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/60 border border-awwwards-border text-awwwards-text rounded-xl px-12 py-3 focus:ring-2 focus:ring-awwwards-primary focus:border-transparent outline-none transition-all placeholder-gray-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-awwwards-primary hover:bg-indigo-600 text-white rounded-xl py-3.5 font-bold tracking-wide shadow-[0_4px_15px_rgba(99,102,241,0.4)] transition-all flex items-center justify-center group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-awwwards-textMuted hover:text-awwwards-primary text-sm font-semibold transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
export default Login;
