export const getMockRoomsForHotel = (hotelId, nights = 1) => {
  return [
    {
      offerId: `off_${hotelId}_dlx_01`,
      name: 'Deluxe King Suite',
      roomType: 'Deluxe King',
      boardType: 'Breakfast Included',
      bedType: '1 Extra Large Double Bed',
      maxOccupancy: 2,
      pricePerNight: 145000,
      totalPrice: 145000 * nights,
      currency: 'NGN',
      cancellationPolicy: 'Free cancellation before 48 hours of check-in',
      image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
      amenities: ['Ocean View', 'Balcony', 'Ensuite Marble Bathroom', 'Espresso Machine', 'Fast Wi-Fi', 'Smart TV']
    },
    {
      offerId: `off_${hotelId}_exec_02`,
      name: 'Executive Diplomatic Suite',
      roomType: 'Executive Suite',
      boardType: 'All Inclusive (Breakfast, High Tea & Lounge)',
      bedType: '1 King Bed + Living Area',
      maxOccupancy: 3,
      pricePerNight: 220000,
      totalPrice: 220000 * nights,
      currency: 'NGN',
      cancellationPolicy: 'Non-refundable discount rate',
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
      amenities: ['Executive Lounge Access', 'Separate Living Room', 'Whirlpool Tub', 'Complimentary Minibar', 'City Skyline View']
    },
    {
      offerId: `off_${hotelId}_std_03`,
      name: 'Superior Double Room',
      roomType: 'Superior Room',
      boardType: 'Room Only',
      bedType: '2 Twin Beds',
      maxOccupancy: 2,
      pricePerNight: 95000,
      totalPrice: 95000 * nights,
      currency: 'NGN',
      cancellationPolicy: 'Free cancellation up to 24 hours before check-in',
      image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80',
      amenities: ['Work Desk', 'Rain Shower', 'Soundproof Windows', 'Coffee Maker', 'Fast Wi-Fi']
    }
  ];
};
