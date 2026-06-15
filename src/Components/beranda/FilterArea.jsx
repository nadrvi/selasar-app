// src/components/FilterArea.jsx
import React from 'react';
import { Search } from 'lucide-react';

const FilterArea = () => {
  const filters = ['Jakarta', 'Bogor', 'Bandung'];
  return (
    <div className="w-full flex flex-col items-center space-y-4">
      
      {/* Search Input */}
      <div className="relative w-full max-w-xl">
        <input 
          type="text" 
          placeholder="Search location or place name"
          className="w-full px-6 py-3.5 pr-14 rounded-full border border-neutral-300 shadow-inner bg-white/70 text-sm focus:ring-2 focus:ring-[#5F4B41]/50 focus:border-[#5F4B41] outline-none"
        />
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer p-2">
            <Search className="h-5 w-5 text-neutral-500" />
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex space-x-3 items-center">
        <button className="bg-[#5F4B41] text-white px-7 py-3 rounded-full text-sm font-medium shadow">
          Show Everything
        </button>
        {filters.map(filter => (
          <button key={filter} className="bg-white border border-neutral-300 text-neutral-700 px-7 py-3 rounded-full text-sm hover:bg-neutral-50 shadow-sm">
            {filter}
          </button>
        ))}
      </div>

    </div>
  );
};

export default FilterArea;