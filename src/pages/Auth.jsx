import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { triggerHaptic } from '../utils/haptics';
import KcalMark from '../components/Core/KcalMark';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [mode, setMode] = useState('sign-in');
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState(null);
  // `now` is real state (not a Date.now() call inline in render) so the
  // countdown updates without making the render itself impure.
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!cooldownUntil) return;
    const interval = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= cooldownUntil) {
        setCooldownUntil(null);
        clearInterval(interval);
      }
    }, 250);
    return () => clearInterval(interval);
  }, [cooldownUntil]);

  // Rate-limit check — client-side only. This smooths out repeated-tap
  // frustration with visible feedback; it is NOT real brute-force
  // protection (a page reload resets it). Actual rate limiting has to be
  // enforced server-side in the Supabase Auth project settings.
  const isInCooldown = !!cooldownUntil && now < cooldownUntil;
  const cooldownRemaining = isInCooldown ? Math.ceil((cooldownUntil - now) / 1000) : 0;

  // Sanitize Supabase error messages to prevent user enumeration
  const sanitizeAuthError = (message) => {
    const lower = (message || '').toLowerCase();
    if (lower.includes('already registered') || lower.includes('already exists')) {
      return 'If an account exists with this email, you can sign in instead.';
    }
    if (lower.includes('invalid login') || lower.includes('invalid credentials')) {
      return 'Invalid email or password. Please try again.';
    }
    if (lower.includes('rate limit') || lower.includes('too many')) {
      return 'Too many attempts. Please wait a moment and try again.';
    }
    return message || 'An unexpected error occurred. Please try again.';
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError(null);
    setSuccess(null);
    setPassword(''); // Clear password on mode switch
    setShowPassword(false);
  };

  const handleAuth = async (e) => {
    e.preventDefault();

    if (isInCooldown) {
      setError(`Too many attempts. Please wait ${cooldownRemaining} seconds.`);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    let authError;

    try {
      if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        authError = error;
        if (!error) {
          // Neutral wording avoids revealing whether the email is registered.
          setSuccess('If an account exists for that email, a password reset link is on its way.');
        }
      } else if (mode === 'magic-link') {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: window.location.origin }
        });
        authError = error;
        if (!error) {
          setSuccess('Magic Link sent! Please check your email to log in.');
        }
      } else if (mode === 'sign-up') {
        if (password.length < 8) {
          setError('Password must be at least 8 characters long.');
          setShake(s => s + 1);
          triggerHaptic('error');
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { emailRedirectTo: window.location.origin }
        });
        authError = error;
        if (!error) {
          if (data?.session) {
            setLoading(false);
            return;
          }
          setSuccess('Account created! Please check your email and click the confirmation link to log in.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        authError = error;
      }
    } catch {
      authError = { message: 'Network error. Please check your connection and try again.' };
    }

    if (authError) {
      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);
      setError(sanitizeAuthError(authError.message));
      setShake(s => s + 1);
      triggerHaptic('error');

      // Client-side cooldown after repeated failures — see note above,
      // this is friction/feedback, not a security control.
      if (attempts >= 5) {
        const until = Date.now() + 30000;
        setCooldownUntil(until);
        setNow(Date.now());
        setFailedAttempts(0);
        setError('Too many failed attempts. Please wait 30 seconds.');
      }
    } else if (mode === 'magic-link' || mode === 'sign-up' || mode === 'reset') {
      setFailedAttempts(0);
      triggerHaptic('success');
    }
    setLoading(false);
  };

  const passwordStrength = (() => {
    if (!password || mode !== 'sign-up') return null;
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return { label: 'Weak', color: 'bg-red-500', width: '20%' };
    if (score <= 2) return { label: 'Fair', color: 'bg-amber-500', width: '40%' };
    if (score <= 3) return { label: 'Good', color: 'bg-yellow-500', width: '60%' };
    if (score <= 4) return { label: 'Strong', color: 'bg-emerald-500', width: '80%' };
    return { label: 'Very Strong', color: 'bg-emerald-400', width: '100%' };
  })();

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center px-6 bg-bg-app">
      <div className="w-full max-w-sm mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-8"
        >
          <KcalMark size={64} badge className="mb-6 shadow-xl rotate-3" />
          <h1 className="text-3xl font-black tracking-tight mb-2 text-gray-900 dark:text-white">Kcal</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-center">
            {mode === 'sign-up' ? "Create an account to save your data." :
             mode === 'magic-link' ? "Get a login link sent to your inbox." :
             mode === 'reset' ? "Enter your email and we'll send a reset link." :
             "Welcome back. Time to log."}
          </p>
        </motion.div>

        <motion.form 
          onSubmit={handleAuth} 
          className="space-y-4"
          key={shake}
          animate={shake > 0 ? { x: [-8, 8, -8, 8, 0] } : {}}
          transition={{ duration: 0.3 }}
        >
          <div className="relative">
            <label htmlFor="auth-email" className="sr-only">Email address</label>
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} aria-hidden="true" />
            <input
              id="auth-email"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full pl-12 pr-6 py-4 bg-white dark:bg-[#141416] border border-gray-200 dark:border-[#1f1f23] rounded-[20px] font-medium text-black dark:text-white outline-none focus:border-gray-400 dark:focus:border-gray-500 focus-visible:ring-2 focus-visible:ring-emerald-500/50 transition-colors disabled:opacity-50"
              required
              autoComplete="email"
            />
          </div>
          
          <AnimatePresence>
            {(mode === 'sign-in' || mode === 'sign-up') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative overflow-hidden space-y-2"
              >
                <div className="relative">
                  <label htmlFor="auth-password" className="sr-only">Password</label>
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} aria-hidden="true" />
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    placeholder={mode === 'sign-up' ? "Password (min 8 chars)" : "Password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="w-full pl-12 pr-12 py-4 bg-white dark:bg-[#141416] border border-gray-200 dark:border-[#1f1f23] rounded-[20px] font-medium text-black dark:text-white outline-none focus:border-gray-400 dark:focus:border-gray-500 focus-visible:ring-2 focus-visible:ring-emerald-500/50 transition-colors disabled:opacity-50"
                    required={mode === 'sign-in' || mode === 'sign-up'}
                    minLength={mode === 'sign-up' ? 8 : 6}
                    autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Password strength meter (sign-up only) */}
                {mode === 'sign-up' && password.length > 0 && passwordStrength && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-1"
                  >
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${passwordStrength.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: passwordStrength.width }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1 font-medium">{passwordStrength.label}</p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              role="alert"
              aria-live="assertive"
              className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 p-3 rounded-[16px] text-sm font-bold flex items-start gap-2 shadow-sm"
            >
              <AlertCircle size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
              <p className="leading-tight">{error}</p>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              role="status"
              aria-live="polite"
              className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-3 rounded-[16px] text-sm font-bold flex items-start gap-2 shadow-sm"
            >
              <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5" aria-hidden="true">✓</div>
              <p className="leading-tight">{success}</p>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading || isInCooldown}
            className="w-full py-4 bg-gray-900 dark:bg-emerald-500 text-white rounded-[20px] font-black tracking-wide flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> :
             isInCooldown ? `Wait ${cooldownRemaining}s` :
             mode === 'sign-up' ? "Create Account" :
             mode === 'magic-link' ? "Send Magic Link" :
             mode === 'reset' ? "Send Reset Link" :
             "Sign In"}
          </button>
        </motion.form>

        {/* One clear next step per mode, phrased as a sentence rather than
            a stack of equally-weighted buttons — the magic-link path still
            exists but doesn't compete visually with the primary flow. */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-[#1f1f23] flex flex-col items-center gap-3 w-full text-sm">
          {mode === 'sign-in' && (
            <>
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                New here?{' '}
                <button type="button" disabled={loading} onClick={() => switchMode('sign-up')} className="font-bold text-gray-900 dark:text-white hover:underline disabled:opacity-50">
                  Create an account
                </button>
              </p>
              <div className="flex items-center gap-4">
                <button type="button" disabled={loading} onClick={() => switchMode('reset')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-medium text-xs transition-colors disabled:opacity-50">
                  Forgot password?
                </button>
                <button type="button" disabled={loading} onClick={() => switchMode('magic-link')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-medium text-xs transition-colors disabled:opacity-50">
                  Magic link instead
                </button>
              </div>
            </>
          )}
          {mode === 'reset' && (
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Remembered it?{' '}
              <button type="button" disabled={loading} onClick={() => switchMode('sign-in')} className="font-bold text-gray-900 dark:text-white hover:underline disabled:opacity-50">
                Back to sign in
              </button>
            </p>
          )}
          {mode === 'sign-up' && (
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Already have an account?{' '}
              <button type="button" disabled={loading} onClick={() => switchMode('sign-in')} className="font-bold text-gray-900 dark:text-white hover:underline disabled:opacity-50">
                Sign in
              </button>
            </p>
          )}
          {mode === 'magic-link' && (
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              <button type="button" disabled={loading} onClick={() => switchMode('sign-in')} className="font-bold text-gray-900 dark:text-white hover:underline disabled:opacity-50">
                Sign in with a password
              </button>{' '}instead
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
