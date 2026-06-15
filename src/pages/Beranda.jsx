// src/pages/Beranda.jsx
import React from 'react';
import Header from '../Components/beranda/Header';
import MapArea from '../Components/beranda/MapArea';
import FilterArea from '../Components/beranda/FilterArea';
import LocationCardGrid from '../Components/beranda/LocationCardGrid';

const Beranda = () => {
  return (
    
    <div className="min-h-screen bg-[#EBE3D5] p-6 md:p-10">
      
      {/* 3. Container utama tetap di tengah, tapi sekarang di atas background krem */}
      <div className="max-w-7xl mx-auto flex flex-col space-y-6">
        <Header />
        <MapArea />
        <FilterArea />
        <LocationCardGrid />
      </div>

    </div>
  );
};

export default Beranda;