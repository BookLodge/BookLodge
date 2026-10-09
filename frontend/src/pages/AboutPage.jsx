import React from 'react';

export const AboutPage = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">

      {/* Title */}
      <div className="text-center space-y-3">
        <span style={{ color: '#254546', backgroundColor: '#254546' + '18', borderColor: '#254546' + '40' }}
          className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border inline-block">
          TS Academy  Capstone Project Group 7
        </span>
        <h1 style={{ color: '#254546' }} className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Hotel Booking Platform
        </h1>
        <p className="text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
          Search hotels, rooms and make reservations 
        </p>
      </div>

      {/* Overview Cards — no icons, clean text */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-2">
          <h3 style={{ color: '#254546' }} className="font-bold text-sm">Frontend Layer (Phoenix)</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Built with React 19, Tailwind CSS , and React Router.soft authentication, and centralized response handling.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-2">
          <h3 style={{ color: '#254546' }} className="font-bold text-sm">Backend API (Hajime)</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Node.js + Express.js REST API with MongoDB persistence. Implements Zod validation, JWT authentication, soft auth middleware, and LiteAPI SDK .
          </p>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-2">
          <h3 style={{ color: '#254546' }} className="font-bold text-sm">LiteAPI Integration</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Powers real-world hotel discovery, live rates, room availability locks (prebook), sandbox test card transactions, and verified provider reservation IDs (book).
          </p>
        </div>

      </div>

      {/* Engineering Standards */}
      <div className="bg-white rounded-xl border border-stone-200 p-8 space-y-6">
        <h2 style={{ color: '#254546' }} className="text-xl font-bold">
          Key Engineering Standards Implemented
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs text-slate-700">

          <div className="space-y-1">
            <strong className="block font-semibold" style={{ color: '#254546' }}>Strict IDOR Protection</strong>
            <span className="text-slate-500 leading-relaxed block">
              customerId is always extracted from the verified JWT on the server, never accepted from user input.
            </span>
          </div>

          <div className="space-y-1">
            <strong className="block font-semibold" style={{ color: '#254546' }}>Two-Factor Guest Ownership</strong>
            <span className="text-slate-500 leading-relaxed block">
              Guest reservation lookups require pairing the unique Reference with the booking Email.
            </span>
          </div>

          <div className="space-y-1">
            <strong className="block font-semibold" style={{ color: '#254546' }}>Standard Response Envelope</strong>
            <span className="text-slate-500 leading-relaxed block">
              Every controller and error returns success, message, data without exposing raw stack traces.
            </span>
          </div>

          <div className="space-y-1">
            <strong className="block font-semibold" style={{ color: '#254546' }}>Price-Lock Prebook Session</strong>
            <span className="text-slate-500 leading-relaxed block">
              Locks dynamic rates during checkout and renders a visible countdown timer before committing the reservation.
            </span>
          </div>

        </div>
      </div>

      {/* Repo link */}
      <div className="text-center">
        <a
          href="https://github.com/BookLodge/BookLodge"
          target="_blank"
          rel="noopener noreferrer"
          style={{ backgroundColor: '#254546', color: '#fefae0' }}
          className="inline-block text-sm font-semibold px-6 py-3 rounded-lg transition hover:opacity-90"
        >
          View Source Code on GitHub
        </a>
      </div>

    </div>
  );
};
