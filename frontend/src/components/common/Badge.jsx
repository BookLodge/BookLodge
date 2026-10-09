import React from 'react';

export const Badge = ({ status = 'PENDING_PAYMENT', children }) => {
  const styles = {
    CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    PENDING_PAYMENT: 'bg-amber-50 text-amber-700 border-amber-200',
    PENDING_BOOKING: 'bg-stone-50 text-[#254546] border-[#254546]/30',
    CANCELLED: 'bg-slate-100 text-slate-700 border-slate-300',
    FAILED: 'bg-rose-50 text-rose-700 border-rose-200',
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    INACTIVE: 'bg-rose-50 text-rose-700 border-rose-200'
  };

  const currentStyle = styles[status] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${currentStyle}`}
    >
      {children || status.replace('_', ' ')}
    </span>
  );
};

