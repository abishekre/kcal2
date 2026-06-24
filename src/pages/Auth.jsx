import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Loader2, Target, ArrowRight, KeyRound } from 'lucide-react';
import { supabase } from '../lib/supabase';

// No social icons for now per user request

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [mode, setMode] = useState('sign-in'); // 'sign-in', 'sign-up', 'magic-link'

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    let authError = null;

    if (mode === 'magic-link') {
      if (!otpSent) {
        const { error } = await supabase.auth.signInWithOtp({ 
          email,
          options: { emailRedirectTo: window.location.origin }
        });
        authError = error;
        if (!error) {
          setSuccess('Code sent! Check your email.');
          setOtpSent(true);
        }
      } else {
        const { error } = await supabase.auth.verifyOtp({
          email,
          token,
          type: 'email'
        });
        authError = error;
      }
    } else if (mode === 'sign-up') {
      if (!otpSent) {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { emailRedirectTo: window.location.origin }
        });
        authError = error;
        if (!error) {
          setSuccess('Account created! Enter the 6-digit code sent to your email.');
          setOtpSent(true);
        }
      } else {
        const { error } = await supabase.auth.verifyOtp({
          email,
          token,
          type: 'signup'
        });
        authError = error;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      authError = error;
    }

    if (authError) setError(authError.message);
    setLoading(false);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center px-6 bg-bg-app">
      <div className="w-full max-w-sm mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="w-16 h-16 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[20px] flex items-center justify-center mb-6 shadow-xl rotate-3">
            <Target size={32} />
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2 text-gray-900 dark:text-white">Kcal</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-center">
            {mode === 'sign-up' ? "Create an account to save your data." : 
             mode === 'magic-link' ? "Sign in instantly with a code." : 
             "Welcome back. Time to log."}
          </p>
        </motion.div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={otpSent}
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-[#141416] border border-gray-200 dark:border-[#1f1f23] rounded-[20px] font-medium text-black dark:text-white outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors disabled:opacity-50"
              required
            />
          </div>
          
          <AnimatePresence>
            {mode !== 'magic-link' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative overflow-hidden"
              >
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={otpSent}
                  className="w-full pl-12 pr-4 py-4 bg-white dark:bg-[#141416] border border-gray-200 dark:border-[#1f1f23] rounded-[20px] font-medium text-black dark:text-white outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors disabled:opacity-50"
                  required={mode !== 'magic-link'}
                  minLength={6}
                />
              </motion.div>
            )}

            {(mode === 'magic-link' || mode === 'sign-up') && otpSent && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative overflow-hidden"
              >
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="6-digit Code"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white dark:bg-[#141416] border border-gray-200 dark:border-[#1f1f23] rounded-[20px] font-medium text-black dark:text-white outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors tracking-widest"
                  required
                  maxLength={6}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-rose-500 text-sm font-bold text-center px-4">
              {error}
            </motion.p>
          )}

          {success && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-emerald-500 text-sm font-bold text-center px-4">
              {success}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gray-900 dark:bg-emerald-500 text-white rounded-[20px] font-black tracking-wide flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              mode === 'sign-up' ? (otpSent ? "Verify Code" : "Create Account") : 
              mode === 'magic-link' ? (otpSent ? "Verify Code" : "Send Code") : "Sign In"
            )}
          </button>
        </form>

        <div className="mt-8 flex flex-col items-center gap-3">
          {mode !== 'magic-link' && (
            <button 
              onClick={() => { setMode('magic-link'); setError(null); setSuccess(null); setOtpSent(false); }}
              className="text-gray-500 hover:text-gray-900 dark:hover:text-white font-bold transition-colors text-sm flex items-center gap-1"
            >
              Sign in with Code instead <ArrowRight size={14} />
            </button>
          )}
          
          <button 
            onClick={() => { setMode(mode === 'sign-up' ? 'sign-in' : 'sign-up'); setError(null); setSuccess(null); setOtpSent(false); }}
            className="text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors text-sm mt-4"
          >
            {mode === 'sign-up' ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
