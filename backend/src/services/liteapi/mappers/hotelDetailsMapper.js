const toBookLodgeRate = (offerId, rate) => ({
  offerId,
  occupancyNumber: rate.occupancyNumber,
  roomName: rate.name,
  boardName: rate.boardName,
  amount: rate.retailRate.total[0].amount,
  currency: rate.retailRate.total[0].currency,
  refundable: rate.cancellationPolicies.refundableTag === "RFN",
});

const mapRates = (entry) => {
  const rates = [];

  for (const roomType of entry.roomTypes) {
    for (const rate of roomType.rates) {
      if (rate.retailRate.total.length === 0) continue;
      rates.push(toBookLodgeRate(roomType.offerId, rate));
    }
  }

  return rates;
};

const mapPhoto = (photo) => ({
  url: photo.url,
  ...(photo.caption !== undefined && { caption: photo.caption }),
  ...(photo.imageDescription !== undefined && { imageDescription: photo.imageDescription }),
  ...(photo.mainPhoto !== undefined && { mainPhoto: photo.mainPhoto }),
  ...(photo.hd_url !== undefined && { hd_url: photo.hd_url }),
});

const mapRoom = (room) => ({
  ...(room.id !== undefined && { id: room.id }),
  name: room.roomName ?? room.name ?? "Room",
  ...(room.description !== undefined && { description: room.description }),
  photos: (room.photos ?? []).map(mapPhoto),
});

const mapHotelDetailsResponse = (hotelDetailsResponse, hotelRatesResponse) => {
  const { data } = hotelDetailsResponse;
  const ratesEntry = hotelRatesResponse.data.find((entry) => entry.hotelId === data.id);

  return {
    id: data.id,
    name: data.name,
    description: data.hotelDescription,
    photo: data.main_photo,
    photos: (data.hotelImages ?? []).map(mapPhoto),
    rooms: (data.rooms ?? []).map(mapRoom),
    address: data.address,
    city: data.city,
    country: data.country,
    rating: data.starRating,
    location: {
      latitude: data.location.latitude,
      longitude: data.location.longitude,
    },
    facilities: data.hotelFacilities,
    checkin: data.checkinCheckoutTimes.checkin_start,
    checkout: data.checkinCheckoutTimes.checkout,
    rates: ratesEntry ? mapRates(ratesEntry) : [],
  };
};

module.exports = { mapHotelDetailsResponse };