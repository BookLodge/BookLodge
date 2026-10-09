import React, { createContext, useContext, useState, useCallback } from 'react';
import { addDays, format } from 'date-fns';

const BookingContext = createContext(null);

export const BookingProvider = ({ children }) => {
  const tomorrow = addDays(new Date(), 1);
  const checkoutDefault = addDays(new Date(), 4);

  const [searchParams, setSearchParams] = useState({
    city: 'Lagos',
    checkIn: format(tomorrow, 'yyyy-MM-dd'),
    checkOut: format(checkoutDefault, 'yyyy-MM-dd'),
    guests: 2
  });

  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [prebookSession, setPrebookSession] = useState(null);

  const updateSearchParams = useCallback((newParams) => {
    setSearchParams((prev) => {
      let changed = false;
      for (const key of Object.keys(newParams)) {
        if (prev[key] !== newParams[key]) {
          changed = true;
          break;
        }
      }
      return changed ? { ...prev, ...newParams } : prev;
    });
  }, []);

  const selectOffer = useCallback((hotel, offer) => {
    setSelectedHotel(hotel);
    setSelectedOffer(offer);
  }, []);

  const startPrebookSession = useCallback((sessionData) => {
    // 10 minute price-lock window
    const expiresAt = Date.now() + 10 * 60 * 1000;
    setPrebookSession({ ...sessionData, expiresAt });
  }, []);

  const clearPrebookSession = useCallback(() => {
    setPrebookSession(null);
  }, []);

  const value = {
    searchParams,
    updateSearchParams,
    selectedHotel,
    selectedOffer,
    selectOffer,
    prebookSession,
    startPrebookSession,
    clearPrebookSession
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};
