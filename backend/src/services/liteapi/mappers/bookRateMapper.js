const mapBookRateRequest = ({ prebookId, clientReference, holder, guests, transactionId }) => ({
  prebookId,
  clientReference,
  holder: {
    firstName: holder.firstName,
    lastName: holder.lastName,
    email: holder.email,
  },
  guests: guests.map((guest) => ({
    occupancyNumber: guest.occupancyNumber,
    firstName: guest.firstName,
    lastName: guest.lastName,
    email: guest.email,
  })),
  payment: {
    method: "TRANSACTION_ID",
    transactionId,
  },
});

// LiteAPI's docs spell the cancelled status CANCELED on some endpoints and
// CANCELLED on others, and one of those is a doc typo we cannot settle without a
// live reservation, so accept either rather than trusting one spelling.
const mapBookStatus = (status) => {
  const normalized = status.toUpperCase();

  return normalized === "CANCELED" || normalized === "CANCELLED" ? "CANCELLED" : normalized;
};

const mapBookRateResponse = (bookRateResponse) => {
  const { data } = bookRateResponse;

  return {
    clientReference: data.clientReference,
    status: mapBookStatus(data.status),
    hotel: {
      hotelId: data.hotel.hotelId,
      name: data.hotel.name,
    },
    stay: {
      checkin: data.checkin,
      checkout: data.checkout,
    },
    rooms: data.bookedRooms.map((room) => ({
      occupancyNumber: room.occupancy_number,
      roomName: room.roomType?.name ?? null,
      boardName: room.boardName ?? null,
    })),
    holder: {
      firstName: data.holder.firstName,
      lastName: data.holder.lastName,
      email: data.holder.email,
    },
    price: {
      amount: data.price,
      currency: data.currency,
    },
    liteApi: {
      bookingId: data.bookingId,
    },
  };
};

module.exports = { mapBookRateRequest, mapBookRateResponse };
