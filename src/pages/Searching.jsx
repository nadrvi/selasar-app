import { useState } from "react";
import {
  FaWifi,
  FaUsers,
  FaPlug,
  FaSearch,
  FaMapMarkerAlt,
  FaRegBookmark,
} from "react-icons/fa";
import TextSelasar from "../assets/text-logo.png";

export default function Searching() {
  const [activeFilters, setActiveFilters] = useState({
    colokan: "Tersedia",
    wifi: "30+ Mbps",
    keramaian: "Sepi",
  });

  const handleFilterClick = (category, value) => {
    setActiveFilters((prev) => ({ ...prev, [category]: value }));
  };

  return (
    <div className="min-h-screen bg-[#EDE8DE] p-4 sm:p-6 md:p-8 font-sans flex flex-col items-center">
      
      {/* HEADER / LOGO */}
      <div className="flex justify-center mb-6">
        <img src={TextSelasar} alt="Logo Selasar" className="w-56 h-auto object-contain drop-shadow-sm" />
      </div>

      {/* SEARCH BAR */}
      <div className="w-full max-w-2xl mb-8 flex justify-center">
        <div className="flex bg-white rounded-full border border-[#523E3E] shadow-sm overflow-hidden w-full sm:w-[80%] max-w-lg">
          <input
            type="text"
            placeholder="Mau nugas di mana hari ini?"
            className="flex-1 px-5 py-2.5 outline-none text-sm text-gray-700"
          />
          <button className="px-5 bg-[#EAE1DD] border-l border-[#523E3E] text-[#4A3B38] hover:bg-gray-200 transition-colors">
            <FaSearch />
          </button>
        </div>
      </div>

      {/* FILTER SECTION */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm mb-10 w-full max-w-3xl border border-gray-100">
        <h2 className="font-bold text-lg text-[#4A3B38] mb-5">
          Pilih suasana yang kamu butuhkan
        </h2>

        {/* Filter 1: Colokan */}
        <div className="bg-[#EAE1DD] rounded-2xl p-4 sm:p-5 mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="bg-[#6B554F] w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm">
            <FaPlug size={20} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-[#4A3B38]">Ketersediaan Colokan</h3>
            <p className="text-xs text-gray-500 mb-3 sm:mb-0">Prioritaskan tempat dengan colokan</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Tidak masalah", "Tersedia", "Banyak"].map((btn) => (
              <button
                key={btn}
                onClick={() => handleFilterClick("colokan", btn)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  activeFilters.colokan === btn
                    ? "bg-[#4A3B38] text-white border-[#4A3B38]"
                    : "bg-[#F3EFEA] text-[#4A3B38] border-[#cbbdb0] hover:bg-[#e4dacd]"
                }`}
              >
                {btn}
              </button>
            ))}
          </div>
        </div>

        {/* Filter 2: WiFi */}
        <div className="bg-[#EAE1DD] rounded-2xl p-4 sm:p-5 mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="bg-[#6B554F] w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm">
            <FaWifi size={20} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-[#4A3B38]">Kecepatan WiFi</h3>
            <p className="text-xs text-gray-500 mb-3 sm:mb-0">Pilih minimal kecepatan yang kamu butuhkan</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["10+ Mbps", "30+ Mbps", "50+ Mbps"].map((btn) => (
              <button
                key={btn}
                onClick={() => handleFilterClick("wifi", btn)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  activeFilters.wifi === btn
                    ? "bg-[#4A3B38] text-white border-[#4A3B38]"
                    : "bg-[#F3EFEA] text-[#4A3B38] border-[#cbbdb0] hover:bg-[#e4dacd]"
                }`}
              >
                {btn}
              </button>
            ))}
          </div>
        </div>

        {/* Filter 3: Keramaian */}
        <div className="bg-[#EAE1DD] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="bg-[#6B554F] w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm">
            <FaUsers size={20} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-[#4A3B38]">Tingkat Keramaian</h3>
            <p className="text-xs text-gray-500 mb-3 sm:mb-0">Pilih tingkat keramaian yang nyaman</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Sepi", "Sedang", "Ramai"].map((btn) => (
              <button
                key={btn}
                onClick={() => handleFilterClick("keramaian", btn)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  activeFilters.keramaian === btn
                    ? "bg-[#4A3B38] text-white border-[#4A3B38]"
                    : "bg-[#F3EFEA] text-[#4A3B38] border-[#cbbdb0] hover:bg-[#e4dacd]"
                }`}
              >
                {btn}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RECOMMENDATION SECTION */}
      <div className="w-full max-w-3xl">
        <h2 className="font-bold text-lg text-[#4A3B38] mb-4">Rekomendasi Untukmu</h2>

        {/* Card 1 */}
        <div className="bg-white rounded-[1.5rem] overflow-hidden shadow-sm border border-gray-100 mb-5 flex flex-col sm:flex-row relative">
          {/* Image */}
          <div className="sm:w-[35%] h-48 sm:h-auto overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1506744038136-46273834b3fb"
              alt="Kebon Raya Escape"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Content */}
          <div className="p-5 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-extrabold text-xl text-[#4A3B38]">Kebon Raya Escape</h3>
                <span className="text-[10px] bg-white border border-[#cbbdb0] text-[#4A3B38] px-3 py-1 rounded-full font-bold shadow-sm">
                  Alam
                </span>
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1 mb-4 font-medium">
                <FaMapMarkerAlt size={11} className="text-[#6B554F]" />
                Jl. Otto Iskandardinata No. 13
              </p>
            </div>

            {/* Metrics */}
            <div className="flex items-center justify-between mb-4 pr-2">
              <div className="flex gap-6 sm:gap-10">
                <div>
                  <p className="font-bold text-xs text-[#4A3B38] flex items-center gap-1.5 mb-0.5">
                    Colokan <FaPlug size={12} className="text-[#6B554F]" />
                  </p>
                  <p className="text-xs text-gray-500 font-medium">Terbatas</p>
                </div>
                <div>
                  <p className="font-bold text-xs text-[#4A3B38] flex items-center gap-1.5 mb-0.5">
                    WiFi <FaWifi size={12} className="text-[#6B554F]" />
                  </p>
                  <p className="text-xs text-gray-500 font-medium">Cepat</p>
                </div>
                <div>
                  <p className="font-bold text-xs text-[#4A3B38] flex items-center gap-1.5 mb-0.5">
                    <FaUsers size={12} className="text-[#6B554F]" /> 3-5 orang
                  </p>
                  <p className="text-xs text-gray-500 font-medium">Cocok</p>
                </div>
              </div>
              <button className="text-[#6B554F] hover:text-[#4A3B38] transition-colors">
                <FaRegBookmark size={20} />
              </button>
            </div>

            <div className="flex justify-between items-end border-t border-gray-100 pt-3">
              <p className="font-bold text-sm text-[#4A3B38]">
                Cocok untuk: <span className="font-medium text-gray-600">Me time, Hangout</span>
              </p>
              <div className="bg-[#F3EFEA] px-3 py-1.5 rounded-lg text-xs font-bold text-[#4A3B38] shadow-sm">
                80% match
              </div>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-[1.5rem] overflow-hidden shadow-sm border border-gray-100 mb-10 flex flex-col sm:flex-row relative">
          {/* Image */}
          <div className="sm:w-[35%] h-48 sm:h-auto overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1554118811-1e0d58224f24"
              alt="Kopi Nalar"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Content */}
          <div className="p-5 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-extrabold text-xl text-[#4A3B38]">Kopi Nalar</h3>
                <span className="text-[10px] bg-white border border-[#cbbdb0] text-[#4A3B38] px-3 py-1 rounded-full font-bold shadow-sm">
                  Cafe
                </span>
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1 mb-4 font-medium">
                <FaMapMarkerAlt size={11} className="text-[#6B554F]" />
                Jl. Masjid Nurul Hidayah, Tambun
              </p>
            </div>

            {/* Metrics */}
            <div className="flex items-center justify-between mb-4 pr-2">
              <div className="flex gap-6 sm:gap-10">
                <div>
                  <p className="font-bold text-xs text-[#4A3B38] flex items-center gap-1.5 mb-0.5">
                    Colokan <FaPlug size={12} className="text-[#6B554F]" />
                  </p>
                  <p className="text-xs text-gray-500 font-medium">Tersedia</p>
                </div>
                <div>
                  <p className="font-bold text-xs text-[#4A3B38] flex items-center gap-1.5 mb-0.5">
                    WiFi <FaWifi size={12} className="text-[#6B554F]" />
                  </p>
                  <p className="text-xs text-gray-500 font-medium">Cepat</p>
                </div>
                <div>
                  <p className="font-bold text-xs text-[#4A3B38] flex items-center gap-1.5 mb-0.5">
                    <FaUsers size={12} className="text-[#6B554F]" /> 2-4 orang
                  </p>
                  <p className="text-xs text-gray-500 font-medium">Cocok</p>
                </div>
              </div>
              <button className="text-[#6B554F] hover:text-[#4A3B38] transition-colors">
                <FaRegBookmark size={20} />
              </button>
            </div>

            <div className="flex justify-between items-end border-t border-gray-100 pt-3">
              <p className="font-bold text-sm text-[#4A3B38]">
                Cocok untuk: <span className="font-medium text-gray-600">Me time, WFC</span>
              </p>
              <div className="bg-[#F3EFEA] px-3 py-1.5 rounded-lg text-xs font-bold text-[#4A3B38] shadow-sm">
                95% match
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}