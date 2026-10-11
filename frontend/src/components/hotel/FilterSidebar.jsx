import React from "react";

export const FilterSidebar = ({ filters, onFilterChange, onReset, maxAvailablePrice = 3000 }) => {
  const ratingTiers = [
    { key: "tier_high", label: "8.0 - 10" },
    { key: "tier_mid", label: "5.1 - 7.9" },
    { key: "tier_low", label: "5.0 & Below" }
  ];

  return (
    <div className="bg-white rounded-lg border border-stone-200 p-5 space-y-6 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-stone-100">
        <h4 className="font-bold text-black text-sm">Filter Results</h4>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-slate-400 hover:text-black transition cursor-pointer font-medium"
        >
          Reset All
        </button>
      </div>

      {/* Guest Review Rating Filter */}
      <div>
        <label className="block text-xs font-bold text-black uppercase tracking-wider mb-2">
          Rating
        </label>
        <div className="space-y-2">
          {ratingTiers.map(({ key, label }) => {
            const isChecked = filters.ratingTiers?.includes(key);
            return (
              <label
                key={key}
                className="flex items-center space-x-2.5 text-xs text-slate-700 cursor-pointer p-1.5 rounded-md hover:bg-stone-50 transition"
              >
                <input
                  type="checkbox"
                  checked={isChecked || false}
                  onChange={(e) => {
                    const current = filters.ratingTiers || [];
                    const next = e.target.checked
                      ? [...current, key]
                      : current.filter((k) => k !== key);
                    onFilterChange({ ...filters, ratingTiers: next });
                  }}
                  className="w-4 h-4 rounded cursor-pointer"
                  style={{ accentColor: "#254546" }}
                />
                <span className="font-semibold text-slate-700">
                  {label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Max Price Range Slider */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-xs font-bold text-black uppercase tracking-wider">
            Max Price / Night
          </label>
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-stone-100" style={{ color: "#254546" }}>
            {"$" + Number(filters.maxPrice).toLocaleString()}
          </span>
        </div>

        {/* Visible Track Range Input */}
        <div className="py-2">
          <input
            type="range"
            min={50}
            max={maxAvailablePrice}
            step={25}
            value={filters.maxPrice}
            onChange={(e) => onFilterChange({ ...filters, maxPrice: Number(e.target.value) })}
            className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer border border-stone-300"
            style={{ accentColor: "#254546" }}
          />
        </div>

        <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-medium">
          <span>$50</span>
          <span>{"$" + maxAvailablePrice.toLocaleString()}</span>
        </div>
      </div>

      {/* Breakfast Included Filter */}
      <div className="pt-2 border-t border-stone-100">
        <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer p-1 rounded-md hover:bg-stone-50 transition">
          <input
            type="checkbox"
            checked={filters.breakfastOnly}
            onChange={(e) => onFilterChange({ ...filters, breakfastOnly: e.target.checked })}
            className="w-4 h-4 rounded cursor-pointer"
            style={{ accentColor: "#254546" }}
          />
          <span className="font-medium">Breakfast Included Deals</span>
        </label>
      </div>
    </div>
  );
};
