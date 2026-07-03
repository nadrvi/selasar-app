import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaWifi,
  FaUsers,
  FaPlug,
  FaSearch,
  FaMapMarkerAlt,
  FaRegBookmark,
  FaArrowLeft,
  FaHistory,
  FaTimes,
  FaSortAmountDown,
  FaBookmark,
  FaChevronDown,
  FaStar,
} from "react-icons/fa";
import TextSelasar from "../assets/text-logo.png";
import {
  logVisit,
  toggleFavorite as toggleFavoriteStore,
  getFavorites as getStoredFavorites,
} from "../utils/activityStore";

const dummyPlaces = [
  {
    id: 1,
    name: "Kebon Raya Escape",
    type: "Alam",
    address: "Jl. Otto Iskandardinata No. 13",
    img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80",
    colokan: "Terbatas",
    wifi: "Standar",
    keramaian: "Sedang",
    cocok: "Me time, Hangout",
    match: 80,
    price: 10000,
    rating: 4.3,
    description:
      "Area terbuka hijau dengan suasana yang tenang dan udara yang sejuk. Cocok untuk melepas penat, membaca buku, atau mengerjakan tugas ringan sambil menikmati suasana alam.",
  },
  {
    id: 2,
    name: "Kopi Nalar",
    type: "Cafe",
    address: "Jl. Masjid Nurul Hidayah, Tambun",
    img: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1000&q=80",
    colokan: "Tersedia",
    wifi: "Cepat",
    keramaian: "Ramai",
    cocok: "Me Time, WFC",
    match: 95,
    price: 25000,
    rating: 4.8,
    description:
      "Cafe bergaya minimalis dengan suasana nyaman untuk bekerja maupun belajar. Dilengkapi WiFi cepat, banyak pilihan menu, dan area duduk yang luas.",
  },
  {
    id: 3,
    name: "Ruang Seduh",
    type: "Coworking",
    address: "Jl. Kemang Raya, Jakarta",
    img: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1000&q=80",
    colokan: "Banyak",
    wifi: "Super Cepat",
    keramaian: "Sepi",
    cocok: "Deadline, Fokus",
    match: 98,
    price: 50000,
    rating: 4.9,
    description:
      "Coworking space dengan lingkungan yang tenang, kursi ergonomis, dan internet berkecepatan tinggi. Sangat cocok untuk menyelesaikan deadline, meeting online, maupun bekerja secara fokus.",
  },
  {
    id: 4,
    name: "Forest Brew",
    type: "Cafe",
    address: "Jl. Raya Hankam No. 22",
    img: "https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=1000&q=80",
    colokan: "Banyak",
    wifi: "Cepat",
    keramaian: "Sedang",
    cocok: "Belajar, Nongkrong",
    match: 92,
    price: 30000,
    rating: 4.6,
    description:
      "Cafe bernuansa kayu dan tanaman hijau yang memberikan suasana hangat dan nyaman. Cocok untuk belajar bersama teman atau bekerja dari laptop.",
  },
  {
    id: 5,
    name: "Skyline Coffee",
    type: "Cafe",
    address: "Jl. Ahmad Yani No. 45",
    img: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1000&q=80",
    colokan: "Tersedia",
    wifi: "Cepat",
    keramaian: "Sedang",
    cocok: "WFC, Meeting",
    match: 94,
    price: 35000,
    rating: 4.7,
    description:
      "Memiliki area rooftop dengan pemandangan kota yang menarik. Tempat yang nyaman untuk meeting santai maupun bekerja sambil menikmati kopi.",
  },
  {
    id: 6,
    name: "Creative Hub",
    type: "Coworking",
    address: "Jl. Diponegoro No. 10",
    img: "https://images.unsplash.com/photo-1497366412874-3415097a27e7?auto=format&fit=crop&w=1000&q=80",
    colokan: "Banyak",
    wifi: "Super Cepat",
    keramaian: "Sepi",
    cocok: "Coding, Meeting",
    match: 99,
    price: 60000,
    rating: 4.9,
    description:
      "Ruang kerja modern dengan fasilitas lengkap seperti ruang meeting, WiFi stabil, dan banyak stop kontak. Pilihan ideal bagi programmer, freelancer, maupun startup.",
  },
  {
    id: 7,
    name: "Taman Harmoni",
    type: "Alam",
    address: "Jl. Raya Bekasi No. 88",
    img: "https://images.unsplash.com/photo-1473773508845-188df298d2d1?auto=format&fit=crop&w=1000&q=80",
    colokan: "Tidak Ada",
    wifi: "Tidak Tersedia",
    keramaian: "Sepi",
    cocok: "Healing, Me Time",
    match: 78,
    price: 5000,
    rating: 4.1,
    description:
      "Taman kota dengan pepohonan rindang dan suasana yang asri. Tempat yang cocok untuk mencari inspirasi, bersantai, atau sekadar menikmati udara segar.",
  },
  {
    id: 8,
    name: "Daily Grind",
    type: "Cafe",
    address: "Jl. Kalimalang No. 7",
    img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80",
    colokan: "Banyak",
    wifi: "Cepat",
    keramaian: "Ramai",
    cocok: "Belajar, Nongkrong",
    match: 90,
    price: 28000,
    rating: 4.5,
    description:
      "Cafe dengan konsep industrial modern dan pencahayaan yang nyaman. Menyediakan banyak meja besar sehingga cocok untuk belajar kelompok.",
  },
  {
    id: 9,
    name: "Library Corner",
    type: "Perpustakaan",
    address: "Jl. Pendidikan No. 15",
    img: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1000&q=80",
    colokan: "Tersedia",
    wifi: "Cepat",
    keramaian: "Sangat Sepi",
    cocok: "Belajar, Riset",
    match: 97,
    price: 0,
    rating: 4.8,
    description:
      "Perpustakaan modern dengan ruang baca yang nyaman, koleksi buku yang lengkap, dan area diskusi. Sangat mendukung aktivitas belajar tanpa gangguan.",
  },
  {
    id: 10,
    name: "Sunrise Workspace",
    type: "Coworking",
    address: "Jl. Boulevard Selatan No. 5",
    img: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1000&q=80",
    colokan: "Sangat Banyak",
    wifi: "Super Cepat",
    keramaian: "Sedang",
    cocok: "Remote Working, Startup",
    match: 96,
    price: 75000,
    rating: 4.9,
    description:
      "Coworking space premium dengan ruang kerja luas, internet berkecepatan tinggi, serta suasana profesional yang mendukung produktivitas sepanjang hari.",
  },
];

const SORT_OPTIONS = [
  { value: "Match", label: "Paling Cocok" },
  { value: "Name", label: "Nama A-Z" },
  { value: "PriceAsc", label: "Harga: Termurah" },
  { value: "PriceDesc", label: "Harga: Termahal" },
  { value: "Rating", label: "Rating Tertinggi" },
  { value: "Favorite", label: "Favorit Tersimpan" },
];

export default function Searching() {
  const navigate = useNavigate();

  const [activeFilters, setActiveFilters] = useState({
    colokan: "Semua",
    wifi: "Semua",
    keramaian: "Semua",
  });

  const [isLoaded, setIsLoaded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [showRecent, setShowRecent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleBackClick = () => {
    setIsExiting(true);
    setTimeout(() => navigate("/beranda"), 500);
  };

  const handleFilterClick = (category, value) => {
    setActiveFilters((prev) => ({ ...prev, [category]: value }));
  };

  const [selectedPlace, setSelectedPlace] = useState(null);
  useEffect(() => {
    document.body.style.overflow = selectedPlace ? "hidden" : "unset";
  }, [selectedPlace]);

  const handleSelectPlace = (place) => {
    logVisit({
      source: "searching",
      id: place.id,
      name: place.name,
      image: place.img,
      subtitle: place.address,
      match: place.match,
    });
    setSelectedPlace(place);
  };

  const filteredPlaces = dummyPlaces.filter((place) => {
    const matchSearch =
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.cocok.toLowerCase().includes(searchQuery.toLowerCase());

    const matchColokan =
      activeFilters.colokan === "Semua" ||
      place.colokan === activeFilters.colokan;
    const matchWifi =
      activeFilters.wifi === "Semua" || place.wifi === activeFilters.wifi;
    const matchKeramaian =
      activeFilters.keramaian === "Semua" ||
      place.keramaian === activeFilters.keramaian;

    return matchSearch && matchColokan && matchWifi && matchKeramaian;
  });

  // Favorit sekarang persist per akun lewat activityStore
  const [savedPlaces, setSavedPlaces] = useState(() =>
    getStoredFavorites()
      .filter((f) => f.source === "searching")
      .map((f) => f.id),
  );
  const toggleSave = (id) => {
    const place = dummyPlaces.find((p) => p.id === id);
    toggleFavoriteStore({
      source: "searching",
      id,
      name: place?.name,
      image: place?.img,
      match: place?.match,
    });
    setSavedPlaces((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // ==== SORT DROPDOWN ====
  const [sortBy, setSortBy] = useState("Match");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target))
        setSortOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const sortedPlaces = [...filteredPlaces].sort((a, b) => {
    switch (sortBy) {
      case "Match":
        return b.match - a.match;
      case "Name":
        return a.name.localeCompare(b.name);
      case "PriceAsc":
        return (a.price ?? 0) - (b.price ?? 0);
      case "PriceDesc":
        return (b.price ?? 0) - (a.price ?? 0);
      case "Rating":
        return (b.rating ?? 0) - (a.rating ?? 0);
      case "Favorite": {
        const aFav = savedPlaces.includes(a.id) ? 1 : 0;
        const bFav = savedPlaces.includes(b.id) ? 1 : 0;
        if (aFav !== bFav) return bFav - aFav;
        return b.match - a.match;
      }
      default:
        return 0;
    }
  });

  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "Urutkan";

  return (
    <div className="min-h-screen bg-[#EDE8DE] dark:bg-[#1F1B18] p-4 sm:p-6 md:p-8 font-sans flex flex-col items-center overflow-x-hidden transition-colors duration-500">
      {/* HEADER */}
      <div
        className={`w-full max-w-2xl relative flex justify-center items-center mb-6 transition-all duration-500 ease-out ${
          isExiting
            ? "opacity-0 -translate-y-8"
            : isLoaded
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-8"
        }`}
      >
        <button
          onClick={handleBackClick}
          className="absolute left-0 p-3 bg-white dark:bg-[#2A2521] text-[#4A3B38] dark:text-[#F5F2EB] rounded-full shadow-sm border border-gray-200 dark:border-[#3D342D] hover:bg-[#F3EFEA] dark:hover:bg-[#332C27] hover:scale-105 active:scale-95 transition-all"
        >
          <FaArrowLeft size={16} />
        </button>
        <img
          src={TextSelasar}
          alt="Logo Selasar"
          className="w-48 sm:w-56 h-auto object-contain drop-shadow-sm"
        />
      </div>

      {/* SEARCH BAR */}
      <div
        className={`w-full max-w-2xl mb-8 flex justify-center transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] z-20 ${
          isExiting
            ? "opacity-0 translate-y-24 scale-90"
            : isLoaded
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 translate-y-10 scale-105"
        }`}
      >
        <div className="relative w-full sm:w-[80%] max-w-lg group">
          <div className="flex bg-white dark:bg-[#2A2521] rounded-full border border-[#523E3E] dark:border-[#6B554F] shadow-sm overflow-hidden w-full focus-within:ring-2 ring-[#523E3E] dark:ring-[#C4A876] transition-all">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowRecent(true)}
              onBlur={() => setTimeout(() => setShowRecent(false), 200)}
              placeholder="Cari nama tempat, alamat, atau vibes..."
              className="flex-1 px-6 py-3 outline-none text-sm text-gray-700 dark:text-gray-200 bg-transparent placeholder-gray-400 dark:placeholder-gray-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="px-3 text-gray-400 dark:text-gray-500 hover:text-[#523E3E] dark:hover:text-[#C4A876] transition-colors"
              >
                <FaTimes />
              </button>
            )}
            <button className="px-6 bg-[#EAE1DD] dark:bg-[#332C27] border-l border-[#523E3E] dark:border-[#6B554F] text-[#4A3B38] dark:text-[#F5F2EB] hover:bg-[#dcd0cb] dark:hover:bg-[#3D342D] transition-colors">
              <FaSearch />
            </button>
          </div>

          <div
            className={`absolute top-14 left-0 w-full bg-white dark:bg-[#2A2521] rounded-2xl shadow-xl overflow-hidden transition-all duration-300 origin-top ${
              showRecent && !searchQuery
                ? "opacity-100 scale-y-100"
                : "opacity-0 scale-y-0 pointer-events-none"
            }`}
          >
            <div className="p-4">
              <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-2">
                <FaHistory /> Pencarian Terakhir
              </p>
              {["Ruang Seduh", "Kopi Nalar", "Tempat sepi di Bogor"].map(
                (item) => (
                  <div
                    key={item}
                    onClick={() => setSearchQuery(item)}
                    className="px-3 py-2.5 hover:bg-[#F3EFEA] dark:hover:bg-[#332C27] rounded-lg cursor-pointer text-sm font-medium text-[#4A3B38] dark:text-[#F5F2EB] transition-colors"
                  >
                    {item}
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KONTEN BAWAH */}
      <div
        className={`w-full flex flex-col items-center transition-all duration-500 ease-out ${
          isExiting
            ? "opacity-0 translate-y-16"
            : isLoaded
              ? "opacity-100 translate-y-0 delay-150"
              : "opacity-0 translate-y-16"
        }`}
      >
        {/* FILTER SECTION */}
        <div className="bg-white dark:bg-[#2A2521] rounded-3xl p-6 sm:p-8 shadow-sm mb-10 w-full max-w-3xl border border-gray-100 dark:border-[#3D342D] transition-colors duration-500">
          <h2 className="font-bold text-lg text-[#4A3B38] dark:text-[#F5F2EB] mb-5">
            Pilih suasana yang kamu butuhkan
          </h2>

          {[
            {
              cat: "colokan",
              icon: <FaPlug size={20} />,
              title: "Ketersediaan Colokan",
              desc: "Prioritaskan tempat dengan colokan",
              options: ["Semua", "Terbatas", "Tersedia", "Banyak"],
            },
            {
              cat: "wifi",
              icon: <FaWifi size={20} />,
              title: "Kecepatan WiFi",
              desc: "Pilih minimal kecepatan yang kamu butuhkan",
              options: ["Semua", "Standar", "Cepat", "Super Cepat"],
            },
            {
              cat: "keramaian",
              icon: <FaUsers size={20} />,
              title: "Tingkat Keramaian",
              desc: "Pilih tingkat keramaian yang nyaman",
              options: ["Semua", "Sepi", "Sedang", "Ramai"],
            },
          ].map((f) => (
            <div
              key={f.cat}
              className="bg-[#EAE1DD] dark:bg-[#332C27] rounded-2xl p-4 sm:p-5 mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center transition-colors duration-500"
            >
              <div className="bg-[#6B554F] w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm">
                {f.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-[#4A3B38] dark:text-[#F5F2EB]">{f.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 sm:mb-0">{f.desc}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {f.options.map((btn) => (
                  <button
                    key={btn}
                    onClick={() => handleFilterClick(f.cat, btn)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 active:scale-90 border ${
                      activeFilters[f.cat] === btn
                        ? "bg-[#4A3B38] text-white border-[#4A3B38] shadow-md scale-105"
                        : "bg-[#F3EFEA] dark:bg-[#3D342D] text-[#4A3B38] dark:text-[#F5F2EB] border-[#cbbdb0] dark:border-[#4a4038] hover:bg-[#e4dacd] dark:hover:bg-[#443a32]"
                    }`}
                  >
                    {btn}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* RECOMMENDATION SECTION */}
        <div className="w-full max-w-3xl">
          <div className="flex justify-between items-end mb-4 border-b border-gray-300/30 dark:border-[#3D342D] pb-3 gap-4">
            <div>
              <h2 className="font-bold text-xl text-[#4A3B38] dark:text-[#F5F2EB]">
                Rekomendasi Untukmu
              </h2>
              <p className="text-sm text-[#6B554F] dark:text-[#C4A876] font-medium mt-1 transition-all">
                Ditemukan{" "}
                <strong className="text-[#4A3B38] dark:text-[#F5F2EB]">
                  {filteredPlaces.length}
                </strong>{" "}
                tempat ✨
              </p>
            </div>

            {/* SORT DROPDOWN */}
            <div ref={sortRef} className="relative shrink-0">
              <button
                onClick={() => setSortOpen((v) => !v)}
                className={`text-xs font-bold flex items-center gap-1.5 px-4 py-2 rounded-full shadow-sm transition-all border ${
                  sortBy === "Match"
                    ? "bg-white dark:bg-[#2A2521] text-[#4A3B38] dark:text-[#F5F2EB] border-gray-200 dark:border-[#3D342D] hover:bg-[#F3EFEA] dark:hover:bg-[#332C27]"
                    : "bg-[#4A3B38] text-white border-[#4A3B38]"
                }`}
              >
                <FaSortAmountDown />
                <span className="hidden sm:inline">{currentSortLabel}</span>
                <span className="sm:hidden">Urutkan</span>
                <FaChevronDown
                  size={10}
                  className={`transition-transform duration-300 ${
                    sortOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                className={`absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#2A2521] rounded-2xl shadow-xl border border-gray-100 dark:border-[#3D342D] overflow-hidden z-30 origin-top-right transition-all duration-200 ${
                  sortOpen
                    ? "opacity-100 scale-100 pointer-events-auto"
                    : "opacity-0 scale-95 pointer-events-none"
                }`}
              >
                <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 px-4 pt-3 pb-1">
                  Urutkan berdasarkan
                </p>
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSortBy(opt.value);
                      setSortOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      sortBy === opt.value
                        ? "bg-[#F3EFEA] dark:bg-[#332C27] text-[#4A3B38] dark:text-[#F5F2EB] font-bold"
                        : "text-[#4A3B38] dark:text-[#F5F2EB]/90 font-medium hover:bg-[#F7F3EE] dark:hover:bg-[#332C27]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {sortedPlaces.length > 0 ? (
            sortedPlaces.map((place) => (
              <div
                key={place.id}
                onClick={() => handleSelectPlace(place)}
                className="bg-white dark:bg-[#2A2521] rounded-[1.5rem] overflow-hidden shadow-sm border border-gray-100 dark:border-[#3D342D] mb-5 flex flex-col sm:flex-row relative group hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="sm:w-[35%] h-48 sm:h-auto overflow-hidden">
                  <img
                    src={place.img}
                    alt={place.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-extrabold text-xl text-[#4A3B38] dark:text-[#F5F2EB] group-hover:text-[#6B554F] dark:group-hover:text-[#C4A876] transition-colors">
                        {place.name}
                      </h3>
                      <span className="text-[10px] bg-white dark:bg-[#332C27] border border-[#cbbdb0] dark:border-[#4a4038] text-[#4A3B38] dark:text-[#F5F2EB] px-3 py-1 rounded-full font-bold shadow-sm">
                        {place.type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-2 font-medium">
                      <FaMapMarkerAlt size={11} className="text-[#6B554F] dark:text-[#C4A876]" />
                      {place.address}
                    </p>
                    <p className="text-[11px] font-semibold text-[#6B554F] dark:text-[#C4A876] flex items-center gap-3 mb-3">
                      <span className="flex items-center gap-1">
                        <FaStar size={10} className="text-yellow-500" />
                        {place.rating}
                      </span>
                      <span>
                        {place.price === 0
                          ? "Gratis"
                          : `Rp${place.price.toLocaleString("id-ID")}`}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center justify-between mb-4 pr-2">
                    <div className="flex gap-4 sm:gap-8">
                      <div>
                        <p className="font-bold text-xs text-[#4A3B38] dark:text-[#F5F2EB] flex items-center gap-1.5 mb-0.5">
                          Colokan{" "}
                          <FaPlug size={12} className="text-[#6B554F] dark:text-[#C4A876]" />
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          {place.colokan}
                        </p>
                      </div>
                      <div>
                        <p className="font-bold text-xs text-[#4A3B38] dark:text-[#F5F2EB] flex items-center gap-1.5 mb-0.5">
                          WiFi <FaWifi size={12} className="text-[#6B554F] dark:text-[#C4A876]" />
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          {place.wifi}
                        </p>
                      </div>
                      <div>
                        <p className="font-bold text-xs text-[#4A3B38] dark:text-[#F5F2EB] flex items-center gap-1.5 mb-0.5">
                          <FaUsers size={12} className="text-[#6B554F] dark:text-[#C4A876]" />{" "}
                          {place.keramaian}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          Cocok
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSave(place.id);
                      }}
                      className={`transition-all duration-300 active:scale-90 ${
                        savedPlaces.includes(place.id)
                          ? "text-yellow-500 scale-110"
                          : "text-[#cbbdb0] dark:text-[#5a4a42] hover:text-[#4A3B38] dark:hover:text-[#F5F2EB]"
                      }`}
                    >
                      {savedPlaces.includes(place.id) ? (
                        <FaBookmark size={20} />
                      ) : (
                        <FaRegBookmark size={20} />
                      )}
                    </button>
                  </div>
                  <div className="flex justify-between items-end border-t border-gray-100 dark:border-[#3D342D] pt-3 mt-1">
                    <p className="font-bold text-sm text-[#4A3B38] dark:text-[#F5F2EB]">
                      Cocok untuk:{" "}
                      <span className="font-medium text-gray-600 dark:text-gray-400">
                        {place.cocok}
                      </span>
                    </p>
                    <div className="bg-[#F3EFEA] dark:bg-[#332C27] px-3 py-1.5 rounded-lg text-xs font-bold text-[#4A3B38] dark:text-[#F5F2EB] shadow-sm">
                      {place.match}% match
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-[#2A2521] rounded-3xl p-10 text-center border-2 border-dashed border-[#cbbdb0] dark:border-[#4a4038]">
              <h3 className="text-xl font-bold text-[#4A3B38] dark:text-[#F5F2EB] mb-2">
                Yah, tempatnya nggak ketemu 🥲
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                Coba cari dengan kata kunci lain atau longgarkan filter
                pencarianmu.
              </p>
              <button
                onClick={() =>
                  setActiveFilters({
                    colokan: "Semua",
                    wifi: "Semua",
                    keramaian: "Semua",
                  })
                }
                className="px-6 py-2.5 bg-[#4A3B38] text-white rounded-full text-sm font-bold shadow-sm hover:scale-105 active:scale-95 transition-all"
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL POP-UP */}
      {selectedPlace && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#445234]/40 backdrop-blur-sm transition-all duration-300 px-4"
          onClick={() => setSelectedPlace(null)}
        >
          <div
            className="bg-white dark:bg-[#2A2521] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row w-full max-w-4xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] scale-100 opacity-100 animate-in zoom-in-95 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPlace(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/80 dark:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-[#EFE7E2] dark:hover:bg-[#3D342D] hover:text-[#8B6B4F] dark:hover:text-[#C4A876] hover:rotate-180 transition-transform duration-500 shadow-sm"
            >
              <FaTimes size={18} />
            </button>

            <div className="w-full md:w-[45%] h-[250px] md:h-auto overflow-hidden">
              <img
                src={selectedPlace.img}
                alt={selectedPlace.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
              <div>
                <h2 className="text-3xl font-bold text-[#5E4B45] dark:text-[#F5F2EB] mb-2">
                  {selectedPlace.name}
                </h2>
                <p className="text-sm text-green-700 dark:text-green-400 font-medium mb-4">
                  Cocok untuk: {selectedPlace.cocok}
                </p>

                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6 bg-gray-50 dark:bg-[#1F1B18] p-4 rounded-2xl italic">
                  "{selectedPlace.description}"
                </p>

                <div className="grid grid-cols-2 gap-4 text-sm text-[#5E4B45] dark:text-[#F5F2EB]">
                  <div className="bg-[#F4EFE8] dark:bg-[#332C27] p-4 rounded-2xl">
                    <p className="font-bold flex items-center gap-2 mb-1 text-gray-500 dark:text-gray-400">
                      <FaPlug /> Colokan
                    </p>
                    <p className="font-semibold">{selectedPlace.colokan}</p>
                  </div>
                  <div className="bg-[#F4EFE8] dark:bg-[#332C27] p-4 rounded-2xl">
                    <p className="font-bold flex items-center gap-2 mb-1 text-gray-500 dark:text-gray-400">
                      <FaWifi /> WiFi
                    </p>
                    <p className="font-semibold">{selectedPlace.wifi}</p>
                  </div>
                </div>
              </div>

              <button className="w-full mt-6 py-4 bg-[#594A42] text-white rounded-xl font-bold hover:bg-[#433731] active:scale-95 transition-all shadow-md">
                Lihat Rute ke Sini
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}