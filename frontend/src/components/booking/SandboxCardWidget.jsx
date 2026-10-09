import React, { useState } from 'react';

export const SandboxCardWidget = ({ amount, currency = 'USD', onSubmit, isProcessing }) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [error, setError] = useState('');

  const fillTestCard = () => {
    setCardNumber('4242 4242 4242 4242');
    setExpiry('12/28');
    setCvv('123');
    setCardHolder('Alex Morgan');
    setError('');
  };

  const handleCardNumberChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = val.replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 3) {
      val = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    setExpiry(val);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const cleanCard = cardNumber.replace(/\s/g, '');
    if (cleanCard.length < 16) {
      setError('Please enter a valid 16-digit card number.');
      return;
    }
    if (!expiry || expiry.length < 5) {
      setError('Please enter expiration as MM/YY.');
      return;
    }
    if (!cvv || cvv.length < 3) {
      setError('Please enter a valid 3-digit CVV.');
      return;
    }
    if (!cardHolder.trim()) {
      setError('Please enter the name on the card.');
      return;
    }

    onSubmit({
      cardNumber: cleanCard,
      expiry,
      cvv,
      cardHolder,
    });
  };

  return (
    <div className="bg-white rounded-lg border border-stone-200 p-6 shadow-xs">
      {/* Test Sandbox Notice (Clean, Professional, No AI styling) */}
      <div className="bg-stone-50 border border-stone-200 rounded-md p-4 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-slate-700">
          <span className="font-bold text-black block mb-0.5">Payment Sandbox (Test Mode)</span>
          <span>No real card will be charged. Use test card number <code className="bg-white px-1.5 py-0.5 rounded border border-stone-200 font-mono text-black font-semibold">4242 4242 4242 4242</code></span>
        </div>
        <button
          type="button"
          onClick={fillTestCard}
          className="text-xs font-semibold bg-white hover:bg-stone-100 text-black px-3.5 py-2 rounded-md border border-stone-300 transition cursor-pointer shrink-0"
        >
          Fill Test Card
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded-md">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
            Cardholder Name
          </label>
          <input
            type="text"
            placeholder="e.g. Alex Morgan"
            value={cardHolder}
            onChange={(e) => setCardHolder(e.target.value)}
            disabled={isProcessing}
            className="w-full px-3.5 py-2.5 bg-stone-100 hover:bg-stone-50 border border-stone-300 rounded-md text-sm font-medium text-black focus:bg-white focus:border-[#254546] focus:ring-1 focus:ring-[#254546] outline-none transition disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
            Card Number
          </label>
          <input
            type="text"
            placeholder="4242 4242 4242 4242"
            value={cardNumber}
            onChange={handleCardNumberChange}
            disabled={isProcessing}
            maxLength={19}
            className="w-full px-3.5 py-2.5 bg-stone-100 hover:bg-stone-50 border border-stone-300 rounded-md text-sm font-medium font-mono text-black focus:bg-white focus:border-[#254546] focus:ring-1 focus:ring-[#254546] outline-none transition disabled:opacity-50 tracking-wider"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
              Expires (MM/YY)
            </label>
            <input
              type="text"
              placeholder="12/28"
              value={expiry}
              onChange={handleExpiryChange}
              disabled={isProcessing}
              maxLength={5}
              className="w-full px-3.5 py-2.5 bg-stone-100 hover:bg-stone-50 border border-stone-300 rounded-md text-sm font-medium font-mono text-black focus:bg-white focus:border-[#254546] focus:ring-1 focus:ring-[#254546] outline-none transition disabled:opacity-50 text-center"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
              CVV Code
            </label>
            <input
              type="password"
              placeholder="123"
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
              disabled={isProcessing}
              maxLength={3}
              className="w-full px-3.5 py-2.5 bg-stone-100 hover:bg-stone-50 border border-stone-300 rounded-md text-sm font-medium font-mono text-black focus:bg-white focus:border-[#254546] focus:ring-1 focus:ring-[#254546] outline-none transition disabled:opacity-50 text-center"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isProcessing}
          style={{ backgroundColor: '#254546', color: '#fefae0' }}
          className="w-full mt-4 font-bold py-3 rounded-md flex items-center justify-center space-x-2 transition hover:opacity-90 cursor-pointer disabled:opacity-60"
        >
          {isProcessing ? (
            <span>Confirming Reservation</span>
          ) : (
            <span>
              Pay {currency} {Number(amount).toLocaleString()} & Confirm Reservation
            </span>
          )}
        </button>
      </form>
    </div>
  );
};