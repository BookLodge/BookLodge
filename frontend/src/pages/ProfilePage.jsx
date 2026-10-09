import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { toast } from 'react-hot-toast';
import { Spinner } from '../components/common/Spinner';

export const ProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authService.getProfile();
        const p = res.data?.user || res.data;
        if (p) {
          setProfile(p);
        } else if (user) {
          setProfile(user);
        }
      } catch (err) {
        toast.error(err.message || 'Failed to load profile');
        if (user) {
          setProfile(user);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const currentUser = profile || user || {};
  const initials = `${currentUser.firstName?.[0] || ''}${currentUser.lastName?.[0] || ''}`.toUpperCase() || 'U';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-black tracking-tight">
          Account Profile
        </h1>
        <p className="text-xs text-slate-500">
          View your verified personal details and BookLodge membership information
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left Side: Avatar & Quick Summary */}
        <div className="bg-white rounded-lg border border-stone-200 p-6 shadow-xs text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-[#254546] text-[#fefae0] text-2xl font-bold flex items-center justify-center mx-auto shadow-inner">
            {initials}
          </div>

          <div>
            <h2 className="text-lg font-bold text-black">
              {currentUser.firstName} {currentUser.lastName}
            </h2>
            <p className="text-xs text-slate-500">{currentUser.email}</p>
          </div>

          <div className="pt-3 border-t border-stone-100 flex flex-wrap justify-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              Active Member
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-stone-200 uppercase tracking-wider text-[10px]">
              {currentUser.role || 'customer'}
            </span>
          </div>

          <div className="pt-4 border-t border-stone-100 flex flex-col space-y-2">
            <Link
              to="/my-bookings"
              style={{ backgroundColor: '#254546', color: '#fefae0' }}
              className="w-full text-xs font-semibold py-2.5 rounded-md transition hover:opacity-90 text-center"
            >
              View My Bookings
            </Link>
            <Link
              to="/search"
              className="w-full text-xs font-semibold py-2 rounded-md border border-stone-200 text-slate-700 hover:bg-stone-50 transition text-center"
            >
              Explore Hotels
            </Link>
          </div>
        </div>

        {/* Right Side: Account Details Grid */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-stone-200 p-6 shadow-xs space-y-6">
            <div className="pb-3 border-b border-stone-100">
              <h3 className="font-bold text-black text-base">
                Personal Information
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Your registered contact details used for booking vouchers and confirmations
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-stone-50 border border-stone-200 rounded-md p-3.5">
                <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  First Name
                </span>
                <p className="text-sm font-semibold text-black">
                  {currentUser.firstName || '—'}
                </p>
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-md p-3.5">
                <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Last Name
                </span>
                <p className="text-sm font-semibold text-black">
                  {currentUser.lastName || '—'}
                </p>
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-md p-3.5">
                <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Email Address
                </span>
                <p className="text-sm font-semibold text-black break-all">
                  {currentUser.email || '—'}
                </p>
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-md p-3.5">
                <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Phone Number
                </span>
                <p className="text-sm font-semibold text-black">
                  {currentUser.phone || '—'}
                </p>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md flex items-start space-x-3">
              <div className="text-emerald-700 text-base font-bold mt-0.5">✓</div>
              <div className="text-xs text-emerald-900 leading-relaxed">
                <strong className="font-semibold block mb-0.5">Verified Profile</strong>
                Your profile information is verified and synced with your BookLodge reservations.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
