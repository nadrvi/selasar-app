import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import textLogo from "../assets/text-logo.png";
import { placesData } from "../data/place";
import {
  logVisit,
  toggleFavorite as toggleFavoriteStore,
  getFavorites as getStoredFavorites,
} from "../utils/activityStore";
import {
  FaTimes,
  FaPlug,
  FaWifi,
  FaUsers,
  FaBookmark,
  FaLocationArrow,
  FaTag,
  FaCog,
  FaFilter,
} from "react-icons/fa";

const banners = [
  {
    id: 1,
    image:
      "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=1000&q=80",
    title: "Promo Nugas Mahasiswa 🎓",
    subtitle: "Diskon 30% all item di Ruang Seduh.",
    detail:
      "Tunjukin Kartu Tanda Mahasiswa (KTM) kamu ke kasir buat nikmatin diskon 30% untuk semua varian kopi. Cocok banget buat nemenin skripsian sampai pagi! Maksimal diskon Rp 50.000.",
    brand: "Ruang Seduh",
  },
  {
    id: 2,
    image:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=80",
    title: "Spot Baru di Bogor 🌲",
    subtitle: "Healing sambil nugas di Kopi Daong.",
    detail:
      "Udah suntuk di kamar? Kopi Daong ngasih kamu view hutan pinus yang bikin otak fresh lagi. Free WiFi ngebut khusus pembelian paket Nugas Hemat.",
    brand: "Kopi Daong",
  },
  {
    id: 3,
    image:
      "https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1000&q=80",
    title: "Coworking 24 Jam 🦉",
    subtitle: "Titik Koma Coffee sekarang buka 24 jam.",
    detail:
      "Khusus weekend (Jumat - Minggu), Titik Koma buka 24 jam full. Free refill infused water dan colokan di setiap meja dijamin aman.",
    brand: "Titik Koma",
  },
  {
    id: 4,
    image:
      "https://images.unsplash.com/photo-1525610553991-2bede1a236e2?auto=format&fit=crop&w=1000&q=80",
    title: "Cashback Gopay 50% 💸",
    subtitle: "Nugas hemat di Kopi Nalar.",
    detail:
      "Pakai kode voucher SELASAR50 di aplikasi Gopay kamu saat bayar di Kopi Nalar Jakarta. Dapatkan cashback instan 50% tanpa minimum pembelian!",
    brand: "Kopi Nalar",
  },
  {
    id: 5,
    image:
      "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1000&q=80",
    title: "Live Acoustic Weekend 🎸",
    subtitle: "Beresin tugas sambil chill di Kisah Manis.",
    detail:
      "Nugas nggak harus tegang! Mulai jam 7 malam tiap Sabtu, Kisah Manis Bandung ngadain Live Acoustic. Beli 2 minuman gratis 1 porsi dimsum.",
    brand: "Kisah Manis",
  },
  {
    id: 6,
    image:
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1000&q=80",
    title: "Paket Skripsian Unlimited ☕",
    subtitle: "Gratis refill kopi hitam seharian.",
    detail:
      "Beli Paket Skripsian seharga Rp 45.000, kamu udah dapet 1 pastry dan bebas refill kopi hitam sepuasnya dari buka sampai tutup. Hanya di Bilik Kopi!",
    brand: "Bilik Kopi",
  },
];

const searchHints = [
  "Mau nugas di mana hari ini?",
  "Nyari colokan yang gampang?",
  "Butuh WiFi ngebut buat deadline?",
  "Pengen suasana yang tenang?",
];

const headingTexts = [
  "Temukan Sudut Nugas yang Pas Buat Kamu",
  "Nugas Enak, Gak Perlu Ribet Cari Tempat",
  "Spot Favorit Buat Kejar Deadline",
  "Colokan Aman, WiFi Kenceng, Fokus Lancar",
  "Cari Tempat Nugas yang Cozy dan Tenang",
  "Nugas Sambil Ngopi, Kenapa Nggak?",
  "Tempat Nugas yang Bikin Kamu Betah Berlama-lama",
];

function RevealOnScroll({ children, delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(  
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      {children}
    </div>
  );
}

export default function Beranda() {
  const navigate = useNavigate();
  const [destination, setDestination] = useState(null);
  const isTransitioning = !!destination;
  const [isLoaded, setIsLoaded] = useState(false);

  const [activeFilter, setActiveFilter] = useState("Show Everything");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [selectedBanner, setSelectedBanner] = useState(null);

  const carouselRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [dragDistance, setDragDistance] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0);

  const [greeting, setGreeting] = useState("halo, ");
  const [hintIndex, setHintIndex] = useState(0);
  const [headingIndex, setHeadingIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setHeadingIndex((i) => (i + 1) % headingTexts.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const [favorites, setFavorites] = useState(() => {
    try {
      return new Set(
        getStoredFavorites()
          .filter((f) => f.source === "beranda")
          .map((f) => f.id),
      );
    } catch {
      return new Set();
    }
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (destination) {
      const timer = setTimeout(() => navigate(destination), 500);
      return () => clearTimeout(timer);
    }
  }, [destination, navigate]);

  useEffect(() => {
    const hour = new Date().getHours();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (hour < 10) setGreeting("Pagi yang cerah,");
    else if (hour < 15) setGreeting("Siang ini,");
    else if (hour < 18) setGreeting("Sore ini,");
    else setGreeting("Malam ini,");
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setHintIndex((i) => (i + 1) % searchHints.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedPlace(null);
        setSelectedBanner(null);
      }
    };
    document.body.style.overflow =
      selectedPlace || selectedBanner ? "hidden" : "unset";
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPlace, selectedBanner]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (carouselRef.current && !isDragging) {
        const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          carouselRef.current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          carouselRef.current.scrollBy({
            left: clientWidth * 0.8,
            behavior: "smooth",
          });
        }
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [isDragging]);

  const onDragStart = (e) => {
    setIsDragging(true);
    setDragDistance(0);
    setStartX(e.pageX || e.touches[0].pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const onDragEnd = () => {
    setIsDragging(false);
  };

  const onDragMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX || e.touches[0].pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    setDragDistance(Math.abs(walk));
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleCarouselScroll = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, scrollWidth } = carouselRef.current;
    const slideWidth = scrollWidth / banners.length;
    const index = Math.round(scrollLeft / slideWidth);
    setActiveSlide(Math.max(0, Math.min(index, banners.length - 1)));
  };

  const goToSlide = (index) => {
    if (!carouselRef.current) return;
    const slideWidth = carouselRef.current.scrollWidth / banners.length;
    carouselRef.current.scrollTo({
      left: slideWidth * index,
      behavior: "smooth",
    });
  };

  const handleBannerClick = (banner) => {
    if (dragDistance < 10) {
      setSelectedBanner(banner);
    }
  };

  const toggleFavorite = (e, placeId) => {
    e.stopPropagation();
    const place = placesData.find((p) => p.id === placeId);
    toggleFavoriteStore({
      source: "beranda",
      id: placeId,
      name: place?.name,
      image: place?.image,
      match: place?.match,
    });
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(placeId)) next.delete(placeId);
      else next.add(placeId);
      return next;
    });
  };

  const handleSelectPlace = (place) => {
    logVisit({
      source: "beranda",
      id: place.id,
      name: place.name,
      image: place.image,
      subtitle: place.city,
      match: place.match,
    });
    setSelectedPlace(place);
  };

  const handleNavigate = (path) => setDestination(path);

  const resetFilters = () => {
    setActiveFilter("Show Everything");
    setShowFavoritesOnly(false);
  };

  const filteredPlaces = placesData.filter((place) => {
    const cityMatch =
      activeFilter === "Show Everything" || place.city === activeFilter;
    const favMatch = !showFavoritesOnly || favorites.has(place.id);
    return cityMatch && favMatch;
  });

  return (
    <div
      className={`relative min-h-screen bg-[#EBE7DF] dark:bg-[#1F1B18] pb-12 select-none font-sans overflow-x-hidden transition-colors duration-500 ${
        isLoaded ? "opacity-100" : "opacity-0"
      } transition-opacity duration-700 ease-out`}
    >
      <style>{`
        @keyframes blobFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -26px) scale(1.05); }
        }
        @keyframes blobFloatSlow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-24px, 22px) scale(1.07); }
        }
        .animate-blob-float { animation: blobFloat 12s ease-in-out infinite; }
        .animate-blob-float-slow { animation: blobFloatSlow 16s ease-in-out infinite; }
        @keyframes fadeInHint {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-hint { animation: fadeInHint 0.5s ease-out; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        @media (prefers-reduced-motion: reduce) {
          .animate-blob-float, .animate-blob-float-slow, .animate-fade-in-hint { animation: none; }
        }
      `}</style>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-28 -left-20 w-96 h-96 bg-[#D9B382]/20 dark:bg-[#D9B382]/10 rounded-full blur-3xl animate-blob-float" />
        <div className="absolute top-1/4 -right-24 w-[26rem] h-[26rem] bg-[#594A42]/10 dark:bg-[#594A42]/20 rounded-full blur-3xl animate-blob-float-slow" />
        <div className="absolute bottom-10 left-1/4 w-72 h-72 bg-[#8B6B4F]/10 dark:bg-[#8B6B4F]/15 rounded-full blur-3xl animate-blob-float" />
      </div>

      <div className="relative z-10">
        <nav
          className={`px-6 py-6 flex justify-between items-center max-w-7xl mx-auto relative transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isTransitioning ? "opacity-0 -translate-y-8" : "opacity-100"
          }`}
        >
          <div className="w-[76px]"></div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer transition-transform duration-300 hover:scale-105">
            <img
              src={textLogo}
              alt="Selasar Logo"
              className="h-16 w-auto object-contain"
            />
          </div>
          <Link to="/settings" className="outline-none group">
            <div className="w-[76px] h-[34px] bg-[#594A42] rounded-full p-1 relative flex items-center justify-end shadow-inner transition-all duration-300 ease-out group-hover:bg-[#433731]">
              <div className="w-[26px] h-[26px] bg-[#EBE7DF] rounded-full flex items-center justify-center shadow-md text-[#594A42] transition-all duration-300 ease-out group-hover:bg-white group-hover:scale-110">
                <FaCog
                  size={14}
                  className="animate-[spin_6s_linear_infinite] group-hover:animate-none"
                />
              </div>
            </div>
          </Link>
        </nav>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 flex flex-col items-center">
          <div
            className={`text-center mb-6 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isTransitioning ? "opacity-0 -translate-y-4" : "opacity-100"
            }`}
          >
            <p className="text-[#8B6B4F] dark:text-[#C4A876] text-xs font-bold uppercase tracking-[0.2em] mb-2">
              {greeting}
            </p>
            <h1
              key={headingIndex}
              className="text-2xl md:text-[1.75rem] font-bold text-[#594A42] dark:text-[#F5F2EB] leading-snug animate-fade-in-hint min-h-[2.5rem] md:min-h-[3.5rem]"
            >
              {headingTexts[headingIndex]}
            </h1>
          </div>

          <div
            onClick={() => handleNavigate("/map")}
            className={`w-full h-[280px] cursor-pointer relative group overflow-hidden rounded-[2.5rem] border border-gray-200 dark:border-[#3D342D] shadow-md transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isTransitioning
                ? "opacity-0 scale-[0.98] blur-sm"
                : "opacity-100 scale-100"
            }`}
          >
            <iframe
              title="Map Area"
              src="https://www.openstreetmap.org/export/embed.html?bbox=106.75%2C-6.25%2C106.85%2C-6.15&layer=mapnik"
              className="w-full h-full border-0 grayscale-[70%] contrast-[1.1] brightness-[0.9] dark:brightness-[0.6] transition-all duration-500 group-hover:grayscale-0 group-hover:brightness-100"
              style={{ pointerEvents: "none" }}
            ></iframe>

            <div className="absolute top-6 left-6 flex items-center gap-2 bg-[#EBE7DF]/80 dark:bg-[#2A2521]/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/50 dark:border-[#3D342D] shadow-sm">
              <div className="w-2 h-2 rounded-full bg-[#594A42] dark:bg-[#C4A876] animate-pulse"></div>
              <span className="text-[#594A42] dark:text-[#F5F2EB] text-xs font-bold uppercase tracking-widest">
                Eksplor Peta
              </span>
            </div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <div className="w-4 h-4 bg-[#594A42] dark:bg-[#C4A876] rounded-full border-2 border-white dark:border-[#2A2521] shadow-lg animate-pulse"></div>
                <div className="absolute -inset-2 bg-[#594A42]/20 dark:bg-[#C4A876]/20 rounded-full animate-ping"></div>
              </div>
            </div>
          </div>

          <div
            className={`w-full mt-8 mb-2 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] delay-75 ${
              isTransitioning ? "opacity-0 translate-y-4" : "opacity-100"
            }`}
          >
            <div
              ref={carouselRef}
              onMouseDown={onDragStart}
              onMouseUp={onDragEnd}
              onMouseLeave={onDragEnd}
              onMouseMove={onDragMove}
              onScroll={handleCarouselScroll}
              onTouchStart={onDragStart}
              onTouchEnd={onDragEnd}
              onTouchMove={onDragMove}
              className="flex overflow-x-auto hide-scrollbar gap-4 pb-4 cursor-grab active:cursor-grabbing"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  onClick={() => handleBannerClick(banner)}
                  className="min-w-[85%] sm:min-w-[70%] md:min-w-[45%] lg:min-w-[40%] relative h-48 md:h-52 rounded-3xl overflow-hidden shadow-md group shrink-0"
                >
                  <img
                    src={banner.image}
                    alt={banner.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none"
                    draggable="false"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 p-5 w-full pointer-events-none">
                    <h3 className="text-white font-bold text-lg md:text-xl mb-1 drop-shadow-md leading-tight">
                      {banner.title}
                    </h3>
                    <p className="text-gray-200 text-xs md:text-sm font-medium drop-shadow-md line-clamp-1">
                      {banner.subtitle}
                    </p>
                  </div>
                  <div className="absolute top-4 left-4 bg-red-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Promo
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-2 mb-6">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToSlide(i)}
                  aria-label={`Ke promo ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeSlide === i
                      ? "w-6 bg-[#594A42] dark:bg-[#C4A876]"
                      : "w-1.5 bg-[#594A42]/30 dark:bg-[#C4A876]/30 hover:bg-[#594A42]/50 dark:hover:bg-[#C4A876]/50"
                  }`}
                />
              ))}
            </div>
          </div>

          <div
            onClick={() => handleNavigate("/searching")}
            className={`flex w-full max-w-[480px] relative shadow-lg rounded-full bg-[#fdfcfa] dark:bg-[#2A2521] border border-gray-300 dark:border-[#3D342D] h-14 cursor-text transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isTransitioning
                ? "scale-[1.1] -translate-y-[300px] opacity-100 z-50 border-[#594A42] dark:border-[#C4A876]"
                : "hover:shadow-xl hover:-translate-y-1 z-10"
            }`}
          >
            <div className="flex-1 relative flex items-center px-6 overflow-hidden rounded-l-full cursor-pointer">
              <span
                key={hintIndex}
                className="text-sm text-gray-400 dark:text-gray-500 font-medium animate-fade-in-hint whitespace-nowrap"
              >
                {searchHints[hintIndex]}
              </span>
            </div>
            <button className="w-16 bg-[#E5DFCF] dark:bg-[#3D342D] border-l border-gray-300 dark:border-[#3D342D] rounded-r-full flex items-center justify-center hover:bg-[#d5cebd] dark:hover:bg-[#453a32] transition-colors active:bg-[#c4bcab] dark:active:bg-[#332C27]">
              <svg
                className="w-5 h-5 text-gray-700 dark:text-gray-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>

          {/* MENU FILTER EXPANDABLE */}
          <div
            className={`flex justify-center items-center mt-10 mb-6 transition-all duration-500 ease-in-out delay-150 ${
              isTransitioning
                ? "opacity-0 translate-y-10"
                : "opacity-100 translate-y-0"
            }`}
          >
            <div className="flex items-center bg-[#fdfcfa] dark:bg-[#2A2521] rounded-full shadow-md border border-gray-200 dark:border-[#3D342D] p-1.5 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:shadow-lg">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`shrink-0 flex items-center justify-center gap-2 h-11 px-6 rounded-full font-bold text-sm shadow-sm transition-all duration-300 active:scale-95 z-10 ${
                  isFilterOpen
                    ? "bg-[#EFE7E2] dark:bg-[#3D342D] text-[#594A42] dark:text-[#F5F2EB] hover:bg-[#EBE7DF] dark:hover:bg-[#453a32]"
                    : "bg-[#594A42] text-white hover:bg-[#433731]"
                }`}
              >
                {isFilterOpen ? <FaTimes size={12} /> : <FaFilter size={12} />}
                <span className="w-[38px] text-left">
                  {isFilterOpen ? "Tutup" : "Filter"}
                </span>
              </button>

              <div
                className={`grid transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isFilterOpen
                    ? "grid-cols-[1fr] opacity-100 ml-2"
                    : "grid-cols-[0fr] opacity-0 ml-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="flex items-center gap-2 w-max pr-1">
                    <button
                      onClick={() => setActiveFilter("Show Everything")}
                      className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 active:scale-95 ${
                        activeFilter === "Show Everything"
                          ? "bg-[#594A42] text-white shadow-md"
                          : "bg-transparent text-[#594A42] dark:text-[#C4A876] hover:bg-[#F5F2EB] dark:hover:bg-[#332C27]"
                      }`}
                    >
                      Show Everything
                    </button>

                    {["Jakarta", "Bogor", "Bandung"].map((city) => (
                      <button
                        key={city}
                        onClick={() => setActiveFilter(city)}
                        className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 active:scale-95 border ${
                          activeFilter === city
                            ? "bg-[#594A42] text-white border-transparent shadow-md"
                            : "bg-transparent text-[#594A42] dark:text-[#C4A876] border-gray-300 dark:border-[#3D342D] hover:bg-[#F5F2EB] dark:hover:bg-[#332C27] hover:border-[#594A42] dark:hover:border-[#C4A876]"
                        }`}
                      >
                        {city}
                      </button>
                    ))}

                    <div className="w-px h-6 bg-gray-300 dark:bg-[#3D342D] mx-1 shrink-0" />

                    <button
                      onClick={() => setShowFavoritesOnly((v) => !v)}
                      className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 active:scale-95 border flex items-center gap-2 ${
                        showFavoritesOnly
                          ? "bg-[#8B6B4F] text-white border-transparent shadow-md"
                          : "bg-transparent text-[#8B6B4F] dark:text-[#C4A876] border-gray-300 dark:border-[#3D342D] hover:bg-[#F5F2EB] dark:hover:bg-[#332C27] hover:border-[#8B6B4F] dark:hover:border-[#C4A876]"
                      }`}
                    >
                      <FaBookmark size={12} />
                      Favorit{favorites.size > 0 ? ` (${favorites.size})` : ""}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* GRID DAFTAR TEMPAT */}
        <div
          className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-500 ease-in-out delay-200 ${
            isTransitioning
              ? "opacity-0 translate-y-12"
              : "opacity-100 translate-y-0"
          }`}
        >
          {filteredPlaces.length > 0 && (
            <p className="text-sm text-[#8B6B4F] dark:text-[#C4A876] font-medium mb-4">
              Menampilkan {filteredPlaces.length} tempat
              {activeFilter !== "Show Everything" ? ` di ${activeFilter}` : ""}
              {showFavoritesOnly ? " yang kamu favoritkan" : ""}
            </p>
          )}

          {filteredPlaces.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredPlaces.map((place, index) => (
                <RevealOnScroll key={place.id} delay={(index % 3) * 100}>
                  <div
                    onClick={() => handleSelectPlace(place)}
                    className="bg-white dark:bg-[#2A2521] rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden border border-gray-100 dark:border-[#3D342D] flex flex-col cursor-pointer group"
                  >
                    <div className="h-48 overflow-hidden relative">
                      <img
                        src={place.image}
                        alt={place.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute top-4 left-4 bg-white/90 dark:bg-[#2A2521]/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold text-[#594A42] dark:text-[#F5F2EB] shadow-sm uppercase tracking-wider">
                        {place.city}
                      </div>

                      <button
                        onClick={(e) => toggleFavorite(e, place.id)}
                        aria-label={
                          favorites.has(place.id)
                            ? "Hapus dari favorit"
                            : "Simpan ke favorit"
                        }
                        className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center shadow-sm backdrop-blur-sm transition-all duration-300 active:scale-90 ${
                          favorites.has(place.id)
                            ? "bg-[#8B6B4F] text-white"
                            : "bg-white/90 dark:bg-[#2A2521]/90 text-gray-400 dark:text-gray-400 hover:text-[#8B6B4F] dark:hover:text-[#C4A876]"
                        }`}
                      >
                        <FaBookmark size={13} />
                      </button>

                      <div className="absolute top-14 right-4 bg-white/90 dark:bg-[#2A2521]/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-green-800 dark:text-green-400 flex items-center gap-1 shadow-sm">
                        🔌 {place.colokanProbability}
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800 dark:text-[#F5F2EB] group-hover:text-[#594A42] dark:group-hover:text-[#C4A876] transition-colors">
                            {place.name}
                          </h3>
                          <p className="text-sm text-green-700 dark:text-green-400 font-medium mt-0.5">
                            {place.overthinkingStatus}
                          </p>
                        </div>
                        <span className="bg-[#EBE7DF] dark:bg-[#1F1B18] text-[#594A42] dark:text-[#C4A876] text-xs px-2.5 py-1.5 rounded-lg font-bold shadow-sm whitespace-nowrap">
                          {place.mood}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm text-gray-600 dark:text-gray-300 mt-auto bg-gray-50 dark:bg-[#1F1B18] p-4 rounded-2xl group-hover:bg-[#F5F2EB] dark:group-hover:bg-[#332C27] transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🔊</span>{" "}
                          <span className="font-medium">
                            {place.noiseLevel}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📶</span>{" "}
                          <span className="font-medium">
                            {place.wifiStatus}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 col-span-2 border-t border-gray-200 dark:border-[#3D342D] pt-2 mt-1">
                          <span className="text-lg">👥</span>{" "}
                          <span className="font-medium">
                            {place.visitors} Orang lagi nugas
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-6 bg-white/40 dark:bg-[#2A2521]/40 rounded-3xl border-2 border-dashed border-[#D5D0C5] dark:border-[#3D342D]">
              <div className="text-5xl mb-4">
                {showFavoritesOnly ? "🔖" : "🔍"}
              </div>
              <h3 className="text-lg font-bold text-[#594A42] dark:text-[#F5F2EB] mb-2 text-center">
                {showFavoritesOnly
                  ? "Belum ada tempat favorit"
                  : "Belum ada tempat yang cocok"}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center max-w-xs">
                {showFavoritesOnly
                  ? "Tap ikon bookmark di kartu tempat buat nyimpen spot andalan kamu."
                  : "Coba ubah filter kota, atau lihat semua tempat yang tersedia."}
              </p>
              <button
                onClick={resetFilters}
                className="px-6 py-2.5 bg-[#594A42] text-white rounded-full text-sm font-semibold hover:bg-[#433731] active:scale-95 transition-all shadow-sm"
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedPlace && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#445234]/40 backdrop-blur-sm transition-opacity duration-300 px-4"
          onClick={() => setSelectedPlace(null)}
        >
          <div
            className="bg-white dark:bg-[#2A2521] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row w-full max-w-4xl animate-scale-in relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPlace(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/80 dark:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-[#EFE7E2] dark:hover:bg-[#3D342D] hover:text-[#8B6B4F] dark:hover:text-[#C4A876] hover:rotate-90 transition-all duration-300 shadow-sm"
            >
              <FaTimes size={18} />
            </button>
            <div className="w-full md:w-[45%] h-[250px] md:h-auto overflow-hidden relative">
              <img
                src={selectedPlace.image}
                alt={selectedPlace.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h2 className="text-3xl font-bold text-[#5E4B45] dark:text-[#F5F2EB]">
                    {selectedPlace.name}
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 font-medium mb-4">
                  {selectedPlace.overthinkingStatus}
                </div>

                {selectedPlace.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
                    {selectedPlace.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-4 md:gap-5 mt-4 text-sm text-[#5E4B45] dark:text-[#F5F2EB]">
                  <div className="bg-[#F4EFE8] dark:bg-[#1F1B18] p-4 rounded-2xl">
                    <p className="font-bold flex items-center gap-2 mb-1 text-gray-500 dark:text-gray-400">
                      <FaPlug className="text-[#8B6B4F] dark:text-[#C4A876]" />{" "}
                      Colokan
                    </p>
                    <p className="font-semibold">
                      {selectedPlace.colokanProbability}
                    </p>
                  </div>
                  <div className="bg-[#F4EFE8] dark:bg-[#1F1B18] p-4 rounded-2xl">
                    <p className="font-bold flex items-center gap-2 mb-1 text-gray-500 dark:text-gray-400">
                      <FaWifi className="text-[#8B6B4F] dark:text-[#C4A876]" />{" "}
                      WiFi
                    </p>
                    <p className="font-semibold">{selectedPlace.wifiStatus}</p>
                  </div>
                  <div className="bg-[#F4EFE8] dark:bg-[#1F1B18] p-4 rounded-2xl">
                    <p className="font-bold flex items-center gap-2 mb-1 text-gray-500 dark:text-gray-400">
                      🔊 Suasana
                    </p>
                    <p className="font-semibold">{selectedPlace.noiseLevel}</p>
                  </div>
                  <div className="bg-[#F4EFE8] dark:bg-[#1F1B18] p-4 rounded-2xl">
                    <p className="font-bold flex items-center gap-2 mb-1 text-gray-500 dark:text-gray-400">
                      <FaUsers className="text-[#8B6B4F] dark:text-[#C4A876]" />{" "}
                      Kepadatan
                    </p>
                    <p className="font-semibold">
                      {selectedPlace.visitors} Orang
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-[#3D342D] flex flex-col sm:flex-row justify-between items-center gap-4">
                <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-[#594A42] text-white rounded-xl font-bold hover:bg-[#433731] active:scale-95 transition-all shadow-md hover:shadow-lg">
                  <FaLocationArrow /> Rute ke Sini
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedBanner && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#445234]/60 backdrop-blur-md transition-opacity duration-300 px-4"
          onClick={() => setSelectedBanner(null)}
        >
          <div
            className="bg-white dark:bg-[#2A2521] rounded-3xl shadow-2xl overflow-hidden w-full max-w-lg animate-scale-in relative flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedBanner(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/70 hover:rotate-90 transition-all duration-300 shadow-sm"
            >
              <FaTimes size={18} />
            </button>
            <div className="w-full h-56 sm:h-64 overflow-hidden relative">
              <img
                src={selectedBanner.image}
                alt={selectedBanner.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-black/60 to-transparent"></div>
            </div>
            <div className="p-6 md:p-8 flex flex-col flex-1 bg-[#fdfcfa] dark:bg-[#2A2521]">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <FaTag size={10} /> Penawaran Spesial
                </span>
                <span className="text-[#8B6B4F] dark:text-[#C4A876] text-xs font-bold border border-[#8B6B4F] dark:border-[#C4A876] px-3 py-1 rounded-full">
                  {selectedBanner.brand}
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#594A42] dark:text-[#F5F2EB] mb-2 leading-tight">
                {selectedBanner.title}
              </h2>
              <p className="text-[#8B6B4F] dark:text-[#C4A876] font-bold text-sm md:text-base mb-4">
                {selectedBanner.subtitle}
              </p>
              <div className="bg-[#EBE7DF] dark:bg-[#1F1B18] p-5 rounded-2xl mb-6">
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed font-medium">
                  {selectedBanner.detail}
                </p>
              </div>
              <button
                onClick={() => setSelectedBanner(null)}
                className="w-full py-4 bg-[#594A42] text-white rounded-xl font-bold hover:bg-[#433731] active:scale-95 transition-all shadow-lg hover:shadow-xl mt-auto"
              >
                Mengerti, Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
