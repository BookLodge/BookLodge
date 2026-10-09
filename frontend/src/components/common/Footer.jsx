import React from "react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer style={{ backgroundColor: "#254546" }} className="text-white text-sm mt-auto">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">

          {/* Brand */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1 space-y-3">
            <div className="font-bold text-xl tracking-tight text-white">
              Book<span className="font-light">Lodge</span>
            </div>
            <p className="text-xs leading-relaxed max-w-xs" style={{ color: "rgba(254,250,224,0.65)" }}>
              Hotel Booking App.  A full-stack capstone project built by Group 7 Phoenix & Hajime Cohort.
            </p>
            <a
              href="https://github.com/BookLodge/BookLodge"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs hover:underline transition"
              style={{ color: "rgba(254,250,224,0.65)" }}
            >
              github.com/BookLodge
            </a>
          </div>

          {/* Quick Booking */}
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wider mb-4" style={{ color: "#fefae0" }}>
              Quick Booking
            </h4>
            <ul className="space-y-2.5 text-xs" style={{ color: "rgba(254,250,224,0.65)" }}>
              <li><Link to="/search" className="hover:text-white transition">Search Hotels</Link></li>
              <li><Link to="/my-bookings" className="hover:text-white transition">My Bookings</Link></li>
              <li><Link to="/register" className="hover:text-white transition">Create an Account</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wider mb-4" style={{ color: "#fefae0" }}>
              Support
            </h4>
            <ul className="space-y-2.5 text-xs" style={{ color: "rgba(254,250,224,0.65)" }}>
              <li><Link to="/contact" className="hover:text-white transition">Contact Us</Link></li>
              <li><Link to="/contact" className="hover:text-white transition">Report an Issue</Link></li>
              <li><Link to="/about" className="hover:text-white transition">How It Works</Link></li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wider mb-4" style={{ color: "#fefae0" }}>
              About
            </h4>
            <ul className="space-y-2.5 text-xs" style={{ color: "rgba(254,250,224,0.65)" }}>
              <li><Link to="/about" className="hover:text-white transition">About BookLodge</Link></li>
              <li><Link to="/about" className="hover:text-white transition">Architecture & Tech Stack</Link></li>
              <li><a href="https://www.liteapi.travel" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">Powered by LiteAPI</a></li>
              <li><a href="https://github.com/BookLodge/BookLodge" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">View Source Code</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wider mb-4" style={{ color: "#fefae0" }}>
              Get In Touch
            </h4>
            <ul className="space-y-3 text-xs" style={{ color: "rgba(254,250,224,0.65)" }}>
              <li className="leading-relaxed">
                <span className="block text-white font-medium mb-0.5">Address</span>
                14 Victoria Island Road,<br />Lagos, Nigeria
              </li>
              <li>
                <span className="block text-white font-medium mb-0.5">Support Email</span>
                <a href="mailto:support@booklodge.com" className="hover:text-white transition">support@booklodge.com</a>
              </li>
              <li>
                <span className="block text-white font-medium mb-0.5">Phone</span>
                +234 800 000 0000
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom strip */}
      <div style={{ borderColor: "rgba(254,250,224,0.12)" }} className="border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs" style={{ color: "rgba(254,250,224,0.4)" }}>
          <p>&copy; {new Date().getFullYear()} BookLodge  TS Academy Capstone Project #7. All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <span>LiteAPI Sandbox Mode</span>
            <a href="https://github.com/BookLodge/BookLodge" target="_blank" rel="noopener noreferrer" className="hover:text-white transition" style={{ color: "rgba(254,250,224,0.6)" }}>GitHub Repository</a>
          </div>
        </div>
      </div>

    </footer>
  );
};