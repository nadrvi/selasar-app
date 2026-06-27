import React from "react";
import {
  Search,
  Grid2x2,
  Coffee,
  Users,
  BookOpen,
  Trees,
  LocateFixed,
  Navigation,
  MapPin,
  Plug,
  Wifi,
  Bookmark,
} from "lucide-react";

export default function AppDesktop() {
  const mapMarkers = [
    {
      id: 1,
      top: "15%",
      left: "25%",
      title: "Kopi Selasar",
      dist: "250 m",
      icon: Coffee,
      bg: "bg-[#7B5B43]",
      type: "cafe",
    },
    {
      id: 2,
      top: "25%",
      left: "65%",
      title: "CoWork Hub",
      dist: "650 m",
      icon: Users,
      bg: "bg-[#7B5B43]",
      type: "cowork",
    },
    {
      id: 3,
      top: "50%",
      left: "20%",
      title: "Perpus Kota",
      dist: "1.2 km",
      icon: BookOpen,
      bg: "bg-[#7B5B43]",
      type: "perpus",
    },
    {
      id: 4,
      top: "60%",
      left: "75%",
      title: "Ruang Teduh",
      dist: "400 m",
      icon: Coffee,
      bg: "bg-[#7B5B43]",
      type: "cafe",
    },
    {
      id: 5,
      top: "80%",
      left: "45%",
      title: "Taman Literasi",
      dist: "800 m",
      icon: Trees,
      bg: "bg-[#5D7637]",
      type: "alam",
    },
  ];

  return (
    <div className="flex w-full h-screen bg-[#F5F1EA] overflow-hidden font-sans">
      {/* ================= SIDEBAR (KIRI) ================= */}
      <div className="w-[420px] bg-[#F5F1EA] flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.05)] z-20 relative">
        {/* HEADER */}
        <div className="pt-10 px-8 pb-6 text-center shrink-0">
          <h1 className="text-6xl font-serif font-bold text-[#3E4A2D] flex items-center justify-center gap-2">
            Selasar
            <Trees size={40} className="text-[#5D7637]" />
          </h1>
          <p className="text-[10px] tracking-[4px] text-[#776B61] uppercase mt-3 font-semibold">
            Tempat Nyaman, Ide Berkembang
          </p>
        </div>

        {/* SEARCH */}
        <div className="px-8 pb-6 shrink-0">
          <div className="bg-white rounded-full shadow-sm border border-[#D8D1CA] flex items-center overflow-hidden hover:shadow-md transition-shadow">
            <input
              type="text"
              placeholder="Mau nugas di mana hari ini?"
              className="flex-1 px-6 py-4 text-sm outline-none bg-transparent placeholder:text-gray-400"
            />
            <button className="px-5 text-[#3E4A2D] hover:text-[#5D7637] transition-colors">
              <Search size={22} />
            </button>
          </div>
        </div>

        {/* FILTER */}
        <div className="px-8 pb-6 shrink-0">
          <div className="flex flex-wrap gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#5B4741] text-white shadow-sm text-sm font-medium hover:bg-[#4a3a35] transition-colors">
              <Grid2x2 size={16} /> Semua
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E8E1D9] shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <Coffee size={16} /> Cafe
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E8E1D9] shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <Users size={16} /> Coworking
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E8E1D9] shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <BookOpen size={16} /> Perpustakaan
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E8E1D9] shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <Trees size={16} /> Alam
            </button>
          </div>
        </div>

        {/* LIST / DETAIL AREA (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
          <h3 className="text-sm font-bold text-gray-700 mb-4">
            Rekomendasi untukmu
          </h3>

          {/* KARTU KEBON RAYA ESCAPE */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#E8E1D9] overflow-hidden group hover:shadow-md transition-shadow">
            <div className="h-40 w-full relative overflow-hidden bg-gray-200">
              <img
                src="https://images.unsplash.com/photo-1542224566-6e85f2e6772f?q=80&w=1000&auto=format&fit=crop"
                alt="Kebon Raya Escape"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-lg border border-gray-200 text-xs font-bold text-[#5B4741]">
                Alam
              </div>
            </div>

            <div className="p-5">
              <div className="flex justify-between items-start mb-1">
                <h3 className="text-xl font-bold text-[#3E4A2D]">
                  Kebon Raya Escape
                </h3>
                <button className="text-gray-400 hover:text-[#3E4A2D] transition-colors">
                  <Bookmark size={22} />
                </button>
              </div>

              <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-4">
                <MapPin size={12} /> Jl. Otto Iskandardinata No. 13
              </p>

              <div className="grid grid-cols-3 gap-2 mb-4 border-y border-gray-100 py-3">
                <div className="flex flex-col items-center text-center gap-1">
                  <Plug size={16} className="text-gray-600" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-700">
                      Colokan
                    </p>
                    <p className="text-[10px] text-gray-500">Terbatas</p>
                  </div>
                </div>
                <div className="flex flex-col items-center text-center gap-1 border-x border-gray-100">
                  <Wifi size={16} className="text-gray-600" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-700">WiFi</p>
                    <p className="text-[10px] text-gray-500">Cepat</p>
                  </div>
                </div>
                <div className="flex flex-col items-center text-center gap-1">
                  <Users size={16} className="text-gray-600" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-700">
                      Kapasitas
                    </p>
                    <p className="text-[10px] text-gray-500">3-5 Orang</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-600">
                  Cocok untuk:{" "}
                  <span className="font-bold text-[#3E4A2D]">
                    Me time, Hangout
                  </span>
                </p>
                <div className="px-3 py-1.5 bg-[#F5F1EA] text-[#5D7637] font-bold text-xs rounded-lg border border-[#E8E1D9]">
                  80% match
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MAP AREA (KANAN) ================= */}
      <div className="flex-1 relative bg-[#F5F1EA] overflow-hidden">
        
        {/* GAMBAR MAP ASLI TAPI DIMINIMALISIR PAKAI TAILWIND FILTERS */}
        <img
          src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2000&auto=format&fit=crop"
          alt="map background"
          className="absolute inset-0 w-full h-full object-cover grayscale opacity-40 mix-blend-multiply contrast-125" 
        />

        {/* MAP MARKERS LOOP */}
        {mapMarkers.map((marker) => {
          const IconComponent = marker.icon;
          return (
            <div
              key={marker.id}
              className="absolute group cursor-pointer"
              style={{ top: marker.top, left: marker.left }}
            >
              {/* Pin Icon Drop */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[#7B5B43] text-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                📍
              </div>

              <div className="bg-white rounded-full shadow-lg px-2 pr-5 py-2 flex items-center gap-3 hover:scale-105 transition-transform origin-bottom-left">
                <div
                  className={`w-10 h-10 rounded-full ${marker.bg} flex items-center justify-center text-white shadow-inner`}
                >
                  <IconComponent size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-800">
                    {marker.title}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    {marker.dist}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {/* USER LOCATION (Tengah Peta) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center">
          <div className="absolute w-64 h-64 rounded-full bg-blue-400/10 border border-blue-400/20 animate-pulse"></div>
          <div className="absolute w-32 h-32 rounded-full bg-blue-400/20"></div>
          <div className="w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-md relative z-10"></div>

          {/* User Custom Pin */}
          <div className="absolute -top-24">
            <div className="w-20 h-20 rounded-full bg-[#60773D] shadow-xl flex items-center justify-center border-4 border-white">
              <Trees size={32} className="text-white" />
            </div>
            {/* Triangle pointing down */}
            <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[14px] border-transparent border-t-[#60773D] mx-auto -mt-1 drop-shadow-md"></div>
          </div>
        </div>

        {/* FLOATING CONTROLS (Kanan Bawah) */}
        <div className="absolute bottom-10 right-10 flex flex-col gap-4">
          <button className="w-14 h-14 rounded-full bg-white text-gray-700 shadow-[0_4px_20px_rgba(0,0,0,0.1)] flex items-center justify-center hover:bg-gray-50 hover:text-[#3E4A2D] transition-all">
            <LocateFixed size={24} />
          </button>
          <button className="w-14 h-14 rounded-full bg-white text-gray-700 shadow-[0_4px_20px_rgba(0,0,0,0.1)] flex items-center justify-center hover:bg-gray-50 hover:text-[#3E4A2D] transition-all">
            <Navigation size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}