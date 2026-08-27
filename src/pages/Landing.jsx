import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import textLogo from "../assets/text-logo.png";
import Daun from "../assets/Daun.png";
import DaunBawah from "../assets/Daun_half.png";
import { placesData } from "../data/place";
import {
  FaPlug,
  FaWifi,
  FaUsers,
  FaMapMarkerAlt,
  FaBookmark,
  FaArrowRight,
  FaQuoteLeft,
  FaBars,
  FaTimes,
  FaSun,
  FaMoon,
  FaSearch,
  FaStar,
  FaChevronDown,
  FaClock,
} from "react-icons/fa";

const features = [
  {
    icon: FaPlug,
    title: "Cek Colokan Real-time",
    desc: "Nggak perlu tebak-tebakan lagi. Tiap spot punya info seberapa gampang cari colokan sebelum kamu berangkat.",
  },
  {
    icon: FaWifi,
    title: "WiFi Speed Check",
    desc: "Dari 'ngebut' sampai 'lemot parah', tiap tempat udah dikasih rating WiFi biar meeting online kamu gak nge-lag.",
  },
  {
    icon: FaUsers,
    title: "Suasana & Kepadatan",
    desc: "Mau yang sepi buat fokus atau yang rame buat healing? Lihat mood dan jumlah orang yang lagi nugas di sana.",
  },
  {
    icon: FaMapMarkerAlt,
    title: "Peta Interaktif",
    desc: "Jelajahi spot terdekat langsung dari peta, lengkap sama rute dan jarak dari lokasi kamu sekarang.",
  },
];

const steps = [
  {
    number: "01",
    title: "Cari Spot",
    desc: "Ketik lokasi, mood, atau kebutuhan kamu seperti: 'tenang buat fokus' atau 'colokan banyak'.",
  },
  {
    number: "02",
    title: "Bandingkan",
    desc: "Selasar menyaring tempat paling pas berdasarkan kecepatan WiFi, suasana, dan kepadatan.",
  },
  {
    number: "03",
    title: "Mulai Nugas",
    desc: "Tinggal berangkat, pilih meja favorit, dan selesaikan project-mu tanpa kendala.",
  },
];

const testimonials = [
  {
    name: "Qonita P.",
    role: "Mahasiswa Teknik Informatika",
    quote:
      "Selasar nyelametin skripsi gw! Tinggal buka, langsung ketemu tempat sepi dengan colokan di tiap meja.",
  },
  {
    name: "Andra",
    role: "Freelance Designer",
    quote:
      "Suka banget fitur cek WiFi-nya. Gak ada lagi drama meeting client putus-putus gara-gara salah pilih cafe.",
  },
  {
    name: "Malaka",
    role: "Mahasiswa Manajemen",
    quote:
      "Filter suasananya ngebantu banget buat yang gampang keganggu. Sekali coba langsung jadi rutinitas nugas gw.",
  },
];

const faqs = [
  {
    q: "Apakah data ketersediaan colokan & WiFi selalu akurat?",
    a: "Ya, data kami diperbarui secara konstan melalui kontribusi komunitas real-time dan verifikasi berkala dari tim Selasar.",
  },
  {
    q: "Apakah layanan Selasar ini gratis?",
    a: "100% Gratis untuk pencarian spot, cek fasilitas, dan melihat review dari sesama pengguna.",
  },
  {
    q: "Bisakah saya mendaftarkan cafe/space milik sendiri?",
    a: "Tentu! Setelah mendaftar akun, kamu bisa mengajukan penambahan lokasi baru melalui menu 'Tambah Spot'.",
  },
];

function RevealOnScroll({ children, delay = 0, className = "" }) {
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
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
        visible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-10 scale-95"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default function Landing() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [openFaq, setOpenFaq] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const categories = ["Semua", "Quiet Zone", "Buka 24 Jam", "Cafe Aesthetic"];
  const previewPlaces = placesData.slice(0, 3);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme) {
        return savedTheme === "dark";
      }
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      className={`relative min-h-screen bg-[#EBE7DF] dark:bg-[#1F1B18] overflow-x-hidden font-sans transition-colors duration-500 ${
        isLoaded ? "opacity-100" : "opacity-0"
      }`}
    >
      <style>{`
        @keyframes floatGlow {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); }
          50% { transform: translate3d(18px, -24px, 0) scale(1.08) rotate(6deg); }
        }
        @keyframes floatLeaf {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
          50% { transform: translate3d(-10px, 14px, 0) rotate(-6deg); }
        }
        .animate-glow-float {
          animation: floatGlow 12s ease-in-out infinite alternate;
          will-change: transform;
        }
        .animate-leaf-float {
          animation: floatLeaf 8s ease-in-out infinite alternate;
          will-change: transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-glow-float, .animate-leaf-float { animation: none; }
        }
      `}</style>

      {/* AMBIENT BACKGROUND GLOWS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-1000 select-none">
        <div className="absolute -top-28 -left-20 w-[30rem] h-[30rem] bg-gradient-to-br from-[#D9B382]/30 to-transparent dark:from-[#D9B382]/10 rounded-full blur-3xl animate-glow-float" />
        <div className="absolute top-1/4 -right-24 w-[28rem] h-[28rem] bg-gradient-to-bl from-[#594A42]/15 to-transparent dark:from-[#594A42]/30 rounded-full blur-3xl animate-glow-float" />
        <div className="absolute bottom-10 left-1/4 w-[24rem] h-[24rem] bg-gradient-to-tr from-[#8B6B4F]/20 to-transparent dark:from-[#8B6B4F]/15 rounded-full blur-3xl animate-glow-float" />
      </div>

      {/* HEADER NAVBAR */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 sm:px-6 pointer-events-none pt-4">
        <header
          className={`pointer-events-auto w-full transition-all duration-[600ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] relative ${
            scrolled
              ? "max-w-4xl bg-white/75 dark:bg-[#1F1B18]/75 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/50 dark:border-white/10 rounded-full mt-2"
              : "max-w-6xl bg-transparent mt-0 rounded-none border-transparent shadow-none"
          }`}
        >
          <nav
            className={`flex items-center justify-between transition-all duration-[600ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
              scrolled ? "h-16 px-6" : "h-24 px-2 sm:px-4"
            }`}
          >
            {/* Logo */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="hover:scale-105 active:scale-95 transition-transform duration-300 focus:outline-none select-none"
              aria-label="Selasar Home"
            >
              <img
                src={textLogo}
                alt="Selasar"
                className={`w-auto object-contain transition-all duration-500 ${
                  scrolled ? "h-8" : "h-10"
                }`}
              />
            </button>

            {/* Menu Navigasi Desktop */}
            <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#594A42] dark:text-[#F5F2EB]">
              {["Fitur", "Cara Kerja", "Spot Populer", "Testimoni", "FAQ"].map(
                (item) => (
                  <button
                    key={item}
                    onClick={() =>
                      scrollTo(
                        item
                          .toLowerCase()
                          .replace(/\s+/g, "-")
                          .replace("spot-populer", "spot")
                      )
                    }
                    className="relative group hover:text-[#8B6B4F] dark:hover:text-[#C4A876] transition-colors duration-300"
                  >
                    {item}
                    <span className="absolute -bottom-1 left-1/2 w-0 h-0.5 bg-[#8B6B4F] dark:bg-[#C4A876] group-hover:w-full group-hover:left-0 transition-all duration-300 ease-out rounded-full" />
                  </button>
                )
              )}
            </div>

            {/* Tombol Action Desktop */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white/60 hover:bg-white dark:bg-[#2A2521]/60 dark:hover:bg-[#2A2521] text-[#594A42] dark:text-[#F5F2EB] shadow-sm hover:shadow transition-all active:scale-90 border border-white/60 dark:border-[#3D342D] overflow-hidden select-none"
                aria-label="Toggle Dark Mode"
              >
                <div
                  className={`absolute transition-all duration-500 ${
                    isDarkMode
                      ? "opacity-100 rotate-0 scale-100"
                      : "opacity-0 -rotate-90 scale-50 translate-y-8"
                  }`}
                >
                  <FaSun size={16} className="text-amber-400" />
                </div>
                <div
                  className={`absolute transition-all duration-500 ${
                    !isDarkMode
                      ? "opacity-100 rotate-0 scale-100"
                      : "opacity-0 rotate-90 scale-50 -translate-y-8"
                  }`}
                >
                  <FaMoon size={16} />
                </div>
              </button>
              <div className="w-px h-6 bg-gray-300 dark:bg-[#3D342D] mx-1 transition-colors duration-500" />
              <Link
                to="/login"
                className="px-5 py-2.5 rounded-full font-bold text-sm text-[#594A42] dark:text-[#F5F2EB] hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all duration-300 select-none"
              >
                Masuk
              </Link>
              <Link
                to="/register"
                className="px-6 py-2.5 rounded-full font-bold text-sm bg-[#594A42] text-white hover:bg-[#433731] hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-300 select-none"
              >
                Daftar Gratis
              </Link>
            </div>

            {/* Mobile View Toggle */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="relative w-10 h-10 flex items-center justify-center rounded-full bg-[#594A42]/10 dark:bg-white/10 text-[#594A42] dark:text-[#F5F2EB] transition-colors active:scale-90 select-none"
                aria-label="Toggle Dark Mode Mobile"
              >
                {isDarkMode ? (
                  <FaSun size={16} className="text-amber-400" />
                ) : (
                  <FaMoon size={16} />
                )}
              </button>
              <button
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-[#594A42]/10 dark:bg-white/10 text-[#594A42] dark:text-[#F5F2EB] transition-colors active:scale-90 select-none"
                aria-label="Open Navigation Menu"
              >
                {mobileMenuOpen ? <FaTimes size={16} /> : <FaBars size={16} />}
              </button>
            </div>
          </nav>

          {/* Floating Mobile Menu */}
          <div
            className={`absolute top-full left-0 right-0 mt-3 mx-2 md:hidden overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform origin-top ${
              mobileMenuOpen
                ? "opacity-100 scale-y-100 pointer-events-auto shadow-2xl"
                : "opacity-0 scale-y-0 pointer-events-none"
            }`}
          >
            <div className="bg-white/95 dark:bg-[#2A2521]/95 backdrop-blur-2xl rounded-3xl border border-white/50 dark:border-[#3D342D] p-6 flex flex-col gap-3 shadow-xl">
              {["Fitur", "Cara Kerja", "Spot Populer", "Testimoni", "FAQ"].map(
                (item) => (
                  <button
                    key={item}
                    onClick={() =>
                      scrollTo(
                        item
                          .toLowerCase()
                          .replace(/\s+/g, "-")
                          .replace("spot-populer", "spot")
                      )
                    }
                    className="text-left font-bold text-[#594A42] dark:text-[#F5F2EB] p-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors"
                  >
                    {item}
                  </button>
                )
              )}
              <div className="h-px bg-gray-200 dark:bg-[#3D342D] my-1" />
              <Link
                to="/login"
                className="text-center font-bold text-[#594A42] dark:text-[#F5F2EB] py-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors select-none"
              >
                Masuk
              </Link>
              <Link
                to="/register"
                className="text-center font-bold bg-[#594A42] text-white py-3.5 rounded-2xl active:scale-95 transition-transform shadow-md select-none"
              >
                Daftar Gratis
              </Link>
            </div>
          </div>
        </header>
      </div>

      <main className="relative z-10 pt-20">
        {/* HERO SECTION */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-20 grid md:grid-cols-2 gap-12 items-center">
          <RevealOnScroll>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 dark:bg-[#2A2521]/70 backdrop-blur-sm border border-white/50 dark:border-[#3D342D] mb-6 shadow-sm select-none">
              {/* <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> */}
              <p className="text-[#8B6B4F] dark:text-[#C4A876] text-xs font-bold uppercase tracking-widest">
                Study &amp; Coworking Space Finder
              </p>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#594A42] dark:text-[#F5F2EB] leading-[1.15] mb-6 tracking-tight">
              Temukan Sudut Nugas yang Pas, Kapan Aja
            </h1>
            {/* QUICK SEARCH BAR */}
            <div className="bg-white dark:bg-[#2A2521] p-2 sm:p-2.5 rounded-full shadow-xl border border-white/60 dark:border-[#3D342D] flex items-center gap-2 mb-8 transition-all hover:shadow-2xl">
              <div className="pl-4 text-gray-400 select-none">
                <FaSearch size={18} />
              </div>
              <input
                type="text"
                placeholder="Cari spot di Jakarta, Bandung, Depok..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-[#594A42] dark:text-[#F5F2EB] placeholder-gray-400 focus:outline-none"
              />
              <Link
                to="/register"
                className="shrink-0 px-6 py-3 bg-[#594A42] text-white font-bold text-sm rounded-full hover:bg-[#433731] transition-all duration-300 shadow-md flex items-center gap-2 select-none"
              >
                <span>Cari</span>
                <FaArrowRight size={12} />
              </Link>
            </div>

            {/* Quick Mood Pills */}
            <div className="flex flex-wrap items-center gap-2 mb-10 text-xs font-semibold text-[#8B6B4F] dark:text-[#C4A876] select-none">
              <span className="text-gray-400 font-medium">Populer:</span>
              {["Stopkontak 100%", "WiFi Fast", "Hening"].map((pill) => (
                <button
                  key={pill}
                  onClick={() => setSearchQuery(pill)}
                  className="px-3 py-1.5 rounded-full bg-white/50 dark:bg-[#2A2521]/50 border border-white/40 dark:border-[#3D342D] hover:bg-white dark:hover:bg-[#2A2521] transition-colors"
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* STATISTIK */}
            <div className="flex items-center gap-8 border-t border-[#594A42]/10 dark:border-white/10 pt-8 select-none">
              {[
                { label: "Spot Terverifikasi", val: "500+" },
                { label: "Kota Aktif", val: "12+" },
                { label: "Sesi Nugas", val: "10rb+" },
              ].map((stat, i) => (
                <div key={i} className="group cursor-default">
                  <p className="text-2xl sm:text-3xl font-extrabold text-[#594A42] dark:text-[#F5F2EB] group-hover:scale-105 group-hover:text-[#8B6B4F] transition-all">
                    {stat.val}
                  </p>
                  <p className="text-xs text-[#8B6B4F] dark:text-[#C4A876] font-semibold mt-0.5">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </RevealOnScroll>

          {/* HERO IMAGE SHOWCASE */}
          <RevealOnScroll delay={150} className="relative mt-4 md:mt-0">
            <img
              src={Daun}
              alt=""
              aria-hidden="true"
              className="hidden sm:block absolute -top-12 -right-8 sm:-top-14 sm:-right-10 w-28 sm:w-36 opacity-85 pointer-events-none select-none drop-shadow-lg z-20 animate-leaf-float"
            />

            <div className="relative rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-xl border-4 border-white/70 dark:border-[#3D342D]/80 aspect-[4/3] group z-10">
              <img
                src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80"
                alt="Suasana Kopi Karsa & Space"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute bottom-10 left-5 right-5 sm:left-6 sm:right-6 text-white z-10">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-emerald-500/90 text-[10px] font-bold uppercase tracking-wider rounded-md backdrop-blur-sm">
                    Verified Spot
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-300">
                    <FaStar size={11} /> 4.9 (120+ ulasan)
                  </span>
                </div>
                <h4 className="text-lg sm:text-xl font-extrabold text-white drop-shadow-sm">
                  Kopi Karsa &amp; Space
                </h4>
                <p className="text-xs text-gray-200 font-medium mt-0.5">
                  Jakarta Selatan • 1.2 km dari lokasi kamu
                </p>
              </div>
            </div>

            <div className="absolute -bottom-5 right-3 sm:-bottom-6 sm:-right-6 bg-white/95 dark:bg-[#2A2521]/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/80 dark:border-[#3D342D] px-4 py-2.5 sm:px-5 sm:py-3 flex items-center gap-3 hover:-translate-y-1 transition-all duration-300 z-20 select-none cursor-default">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <FaPlug size={16} className="animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                  Update Live
                </p>
                <p className="text-xs sm:text-sm font-extrabold text-[#594A42] dark:text-[#F5F2EB]">
                  95% Colokan Kosong
                </p>
              </div>
            </div>

            <img
              src={DaunBawah}
              alt=""
              aria-hidden="true"
              className="hidden sm:block absolute -bottom-8 -left-8 w-24 sm:w-32 opacity-80 pointer-events-none select-none rotate-180 z-0 animate-leaf-float"
            />
          </RevealOnScroll>
        </section>

        {/* FITUR UNGGULAN */}
        <section id="fitur" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <RevealOnScroll className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#594A42] dark:text-[#F5F2EB] mb-4">
              Semua yang Kamu Perlu Tahu,<br />Sebelum Berangkat
            </h2>
            <div className="w-20 h-1.5 bg-[#8B6B4F] dark:bg-[#C4A876] rounded-full mx-auto" />
          </RevealOnScroll>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <RevealOnScroll key={f.title} delay={i * 100}>
                <div className="group h-full bg-white/60 dark:bg-[#2A2521]/60 backdrop-blur-sm rounded-3xl p-8 shadow-sm hover:shadow-2xl hover:bg-white dark:hover:bg-[#2A2521] transition-all duration-500 hover:-translate-y-2 border border-white/50 dark:border-[#3D342D]/50 relative overflow-hidden">
                  <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#D9B382]/10 rounded-full blur-2xl group-hover:bg-[#D9B382]/30 transition-colors" />
                  <div className="w-14 h-14 rounded-2xl bg-[#EBE7DF] dark:bg-[#1F1B18] text-[#8B6B4F] dark:text-[#C4A876] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 select-none">
                    <f.icon size={24} />
                  </div>
                  <h3 className="font-extrabold text-lg text-[#594A42] dark:text-[#F5F2EB] mb-3">
                    {f.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                    {f.desc}
                  </p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </section>

        {/* CARA KERJA */}
        <section id="cara-kerja" className="py-24 my-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#D9B382]/10 to-transparent dark:via-[#D9B382]/5 select-none pointer-events-none" />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <RevealOnScroll className="text-center max-w-xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#594A42] dark:text-[#F5F2EB] mb-4">
                Tiga Langkah, Langsung Nugas
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Alur cepat dari rebahan sampai produktif di meja favoritmu.
              </p>
            </RevealOnScroll>

            <div className="grid md:grid-cols-3 gap-12 relative">
              <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-transparent via-[#8B6B4F]/40 to-transparent border-dashed select-none pointer-events-none" />
              {steps.map((s, i) => (
                <RevealOnScroll key={s.number} delay={i * 150}>
                  <div className="text-center relative group">
                    <div className="w-24 h-24 mx-auto bg-white dark:bg-[#2A2521] rounded-full shadow-lg border-4 border-[#EBE7DF] dark:border-[#1F1B18] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-xl transition-all duration-300 z-10 relative select-none">
                      <span className="text-3xl font-extrabold text-[#8B6B4F] dark:text-[#C4A876]">
                        {s.number}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-[#594A42] dark:text-[#F5F2EB] mb-3">
                      {s.title}
                    </h3>
                    <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed max-w-xs mx-auto font-medium">
                      {s.desc}
                    </p>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* SPOT POPULER */}
        <section id="spot" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <RevealOnScroll className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#594A42] dark:text-[#F5F2EB] mb-2">
                Lagi Rame Dicari Minggu Ini
              </h2>
              <div className="w-16 h-1.5 bg-[#8B6B4F] dark:bg-[#C4A876] rounded-full" />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
                    activeCategory === cat
                      ? "bg-[#594A42] text-white shadow-md"
                      : "bg-white/60 dark:bg-[#2A2521]/60 text-[#594A42] dark:text-[#F5F2EB] hover:bg-white dark:hover:bg-[#2A2521]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {previewPlaces.map((place, i) => (
              <RevealOnScroll key={place.id} delay={i * 100}>
                <div className="bg-white/80 dark:bg-[#2A2521]/80 backdrop-blur-sm rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden border border-white dark:border-[#3D342D] group cursor-pointer flex flex-col h-full">
                  <div className="h-56 overflow-hidden relative">
                    <img
                      src={place.image}
                      alt={place.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                    <div className="absolute top-4 left-4 bg-white/90 dark:bg-[#2A2521]/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-extrabold text-[#594A42] dark:text-[#F5F2EB] shadow-sm uppercase tracking-widest select-none">
                      {place.city}
                    </div>

                    <button
                      className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 dark:bg-[#2A2521]/90 backdrop-blur-md flex items-center justify-center text-gray-400 hover:text-rose-500 hover:scale-110 active:scale-95 transition-all shadow-sm select-none"
                      aria-label="Simpan Tempat"
                    >
                      <FaBookmark size={13} />
                    </button>

                    <div className="absolute bottom-3 left-4 flex items-center gap-2 select-none">
                      <span className="px-2 py-0.5 rounded bg-emerald-500 text-white text-[10px] font-bold">
                        Buka
                      </span>
                      <span className="text-xs font-semibold text-white flex items-center gap-1">
                        <FaClock size={11} /> 08:00 - 22:00
                      </span>
                    </div>
                  </div>

                  <div className="p-6 flex flex-col justify-between flex-1">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-extrabold text-xl text-[#594A42] dark:text-[#F5F2EB] group-hover:text-[#8B6B4F] transition-colors">
                          {place.name}
                        </h3>
                        <div className="flex items-center gap-1 text-xs font-extrabold text-amber-500 select-none">
                          <FaStar size={12} /> 4.8
                        </div>
                      </div>

                      <div className="inline-block px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-md text-xs font-bold mb-4">
                        {place.overthinkingStatus}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300 font-semibold border-t border-gray-100 dark:border-[#3D342D] pt-4 mt-2">
                      <span className="flex items-center gap-1.5">
                        <FaPlug className="text-[#8B6B4F] dark:text-[#C4A876]" size={13} />
                        {place.colokanProbability}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FaWifi className="text-[#8B6B4F] dark:text-[#C4A876]" size={13} />
                        {place.wifiStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>

          <div className="text-center mt-12 select-none">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white dark:bg-[#2A2521] rounded-full text-sm font-extrabold text-[#594A42] dark:text-[#F5F2EB] shadow-md hover:shadow-xl border border-white dark:border-[#3D342D] hover:-translate-y-0.5 transition-all"
            >
              Lihat 500+ Spot Lainnya <FaArrowRight size={12} />
            </Link>
          </div>
        </section>

        {/* TESTIMONI */}
        <section id="testimoni" className="py-24 bg-gradient-to-b from-transparent via-white/40 to-transparent dark:via-black/20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <RevealOnScroll className="text-center max-w-xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#594A42] dark:text-[#F5F2EB] mb-4">
                Ribuan Sesi Nugas Terselamatkan
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Dengarkan apa kata mahasiswa dan freelancer yang udah bebas dari drama mati lampu &amp; WiFi lemot.
              </p>
            </RevealOnScroll>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((t, i) => (
                <RevealOnScroll key={t.name} delay={i * 120}>
                  <div className="h-full bg-white/80 dark:bg-[#2A2521]/80 backdrop-blur-sm rounded-3xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all border border-white dark:border-[#3D342D] flex flex-col justify-between">
                    <div>
                      <div className="w-12 h-12 bg-[#D9B382]/20 rounded-2xl flex items-center justify-center mb-6 text-[#8B6B4F] dark:text-[#C4A876] select-none">
                        <FaQuoteLeft size={18} />
                      </div>
                      <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed mb-8 italic font-medium">
                        "{t.quote}"
                      </p>
                    </div>

                    <div className="flex items-center gap-4 border-t border-gray-100 dark:border-[#3D342D] pt-6">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#8B6B4F] to-[#D9B382] text-white flex items-center justify-center font-bold text-sm shadow-sm select-none">
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-extrabold text-sm text-[#594A42] dark:text-[#F5F2EB]">
                          {t.name}
                        </p>
                        <p className="text-xs text-gray-500 font-semibold mt-0.5">{t.role}</p>
                      </div>
                    </div>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <RevealOnScroll className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#594A42] dark:text-[#F5F2EB] mb-4">
              Sering Ditanyakan (FAQ)
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              Masih ragu? Temukan jawaban cepat untuk pertanyaanmu di sini.
            </p>
          </RevealOnScroll>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <RevealOnScroll key={idx} delay={idx * 80}>
                <div className="bg-white/70 dark:bg-[#2A2521]/70 backdrop-blur-sm rounded-2xl border border-white dark:border-[#3D342D] overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full text-left p-6 font-bold text-[#594A42] dark:text-[#F5F2EB] flex items-center justify-between gap-4 focus:outline-none"
                  >
                    <span>{faq.q}</span>
                    <FaChevronDown
                      className={`shrink-0 transition-transform duration-300 ${
                        openFaq === idx ? "rotate-180 text-[#8B6B4F]" : "text-gray-400"
                      }`}
                    />
                  </button>
                  {openFaq === idx && (
                    <div className="px-6 pb-6 text-sm text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-[#3D342D]/50 pt-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </section>

        {/* CALL TO ACTION */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <RevealOnScroll>
            <div className="relative bg-gradient-to-br from-[#594A42] to-[#382E28] rounded-[2.5rem] sm:rounded-[3rem] px-6 py-16 sm:px-20 text-center overflow-hidden shadow-2xl group cursor-default">
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
                <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-white/5 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
              </div>

              <img
                src={Daun}
                alt=""
                aria-hidden="true"
                className="absolute -top-8 -right-6 w-32 sm:w-40 opacity-15 pointer-events-none select-none z-0 animate-leaf-float"
              />
              <img
                src={DaunBawah}
                alt=""
                aria-hidden="true"
                className="absolute -bottom-6 -left-6 w-28 sm:w-36 opacity-15 pointer-events-none select-none rotate-180 z-0 animate-leaf-float"
              />

              <div className="relative z-10">
                <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-6 tracking-tight">
                  Siap Nugas Tanpa Drama?
                </h2>
                <p className="text-[#D9C7B8] text-base sm:text-lg max-w-lg mx-auto mb-10 font-medium">
                  Daftar gratis sekarang dan langsung temukan spot terbaik yang bikin produktivitas kamu meroket.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center select-none">
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white text-[#594A42] rounded-full font-extrabold text-lg hover:bg-[#F5F2EB] hover:scale-105 active:scale-95 transition-all shadow-xl"
                  >
                    Daftar Sekarang <FaArrowRight size={16} />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-transparent text-white rounded-full font-bold border-2 border-white/30 hover:bg-white/10 active:scale-95 transition-all"
                  >
                    Sudah Punya Akun
                  </Link>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 bg-white/50 dark:bg-[#1F1B18]/50 border-t border-gray-200 dark:border-[#3D342D] mt-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center sm:items-start gap-2">
            <img
              src={textLogo}
              alt="Selasar"
              className="h-8 w-auto object-contain hover:scale-105 transition-transform cursor-pointer select-none"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            />
            <p className="text-xs text-gray-500 font-semibold">
              Tempat nyaman, ide berkembang.
            </p>
          </div>
          <p className="text-xs text-gray-400 font-medium">
            © {new Date().getFullYear()} Selasar. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm font-bold text-[#8B6B4F] dark:text-[#C4A876] select-none">
            {["Fitur", "Testimoni", "FAQ"].map((item) => (
              <button
                key={item}
                onClick={() => scrollTo(item.toLowerCase())}
                className="hover:text-[#594A42] dark:hover:text-[#F5F2EB] transition-colors"
              >
                {item}
              </button>
            ))}
            <Link
              to="/register"
              className="hover:text-[#594A42] dark:hover:text-[#F5F2EB] transition-colors"
            >
              Daftar
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}