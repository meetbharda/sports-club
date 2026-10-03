import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Trophy, AlertCircle, ArrowRight } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, initialMode = 'login', onAuthSuccess }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [planCode, setPlanCode] = useState('GOLD');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const loggedUser = await login(email, password);
        onClose();
        if (onAuthSuccess) onAuthSuccess(loggedUser.role);
      } else {
        const registeredUser = await register({
          full_name: fullName,
          email,
          password,
          phone,
          plan_code: planCode
        });
        onClose();
        if (onAuthSuccess) onAuthSuccess('member');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#111827] border border-slate-700/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">The Champions Club</h3>
              <p className="text-[11px] text-slate-400">{mode === 'login' ? 'Welcome back to the arena' : 'Begin your athletic journey'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alexander Wright"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile Phone</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Membership Tier</label>
                <select
                  value={planCode}
                  onChange={(e) => setPlanCode(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900/80 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="GOLD">Gold Championship ($149/mo - 15% discounts, 2 bookings/day)</option>
                  <option value="SILVER">Silver Club ($89/mo - 5% discounts, 1 booking/day)</option>
                  <option value="JUNIOR">Junior Stars Under 18 ($49/mo)</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="athlete@example.com"
              className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            {loading ? 'Processing...' : (
              <>
                <span>{mode === 'login' ? 'Sign In to Portal' : 'Create Member Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-2 text-center text-xs text-slate-400">
            {mode === 'login' ? (
              <span>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(''); }}
                  className="text-emerald-400 font-semibold hover:underline"
                >
                  Join Membership
                </button>
              </span>
            ) : (
              <span>
                Already a registered member?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className="text-emerald-400 font-semibold hover:underline"
                >
                  Sign In
                </button>
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
