import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Loader2, Target, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { triggerHaptic } from '../utils/haptics';

// No social icons for now per user request

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [mode, setMode] = useState('sign-in'); // 'sign-in', 'sign-up', 'magic-link'
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(0);



  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    let authError;

    if (mode === 'magic-link') {
      const { error } = await supabase.auth.signInWithOtp({ 
        email, 
        options: { emailRedirectTo: window.location.origin } 
      });
      authError = error;
      if (!error) {
        setSuccess('Magic Link sent! Please check your email to log in.');
      }
    } else if (mode === 'sign-up') {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { emailRedirectTo: window.location.origin }
      });
      authError = error;
      if (!error) {
        if (data?.session) {
          // Email confirmation is disabled in Supabase; user is already logged in
          setLoading(false);
          return;
        }
        setSuccess('Account created! Please check your email and click the confirmation link to log in.');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      authError = error;
    }

    if (authError) {
      setError(authError.message);
      setShake(s => s + 1);
      triggerHaptic('error');
    } else if (mode === 'magic-link' || mode === 'sign-up') {
      triggerHaptic('success');
    }
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
             mode === 'magic-link' ? "Get a login link sent to your inbox." : 
             "Welcome back. Time to log."}
          </p>
        </motion.div>

        <motion.form 
          onSubmit={handleAuth} 
          className="space-y-4"
          animate={{ x: shake > 0 ? [-8, 8, -8, 8, 0] : 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white dark:bg-[#141416] border border-gray-200 dark:border-[#1f1f23] rounded-[20px] font-medium text-black dark:text-white outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors disabled:opacity-50"
              required
            />
          </div>
          
          <AnimatePresence>
            {(mode === 'sign-in' || mode === 'sign-up') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative overflow-hidden"
              >
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-white dark:bg-[#141416] border border-gray-200 dark:border-[#1f1f23] rounded-[20px] font-medium text-black dark:text-white outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors disabled:opacity-50"
                  required={mode === 'sign-in' || mode === 'sign-up'}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 p-3 rounded-[16px] text-sm font-bold flex items-start gap-2 shadow-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p className="leading-tight">{error}</p>
            </motion.div>
          )}

          {success && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-3 rounded-[16px] text-sm font-bold flex items-start gap-2 shadow-sm">
              <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">✓</div>
              <p className="leading-tight">{success}</p>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gray-900 dark:bg-emerald-500 text-white rounded-[20px] font-black tracking-wide flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              mode === 'sign-up' ? "Create Account" : 
              mode === 'magic-link' ? "Send Magic Link" : 
              "Sign In"
            )}
          </button>
        </motion.form>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-[#1f1f23] flex flex-col items-center gap-4 w-full">
          {mode !== 'sign-in' && (
            <button type="button" onClick={() => { setMode('sign-in'); setError(null); setSuccess(null); }} className="text-gray-500 hover:text-gray-900 dark:hover:text-white font-bold transition-colors text-sm flex items-center gap-1">
              Sign In with Password <ArrowRight size={14} />
            </button>
          )}
          {mode !== 'sign-up' && (
            <button type="button" onClick={() => { setMode('sign-up'); setError(null); setSuccess(null); }} className="text-gray-500 hover:text-gray-900 dark:hover:text-white font-bold transition-colors text-sm flex items-center gap-1">
              Create a New Account <ArrowRight size={14} />
            </button>
          )}
          {mode !== 'magic-link' && (
            <button type="button" onClick={() => { setMode('magic-link'); setError(null); setSuccess(null); }} className="text-gray-500 hover:text-gray-900 dark:hover:text-white font-bold transition-colors text-sm flex items-center gap-1">
              Sign In with Magic Link <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
