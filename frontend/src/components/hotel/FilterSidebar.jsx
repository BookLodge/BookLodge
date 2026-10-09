import React from "react";

export const FilterSidebar = ({ filters, onFilterChange, onReset, maxAvailablePrice = 2000 }) => {
  return (
    <div className="bg-white rounded-lg border border-stone-200 p-5 space-y-6 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-stone-100">
        <h4 className="font-bold text-black text-sm">Filter Results</h4>
        <button onClick={onReset} className="text-xs text-slate-400 hover:text-black transition cursor-pointer">
          Reset
        </button>
      </div>

      {/* Star Rating */}
      <div>
        <label className="block text-xs font-bold text-black uppercase tracking-wider mb-2">
          Hotel Rating
        </label>
        <div className="space-y-1.5">
          {[5, 4, 3].map((star) => (
            <label key={star} className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer p-1.5 rounded-md hover:bg-stone-50 transition">
              <input
                type="checkbox"
                checked={filters.stars.includes(star)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...filters.stars, star]
                    : filters.stars.filter((s) => s !== star);
                  onFilterChange({ ...filters, stars: next });
                }}
                className="w-4 h-4 rounded"
                style={{ accentColor: "#254546" }}
              />
              <span>{"★".repeat(star)} {star} Stars</span>
            </label>
          ))}
        </div>
      </div>

      {/* Max Price Slider — USD */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-xs font-bold text-black uppercase tracking-wider">
            Max Price / Night
          </label>
          <span className="text-xs font-bold" style={{ color: "#254546" }}>
            ${Number(filters.maxPrice).toLocaleString()}
          </span>
        </div>
        <input
          type="range"
          min={50}
          max={maxAvailablePrice}
          step={50}
          value={filters.maxPrice}
          onChange={(e) => onFilterChange({ ...filters, maxPrice: Number(e.target.value) })}
          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
          style={{ accentColor: "#254546" }}
        />
        <div className="flex justify-between text-[11px] text-slate-400 mt-1">
          <span>$50</span>
          <span>${maxAvailablePrice.toLocaleString()}</span>
        </div>
      </div>

      {/* Breakfast filter */}
      <div className="pt-2 border-t border-stone-100">
        <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.breakfastOnly}
            onChange={(e) => onFilterChange({ ...filters, breakfastOnly: e.target.checked })}
            className="w-4 h-4 rounded"
            style={{ accentColor: "#254546" }}
          />
          <span className="font-medium">Breakfast Included Deals</span>
        </label>
      </div>
    </div>
  );
};