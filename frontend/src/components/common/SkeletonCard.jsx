import React from 'react';

export const SkeletonHotelCard = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm animate-pulse flex flex-col md:flex-row">
      <div className="w-full md:w-72 h-48 md:h-auto bg-slate-200" />
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="h-6 bg-slate-200 rounded w-3/4" />
          <div className="h-4 bg-slate-100 rounded w-1/2" />
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-slate-100 rounded-full" />
          <div className="h-6 w-20 bg-slate-100 rounded-full" />
          <div className="h-6 w-16 bg-slate-100 rounded-full" />
        </div>
        <div className="flex justify-between items-end pt-4 border-t border-slate-100">
          <div className="space-y-1">
            <div className="h-3 w-16 bg-slate-100 rounded" />
            <div className="h-6 w-28 bg-slate-200 rounded" />
          </div>
          <div className="h-10 w-32 bg-slate-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export const SkeletonRoomCard = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse flex flex-col md:flex-row gap-5">
      <div className="w-full md:w-56 h-40 bg-slate-200 rounded-lg" />
      <div className="flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          <div className="h-5 bg-slate-200 rounded w-1/2" />
          <div className="h-4 bg-slate-100 rounded w-1/3" />
        </div>
        <div className="flex gap-2">
          <div className="h-5 w-20 bg-slate-100 rounded" />
          <div className="h-5 w-24 bg-slate-100 rounded" />
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-slate-100">
          <div className="h-6 w-24 bg-slate-200 rounded" />
          <div className="h-9 w-28 bg-slate-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
};
