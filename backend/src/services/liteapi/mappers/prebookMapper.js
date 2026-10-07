const mapPrebookResponse = (prebookResponse) => {
  const { data } = prebookResponse;

  return {
    prebookId: data.prebookId,
    offerId: data.offerId,
    hotelId: data.hotelId,
    price: {
      amount: data.price,
      currency: data.currency,
    },
    transactionId: data.transactionId,
    secretKey: data.secretKey,
  };
};

module.exports = { mapPrebookResponse };
