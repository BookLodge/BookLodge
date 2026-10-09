import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

export const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const prefilledEmail = searchParams.get('email') || '';

  const navigate = useNavigate();
  const { register, login } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState(prefilledEmail);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validatePassword = (pass) => {
    if (pass.length < 6) return 'Password must be at least 6 characters long.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const passError = validatePassword(password);
    if (passError) {
      setError(passError);
      return;
    }

    if (!phone.trim()) {
      setError('Phone number is required.');
      return;
    }

    setLoading(true);
    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
      });

      toast.success('Account created successfully! Signing you in...');

      // Auto-login after successful registration
      try {
        await login({ email: email.trim().toLowerCase(), password });
        navigate('/');
      } catch {
        navigate('/login');
      }
    } catch (err) {
      setError(err.message || 'Unable to create account. Please try again.');
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-14 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-black tracking-tight">
          Create an Account
        </h1>
        <p className="text-xs text-slate-500">
          Book faster, view itinerary history, and enjoy member benefits with BookLodge
        </p>
      </div>

      <div className="bg-white rounded-lg border border-stone-200 p-8 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-md text-xs flex items-start space-x-2">
              <span className="font-bold">Error:</span>
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Alex"
                className="w-full px-3.5 py-2.5 bg-stone-100 hover:bg-stone-50 border border-stone-300 rounded-md text-sm font-medium text-black focus:bg-white focus:border-[#254546] focus:ring-1 focus:ring-[#254546] outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Morgan"
                className="w-full px-3.5 py-2.5 bg-stone-100 hover:bg-stone-50 border border-stone-300 rounded-md text-sm font-medium text-black focus:bg-white focus:border-[#254546] focus:ring-1 focus:ring-[#254546] outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3.5 py-2.5 bg-stone-100 hover:bg-stone-50 border border-stone-300 rounded-md text-sm font-medium text-black focus:bg-white focus:border-[#254546] focus:ring-1 focus:ring-[#254546] outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+234 800 000 0000"
              className="w-full px-3.5 py-2.5 bg-stone-100 hover:bg-stone-50 border border-stone-300 rounded-md text-sm font-medium text-black focus:bg-white focus:border-[#254546] focus:ring-1 focus:ring-[#254546] outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
              Password *
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full pl-3.5 pr-10 py-2.5 bg-stone-100 hover:bg-stone-50 border border-stone-300 rounded-md text-sm font-medium text-black focus:bg-white focus:border-[#254546] focus:ring-1 focus:ring-[#254546] outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 p-1 text-slate-400 hover:text-slate-700 transition focus:outline-none cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Must be at least 6 characters long
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
              Confirm Password *
            </label>
            <div className="relative flex items-center">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full pl-3.5 pr-10 py-2.5 bg-stone-100 hover:bg-stone-50 border border-stone-300 rounded-md text-sm font-medium text-black focus:bg-white focus:border-[#254546] focus:ring-1 focus:ring-[#254546] outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 p-1 text-slate-400 hover:text-slate-700 transition focus:outline-none cursor-pointer"
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ backgroundColor: '#254546', color: '#fefae0' }}
            className="w-full mt-2 font-bold py-3 rounded-md flex items-center justify-center space-x-2 transition hover:opacity-90 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <span>Creating Account...</span>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-stone-100 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#254546' }} className="font-bold hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};
