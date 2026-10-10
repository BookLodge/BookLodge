import React from "react";

export const FilterSidebar = ({ filters, onFilterChange, onReset, maxAvailablePrice = 3000 }) => {
  const starOptions = [
    { stars: 5, label: "5 Stars (9.0+ Excellent)" },
    { stars: 4, label: "4 Stars (7.5 - 8.9 Very Good)" },
    { stars: 3, label: "3 Stars (6.0 - 7.4 Good)" },
    { stars: 2, label: "2 Stars & below" }
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

      {/* Star Rating Filter */}
      <div>
        <label className="block text-xs font-bold text-black uppercase tracking-wider mb-2">
          Rating & Category
        </label>
        <div className="space-y-1.5">
          {starOptions.map(({ stars, label }) => {
            const isChecked = filters.stars.includes(stars);
            return (
              <label
                key={stars}
                className="flex items-center space-x-2.5 text-xs text-slate-700 cursor-pointer p-1.5 rounded-md hover:bg-stone-50 transition"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...filters.stars, stars]
                      : filters.stars.filter((s) => s !== stars);
                    onFilterChange({ ...filters, stars: next });
                  }}
                  className="w-4 h-4 rounded cursor-pointer"
                  style={{ accentColor: "#254546" }}
                />
                <span className="flex items-center space-x-1.5">
                  <span className="text-amber-400 text-sm leading-none">
                    {"★".repeat(stars)}
                  </span>
                  <span className="font-medium text-slate-600">
                    {stars} Star{stars > 1 ? "s" : ""}
                  </span>
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
