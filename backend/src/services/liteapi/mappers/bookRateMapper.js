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

const mapBookRateResponse = (bookRateResponse) => {
  const { data } = bookRateResponse;

  return { bookingId: data.bookingId };
};

module.exports = { mapBookRateRequest, mapBookRateResponse };
