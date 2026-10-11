import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { resetSearchParams } = useBooking();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleLogoClick = () => {
    resetSearchParams();
  };

  const isActive = (path) => location.pathname === path;

  const linkClass = (path) =>
    `transition text-sm font-medium ${
      isActive(path)
        ? 'text-[#fefae0] underline underline-offset-4'
        : 'text-[#fefae0]/80 hover:text-[#fefae0]'
    }`;

  return (
    <nav style={{ backgroundColor: '#254546' }} className="text-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link
            to="/"
            onClick={handleLogoClick}
            className="text-xl font-bold tracking-tight text-[#fefae0] hover:opacity-80 transition cursor-pointer"
          >
            Book<span className="font-light">Lodge</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link to="/search" className={linkClass('/search')}>Explore Hotels</Link>
            <Link to="/about" className={linkClass('/about')}>About</Link>
            <Link to="/contact" className={linkClass('/contact')}>Contact</Link>

            {/* Auth section */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-4 pl-4 border-l border-[#fefae0]/20">
                {isAdmin && (
                  <Link
                    to="/admin/bookings"
                    className="text-xs font-semibold px-3 py-1 rounded border border-[#fefae0]/30 text-[#fefae0] hover:bg-[#fefae0]/10 transition"
                  >
                    Admin Panel
                  </Link>
                )}
                <Link to="/my-bookings" className={linkClass('/my-bookings')}>
                  My Bookings
                </Link>
                <Link to="/profile" className={linkClass('/profile')}>
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-xs text-[#fefae0]/60 hover:text-[#fefae0] transition cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3 pl-4 border-l border-[#fefae0]/20">
                <Link
                  to="/login"
                  className="text-sm font-medium text-[#fefae0]/80 hover:text-[#fefae0] transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  style={{ backgroundColor: '#fefae0', color: '#254546' }}
                  className="text-sm font-semibold px-4 py-1.5 rounded-md transition hover:opacity-90"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-[#fefae0] text-2xl leading-none px-2 py-1 cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div style={{ backgroundColor: '#1d3435' }} className="md:hidden border-t border-[#fefae0]/10 px-4 pt-3 pb-5 space-y-2">
          <Link to="/" onClick={() => { setMobileMenuOpen(false); handleLogoClick(); }} className="block py-2 text-[#fefae0] font-bold">Home</Link>
          <Link to="/search" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-[#fefae0]/80 hover:text-[#fefae0]">Explore Hotels</Link>
          <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-[#fefae0]/80 hover:text-[#fefae0]">About</Link>
          <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-[#fefae0]/80 hover:text-[#fefae0]">Contact</Link>

          {isAuthenticated ? (
            <div className="pt-3 border-t border-[#fefae0]/10 space-y-2">
              <div className="text-xs text-[#fefae0]/40">{user?.email}</div>
              {isAdmin && (
                <Link to="/admin/bookings" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-[#fefae0] font-semibold">Admin Panel</Link>
              )}
              <Link to="/my-bookings" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-[#fefae0]/80">My Bookings</Link>
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-[#fefae0]/80">Profile</Link>
              <button
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                className="block w-full text-left py-2 text-rose-300 font-medium cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-[#fefae0]/10 flex flex-col space-y-2">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block text-center py-2 text-[#fefae0]/80 border border-[#fefae0]/20 rounded">Sign In</Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} style={{ backgroundColor: '#fefae0', color: '#254546' }} className="block text-center py-2 rounded font-semibold">Register</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
