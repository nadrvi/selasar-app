import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  FaCheckCircle,
  FaDoorOpen,
  FaLocationArrow,
} from "react-icons/fa";
import TextSelasar from "../assets/text-logo.png";
import {
  logVisit,
  toggleFavorite as toggleFavoriteStore,
  getFavorites as getStoredFavorites,
} from "../utils/activityStore";
import {
  fetchPlaces,
  toggleBookmarkAPI,
  checkinToPlace,
  checkoutFromPlace,
  fetchUserActiveCheckin,
  logActivityAPI,
} from "../services/api";


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
  const location = useLocation();

  const [activeFilters, setActiveFilters] = useState(() => ({
    colokan: location.state?.filters?.colokan || "Semua",
    wifi: location.state?.filters?.wifi || "Semua",
    keramaian: location.state?.filters?.keramaian || "Semua",
  }));

  const [searchQuery, setSearchQuery] = useState(
    () => location.state?.query || "",
  );
  const [places, setPlaces] = useState([]);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [placesLoadError, setPlacesLoadError] = useState("");
  const [isExiting, setIsExiting] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    fetchPlaces()
      .then((data) => {
        if (isMounted) setPlaces(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("[Searching] Gagal memuat tempat dari database:", err);
        setPlacesLoadError(err.message);
      })
      .finally(() => {
        if (isMounted) setPlacesLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (location.state?.autoFocus !== false) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const len = inputRef.current.value.length;
          inputRef.current.setSelectionRange(len, len);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const handleBackClick = () => {
    if (typeof document !== "undefined" && "startViewTransition" in document) {
      document.startViewTransition(() => {
        navigate("/beranda");
      });
    } else {
      setIsExiting(true);
      setTimeout(() => navigate("/beranda"), 280);
    }
  };

  const handleFilterClick = (category, value) => {
    setActiveFilters((prev) => ({ ...prev, [category]: value }));
  };

  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCheckinLoading, setIsCheckinLoading] = useState(false);
  const [checkinMessage, setCheckinMessage] = useState("");

  useEffect(() => {
    document.body.style.overflow = selectedPlace ? "hidden" : "unset";
  }, [selectedPlace]);

  useEffect(() => {
    if (!selectedPlace) {
      setIsCheckedIn(false);
      setCheckinMessage("");
      return;
    }
    let userIdentifier = null;
    try {
      const stored = JSON.parse(localStorage.getItem("selasarUser") || "{}");
      userIdentifier = stored?.id || stored?.uid || stored?.email;
    } catch {
      /* ignore */
    }
    if (userIdentifier) {
      fetchUserActiveCheckin(userIdentifier)
        .then((active) => {
          setIsCheckedIn(active && Number(active.place_id) === Number(selectedPlace.id));
        })
        .catch(() => {});
    }
  }, [selectedPlace]);

  const handleSelectPlace = (place) => {
    logVisit({
      source: "searching",
      id: place.id,
      name: place.name,
      image: place.image,
      subtitle: place.address,
      match: place.match,
    });

    let userIdentifier = null;
    try {
      const stored = JSON.parse(localStorage.getItem("selasarUser") || "{}");
      userIdentifier = stored?.id || stored?.uid || stored?.email;
    } catch {
      /* ignore */
    }

    if (userIdentifier) {
      logActivityAPI({
        uid: userIdentifier,
        place_id: place.id,
        event_type: "visit",
        metadata: { source: "searching", place_name: place.name },
      }).catch(() => {});
    }

    setSelectedPlace(place);
  };

  const handleCheckinToggle = async () => {
    let userIdentifier = null;
    try {
      const stored = JSON.parse(localStorage.getItem("selasarUser") || "{}");
      userIdentifier = stored?.id || stored?.uid || stored?.email;
    } catch {
      /* ignore */
    }

    if (!userIdentifier) {
      setCheckinMessage("Silakan masuk/login terlebih dahulu untuk check-in.");
      return;
    }

    if (!selectedPlace) return;

    setIsCheckinLoading(true);
    setCheckinMessage("");

    try {
      if (isCheckedIn) {
        await checkoutFromPlace(userIdentifier, selectedPlace.id);
        setIsCheckedIn(false);
        setCheckinMessage("Check-out berhasil! Terima kasih sudah nugas di sini.");
      } else {
        await checkinToPlace(userIdentifier, selectedPlace.id);
        setIsCheckedIn(true);
        setCheckinMessage("Check-in berhasil! Selamat nugas di sini ☕");
      }
    } catch (err) {
      setCheckinMessage(err.message || "Gagal memperbarui status check-in.");
    } finally {
      setIsCheckinLoading(false);
    }
  };


  const filteredPlaces = places.filter((place) => {
    const q = searchQuery.toLowerCase().trim();
    const searchableContent = [
      place.name,
      place.address,
      place.mood,
      place.category,
      place.city,
      place.noiseLevel,
      place.wifiStatus,
      place.specs?.plug,
      place.description,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const matchSearch =
      !q ||
      searchableContent.includes(q) ||
      (q.includes("colokan") && Boolean(place.colokanProbability)) ||
      (q.includes("stopkontak") && Boolean(place.colokanProbability)) ||
      (q.includes("wifi") && Boolean(place.wifiStatus));

    const matchColokan =
      activeFilters.colokan === "Semua" ||
      place.specs?.plug === activeFilters.colokan;
    const matchWifi =
      activeFilters.wifi === "Semua" ||
      place.wifiStatus === activeFilters.wifi;
    const matchKeramaian =
      activeFilters.keramaian === "Semua" ||
      place.noiseLevel === activeFilters.keramaian;

    return matchSearch && matchColokan && matchWifi && matchKeramaian;
  });

  // Favorit sekarang persist per akun lewat activityStore
  const [savedPlaces, setSavedPlaces] = useState(() =>
    getStoredFavorites()
      .filter((f) => f.source === "searching")
      .map((f) => f.id),
  );
  const toggleSave = (id) => {
    const place = places.find((p) => p.id === id);
    toggleFavoriteStore({
      source: "searching",
      id,
      name: place?.name,
      image: place?.image,
      match: place?.match,
    });
    setSavedPlaces((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );

    // Sinkronkan ke PostgreSQL Backend (selasar-db)
    try {
      const user = JSON.parse(localStorage.getItem("selasarUser") || "{}");
      const userIdentifier = user?.uid || user?.id;
      if (userIdentifier) {
        toggleBookmarkAPI(userIdentifier, id).catch(() => {});
      }
    } catch {
      /* ignore */
    }
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
        return (b.match ?? 0) - (a.match ?? 0);
      case "Name":
        return a.name.localeCompare(b.name);
      case "PriceAsc":
        return (a.price_min ?? 0) - (b.price_min ?? 0);
      case "PriceDesc":
        return (b.price_min ?? 0) - (a.price_min ?? 0);
      case "Rating":
        return (b.avg_rating ?? 0) - (a.avg_rating ?? 0);
      case "Favorite": {
        const aFav = savedPlaces.includes(a.id) ? 1 : 0;
        const bFav = savedPlaces.includes(b.id) ? 1 : 0;
        if (aFav !== bFav) return bFav - aFav;
        return (b.match ?? 0) - (a.match ?? 0);
      }
      default:
        return 0;
    }
  });

  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "Urutkan";
  const filterOptions = {
    colokan: [...new Set(places.map((place) => place.specs?.plug).filter(Boolean))],
    wifi: [...new Set(places.map((place) => place.wifiStatus).filter(Boolean))],
    keramaian: [...new Set(places.map((place) => place.noiseLevel).filter(Boolean))],
  };
  const searchSuggestions = [
    ...new Set(places.flatMap((place) => [place.name, place.city]).filter(Boolean)),
  ].slice(0, 6);

  return (
    <div className="min-h-screen bg-[#EDE8DE] dark:bg-[#1F1B18] p-4 sm:p-6 md:p-8 font-sans flex flex-col items-center overflow-x-hidden transition-colors duration-500">
      {/* HEADER */}
      <div
        className={`w-full max-w-xl relative flex justify-center items-center mb-6 transition-all duration-300 ease-out ${
          isExiting ? "opacity-0 -translate-y-4" : "opacity-100 translate-y-0"
        }`}
      >
        <button
          onClick={handleBackClick}
          aria-label="Kembali ke Beranda"
          className="absolute left-0 p-3 bg-white dark:bg-[#2A2521] text-[#4A3B38] dark:text-[#F5F2EB] rounded-full shadow-sm border border-gray-200 dark:border-[#3D342D] hover:bg-[#F3EFEA] dark:hover:bg-[#332C27] hover:scale-105 active:scale-95 transition-all"
        >
          <FaArrowLeft size={16} />
        </button>
        <button
          onClick={handleBackClick}
          className="focus:outline-none"
          aria-label="Selasar Logo"
        >
          <img
            src={TextSelasar}
            alt="Logo Selasar"
            style={{ viewTransitionName: "selasar-logo" }}
            className="w-44 sm:w-52 h-auto object-contain drop-shadow-sm hover:opacity-90 transition-opacity"
          />
        </button>
      </div>

      {/* SEARCH BAR */}
      <div
        className={`w-full max-w-xl mb-8 flex justify-center z-20 transition-all duration-300 ease-out ${
          isExiting
            ? "opacity-0 translate-y-2 scale-98"
            : "opacity-100 translate-y-0 scale-100"
        }`}
      >
        <div
          style={{ viewTransitionName: "selasar-search-bar" }}
          className="relative w-full group"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setShowRecent(false);
            }}
            className="flex bg-white dark:bg-[#2A2521] rounded-full border border-gray-300 dark:border-[#3D342D] shadow-md hover:shadow-lg focus-within:shadow-xl focus-within:ring-2 ring-[#594A42]/20 dark:ring-[#C4A876]/30 transition-all h-14 overflow-hidden w-full"
          >
            <div className="flex-1 flex items-center px-6">
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowRecent(true)}
                onBlur={() => setTimeout(() => setShowRecent(false), 200)}
                placeholder="Cari nama tempat, suasana, atau kota..."
                className="w-full outline-none text-sm font-semibold text-[#594A42] dark:text-[#F5F2EB] bg-transparent placeholder-gray-400 dark:placeholder-gray-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    inputRef.current?.focus();
                  }}
                  className="p-1.5 text-gray-400 hover:text-[#594A42] dark:hover:text-[#F5F2EB] transition-colors rounded-full hover:bg-black/5 dark:hover:bg-white/5 mr-1"
                >
                  <FaTimes size={14} />
                </button>
              )}
            </div>
            <button
              type="submit"
              aria-label="Cari"
              className="w-16 bg-[#E5DFCF] dark:bg-[#332C27] border-l border-gray-200 dark:border-[#3D342D] text-[#594A42] dark:text-[#F5F2EB] hover:bg-[#d5cebd] dark:hover:bg-[#3D342D] transition-colors flex items-center justify-center shrink-0"
            >
              <FaSearch size={16} />
            </button>
          </form>

          {/* RECENT SEARCHES DROPDOWN */}
          <div
            className={`absolute top-16 left-0 w-full bg-white dark:bg-[#2A2521] rounded-2xl shadow-xl border border-gray-100 dark:border-[#3D342D] overflow-hidden transition-all duration-300 origin-top z-30 ${
              showRecent && !searchQuery
                ? "opacity-100 scale-y-100"
                : "opacity-0 scale-y-0 pointer-events-none"
            }`}
          >
            <div className="p-4">
              <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-2">
                <FaHistory /> Tempat dan kota di database
              </p>
              {searchSuggestions.map((item) => (
                <div
                  key={item}
                  onMouseDown={() => {
                    setSearchQuery(item);
                    setShowRecent(false);
                  }}
                  className="px-3 py-2.5 hover:bg-[#F3EFEA] dark:hover:bg-[#332C27] rounded-lg cursor-pointer text-sm font-medium text-[#4A3B38] dark:text-[#F5F2EB] transition-colors flex items-center justify-between"
                >
                  <span>{item}</span>
                  <span className="text-xs text-gray-400">Pilih</span>
                </div>
              ))}
              {searchSuggestions.length === 0 && (
                <p className="px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400">
                  {placesLoading
                    ? "Memuat saran..."
                    : placesLoadError || "Belum ada tempat di database."}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KONTEN BAWAH */}
      <div
        className={`w-full flex flex-col items-center transition-all duration-300 ease-out ${
          isExiting ? "opacity-0 translate-y-6" : "opacity-100 translate-y-0"
        }`}
      >
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

          {placesLoading ? (
            <div role="status" className="bg-white dark:bg-[#2A2521] rounded-3xl p-10 text-center border border-gray-200 dark:border-[#3D342D]">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Memuat tempat dari database...
              </p>
            </div>
          ) : placesLoadError ? (
            <div role="alert" className="bg-white dark:bg-[#2A2521] rounded-3xl p-10 text-center border border-red-300 dark:border-red-900">
              <h3 className="text-xl font-bold text-[#4A3B38] dark:text-[#F5F2EB] mb-2">
                Gagal memuat tempat
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300">
                {placesLoadError}
              </p>
            </div>
          ) : sortedPlaces.length > 0 ? (
            sortedPlaces.map((place) => (
              <div
                key={place.id}
                onClick={() => handleSelectPlace(place)}
                className="bg-white dark:bg-[#2A2521] rounded-[1.5rem] overflow-hidden shadow-sm border border-gray-100 dark:border-[#3D342D] mb-5 flex flex-col sm:flex-row relative group hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="sm:w-[35%] h-48 sm:h-auto overflow-hidden">
                  <img
                    src={place.image || ""}
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
                        {place.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-2 font-medium">
                      <FaMapMarkerAlt size={11} className="text-[#6B554F] dark:text-[#C4A876]" />
                      {place.address}
                    </p>
                    <p className="text-[11px] font-semibold text-[#6B554F] dark:text-[#C4A876] flex items-center gap-3 mb-3">
                      <span className="flex items-center gap-1">
                        <FaStar size={10} className="text-yellow-500" />
                        {place.avg_rating ?? "Belum ada"}
                      </span>
                      <span>
                        {place.price_min === 0
                          ? "Gratis"
                          : place.price_min == null
                            ? "Harga belum tersedia"
                            : `Rp${place.price_min.toLocaleString("id-ID")}`}
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
                          {place.colokanProbability || "Belum ada data"}
                        </p>
                      </div>
                      <div>
                        <p className="font-bold text-xs text-[#4A3B38] dark:text-[#F5F2EB] flex items-center gap-1.5 mb-0.5">
                          WiFi <FaWifi size={12} className="text-[#6B554F] dark:text-[#C4A876]" />
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          {place.wifiStatus || "Belum ada data"}
                        </p>
                      </div>
                      <div>
                        <p className="font-bold text-xs text-[#4A3B38] dark:text-[#F5F2EB] flex items-center gap-1.5 mb-0.5">
                          <FaUsers size={12} className="text-[#6B554F] dark:text-[#C4A876]" />{" "}
                          {place.noiseLevel || "Belum ada data"}
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
                        {place.mood || "Belum ada data"}
                      </span>
                    </p>
                    <div className="bg-[#F3EFEA] dark:bg-[#332C27] px-3 py-1.5 rounded-lg text-xs font-bold text-[#4A3B38] dark:text-[#F5F2EB] shadow-sm">
                      {place.match == null ? "Match belum tersedia" : `${place.match}% match`}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-[#2A2521] rounded-3xl p-10 text-center border-2 border-dashed border-[#cbbdb0] dark:border-[#4a4038]">
              <h3 className="text-xl font-bold text-[#4A3B38] dark:text-[#F5F2EB] mb-2">
                {places.length === 0
                  ? "Belum ada tempat aktif"
                  : "Yah, tempatnya nggak ketemu 🥲"}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                {places.length === 0
                  ? "Database belum memiliki tempat yang aktif."
                  : "Coba cari dengan kata kunci lain atau longgarkan filter pencarianmu."}
              </p>
              {places.length > 0 && (
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
              )}
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
                src={selectedPlace.image || ""}
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
                  Cocok untuk: {selectedPlace.mood || "Belum ada data"}
                </p>

                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6 bg-gray-50 dark:bg-[#1F1B18] p-4 rounded-2xl italic">
                  "{selectedPlace.description}"
                </p>

                <div className="grid grid-cols-2 gap-4 text-sm text-[#5E4B45] dark:text-[#F5F2EB]">
                  <div className="bg-[#F4EFE8] dark:bg-[#332C27] p-4 rounded-2xl">
                    <p className="font-bold flex items-center gap-2 mb-1 text-gray-500 dark:text-gray-400">
                      <FaPlug /> Colokan
                    </p>
                    <p className="font-semibold">
                      {selectedPlace.colokanProbability || "Belum ada data"}
                    </p>
                  </div>
                  <div className="bg-[#F4EFE8] dark:bg-[#332C27] p-4 rounded-2xl">
                    <p className="font-bold flex items-center gap-2 mb-1 text-gray-500 dark:text-gray-400">
                      <FaWifi /> WiFi
                    </p>
                    <p className="font-semibold">
                      {selectedPlace.wifiStatus || "Belum ada data"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={handleCheckinToggle}
                  disabled={isCheckinLoading}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm cursor-pointer transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${
                    isCheckedIn
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-[#8B6B4F] text-white hover:bg-[#735840]"
                  }`}
                >
                  {isCheckinLoading ? (
                    "Memproses..."
                  ) : isCheckedIn ? (
                    <>
                      <FaCheckCircle /> Sedang Nugas (Check-out)
                    </>
                  ) : (
                    <>
                      <FaDoorOpen /> Check-in di Spot Ini
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    if (selectedPlace?.lat && selectedPlace?.lng) {
                      window.open(
                        `https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.lat},${selectedPlace.lng}`,
                        "_blank",
                      );
                    } else {
                      window.open(
                        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          selectedPlace.name + " " + (selectedPlace.city || ""),
                        )}`,
                        "_blank",
                      );
                    }
                  }}
                  className="flex-1 py-3 px-4 bg-[#594A42] text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-[#433731] active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FaLocationArrow /> Rute ke Sini
                </button>
              </div>
              {checkinMessage && (
                <p className="mt-2 text-xs text-center font-medium text-[#8B6B4F] dark:text-[#C4A876]">
                  {checkinMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}