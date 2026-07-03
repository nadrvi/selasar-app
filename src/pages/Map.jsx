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
  FaArrowLeft,
} from "react-icons/fa";
import { PiLeafFill } from "react-icons/pi";
import locationsData from "../data/locationsData";
import { useNavigate } from "react-router-dom";
import {
  logVisit,
  toggleFavorite as toggleFavoriteStore,
  getFavorites as getStoredFavorites,
} from "../utils/activityStore";

const getIcon = (category) => {
  switch (category) {
    case "Cafe":
      return <FaCoffee className="text-white text-sm" />;
    case "Coworking":
      return <FaUsers className="text-white text-sm" />;
    case "Perpustakaan":
      return <FaBook className="text-white text-sm" />;
    case "Alam":
      return <FaTree className="text-white text-sm" />;
    default:
      return null;
  }
};

const filterCategories = [
  { label: "Semua", icon: null },
  { label: "Cafe", icon: <FaCoffee /> },
  { label: "Coworking", icon: <FaUsers /> },
  { label: "Perpustakaan", icon: <FaBook /> },
  { label: "Alam", icon: <FaTree /> },
];

export default function Map() {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [filteredLocations, setFilteredLocations] = useState(locationsData);
  const [favoriteIds, setFavoriteIds] = useState(() => {
    try {
      return new Set(
        getStoredFavorites()
          .filter((f) => f.source === "map")
          .map((f) => f.id),
      );
    } catch {
      return new Set();
    }
  });

  // Animasi awal render
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoaded(true);
  }, []);

  // Modal Escape Logic
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") navigate(-1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  const handleBack = () => {
    navigate(-1);
  };

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

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilteredLocations(result);
  }, [searchQuery, activeFilter]);

  const handleSelectLocation = (loc) => {
    logVisit({
      source: "map",
      id: loc.id,
      name: loc.name,
      image: loc.image,
      subtitle: loc.address,
      match:
        typeof loc.match === "string" ? parseInt(loc.match, 10) : loc.match,
    });
    setSelectedLocation(loc);
  };

  const handleToggleFavoriteDetail = () => {
    if (!selectedLocation) return;
    const matchNum =
      typeof selectedLocation.match === "string"
        ? parseInt(selectedLocation.match, 10)
        : selectedLocation.match;
    toggleFavoriteStore({
      source: "map",
      id: selectedLocation.id,
      name: selectedLocation.name,
      image: selectedLocation.image,
      match: matchNum,
    });
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(selectedLocation.id)) next.delete(selectedLocation.id);
      else next.add(selectedLocation.id);
      return next;
    });
  };

  return (
    <div
      className={`min-h-screen bg-[#F4EFE8] dark:bg-[#1F1B18] transition-colors duration-500 ${isLoaded ? "opacity-100" : "opacity-0"} pb-20 transition-opacity duration-1000`}
    >
      <button
        onClick={handleBack}
        className="absolute top-6 left-6 z-50 p-3 bg-white/90 dark:bg-[#2A2521]/90 backdrop-blur-md rounded-full shadow-lg border border-white/20 dark:border-[#3D342D] hover:scale-110 active:scale-95 transition-all text-[#5E4B45] dark:text-[#F5F2EB]"
      >
        <FaArrowLeft size={20} />
      </button>
      {/* HEADER */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex justify-center cursor-pointer transition-transform duration-500 hover:scale-105">
          <div className="text-center">
            <h1 className="text-[64px] font-serif font-bold text-[#445234] dark:text-[#9CB380] leading-none drop-shadow-sm">
              Selasar
            </h1>
            <p className="text-[10px] tracking-[3px] text-[#8B6B4F] dark:text-[#C4A876] mt-1">
              TEMPAT NYAMAN, IDE BERKEMBANG
            </p>
          </div>
        </div>

        {/* SEARCH */}
        <div className="flex justify-center mt-6">
          <div className="flex w-[450px] overflow-hidden rounded-full border border-gray-200 dark:border-[#3D342D] bg-white dark:bg-[#2A2521] shadow-sm transition-all duration-300 hover:shadow-md focus-within:shadow-lg focus-within:scale-[1.02] focus-within:border-[#8B6B4F]/30 dark:focus-within:border-[#C4A876]/40 focus-within:ring-4 focus-within:ring-[#8B6B4F]/10 dark:focus-within:ring-[#C4A876]/10">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} // Nangkep inputan user
              placeholder="Cari nama, jalan, atau kategori..."
              className="flex-1 px-6 py-3 text-sm outline-none text-gray-700 dark:text-gray-100 bg-transparent placeholder-gray-400 dark:placeholder-gray-500"
            />
            <button className="px-5 border-l border-gray-100 dark:border-[#3D342D] text-gray-500 dark:text-gray-400 hover:bg-[#F4EFE8] dark:hover:bg-[#332C27] hover:text-[#8B6B4F] dark:hover:text-[#C4A876] transition-colors duration-300 active:bg-gray-200 dark:active:bg-[#3D342D]">
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
                      : "bg-white dark:bg-[#2A2521] text-[#5E4B45] dark:text-[#F5F2EB] hover:shadow-md hover:border-[#EFE7E2] dark:hover:border-[#3D342D] border-transparent" // Style pasif
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
      <div className="relative max-w-7xl mx-auto h-[700px] rounded-3xl overflow-hidden shadow-xl border-4 border-white/50 dark:border-[#2A2521] bg-[#e3ded8] dark:bg-[#171310] mb-12">
        <img
          src="https://images.unsplash.com/photo-1524661135-423995f22d0b"
          alt="Map"
          className="w-full h-full object-cover opacity-40 dark:opacity-25 transition-opacity duration-1000 hover:opacity-50 dark:hover:opacity-35"
        />

        {/* MARKER USER (Statik) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer group">
          <div className="w-28 h-28 bg-blue-400/20 rounded-full absolute -left-11 -top-11 animate-pulse group-hover:bg-blue-400/30 transition-colors duration-300"></div>
          <div className="w-6 h-6 bg-blue-500 rounded-full border-4 border-white dark:border-[#2A2521] relative z-10 shadow-lg group-hover:scale-110 transition-transform duration-300">
            <div className="absolute inset-0 rounded-full border-2 border-blue-300 animate-ping opacity-0 group-hover:opacity-100"></div>
          </div>
        </div>

        {/* MARKER SELASAR CENTER (Statik) */}
        <div className="absolute left-[50%] top-[43%] -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group">
          <div className="relative animate-bounce group-hover:animate-none transition-transform duration-300 group-hover:-translate-y-2">
            <div className="w-16 h-16 bg-[#556B2F] rounded-full flex items-center justify-center shadow-xl border-2 border-white/20 dark:border-[#2A2521] group-hover:shadow-2xl transition-all duration-300">
              <PiLeafFill size={30} className="text-white drop-shadow-md" />
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-5 h-5 bg-[#556B2F] rotate-45 -z-10 shadow-md"></div>
          </div>
        </div>

        {filteredLocations.map((loc) => (
          <div
            key={loc.id}
            onClick={() => handleSelectLocation(loc)}
            className={`absolute ${loc.position} bg-white dark:bg-[#2A2521] rounded-2xl p-4 shadow-lg w-[220px] cursor-pointer z-10 transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-2xl hover:z-30 border border-transparent hover:border-[#EFE7E2] dark:hover:border-[#3D342D] animate-[scaleIn_0.3s_ease-out]`}
          >
            <div className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full ${loc.bgColor} flex items-center justify-center mr-3 flex-shrink-0 shadow-inner`}
              >
                {getIcon(loc.category)}
              </div>

              <div>
                <h3 className="font-bold text-[#5E4B45] dark:text-[#F5F2EB] text-lg leading-5 transition-colors duration-300 hover:text-[#7A5230] dark:hover:text-[#C4A876]">
                  {loc.name}
                </h3>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1 font-medium">
                  {loc.distance}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* FLOATING MAP BUTTON */}
        <div className="absolute bottom-10 right-6 flex flex-col gap-4 z-40">
          <button className="w-12 h-12 bg-white dark:bg-[#2A2521] rounded-full shadow-lg flex items-center justify-center text-[#5E4B45] dark:text-[#F5F2EB] transition-all duration-300 hover:scale-110 hover:shadow-xl hover:text-[#7A5230] dark:hover:text-[#C4A876] active:scale-95">
            <FaCrosshairs size={18} />
          </button>
          <button className="w-12 h-12 bg-white dark:bg-[#2A2521] rounded-full shadow-lg flex items-center justify-center text-[#5E4B45] dark:text-[#F5F2EB] transition-all duration-300 hover:scale-110 hover:shadow-xl hover:text-[#7A5230] dark:hover:text-[#C4A876] active:scale-95">
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
            <h2 className="text-3xl font-bold text-[#5E4B45] dark:text-[#F5F2EB]">
              {activeFilter === "Semua"
                ? "Rekomendasi untukmu "
                : `Spot ${activeFilter} Tersedia 📍`}
            </h2>
            <p className="text-[#8B6B4F] dark:text-[#C4A876] mt-2 font-medium">
              Spot nugas terbaik di sekitarmu berdasarkan preferensi.
            </p>
          </div>
        </div>

        {filteredLocations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/50 dark:bg-[#2A2521]/50 rounded-3xl border-2 border-dashed border-[#EFE7E2] dark:border-[#3D342D]">
            <FaRegSadTear className="text-6xl text-[#8B6B4F]/50 mb-4" />
            <h3 className="text-xl font-bold text-[#5E4B45] dark:text-[#F5F2EB]">
              Waduh, lokasinya belum ketemu broks!
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
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
                onClick={() => handleSelectLocation(loc)}
                className="bg-white dark:bg-[#2A2521] rounded-[2rem] shadow-sm hover:shadow-xl overflow-hidden flex flex-col cursor-pointer group transition-all duration-500 ease-out hover:-translate-y-2 border border-transparent hover:border-[#EFE7E2] dark:hover:border-[#3D342D] animate-[scaleIn_0.4s_ease-out]"
              >
                <div className="h-52 overflow-hidden relative">
                  <img
                    src={loc.image}
                    alt={loc.name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
                  />
                  <div className="absolute top-4 right-4 bg-white/95 dark:bg-[#2A2521]/95 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-bold text-[#5E4B45] dark:text-[#F5F2EB] shadow-sm">
                    {loc.category}
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-[#5E4B45] dark:text-[#F5F2EB] group-hover:text-[#7A5230] dark:group-hover:text-[#C4A876] transition-colors">
                        {loc.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
                        <FaMapMarkerAlt className="text-[#8B6B4F] dark:text-[#C4A876]" />
                        Berjarak {loc.distance}
                      </div>
                    </div>
                    <div className="bg-[#EFE7E2] dark:bg-[#1F1B18] text-[#5E4B45] dark:text-[#C4A876] px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap">
                      {loc.match} Match
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-100 dark:border-[#3D342D] grid grid-cols-2 gap-y-3 gap-x-2 text-sm text-[#5E4B45] dark:text-[#F5F2EB]">
                    <div>
                      <p className="flex items-center gap-2 mb-0.5 text-gray-400 dark:text-gray-500 font-bold text-xs">
                        <FaPlug /> Colokan
                      </p>
                      <p className="font-semibold">{loc.specs.plug}</p>
                    </div>
                    <div>
                      <p className="flex items-center gap-2 mb-0.5 text-gray-400 dark:text-gray-500 font-bold text-xs">
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
            className="bg-white dark:bg-[#2A2521] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row w-full max-w-4xl animate-scale-in relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedLocation(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/80 dark:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-[#EFE7E2] dark:hover:bg-[#3D342D] hover:text-[#8B6B4F] dark:hover:text-[#C4A876] hover:rotate-90 transition-all duration-300 shadow-sm"
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
                <span className="px-4 py-1.5 bg-white/90 dark:bg-[#2A2521]/90 backdrop-blur-sm text-[#5E4B45] dark:text-[#F5F2EB] font-bold text-xs rounded-lg shadow-sm">
                  {selectedLocation.category}
                </span>
              </div>
            </div>

            <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
              <div>
                <h2 className="text-3xl font-bold text-[#5E4B45] dark:text-[#F5F2EB] mb-2">
                  {selectedLocation.name}
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
                  <FaMapMarkerAlt className="text-[#8B6B4F] dark:text-[#C4A876]" />
                  {selectedLocation.address}{" "}
                  <span className="text-gray-300 dark:text-gray-600">|</span>{" "}
                  {selectedLocation.distance}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mt-8 text-sm text-[#5E4B45] dark:text-[#F5F2EB]">
                  <div className="bg-[#F4EFE8] dark:bg-[#1F1B18] p-4 rounded-2xl">
                    <p className="font-bold flex items-center gap-2 mb-1 text-gray-500 dark:text-gray-400">
                      <FaPlug className="text-[#8B6B4F] dark:text-[#C4A876]" />{" "}
                      Colokan
                    </p>
                    <p className="font-semibold">
                      {selectedLocation.specs.plug}
                    </p>
                  </div>
                  <div className="bg-[#F4EFE8] dark:bg-[#1F1B18] p-4 rounded-2xl">
                    <p className="font-bold flex items-center gap-2 mb-1 text-gray-500 dark:text-gray-400">
                      <FaWifi className="text-[#8B6B4F] dark:text-[#C4A876]" />{" "}
                      WiFi
                    </p>
                    <p className="font-semibold">
                      {selectedLocation.specs.wifi}
                    </p>
                  </div>
                  <div className="bg-[#F4EFE8] dark:bg-[#1F1B18] p-4 rounded-2xl col-span-2 md:col-span-1">
                    <p className="font-bold flex items-center gap-2 mb-1 text-gray-500 dark:text-gray-400">
                      <FaUsers className="text-[#8B6B4F] dark:text-[#C4A876]" />{" "}
                      Kapasitas
                    </p>
                    <p className="font-semibold">
                      {selectedLocation.specs.capacity}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-[#3D342D] flex flex-col sm:flex-row justify-between items-center gap-4">
                <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-[#6B554F] text-white rounded-xl font-bold hover:bg-[#5E4B45] active:scale-95 transition-all shadow-md hover:shadow-lg">
                  <FaLocationArrow /> Rute ke Sini
                </button>
                <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                  <button
                    onClick={handleToggleFavoriteDetail}
                    aria-label={
                      favoriteIds.has(selectedLocation.id)
                        ? "Hapus dari favorit"
                        : "Simpan ke favorit"
                    }
                    className={`p-3.5 rounded-full transition-all hover:scale-110 active:scale-95 ${
                      favoriteIds.has(selectedLocation.id)
                        ? "bg-[#8B6B4F] text-white"
                        : "bg-gray-50 dark:bg-[#1F1B18] text-gray-400 dark:text-gray-500 hover:bg-[#EFE7E2] dark:hover:bg-[#3D342D] hover:text-[#8B6B4F] dark:hover:text-[#C4A876]"
                    }`}
                  >
                    <FaBookmark size={20} />
                  </button>
                  <div className="bg-[#EFE7E2] dark:bg-[#1F1B18] text-[#5E4B45] dark:text-[#C4A876] px-5 py-3 rounded-xl font-bold shadow-sm">
                    {selectedLocation.match} Match
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
