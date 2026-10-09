const STORAGE_KEY = 'demo_hotel_bookings';

const initialMockBookings = [
  {
    _id: 'book_mock_101',
    reference: 'HB-20261001-A1B2',
    customerId: 'cust_001',
    guestEmail: 'alex.morgan@example.com',
    guestFirstName: 'Alex',
    guestLastName: 'Morgan',
    liteApiHotelId: 'lp_lag_001',
    hotelName: 'Eko Grand Suites & Resort',
    hotelAddress: 'Plot 1415 Adetokunbo Ademola Street, Victoria Island, Lagos',
    hotelImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
    roomType: 'Deluxe King Suite',
    boardType: 'Breakfast Included',
    checkInDate: '2026-10-15',
    checkOutDate: '2026-10-18',
    numberOfGuests: 2,
    pricePerNight: 145000,
    totalPrice: 435000,
    currency: 'NGN',
    status: 'CONFIRMED',
    liteApiBookingId: 'lite_bk_993817',
    hotelConfirmationCode: 'EKO-RES-7781',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    _id: 'book_mock_102',
    reference: 'HB-20260920-F4D9',
    customerId: null, // Guest booking
    guestEmail: 'guest.traveler@example.com',
    guestFirstName: 'Sarah',
    guestLastName: 'Connor',
    liteApiHotelId: 'lp_abj_001',
    hotelName: 'Transcorp Metropolitan Palace',
    hotelAddress: '1 Aguiyi Ironsi St, Maitama, Abuja',
    hotelImage: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=600&q=80',
    roomType: 'Executive Suite',
    boardType: 'All Inclusive',
    checkInDate: '2026-11-01',
    checkOutDate: '2026-11-04',
    numberOfGuests: 1,
    pricePerNight: 165000,
    totalPrice: 495000,
    currency: 'NGN',
    status: 'CONFIRMED',
    liteApiBookingId: 'lite_bk_662810',
    hotelConfirmationCode: 'TRN-ABJ-4412',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  }
];

export const getStoredBookings = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialMockBookings));
    return initialMockBookings;
  }
  try {
    return JSON.parse(data);
  } catch {
    return initialMockBookings;
  }
};

export const saveBooking = (newBooking) => {
  const bookings = getStoredBookings();
  const updated = [newBooking, ...bookings];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newBooking;
};

export const updateBookingStatus = (id, status, reason = '') => {
  const bookings = getStoredBookings();
  const index = bookings.findIndex((b) => b._id === id || b.reference === id);
  if (index !== -1) {
    bookings[index].status = status;
    if (reason) bookings[index].cancelledReason = reason;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    return bookings[index];
  }
  return null;
};
