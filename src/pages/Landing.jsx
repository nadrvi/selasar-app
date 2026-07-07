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
    title: "Cari",
    desc: "Ketik mood atau kebutuhan kamu seperti: 'tenang buat fokus' atau 'ada colokan banyak'.",
  },
  {
    number: "02",
    title: "Cocokkan",
    desc: "Selasar nyaring spot yang paling pas dari WiFi, colokan, sampai keramaian tempat.",
  },
  {
    number: "03",
    title: "Nugas",
    desc: "Tinggal berangkat, duduk manis, dan selesaikan apa yang perlu diselesaikan.",
  },
];

const testimonials = [
  {
    name: "Raka A.",
    role: "Mahasiswa Teknik Informatika",
    quote:
      "Selasar nyelametin skripsi gw. Tinggal buka, langsung ketemu tempat sepi dengan colokan di tiap meja.",
  },
  {
    name: "Dinda P.",
    role: "Freelance Designer",
    quote:
      "Suka banget fitur cek WiFi-nya. Gak ada lagi drama meeting client putus-putus gara-gara salah pilih cafe.",
  },
  {
    name: "Fajar S.",
    role: "Mahasiswa Manajemen",
    quote:
      "Filter suasananya ngebantu banget buat yang gampang keganggu. Sekali coba langsung jadi rutinitas nugas gw.",
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
        visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-10 scale-95"
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
  const previewPlaces = placesData.slice(0, 3);

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
      className={`relative min-h-screen bg-[#EBE7DF]  overflow-x-hidden font-sans transition-opacity duration-700 ease-out ${
        isLoaded ? "opacity-100" : "opacity-0"
      } select-none`}
    >
      <style>{`
        @keyframes blobFloat {
          0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); }
          33% { transform: translate(30px, -40px) scale(1.1) rotate(10deg); }
          66% { transform: translate(-20px, 20px) scale(0.9) rotate(-5deg); }
        }
        @keyframes blobFloatSlow {
          0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); }
          50% { transform: translate(-30px, 40px) scale(1.15) rotate(15deg); }
        }
        .animate-blob-float { animation: blobFloat 14s infinite alternate cubic-bezier(0.45, 0, 0.55, 1); }
        .animate-blob-float-slow { animation: blobFloatSlow 18s infinite alternate cubic-bezier(0.45, 0, 0.55, 1); }
        @media (prefers-reduced-motion: reduce) {
          .animate-blob-float, .animate-blob-float-slow { animation: none; }
        }
      `}</style>

      {/* AMBIENT BUBBLES */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-28 -left-20 w-[30rem] h-[30rem] bg-gradient-to-br from-[#D9B382]/30 to-[#EBE7DF]/0 dark:from-[#D9B382]/10 rounded-full blur-3xl animate-blob-float" />
        <div className="absolute top-1/4 -right-24 w-[28rem] h-[28rem] bg-gradient-to-bl from-[#594A42]/15 to-transparent dark:from-[#594A42]/30 rounded-full blur-3xl animate-blob-float-slow" />
        <div className="absolute bottom-10 left-1/4 w-[24rem] h-[24rem] bg-gradient-to-tr from-[#8B6B4F]/20 to-transparent dark:from-[#8B6B4F]/15 rounded-full blur-3xl animate-blob-float" />
      </div>

      {/* HEADER FIX & JELLY/BUBBLE EFFECT */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 sm:px-6 pointer-events-none pt-4">
        <header
          className={`pointer-events-auto w-full transition-all duration-[600ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] relative ${
            scrolled
              ? "max-w-4xl bg-white/70 dark:bg-[#1F1B18]/70 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/40 dark:border-white/10 rounded-full mt-2"
              : "max-w-6xl bg-transparent mt-0 rounded-none border-transparent shadow-none"
          }`}
        >
          <nav
            className={`flex items-center justify-between transition-all duration-[600ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
              scrolled ? "h-16 px-6" : "h-24 px-2 sm:px-4"
            }`}
          >
            {/* Logo dengan hover membal */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="hover:scale-105 active:scale-95 transition-transform duration-300"
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
              {["Fitur", "Cara Kerja", "Spot Populer", "Testimoni"].map((item) => (
                <button
                  key={item}
                  onClick={() =>
                    scrollTo(
                      item.toLowerCase().replace(" ", "-").replace("spot-populer", "spot")
                    )
                  }
                  className="relative group hover:text-[#8B6B4F] dark:hover:text-[#C4A876] transition-colors duration-300"
                >
                  {item}
                  <span className="absolute -bottom-1 left-1/2 w-0 h-0.5 bg-[#8B6B4F] dark:bg-[#C4A876] group-hover:w-full group-hover:left-0 transition-all duration-300 ease-out rounded-full" />
                </button>
              ))}
            </div>

            {/* Tombol Auth Desktop */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/login"
                className="px-5 py-2.5 rounded-full font-bold text-sm text-[#594A42] dark:text-[#F5F2EB] hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all duration-300"
              >
                Masuk
              </Link>
              <Link
                to="/register"
                className="px-6 py-2.5 rounded-full font-bold text-sm bg-[#594A42] text-white hover:bg-[#433731] hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
              >
                Daftar Gratis
              </Link>
            </div>

            {/* Hamburger Button (Mobile) */}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-full bg-[#594A42]/5 hover:bg-[#594A42]/10 dark:bg-white/5 text-[#594A42] dark:text-[#F5F2EB] transition-colors active:scale-90"
            >
              {mobileMenuOpen ? <FaTimes size={16} /> : <FaBars size={16} />}
            </button>
          </nav>

          {/* Floating Mobile Menu */}
          <div
            className={`absolute top-full left-0 right-0 mt-4 mx-4 md:hidden overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform origin-top ${
              mobileMenuOpen
                ? "opacity-100 scale-y-100 pointer-events-auto shadow-2xl"
                : "opacity-0 scale-y-0 pointer-events-none"
            }`}
          >
            <div className="bg-white/90 dark:bg-[#2A2521]/90 backdrop-blur-2xl rounded-3xl border border-white/50 dark:border-[#3D342D] p-6 flex flex-col gap-4">
              {["Fitur", "Cara Kerja", "Spot Populer", "Testimoni"].map((item) => (
                <button
                  key={item}
                  onClick={() =>
                    scrollTo(
                      item.toLowerCase().replace(" ", "-").replace("spot-populer", "spot")
                    )
                  }
                  className="text-left font-bold text-[#594A42] dark:text-[#F5F2EB] p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors"
                >
                  {item}
                </button>
              ))}
              <div className="h-px bg-gray-200 dark:bg-[#3D342D] my-2" />
              <Link
                to="/login"
                className="text-center font-bold text-[#594A42] dark:text-[#F5F2EB] py-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors"
              >
                Masuk
              </Link>
              <Link
                to="/register"
                className="text-center font-bold bg-[#594A42] text-white py-4 rounded-2xl active:scale-95 transition-transform"
              >
                Daftar Gratis
              </Link>
            </div>
          </div>
        </header>
      </div>

      <main className="relative z-10 pt-20">
        {/* HERO */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-20 grid md:grid-cols-2 gap-12 items-center">
          <RevealOnScroll>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-[#2A2521]/60 backdrop-blur-sm border border-white/50 dark:border-[#3D342D] mb-6 shadow-sm">
              <p className="text-[#8B6B4F] dark:text-[#C4A876] text-xs font-bold uppercase tracking-widest">
                Study &amp; Coworking Space Finder
              </p>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#594A42] dark:text-[#F5F2EB] leading-[1.15] mb-6 tracking-tight">
              Temukan Sudut Nugas yang Pas, Kapan Aja
            </h1>
            <p className="text-base sm:text-lg text-[#7D7063] dark:text-gray-300 leading-relaxed mb-8 max-w-md">
              Selasar bantu kamu nemuin cafe, ruang coworking, sampai perpustakaan
              terdekat — lengkap dengan info colokan, WiFi, dan suasana.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#594A42] text-white rounded-full font-bold hover:bg-[#433731] hover:-translate-y-1 hover:shadow-xl hover:shadow-[#594A42]/20 active:scale-95 transition-all duration-300"
              >
                Mulai Sekarang <FaArrowRight size={14} />
              </Link>
              <button
                onClick={() => scrollTo("cara-kerja")}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/80 dark:bg-[#2A2521]/80 backdrop-blur-sm text-[#594A42] dark:text-[#F5F2EB] rounded-full font-bold border border-white dark:border-[#3D342D] hover:bg-white hover:-translate-y-1 hover:shadow-lg active:scale-95 transition-all duration-300"
              >
                Lihat Cara Kerja
              </button>
            </div>

            {/* Statistik Animasi */}
            <div className="flex items-center gap-8 mt-12">
              {[
                { label: "Spot Nugas", val: "500+" },
                { label: "Kota Tersedia", val: "3" },
                { label: "Pengguna", val: "10rb+" },
              ].map((stat, i) => (
                <div key={i} className="group cursor-default">
                  <p className="text-3xl font-extrabold text-[#594A42] dark:text-[#F5F2EB] group-hover:scale-110 group-hover:text-[#8B6B4F] transition-transform duration-300 text-center">
                    {stat.val}
                  </p>
                  <p className="text-xs text-[#8B6B4F] dark:text-[#C4A876] font-semibold mt-1">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={150} className="relative">
            <img
              src={Daun}
              alt=""
              className="absolute -top-16 -right-10 w-40 opacity-90 pointer-events-none select-none drop-shadow-xl animate-blob-float"
            />
            <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white/60 dark:border-[#3D342D]/60 aspect-[4/3] group">
              <img
                src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80"
                alt="Suasana nugas"
                className="w-full h-full object-cover transition-transform duration-[1000ms] group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            <div className="absolute -bottom-6 -left-6 bg-white/95 dark:bg-[#2A2521]/95 backdrop-blur-md rounded-2xl shadow-xl border border-white dark:border-[#3D342D] px-5 py-4 flex items-center gap-4 hover:-translate-y-2 transition-transform duration-300 cursor-default">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                <FaPlug size={20} className="animate-pulse" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-0.5">
                  Update Live
                </p>
                <p className="text-sm font-extrabold text-[#594A42] dark:text-[#F5F2EB]">
                  95% Colokan Kosong
                </p>
              </div>
            </div>

            <img
              src={DaunBawah}
              alt=""
              className="absolute -bottom-10 -right-8 w-32 opacity-80 pointer-events-none select-none rotate-180 animate-blob-float-slow"
            />
          </RevealOnScroll>
        </section>

        {/* FITUR */}
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
                <div className="group h-full bg-white/60 dark:bg-[#2A2521]/60 backdrop-blur-sm rounded-3xl p-8 shadow-sm hover:shadow-2xl hover:bg-white dark:hover:bg-[#2A2521] transition-all duration-500 hover:-translate-y-3 border border-white/50 dark:border-[#3D342D]/50 relative overflow-hidden">
                  <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#D9B382]/10 rounded-full blur-2xl group-hover:bg-[#D9B382]/30 transition-colors duration-500" />
                  <div className="w-14 h-14 rounded-2xl bg-[#EBE7DF] dark:bg-[#1F1B18] text-[#8B6B4F] dark:text-[#C4A876] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 ease-out">
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
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#D9B382]/10 to-transparent dark:via-[#D9B382]/5" />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <RevealOnScroll className="text-center max-w-xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#594A42] dark:text-[#F5F2EB] mb-4">
                Tiga Langkah, Langsung Nugas
              </h2>
            </RevealOnScroll>

            <div className="grid md:grid-cols-3 gap-12 relative">
              <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-transparent via-[#8B6B4F]/30 to-transparent border-dashed" />
              {steps.map((s, i) => (
                <RevealOnScroll key={s.number} delay={i * 150}>
                  <div className="text-center relative group">
                    <div className="w-24 h-24 mx-auto bg-white dark:bg-[#2A2521] rounded-full shadow-lg border-4 border-[#EBE7DF] dark:border-[#1F1B18] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-xl transition-all duration-500 z-10 relative">
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
          <RevealOnScroll className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#594A42] dark:text-[#F5F2EB] mb-2">
                Lagi Rame Dicari Minggu Ini
              </h2>
              <div className="w-16 h-1.5 bg-[#8B6B4F] dark:bg-[#C4A876] rounded-full" />
            </div>
            <Link
              to="/register"
              className="group inline-flex items-center gap-3 px-6 py-3 bg-white dark:bg-[#2A2521] rounded-full text-sm font-bold text-[#594A42] dark:text-[#C4A876] shadow-sm hover:shadow-md border border-white dark:border-[#3D342D] transition-all"
            >
              Lihat Semua <FaArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {previewPlaces.map((place, i) => (
              <RevealOnScroll key={place.id} delay={i * 100}>
                <div className="bg-white/80 dark:bg-[#2A2521]/80 backdrop-blur-sm rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 overflow-hidden border border-white dark:border-[#3D342D] group cursor-pointer">
                  <div className="h-56 overflow-hidden relative">
                    <img
                      src={place.image}
                      alt={place.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute top-4 left-4 bg-white/90 dark:bg-[#2A2521]/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-extrabold text-[#594A42] dark:text-[#F5F2EB] shadow-sm uppercase tracking-widest">
                      {place.city}
                    </div>
                    <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 dark:bg-[#2A2521]/90 backdrop-blur-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:scale-110 active:scale-95 transition-all shadow-sm">
                      <FaBookmark size={14} />
                    </button>
                  </div>
                  <div className="p-6 relative">
                    <h3 className="font-extrabold text-xl text-[#594A42] dark:text-[#F5F2EB] mb-2 group-hover:text-[#8B6B4F] transition-colors">
                      {place.name}
                    </h3>
                    <div className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md text-xs font-bold mb-4">
                      {place.overthinkingStatus}
                    </div>
                    <div className="flex items-center gap-5 text-sm text-gray-600 dark:text-gray-300 font-semibold border-t border-gray-100 dark:border-[#3D342D] pt-4 mt-2">
                      <span className="flex items-center gap-2">
                        <FaPlug className="text-[#8B6B4F] dark:text-[#C4A876]" size={14} />
                        {place.colokanProbability}
                      </span>
                      <span className="flex items-center gap-2">
                        <FaWifi className="text-[#8B6B4F] dark:text-[#C4A876]" size={14} />
                        {place.wifiStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </section>

        {/* TESTIMONI */}
        <section id="testimoni" className="py-24 bg-gradient-to-b from-transparent to-white/60 dark:to-black/20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <RevealOnScroll className="text-center max-w-xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#594A42] dark:text-[#F5F2EB] mb-4">
                Ribuan Sesi Nugas Terselamatkan
              </h2>
            </RevealOnScroll>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((t, i) => (
                <RevealOnScroll key={t.name} delay={i * 120}>
                  <div className="h-full bg-white/80 dark:bg-[#2A2521]/80 backdrop-blur-sm rounded-3xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border border-white dark:border-[#3D342D] group">
                    <div className="w-12 h-12 bg-[#D9B382]/20 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <FaQuoteLeft className="text-[#8B6B4F] dark:text-[#C4A876]" size={18} />
                    </div>
                    <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed mb-8 italic font-medium">
                      "{t.quote}"
                    </p>
                    <div className="flex items-center gap-4 border-t border-gray-100 dark:border-[#3D342D] pt-6">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#8B6B4F] to-[#D9B382] text-white flex items-center justify-center font-bold text-sm">
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

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <RevealOnScroll>
            <div className="relative bg-gradient-to-br from-[#594A42] to-[#433731] rounded-[3rem] px-8 py-20 sm:px-20 text-center overflow-hidden shadow-2xl group cursor-default">
              {/* Animated decorative shapes inside CTA */}
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000 ease-out" />
                <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000 ease-out delay-100" />
              </div>
              
              <img
                src={Daun}
                alt=""
                className="absolute -top-10 -right-6 w-44 opacity-20 pointer-events-none select-none drop-shadow-2xl animate-blob-float"
              />
              <img
                src={DaunBawah}
                alt=""
                className="absolute -bottom-8 -left-8 w-40 opacity-20 pointer-events-none select-none rotate-180 animate-blob-float-slow"
              />
              
              <h2 className="relative text-4xl sm:text-5xl font-extrabold text-white mb-6 tracking-tight">
                Siap Nugas Tanpa Drama?
              </h2>
              <p className="relative text-[#D9C7B8] text-lg max-w-lg mx-auto mb-10 font-medium">
                Daftar gratis sekarang dan langsung amankan spot favoritmu hari ini juga.
              </p>
              <div className="relative flex flex-col sm:flex-row gap-5 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white text-[#594A42] rounded-full font-extrabold text-lg hover:bg-[#F5F2EB] hover:scale-105 active:scale-95 transition-all duration-300 shadow-xl"
                >
                  Daftar Sekarang <FaArrowRight size={16} />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-transparent text-white rounded-full font-bold border-2 border-white/30 hover:bg-white/10 active:scale-95 transition-all duration-300"
                >
                  Sudah Punya Akun
                </Link>
              </div>
            </div>
          </RevealOnScroll>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 bg-white/50 dark:bg-[#1F1B18]/50 border-t border-gray-200 dark:border-[#3D342D] mt-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center sm:items-start gap-2">
            <img src={textLogo} alt="Selasar" className="h-8 w-auto object-contain hover:scale-105 transition-transform cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
            <p className="text-xs text-gray-500 font-semibold">
              Tempat nyaman, ide berkembang.
            </p>
          </div>
          <p className="text-xs text-gray-400 font-medium">
            © {new Date().getFullYear()} Selasar. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm font-bold text-[#8B6B4F] dark:text-[#C4A876]">
            {["Fitur", "Testimoni"].map((item) => (
              <button
                key={item}
                onClick={() => scrollTo(item.toLowerCase())}
                className="hover:text-[#594A42] dark:hover:text-[#F5F2EB] hover:-translate-y-0.5 transition-all"
              >
                {item}
              </button>
            ))}
            <Link to="/register" className="hover:text-[#594A42] dark:hover:text-[#F5F2EB] hover:-translate-y-0.5 transition-all">
              Daftar
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}