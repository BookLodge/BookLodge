const mapHotelSearchRequest = (search) => ({
  placeId: search.placeId,
  checkin: search.checkin,
  checkout: search.checkout,
  occupancies: search.occupancies,
  currency: search.currency,
  guestNationality: search.guestNationality,
  maxRatesPerHotel: 1,
  includeHotelData: true,
});

const firstUsableRate = (entry) => {
  for (const roomType of entry.roomTypes) {
    const rate = roomType.rates[0];
    if (rate && rate.retailRate.total.length > 0) {
      return {
        offerId: roomType.offerId,
        roomName: rate.name,
        boardName: rate.boardName,
        amount: rate.retailRate.total[0].amount,
        currency: rate.retailRate.total[0].currency,
        refundable: rate.cancellationPolicies.refundableTag === "RFN",
      };
    }
  }

  return null;
};

const mapHotelSearchResponse = (response) => {
  const { data, hotels } = response;

  const priced = data
    .map((entry) => {
      const startingRate = firstUsableRate(entry);
      const hotel = hotels.find((item) => item.id === entry.hotelId);
      if (!startingRate || !hotel) return null;

      return {
        id: hotel.id,
        name: hotel.name,
        photo: hotel.main_photo,
        address: hotel.address,
        rating: hotel.rating,
        startingRate,
      };
    })
    .filter((hotel) => hotel !== null);

  return { hotels: priced };
};

module.exports = { mapHotelSearchRequest, mapHotelSearchResponse };
