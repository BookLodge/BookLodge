const LITEAPI_STRIPE_PUBLIC_KEY =
  import.meta.env.VITE_LITEAPI_STRIPE_PUBLIC_KEY ||
  'pk_test_51OyYnVA4FXPoRk9YJECd2jJmfprI2inRzqbt5Brk7R41kKIaftBnO8rCetwEVUdfR5WSsLorvNQ0tr4dDcFk8pof002p27EYzN';

export const paymentService = {
  /**
   * Confirms LiteAPI's Stripe PaymentIntent client secret using test credentials.
   * This authorizes the hold with Stripe so LiteAPI marks the transactionId as paid.
   *
   * @param {Object} params
   * @param {string} params.secretKey - Stripe client secret from prebook (e.g. "pi_3UO..._secret_...")
   * @param {Object} [params.cardDetails] - Card details from SandboxCardWidget
   * @returns {Promise<Object>} Confirmed Stripe PaymentIntent
   */
  async confirmPaymentIntent({ secretKey, cardDetails }) {
    if (!secretKey) {
      throw new Error('PaymentIntent secret key is required');
    }

    const piId = secretKey.split('_secret_')[0];
    if (!piId) {
      throw new Error('Invalid PaymentIntent secret key format');
    }

    const params = new URLSearchParams({
      client_secret: secretKey,
    });

    const cleanCard = cardDetails?.cardNumber?.replace(/\s/g, '');
    const isStandardTestCard = !cleanCard || cleanCard === '4242424242424242';

    if (isStandardTestCard) {
      params.append('payment_method', 'pm_card_visa');
    } else {
      params.append('payment_method_data[type]', 'card');
      params.append('payment_method_data[card][number]', cleanCard);
      const parts = (cardDetails?.expiry || '').split('/');
      if (parts[0]) params.append('payment_method_data[card][exp_month]', parts[0].trim());
      if (parts[1]) {
        const yr = parts[1].trim();
        params.append('payment_method_data[card][exp_year]', yr.length === 2 ? ('20' + yr) : yr);
      }
      if (cardDetails?.cvv) params.append('payment_method_data[card][cvc]', cardDetails.cvv.trim());
      if (cardDetails?.cardHolder) params.append('payment_method_data[billing_details][name]', cardDetails.cardHolder.trim());
    }

    const res = await fetch('https://api.stripe.com/v1/payment_intents/' + piId + '/confirm', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + LITEAPI_STRIPE_PUBLIC_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await res.json();

    if (data.error) {
      if (
        data.error.message?.includes('already succeeded') ||
        data.error.payment_intent?.status === 'requires_capture' ||
        data.error.payment_intent?.status === 'succeeded'
      ) {
        return data.error.payment_intent || { status: 'succeeded' };
      }

      throw new Error(data.error.message || 'Payment processing failed with card gateway');
    }

    const validStatuses = ['succeeded', 'requires_capture'];
    if (!validStatuses.includes(data.status)) {
      throw new Error('Payment incomplete: status is ' + data.status);
    }

    return data;
  },
};
