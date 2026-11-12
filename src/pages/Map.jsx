import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from "react";
import {
  FaUsers,
  FaMapMarkerAlt,
  FaWifi,
  FaPlug,
  FaBookmark,
  FaLocationArrow,
  FaTimes,
  FaRegSadTear,
  FaArrowLeft,
  FaCompass,
  FaChevronUp,
  FaChevronDown,
  FaPen,
} from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { placesData } from "../data/place";
import SelasarMap from "../components/SelasarMap";
import CommunityReviewModal from "../components/CommunityReviewModal";
import CommunityReviewsSection from "../components/CommunityReviewsSection";
import {
  logVisit,
  toggleFavorite as toggleFavoriteStore,
  getFavorites as getStoredFavorites,
} from "../utils/activityStore";

const FALLBACK_PLACE_IMG =
  "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80";

export default function Map() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [modalTab, setModalTab] = useState("info"); // "info" | "reviews"
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [reviewRefreshTrigger, setReviewRefreshTrigger] = useState(0);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("selasarUser") || "null");
    } catch {
      return null;
    }
  });

  // Initial city from navigation state (e.g. from Beranda)
  const [activeCity, setActiveCity] = useState(() => {
    const passedCity = location.state?.city;
    if (
      passedCity &&
      passedCity !== "Show Everything" &&
      passedCity !== "Semua"
    ) {
      return passedCity;
    }
    return "Semua Kota";
  });

  const [activeCategory, setActiveCategory] = useState("Semua");
  const cardRefs = useRef({});
  const cardPanelRef = useRef(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(true);

  const [favoriteIds, setFavoriteIds] = useState(() => {
    try {
      return new Set(
        getStoredFavorites()
          .filter((f) => f.source === "map" || f.source === "beranda")
          .map((f) => f.id),
      );
    } catch {
      return new Set();
    }
  });

  const handleBack = useCallback(() => {
    if (typeof document !== "undefined" && "startViewTransition" in document) {
      document.startViewTransition(() => {
        navigate("/beranda");
      });
    } else {
      navigate("/beranda");
    }
  }, [navigate]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 30);
    return () => clearTimeout(timer);
  }, []);

  // Modal Escape Logic
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (selectedLocation) {
          setSelectedLocation(null);
        } else {
          handleBack();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedLocation, handleBack]);

  // Real-time filtering
  const filteredLocations = placesData.filter((loc) => {
    // 1. City Filter
    const matchCity =
      activeCity === "Semua Kota" ||
      activeCity === "Semua" ||
      loc.city.toLowerCase() === activeCity.toLowerCase();

    // 2. Category Filter
    const matchCat =
      activeCategory === "Semua" || loc.category === activeCategory;

    // 3. Search Bar Filter
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      loc.name.toLowerCase().includes(q) ||
      loc.address.toLowerCase().includes(q) ||
      loc.city.toLowerCase().includes(q) ||
      loc.category.toLowerCase().includes(q) ||
      loc.mood.toLowerCase().includes(q) ||
      (q.includes("colokan") && loc.colokanProbability) ||
      (q.includes("wifi") && loc.wifiStatus);

    return matchCity && matchCat && matchSearch;
  });

  const handleSelectLocation = useCallback((loc, shouldScroll = false) => {
    logVisit({
      source: "map",
      id: loc.id,
      name: loc.name,
      image: loc.image,
      subtitle: loc.address,
      match: loc.match,
    });
    try {
      setCurrentUser(JSON.parse(localStorage.getItem("selasarUser") || "null"));
    } catch {
      /* ignore */
    }
    setModalTab("info");
    setSelectedLocation(loc);
    setHighlightedId(loc.id);

    if (shouldScroll && cardRefs.current[loc.id]) {
      cardRefs.current[loc.id].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, []);

  const handleFocusOnMap = (loc) => {
    setHighlightedId(loc.id);
    const mapEl = document.getElementById("selasar-map-section");
    if (mapEl) {
      mapEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handlePanelScroll = useCallback(() => {
    const panel = cardPanelRef.current;
    if (!panel) return;
    const { scrollTop, scrollHeight, clientHeight } = panel;
    setCanScrollUp(scrollTop > 20);
    setCanScrollDown(scrollTop + clientHeight < scrollHeight - 20);
  }, []);

  // Scroll ke kartu sebelumnya (1-2 kartu ke atas)
  const handleScrollPrev = useCallback(() => {
    const panel = cardPanelRef.current;
    if (!panel) return;

    const currentScroll = panel.scrollTop;
    const prevLoc = [...filteredLocations].reverse().find((loc) => {
      const el = cardRefs.current[loc.id];
      if (!el) return false;
      const elTop = el.offsetTop - panel.offsetTop;
      return elTop < currentScroll - 30;
    });

    if (prevLoc && cardRefs.current[prevLoc.id]) {
      const el = cardRefs.current[prevLoc.id];
      panel.scrollTo({
        top: Math.max(0, el.offsetTop - panel.offsetTop - 12),
        behavior: "smooth",
      });
      setHighlightedId(prevLoc.id);
    } else {
      panel.scrollBy({ top: -450, behavior: "smooth" });
    }
  }, [filteredLocations]);

  // Scroll ke kartu berikutnya (1-2 kartu ke bawah)
  const handleScrollNext = useCallback(() => {
    const panel = cardPanelRef.current;
    if (!panel) return;

    const currentScroll = panel.scrollTop;
    const nextLoc = filteredLocations.find((loc) => {
      const el = cardRefs.current[loc.id];
      if (!el) return false;
      const elTop = el.offsetTop - panel.offsetTop;
      return elTop > currentScroll + 30;
    });

    if (nextLoc && cardRefs.current[nextLoc.id]) {
      const el = cardRefs.current[nextLoc.id];
      panel.scrollTo({
        top: el.offsetTop - panel.offsetTop - 12,
        behavior: "smooth",
      });
      setHighlightedId(nextLoc.id);
    } else {
      panel.scrollBy({ top: 450, behavior: "smooth" });
    }
  }, [filteredLocations]);

  // Reset panel scroll saat filter berubah (DOM-only, tidak memicu render cascade)
  useLayoutEffect(() => {
    if (cardPanelRef.current) {
      cardPanelRef.current.scrollTop = 0;
    }
  }, [activeCity, activeCategory, searchQuery]);

  const handleToggleFavoriteDetail = (e, loc) => {
    e?.stopPropagation();
    const target = loc || selectedLocation;
    if (!target) return;

    toggleFavoriteStore({
      source: "map",
      id: target.id,
      name: target.name,
      image: target.image,
      match: target.match,
    });

    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(target.id)) next.delete(target.id);
      else next.add(target.id);
      return next;
    });
  };

  const handleOpenRoute = (loc) => {
    const target = loc || selectedLocation;
    if (!target) return;

    if (target.lat && target.lng) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${target.lat},${target.lng}`,
        "_blank",
      );
    } else {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          target.name + " " + target.city,
        )}`,
        "_blank",
      );
    }
  };

  return (
    <div
      className={`min-h-screen bg-[#EDE8DE] dark:bg-[#1F1B18] transition-colors duration-500 pb-20 ${
        isLoaded ? "opacity-100" : "opacity-0"
      } transition-opacity duration-500`}
    >
      {/* HEADER SECTION */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
          <button
            onClick={handleBack}
            aria-label="Kembali ke Beranda"
            className="p-2.5 sm:p-3 bg-white dark:bg-[#2A2521] text-[#594A42] dark:text-[#F5F2EB] rounded-full shadow-sm border border-gray-200 dark:border-[#3D342D] hover:bg-[#F3EFEA] dark:hover:bg-[#332C27] hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <FaArrowLeft size={14} className="sm:text-base" />
          </button>

          <div
            onClick={handleBack}
            className="text-center cursor-pointer hover:opacity-90 transition-opacity min-w-0"
          ></div>

          <div className="w-9 sm:w-10 shrink-0"></div>
        </div>
      </div>

      {/* SPLIT LAYOUT: MAP (kiri sticky) + KARTU (kanan scrollable) */}
      <div className="max-w-7xl mx-auto px-4 -translate-y-8 sm:px-6 pb-12 relative z-10">
        {/* SECTION HEADER - CENTERED */}
        <div className="flex flex-col items-center text-center gap-2 mb-6 sm:mb-8">
          {/* Top decorative line + badge row */}
          <div className="flex items-center gap-9 sm:gap-4 w-full max-w-2xl mb-4 sm:mb-5">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#C4A876]/40 to-[#8B6B4F]/60 dark:via-[#C4A876]/25 dark:to-[#8B6B4F]/40 hidden sm:block" />
            <div className="flex items-center gap-2 shrink-0 mx-auto sm:mx-0">
              <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-[#8B6B4F]/10 dark:bg-[#C4A876]/15 text-[#8B6B4F] dark:text-[#C4A876] text-[10px] sm:text-[11px] font-extrabold rounded-full uppercase tracking-widest flex items-center gap-1.5">
                <FaMapMarkerAlt size={9} />
                {activeCity}
              </span>
              <span className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] sm:text-[11px] font-extrabold rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {filteredLocations.length} Spot Aktif
              </span>
            </div>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[#C4A876]/40 to-[#8B6B4F]/60 dark:via-[#C4A876]/25 dark:to-[#8B6B4F]/40 hidden sm:block" />
          </div>

          {/* Main heading */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#594A42] dark:text-[#F5F2EB] tracking-tight leading-tight mb-2  sm:mb-3 px-2">
            {activeCategory === "Semua" ? (
              <>
                Spot Pilihan di{" "}
                <span className="text-[#8B6B4F] dark:text-[#C4A876]">
                  {activeCity}
                </span>
              </>
            ) : (
              <>
                <span className="text-[#8B6B4F] dark:text-[#C4A876]">
                  {activeCategory}
                </span>{" "}
                di {activeCity}
              </>
            )}
          </h2>

          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium max-w-md leading-relaxed px-4">
            Data ketersediaan colokan, kecepatan WiFi, dan suasana diperbarui
            real-time.
          </p>

          {/* Bottom divider */}
          <div className="mt-5 sm:mt-7 w-full h-px bg-gradient-to-r from-transparent via-[#8B6B4F]/25 to-transparent dark:via-[#C4A876]/15" />
        </div>

        {filteredLocations.length === 0 ? (
          /* EMPTY STATE - full width */
          <div className="flex flex-col items-center justify-center py-14 sm:py-20 px-4 bg-white/60 dark:bg-[#2A2521]/60 rounded-3xl border-2 border-dashed border-[#D5D0C5] dark:border-[#3D342D]">
            <FaRegSadTear className="text-5xl sm:text-6xl text-[#8B6B4F]/50 mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-bold text-[#594A42] dark:text-[#F5F2EB] text-center">
              Spot belum ditemukan
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1.5 sm:mt-2 max-w-sm text-center">
              Coba ganti kata kunci, pilih kategori lain, atau luaskan ke "Semua
              Kota".
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveCity("Semua Kota");
                setActiveCategory("Semua");
                setCanScrollUp(false);
                setCanScrollDown(true);
              }}
              className="mt-5 sm:mt-6 px-5 sm:px-6 py-2 sm:py-2.5 bg-[#594A42] text-white text-xs sm:text-sm font-bold rounded-full hover:bg-[#433731] transition-all cursor-pointer shadow-sm active:scale-95"
            >
              Reset Filter Pencarian
            </button>
          </div>
        ) : (
          /* SPLIT LAYOUT: Peta sticky kiri + Kartu scroll kanan (Responsif) */
          <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 items-start">
            {/* LEFT: Leaflet Map */}
            <div
              id="selasar-map-section"
              className="w-full lg:w-[55%] lg:sticky lg:top-6 scroll-mt-6 shrink-0"
            >
              <SelasarMap
                places={filteredLocations}
                activeCity={activeCity === "Semua Kota" ? "Semua" : activeCity}
                selectedPlaceId={highlightedId}
                onSelectPlace={(place) => handleSelectLocation(place, true)}
                mode="full"
                className="!h-[340px] sm:!h-[440px] md:!h-[520px] lg:!h-[620px]"
              />
            </div>

            {/* RIGHT: Fixed-height card panel — Responsif seimbang */}
            <div className="w-full lg:w-[45%] h-[480px] sm:h-[520px] md:h-[560px] lg:h-[620px] relative rounded-[1.75rem] sm:rounded-[2rem] overflow-hidden">
              {/* BUTTON UP (DI ATAS) */}
              <div
                className={`absolute top-2.5 sm:top-3 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 ${
                  canScrollUp
                    ? "opacity-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 -translate-y-2 pointer-events-none"
                }`}
              >
                <button
                  onClick={handleScrollPrev}
                  aria-label="Scroll ke atas"
                  className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/95 dark:bg-[#2A2521]/95 backdrop-blur-md border border-[#8B6B4F]/30 dark:border-[#C4A876]/35 text-[#594A42] dark:text-[#F5F2EB] text-[11px] sm:text-xs font-bold shadow-lg hover:shadow-xl hover:bg-[#F7F3EE] dark:hover:bg-[#332C27] hover:scale-105 active:scale-95 transition-all cursor-pointer group whitespace-nowrap"
                >
                  <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-[#E5DFCF] dark:bg-[#3D342D] flex items-center justify-center text-[#8B6B4F] dark:text-[#C4A876] group-hover:-translate-y-0.5 transition-transform shadow-inner shrink-0">
                    <FaChevronUp size={9} />
                  </div>
                  <span>Ke Atas</span>
                </button>
              </div>

              {/* FADE GRADIENT ATAS */}
              <div
                className={`absolute top-0 left-0 right-0 h-12 sm:h-16 bg-gradient-to-b from-[#EDE8DE] dark:from-[#1F1B18] via-[#EDE8DE]/70 dark:via-[#1F1B18]/70 to-transparent z-20 pointer-events-none rounded-t-[1.75rem] sm:rounded-t-[2rem] transition-opacity duration-300 ${
                  canScrollUp ? "opacity-100" : "opacity-0"
                }`}
              />

              {/* FADE GRADIENT BAWAH */}
              <div
                className={`absolute bottom-0 left-0 right-0 h-12 sm:h-16 bg-gradient-to-t from-[#EDE8DE] dark:from-[#1F1B18] via-[#EDE8DE]/70 dark:via-[#1F1B18]/70 to-transparent z-20 pointer-events-none rounded-b-[1.75rem] sm:rounded-b-[2rem] transition-opacity duration-300 ${
                  canScrollDown ? "opacity-100" : "opacity-0"
                }`}
              />

              {/* BUTTON DOWN (DI BAWAH) */}
              <div
                className={`absolute bottom-2.5 sm:bottom-3 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 ${
                  canScrollDown
                    ? "opacity-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 translate-y-2 pointer-events-none"
                }`}
              >
                <button
                  onClick={handleScrollNext}
                  aria-label="Scroll ke bawah"
                  className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-4.5 py-1.5 sm:py-2 rounded-full bg-[#594A42] hover:bg-[#433731] text-white text-[11px] sm:text-xs font-bold shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer group whitespace-nowrap"
                >
                  <span>Ke Bawah</span>
                  <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-white/20 flex items-center justify-center text-white group-hover:translate-y-0.5 transition-transform shadow-inner shrink-0">
                    <FaChevronDown size={9} />
                  </div>
                </button>
              </div>

              {/* SCROLLABLE CARD CONTAINER */}
              <div
                ref={cardPanelRef}
                onScroll={handlePanelScroll}
                className="w-full h-full overflow-y-auto flex flex-col gap-4 sm:gap-5 px-1 scroll-smooth"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                <div className="pt-2 pb-14 flex flex-col gap-4 sm:gap-5">
                  {filteredLocations.map((loc, idx) => {
                    const isSelected = highlightedId === loc.id;
                    return (
                      <div
                        key={loc.id}
                        ref={(el) => (cardRefs.current[loc.id] = el)}
                        onClick={() => {
                          handleSelectLocation(loc);
                        }}
                        className={`bg-white dark:bg-[#2A2521] rounded-[1.75rem] sm:rounded-[2rem] shadow-sm hover:shadow-xl overflow-hidden flex flex-col cursor-pointer group transition-all duration-300 ease-out hover:-translate-y-1 border ${
                          isSelected
                            ? "ring-3 ring-[#8B6B4F] border-transparent shadow-lg scale-[1.01]"
                            : "border-gray-100 dark:border-[#3D342D]"
                        }`}
                      >
                        <div className="h-44 sm:h-48 overflow-hidden relative bg-[#EBE7DF] dark:bg-[#3D342D]">
                          <img
                            src={loc.image || FALLBACK_PLACE_IMG}
                            alt={loc.name}
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = FALLBACK_PLACE_IMG;
                            }}
                            className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
                          />
                          <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 bg-white/95 dark:bg-[#2A2521]/95 backdrop-blur-sm px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold text-[#594A42] dark:text-[#F5F2EB] shadow-sm uppercase tracking-wider">
                            {loc.city}
                          </div>

                          <div className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 bg-white/95 dark:bg-[#2A2521]/95 backdrop-blur-sm px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold text-[#594A42] dark:text-[#F5F2EB] shadow-sm">
                            {loc.category}
                          </div>

                          {/* Card number badge */}
                          <div className="absolute bottom-2.5 left-3.5 sm:bottom-3 sm:left-4 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#594A42]/80 backdrop-blur-sm flex items-center justify-center text-white text-[10px] sm:text-[11px] font-extrabold shadow-md">
                            {idx + 1}
                          </div>
                        </div>

                        <div className="p-4 sm:p-5 flex flex-col flex-1">
                          <div className="flex justify-between items-start mb-2 gap-2">
                            <div className="min-w-0">
                              <h3 className="text-base sm:text-lg font-extrabold text-[#594A42] dark:text-[#F5F2EB] group-hover:text-[#8B6B4F] dark:group-hover:text-[#C4A876] transition-colors leading-tight truncate">
                                {loc.name}
                              </h3>
                              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium truncate">
                                <FaMapMarkerAlt className="text-[#8B6B4F] dark:text-[#C4A876] shrink-0" />
                                <span className="truncate">
                                  {loc.distance} dari pusat
                                </span>
                              </div>
                            </div>
                            <div className="bg-[#EFE7E2] dark:bg-[#1F1B18] text-[#594A42] dark:text-[#C4A876] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-xl text-[10px] sm:text-xs font-extrabold whitespace-nowrap shrink-0">
                              {loc.match}% Match
                            </div>
                          </div>

                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-3 leading-relaxed font-medium">
                            {loc.description}
                          </p>

                          <div className="mt-auto pt-2.5 sm:pt-3 border-t border-gray-100 dark:border-[#3D342D] grid grid-cols-2 gap-2 text-[11px] sm:text-xs text-[#594A42] dark:text-[#F5F2EB]">
                            <div className="bg-gray-50 dark:bg-[#1F1B18] p-2 sm:p-2.5 rounded-xl">
                              <p className="flex items-center gap-1 sm:gap-1.5 mb-0.5 text-gray-400 dark:text-gray-500 font-bold text-[10px] sm:text-xs">
                                <FaPlug className="text-[#8B6B4F] shrink-0" />{" "}
                                Colokan
                              </p>
                              <p className="font-bold text-emerald-700 dark:text-emerald-400 truncate">
                                {loc.colokanProbability}
                              </p>
                            </div>
                            <div className="bg-gray-50 dark:bg-[#1F1B18] p-2 sm:p-2.5 rounded-xl">
                              <p className="flex items-center gap-1 sm:gap-1.5 mb-0.5 text-gray-400 dark:text-gray-500 font-bold text-[10px] sm:text-xs">
                                <FaWifi className="text-[#8B6B4F] shrink-0" />{" "}
                                WiFi
                              </p>
                              <p className="font-bold truncate">
                                {loc.wifiStatus}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFocusOnMap(loc);
                              }}
                              className="flex-1 py-2 px-2 sm:px-3 bg-[#E5DFCF] dark:bg-[#332C27] hover:bg-[#d5cebd] dark:hover:bg-[#433731] text-[#594A42] dark:text-[#F5F2EB] rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                            >
                              <FaCompass
                                size={11}
                                className="text-[#8B6B4F] dark:text-[#C4A876] shrink-0"
                              />
                              <span>Fokus di Peta</span>
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenRoute(loc);
                              }}
                              className="flex-1 py-2 px-2 sm:px-3 bg-[#594A42] hover:bg-[#433731] text-white rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 whitespace-nowrap"
                            >
                              <FaLocationArrow size={9} className="shrink-0" />
                              <span>Buka Rute</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL POP-UP DETAIL */}
      {selectedLocation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#445234]/40 backdrop-blur-sm transition-opacity duration-300 p-3 sm:p-4"
          onClick={() => setSelectedLocation(null)}
        >
          <div
            className="bg-white dark:bg-[#2A2521] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row w-full max-w-4xl max-h-[90vh] md:max-h-[85vh] animate-in zoom-in-95 duration-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedLocation(null)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 w-8 h-8 sm:w-10 sm:h-10 bg-white/90 dark:bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-[#EFE7E2] dark:hover:bg-[#3D342D] hover:text-[#8B6B4F] dark:hover:text-[#C4A876] hover:rotate-90 transition-all duration-300 shadow-sm cursor-pointer"
            >
              <FaTimes size={15} />
            </button>

            <div className="w-full md:w-[45%] h-[180px] sm:h-[220px] md:h-auto overflow-hidden relative shrink-0 bg-[#EBE7DF] dark:bg-[#3D342D]">
              <img
                src={selectedLocation.image || FALLBACK_PLACE_IMG}
                alt={selectedLocation.name}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = FALLBACK_PLACE_IMG;
                }}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex gap-1.5 sm:gap-2">
                <span className="px-2.5 sm:px-3.5 py-1 bg-white/90 dark:bg-[#2A2521]/90 backdrop-blur-sm text-[#594A42] dark:text-[#F5F2EB] font-bold text-[10px] sm:text-xs rounded-lg shadow-sm uppercase">
                  {selectedLocation.city}
                </span>
                <span className="px-2.5 sm:px-3 py-1 bg-emerald-500 text-white font-bold text-[10px] sm:text-xs rounded-lg shadow-sm">
                  {selectedLocation.category}
                </span>
              </div>
            </div>

            <div className="flex-1 p-4 sm:p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#594A42] dark:text-[#F5F2EB] mb-1.5 sm:mb-2 pr-6">
                  {selectedLocation.name}
                </h2>
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
                  <FaMapMarkerAlt className="text-[#8B6B4F] dark:text-[#C4A876] shrink-0" />
                  <span className="truncate">{selectedLocation.address}</span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="text-[#8B6B4F] dark:text-[#C4A876] font-bold whitespace-nowrap">
                    {selectedLocation.distance}
                  </span>
                </div>

                {/* Tab Navigation */}
                <div className="flex items-center gap-4 mt-3 mb-4 border-b border-gray-100 dark:border-[#3D342D] pb-2 text-xs sm:text-sm">
                  <button
                    onClick={() => setModalTab("info")}
                    className={`pb-1 font-bold transition-all cursor-pointer ${
                      modalTab === "info"
                        ? "text-[#8B6B4F] dark:text-[#C4A876] border-b-2 border-[#8B6B4F] dark:border-[#C4A876]"
                        : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    }`}
                  >
                    Ringkasan Tempat
                  </button>
                  <button
                    onClick={() => setModalTab("reviews")}
                    className={`pb-1 font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      modalTab === "reviews"
                        ? "text-[#8B6B4F] dark:text-[#C4A876] border-b-2 border-[#8B6B4F] dark:border-[#C4A876]"
                        : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    }`}
                  >
                    <span>Ulasan Komunitas</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#8B6B4F]/10 text-[#8B6B4F] dark:bg-[#C4A876]/20 dark:text-[#C4A876]">
                      WFC
                    </span>
                  </button>
                </div>

                {modalTab === "info" ? (
                  <>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4 sm:mb-6">
                      {selectedLocation.description}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3 md:gap-4 text-xs sm:text-sm text-[#594A42] dark:text-[#F5F2EB]">
                      <div className="bg-[#F4EFE8] dark:bg-[#1F1B18] p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl">
                        <p className="font-bold flex items-center gap-1 sm:gap-1.5 mb-1 text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs">
                          <FaPlug className="text-[#8B6B4F]" /> Colokan
                        </p>
                        <p className="font-bold text-emerald-700 dark:text-emerald-400">
                          {selectedLocation.colokanProbability}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                          {selectedLocation.specs?.plug || "Tersedia"}
                        </p>
                      </div>
                      <div className="bg-[#F4EFE8] dark:bg-[#1F1B18] p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl">
                        <p className="font-bold flex items-center gap-1 sm:gap-1.5 mb-1 text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs">
                          <FaWifi className="text-[#8B6B4F]" /> WiFi
                        </p>
                        <p className="font-bold truncate">
                          {selectedLocation.wifiStatus}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                          {selectedLocation.specs?.wifi || "Stabil"}
                        </p>
                      </div>
                      <div className="bg-[#F4EFE8] dark:bg-[#1F1B18] p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl col-span-2 md:col-span-1">
                        <p className="font-bold flex items-center gap-1 sm:gap-1.5 mb-1 text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs">
                          <FaUsers className="text-[#8B6B4F]" /> Suasana
                        </p>
                        <p className="font-bold">
                          {selectedLocation.noiseLevel}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {selectedLocation.visitors} Orang di spot
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <CommunityReviewsSection
                    placeId={selectedLocation.id}
                    placeName={selectedLocation.name}
                    currentUser={currentUser}
                    onOpenWriteReview={() => setIsReviewFormOpen(true)}
                    refreshTrigger={reviewRefreshTrigger}
                  />
                )}
              </div>

              <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-100 dark:border-[#3D342D] flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleOpenRoute(selectedLocation)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 sm:px-7 py-3 sm:py-3.5 bg-[#594A42] text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-[#433731] active:scale-95 transition-all shadow-md hover:shadow-lg cursor-pointer"
                  >
                    <FaLocationArrow /> Rute (Google Maps)
                  </button>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-end">
                  <button
                    onClick={(e) =>
                      handleToggleFavoriteDetail(e, selectedLocation)
                    }
                    aria-label={
                      favoriteIds.has(selectedLocation.id)
                        ? "Hapus dari favorit"
                        : "Simpan ke favorit"
                    }
                    className={`p-3 sm:p-3.5 rounded-full transition-all hover:scale-110 active:scale-95 cursor-pointer ${
                      favoriteIds.has(selectedLocation.id)
                        ? "bg-[#8B6B4F] text-white"
                        : "bg-gray-100 dark:bg-[#1F1B18] text-gray-400 dark:text-gray-500 hover:text-[#8B6B4F]"
                    }`}
                  >
                    <FaBookmark size={16} />
                  </button>
                  <div className="bg-[#EFE7E2] dark:bg-[#1F1B18] text-[#594A42] dark:text-[#C4A876] px-3.5 sm:px-5 py-2 sm:py-3 rounded-xl font-extrabold text-xs sm:text-sm shadow-xs">
                    {selectedLocation.match}% Match
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Community Review Form Modal */}
      {isReviewFormOpen && selectedLocation && (
        <CommunityReviewModal
          isOpen={isReviewFormOpen}
          onClose={() => setIsReviewFormOpen(false)}
          place={selectedLocation}
          currentUser={currentUser}
          onSuccess={() => {
            setReviewRefreshTrigger((prev) => prev + 1);
            setModalTab("reviews");
          }}
        />
      )}
    </div>
  );
}
