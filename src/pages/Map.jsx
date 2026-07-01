import { useState, useEffect } from "react";
import {
  FaSearch,
  FaCoffee,
  FaBook,
  FaUsers,
  FaTree,
  FaMapMarkerAlt,
  FaWifi,
  FaPlug,
  FaBookmark,
  FaLocationArrow,
  FaCrosshairs,
  FaTimes,
  FaRegSadTear,
} from "react-icons/fa";
import { PiLeafFill } from "react-icons/pi";

const locationsData = [
  {
    id: 1,
    name: "Kopi Selasar",
    distance: "250 m",
    category: "Cafe",
    icon: <FaCoffee className="text-white text-sm" />,
    bgColor: "bg-[#7A5230]",
    position: "top-20 left-12",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24",
    address: "Jl. Merdeka No. 10",
    match: "95%",
    specs: { plug: "Banyak", wifi: "Sangat Cepat", capacity: "1-2 orang" },
  },
  {
    id: 2,
    name: "CoWork Hub",
    distance: "650 m",
    category: "Coworking",
    icon: <FaUsers className="text-white text-sm" />,
    bgColor: "bg-[#7A5230]",
    position: "top-32 right-32",
    image: "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2",
    address: "Gd. Inovasi Lantai 3",
    match: "88%",
    specs: { plug: "Tersedia", wifi: "Cepat", capacity: "Tim (5-10)" },
  },
  {
    id: 3,
    name: "Perpus Kota",
    distance: "1.2 km",
    category: "Perpustakaan",
    icon: <FaBook className="text-white text-sm" />,
    bgColor: "bg-[#6B563D]",
    position: "bottom-40 left-20",
    image: "https://images.unsplash.com/photo-1568667256549-094345857637",
    address: "Jl. Pustaka Raya No. 1",
    match: "92%",
    specs: { plug: "Terbatas", wifi: "Standar", capacity: "Individual" },
  },
  {
    id: 4,
    name: "Ruang Teduh",
    distance: "400 m",
    category: "Cafe",
    icon: <FaCoffee className="text-white text-sm" />,
    bgColor: "bg-[#7A5230]",
    position: "bottom-44 right-24",
    image: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf",
    address: "Jl. Rindang No. 8",
    match: "85%",
    specs: { plug: "Lumayan", wifi: "Cepat", capacity: "2-4 orang" },
  },
  {
    id: 5,
    name: "Taman Literasi",
    distance: "800 m",
    category: "Alam",
    icon: <FaTree className="text-white text-sm" />,
    bgColor: "bg-[#556B2F]",
    position: "bottom-20 left-[40%]",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
    address: "Taman Kota Blok C",
    match: "80%",
    specs: { plug: "Tidak Ada", wifi: "Publik (Lambat)", capacity: "Bebas" },
  },
  {
    id: 6,
    name: "Kreativ Space",
    distance: "2.1 km",
    category: "Coworking",
    icon: <FaUsers className="text-white text-sm" />,
    bgColor: "bg-[#7A5230]",
    position: "top-[10%] left-[60%]",
    image: "https://images.unsplash.com/photo-1604328698692-f76ea9498e76",
    address: "Jl. Industri Kreatif 99",
    match: "82%",
    specs: { plug: "Setiap Meja", wifi: "Sangat Cepat", capacity: "4-8 orang" },
  },
];

const filterCategories = [
  { label: "Semua", icon: null },
  { label: "Cafe", icon: <FaCoffee /> },
  { label: "Coworking", icon: <FaUsers /> },
  { label: "Perpustakaan", icon: <FaBook /> },
  { label: "Alam", icon: <FaTree /> },
];

export default function Map() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // State untuk Interaksi Real-time
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [filteredLocations, setFilteredLocations] = useState(locationsData);

  // Animasi awal render
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Modal Escape Logic
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setSelectedLocation(null);
    };
    document.body.style.overflow = selectedLocation ? "hidden" : "unset";
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedLocation]);

  useEffect(() => {
    let result = locationsData;

    // 1. Logika Filter Kategori
    if (activeFilter !== "Semua") {
      result = result.filter((loc) => loc.category === activeFilter);
    }

    // 2. Logika Search Bar
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (loc) =>
          loc.name.toLowerCase().includes(query) ||
          loc.address.toLowerCase().includes(query) ||
          loc.category.toLowerCase().includes(query),
      );
    }

    setFilteredLocations(result);
  }, [searchQuery, activeFilter]); // Akan jalan tiap kali user ngetik atau klik filter

  return (
    <div
      className={`min-h-screen bg-[#F4EFE8] transition-opacity duration-1000 ${isLoaded ? "opacity-100" : "opacity-0"} pb-20`}
    >
      {/* HEADER */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex justify-center cursor-pointer transition-transform duration-500 hover:scale-105">
          <div className="text-center">
            <h1 className="text-[64px] font-serif font-bold text-[#445234] leading-none drop-shadow-sm">
              Selasar
            </h1>
            <p className="text-[10px] tracking-[3px] text-[#8B6B4F] mt-1">
              TEMPAT NYAMAN, IDE BERKEMBANG
            </p>
          </div>
        </div>

        {/* SEARCH */}
        <div className="flex justify-center mt-6">
          <div className="flex w-[450px] overflow-hidden rounded-full border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md focus-within:shadow-lg focus-within:scale-[1.02] focus-within:border-[#8B6B4F]/30 focus-within:ring-4 focus-within:ring-[#8B6B4F]/10">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} // Nangkep inputan user
              placeholder="Cari nama, jalan, atau kategori..."
              className="flex-1 px-6 py-3 text-sm outline-none text-gray-700 placeholder-gray-400"
            />
            <button className="px-5 border-l border-gray-100 text-gray-500 hover:bg-[#F4EFE8] hover:text-[#8B6B4F] transition-colors duration-300 active:bg-gray-200">
              <FaSearch />
            </button>
          </div>
        </div>

        {/* FILTER BUTTONS INTERAKTIF */}
        <div className="flex justify-center gap-3 mt-6 flex-wrap">
          {filterCategories.map((cat, index) => {
            const isActive = activeFilter === cat.label;
            return (
              <button
                key={index}
                onClick={() => setActiveFilter(cat.label)} // Set filter aktif
                className={`
                  px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 active:scale-95 border
                  ${
                    isActive
                      ? "bg-[#6B554F] text-white shadow-md border-transparent" // Style aktif
                      : "bg-white text-[#5E4B45] hover:shadow-md hover:border-[#EFE7E2] border-transparent" // Style pasif
                  }
                `}
              >
                {cat.icon} {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* MAP */}
      <div className="relative max-w-7xl mx-auto h-[700px] rounded-3xl overflow-hidden shadow-xl border-4 border-white/50 bg-[#e3ded8] mb-12">
        <img
          src="https://images.unsplash.com/photo-1524661135-423995f22d0b"
          alt="Map"
          className="w-full h-full object-cover opacity-40 transition-opacity duration-1000 hover:opacity-50"
        />

        {/* MARKER USER (Statik) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 z-10 cursor-pointer group">
          <div className="w-28 h-28 bg-blue-400/20 rounded-full absolute -left-11 -top-11 animate-pulse group-hover:bg-blue-400/30 transition-colors duration-300"></div>
          <div className="w-6 h-6 bg-blue-500 rounded-full border-4 border-white relative z-10 shadow-lg group-hover:scale-110 transition-transform duration-300">
            <div className="absolute inset-0 rounded-full border-2 border-blue-300 animate-ping opacity-0 group-hover:opacity-100"></div>
          </div>
        </div>

        {/* MARKER SELASAR CENTER (Statik) */}
        <div className="absolute left-[50%] top-[43%] -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group">
          <div className="relative animate-bounce group-hover:animate-none transition-transform duration-300 group-hover:-translate-y-2">
            <div className="w-16 h-16 bg-[#556B2F] rounded-full flex items-center justify-center shadow-xl border-2 border-white/20 group-hover:shadow-2xl transition-all duration-300">
              <PiLeafFill size={30} className="text-white drop-shadow-md" />
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-5 h-5 bg-[#556B2F] rotate-45 -z-10 shadow-md"></div>
          </div>
        </div>

        {filteredLocations.map((loc) => (
          <div
            key={loc.id}
            onClick={() => setSelectedLocation(loc)}
            className={`absolute ${loc.position} bg-white rounded-2xl p-4 shadow-lg w-[220px] cursor-pointer z-10 transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-2xl hover:z-30 border border-transparent hover:border-[#EFE7E2] animate-[scaleIn_0.3s_ease-out]`}
          >
            <div className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full ${loc.bgColor} flex items-center justify-center mr-3 flex-shrink-0 shadow-inner`}
              >
                {loc.icon}
              </div>
              <div>
                <h3 className="font-bold text-[#5E4B45] text-lg leading-5 transition-colors duration-300 hover:text-[#7A5230]">
                  {loc.name}
                </h3>
                <p className="text-gray-400 text-sm mt-1 font-medium">
                  {loc.distance}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* FLOATING MAP BUTTON */}
        <div className="absolute bottom-10 right-6 flex flex-col gap-4 z-40">
          <button className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-[#5E4B45] transition-all duration-300 hover:scale-110 hover:shadow-xl hover:text-[#7A5230] active:scale-95">
            <FaCrosshairs size={18} />
          </button>
          <button className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-[#5E4B45] transition-all duration-300 hover:scale-110 hover:shadow-xl hover:text-[#7A5230] active:scale-95">
            <FaLocationArrow
              size={18}
              className="-rotate-45 ml-[-2px] mt-[2px]"
            />
          </button>
        </div>
      </div>

      {/* GRID REKOMENDASI LOKASI */}
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold text-[#5E4B45]">
              {activeFilter === "Semua"
                ? "Rekomendasi untukmu "
                : `Spot ${activeFilter} Tersedia 📍`}
            </h2>
            <p className="text-[#8B6B4F] mt-2 font-medium">
              Spot nugas terbaik di sekitarmu berdasarkan preferensi.
            </p>
          </div>
        </div>

        {filteredLocations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/50 rounded-3xl border-2 border-dashed border-[#EFE7E2]">
            <FaRegSadTear className="text-6xl text-[#8B6B4F]/50 mb-4" />
            <h3 className="text-xl font-bold text-[#5E4B45]">
              Waduh, lokasinya belum ketemu broks!
            </h3>
            <p className="text-gray-500 mt-2">
              Coba ganti kata kunci atau hapus filternya deh.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveFilter("Semua");
              }}
              className="mt-6 px-6 py-2.5 bg-[#6B554F] text-white font-bold rounded-full hover:bg-[#5E4B45] transition-colors"
            >
              Reset Pencarian
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredLocations.map((loc) => (
              <div
                key={loc.id}
                onClick={() => setSelectedLocation(loc)}
                className="bg-white rounded-[2rem] shadow-sm hover:shadow-xl overflow-hidden flex flex-col cursor-pointer group transition-all duration-500 ease-out hover:-translate-y-2 border border-transparent hover:border-[#EFE7E2] animate-[scaleIn_0.4s_ease-out]"
              >
                <div className="h-52 overflow-hidden relative">
                  <img
                    src={loc.image}
                    alt={loc.name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
                  />
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-bold text-[#5E4B45] shadow-sm">
                    {loc.category}
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-[#5E4B45] group-hover:text-[#7A5230] transition-colors">
                        {loc.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1.5 font-medium">
                        <FaMapMarkerAlt className="text-[#8B6B4F]" />
                        Berjarak {loc.distance}
                      </div>
                    </div>
                    <div className="bg-[#EFE7E2] text-[#5E4B45] px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap">
                      {loc.match} Match
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-100 grid grid-cols-2 gap-y-3 gap-x-2 text-sm text-[#5E4B45]">
                    <div>
                      <p className="flex items-center gap-2 mb-0.5 text-gray-400 font-bold text-xs">
                        <FaPlug /> Colokan
                      </p>
                      <p className="font-semibold">{loc.specs.plug}</p>
                    </div>
                    <div>
                      <p className="flex items-center gap-2 mb-0.5 text-gray-400 font-bold text-xs">
                        <FaWifi /> WiFi
                      </p>
                      <p className="font-semibold">{loc.specs.wifi}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedLocation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#445234]/40 backdrop-blur-sm transition-opacity duration-300 px-4"
          onClick={() => setSelectedLocation(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row w-full max-w-4xl animate-[scaleIn_0.3s_ease-out] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedLocation(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-gray-600 hover:bg-[#EFE7E2] hover:text-[#8B6B4F] hover:rotate-90 transition-all duration-300 shadow-sm"
            >
              <FaTimes size={18} />
            </button>

            <div className="w-full md:w-[45%] h-[250px] md:h-auto overflow-hidden relative">
              <img
                src={selectedLocation.image}
                alt={selectedLocation.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4">
                <span className="px-4 py-1.5 bg-white/90 backdrop-blur-sm text-[#5E4B45] font-bold text-xs rounded-lg shadow-sm">
                  {selectedLocation.category}
                </span>
              </div>
            </div>

            <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
              <div>
                <h2 className="text-3xl font-bold text-[#5E4B45] mb-2">
                  {selectedLocation.name}
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                  <FaMapMarkerAlt className="text-[#8B6B4F]" />
                  {selectedLocation.address}{" "}
                  <span className="text-gray-300">|</span>{" "}
                  {selectedLocation.distance}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mt-8 text-sm text-[#5E4B45]">
                  <div className="bg-[#F4EFE8] p-4 rounded-2xl">
                    <p className="font-bold flex items-center gap-2 mb-1 text-gray-500">
                      <FaPlug className="text-[#8B6B4F]" /> Colokan
                    </p>
                    <p className="font-semibold">
                      {selectedLocation.specs.plug}
                    </p>
                  </div>
                  <div className="bg-[#F4EFE8] p-4 rounded-2xl">
                    <p className="font-bold flex items-center gap-2 mb-1 text-gray-500">
                      <FaWifi className="text-[#8B6B4F]" /> WiFi
                    </p>
                    <p className="font-semibold">
                      {selectedLocation.specs.wifi}
                    </p>
                  </div>
                  <div className="bg-[#F4EFE8] p-4 rounded-2xl col-span-2 md:col-span-1">
                    <p className="font-bold flex items-center gap-2 mb-1 text-gray-500">
                      <FaUsers className="text-[#8B6B4F]" /> Kapasitas
                    </p>
                    <p className="font-semibold">
                      {selectedLocation.specs.capacity}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-[#6B554F] text-white rounded-xl font-bold hover:bg-[#5E4B45] active:scale-95 transition-all shadow-md hover:shadow-lg">
                  <FaLocationArrow /> Rute ke Sini
                </button>
                <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                  <div className="p-3.5 bg-gray-50 rounded-full text-gray-400 hover:bg-[#EFE7E2] hover:text-[#8B6B4F] cursor-pointer transition-all hover:scale-110 active:scale-95">
                    <FaBookmark size={20} />
                  </div>
                  <div className="bg-[#EFE7E2] text-[#5E4B45] px-5 py-3 rounded-xl font-bold shadow-sm">
                    {selectedLocation.match} Match
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Style untuk Animasi */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `,
        }}
      />
    </div>
  );
}
