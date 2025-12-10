import React, { useState } from 'react';
import { User } from '../types';
import { Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  users?: User[];
}

export const Login: React.FC<LoginProps> = ({ onLogin, users = [] }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      const trimmedEmail = email.trim().toLowerCase();
      
      // Find user in the dynamic list passed from App.tsx
      const user = users.find(u => u.email.toLowerCase() === trimmedEmail);
      
      if (user) {
        // Check if the user has a specific password set, otherwise fallback to default 'password'
        const isValidPassword = user.password 
            ? user.password === password 
            : password === 'password';

        if (isValidPassword) {
          onLogin(user);
        } else {
          setError('Invalid email or password');
          setIsLoading(false);
        }
      } else {
        setError('Invalid email or password');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* Left Side - The "Poster" Area */}
        <div className="w-full md:w-1/2 bg-white p-12 flex flex-col justify-center items-center relative border-r border-gray-100">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
             <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-60"></div>
             <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-50 rounded-full blur-3xl opacity-60"></div>
          </div>

          <div className="relative z-10 flex flex-col items-center">
            {/* Custom Logo Implementation */}
            <div className="mb-12 scale-125 transform">
                <div className="flex items-baseline font-extrabold tracking-tight text-6xl text-slate-900 leading-none">
                    <span>TELEE</span>
                    <div className="relative mx-0.5">
                        {/* The X Structure */}
                        {/* Black Stroke (Top-Right to Bottom-Left) */}
                        <div className="w-[40px] h-[50px] relative">
                             <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full overflow-visible">
                                {/* Black Diagonal */}
                                <line x1="80" y1="10" x2="20" y2="90" stroke="#0f172a" strokeWidth="12" strokeLinecap="square" />
                                {/* Blue Diagonal (Top-Left to Bottom-Right) connecting to underline */}
                                <path d="M 20 10 L 80 90 L 280 90" fill="none" stroke="#0ea5e9" strokeWidth="12" strokeLinecap="square" strokeLinejoin="miter" />
                             </svg>
                        </div>
                    </div>
                    <span className="relative z-0 ml-1">PRO</span>
                </div>
                {/* Slogan */}
                <div className="text-center mt-6">
                    <p className="text-sm font-semibold tracking-[0.3em] text-slate-400 uppercase">
                        Smart Admin Solutions
                    </p>
                </div>
            </div>

            <div className="space-y-4 text-center max-w-sm">
                <h2 className="text-2xl font-bold text-slate-800">Manage Your Workforce</h2>
                <p className="text-slate-500 leading-relaxed">
                  Experience the next generation of HR management. AI-powered insights, seamless payroll, and real-time collaboration.
                </p>
            </div>
          </div>

          <div className="absolute bottom-8 text-xs text-slate-300 font-medium">
             © 2025 TELEEXPRO Inc.
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full md:w-1/2 p-10 md:p-16 bg-slate-50 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-500 mb-8">Please enter your details to sign in.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 shadow-sm"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 shadow-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium animate-pulse border border-red-100 text-center">
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    Sign In <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};