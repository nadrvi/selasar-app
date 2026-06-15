// src/components/MapArea.jsx
import React from 'react';
import { ZoomIn, ZoomOut, MapPin } from 'lucide-react';

const MapArea = () => {
  // Placeholder untuk gambar peta - dalam produksi, ini bisa berupa API peta
  // atau gambar statis yang dirancang. Saya akan menggunakan latar belakang gradien untuk representasi.
  return (
    <div className="relative w-full h-[250px] bg-sky-100 rounded-xl overflow-hidden border border-neutral-300 shadow-sm">
      
      {/* Mocking the map view - Dalam replikasi ini, kita tidak menggunakan peta API sungguhan */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url("path_to_your_map_image.png")' }}>
        {/* Atau representasi visual sederhana jika tidak ada gambar */}
        <div className="absolute inset-0 flex flex-col space-y-1 p-4">
          <div className="h-4 bg-blue-300 rounded w-1/3"></div>
          <div className="flex space-x-2">
            <div className="h-4 bg-green-200 rounded w-1/4"></div>
            <div className="h-4 bg-yellow-200 rounded w-1/2"></div>
          </div>
          <div className="h-4 bg-orange-200 rounded w-3/4"></div>
          <div className="h-4 bg-neutral-200 rounded w-full"></div>
        </div>
      </div>

      {/* Map Content Overlay: Zoom Controls, Location Pin */}
      <div className="absolute inset-0 p-4 flex flex-col justify-between">
        
        {/* Custom Zoom Controls */}
        <div className="self-end bg-white/80 p-1.5 rounded-xl border border-neutral-200 shadow-lg flex flex-col space-y-1">
          <button className="p-1 hover:bg-neutral-100 rounded-md">
            <ZoomIn className="h-5 w-5 text-neutral-700" strokeWidth={1} />
          </button>
          <div className="border-b border-neutral-300 w-full"></div>
          <button className="p-1 hover:bg-neutral-100 rounded-md">
            <ZoomOut className="h-5 w-5 text-neutral-700" strokeWidth={1} />
          </button>
        </div>

        {/* Location Pins & Labels - Replikasi label spesifik dari gambar */}
        <div className="absolute top-28 left-1/2 -translate-x-1/2 flex items-center space-x-2">
          <div className="bg-orange-500 rounded-full p-1.5 shadow-md">
            <MapPin className="h-5 w-5 text-white" />
          </div>
          <div className="bg-white/80 px-3 py-1 rounded-full text-xs font-semibold text-neutral-800 shadow">
            The Nizam's M
          </div>
        </div>

        {/* Other text labels as per image */}
        <div className="absolute top-10 left-10 text-[10px] text-neutral-700 bg-white/50 p-1 rounded">GHMC Annapurna Food Shelter</div>
        <div className="absolute top-64 right-10 text-[10px] text-neutral-700 bg-white/50 p-1 rounded">Musi River</div>
        <div className="absolute top-5 left-[60%] text-[10px] text-neutral-700 bg-white/50 p-1 rounded">High Court for the State of Telangana</div>
        <div className="absolute bottom-10 left-32 text-[10px] text-neutral-700 bg-white/50 p-1 rounded">Rajlaxmi Textiles India Pvt. Ltd</div>
        {/* Add other specific labels as needed from the image */}

      </div>
    </div>
  );
};

export default MapArea;