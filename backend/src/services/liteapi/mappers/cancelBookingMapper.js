const mapCancelBookingResponse = (cancelResponse) => {
  const { data } = cancelResponse;

  // LiteAPI distinguishes CANCELLED_WITH_CHARGES, which our status enum has no
  // slot for; the fee and refund carry that distinction instead.
  return {
    bookingId: data.bookingId,
    status: "CANCELLED",
    cancellationFee: data.cancellation_fee ?? null,
    refundAmount: data.refund_amount ?? null,
    currency: data.currency ?? null,
  };
};

module.exports = { mapCancelBookingResponse };
