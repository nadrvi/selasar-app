import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import textLogo from "../assets/text-logo.png";
import { placesData } from "../data/place";

export default function Beranda() {
  const navigate = useNavigate();
  const [destination, setDestination] = useState(null); // Ganti dari isTransitioning
  const isTransitioning = !!destination;
  const [isLoaded, setIsLoaded] = useState(false); // State baru untuk animasi masuk

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (destination) {
      const timer = setTimeout(() => {
        navigate(destination);
      }, 500); 
      return () => clearTimeout(timer);
    }
  }, [destination, navigate]);

  const handleNavigate = (path) => {
    setDestination(path);
  };

  return (
    <div
      className={`min-h-screen bg-[#EBE7DF] pb-12 select-none font-sans overflow-x-hidden transition-opacity duration-700 ease-out ${isLoaded ? "opacity-100" : "opacity-0"}`}
    >
      {/* Header / Navbar */}
      <nav
        className={`px-6 py-6 flex justify-between items-center max-w-7xl mx-auto relative transition-all duration-700 ease-smooth ${isTransitioning ? "opacity-0 -translate-y-8" : "opacity-100"}`}
      >
        <div className="w-[76px]"></div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <img
            src={textLogo}
            alt="Selasar Logo"
            className="h-16 w-auto object-contain"
          />
        </div>
        <Link to="/profile" className="outline-none group">
          <div className="w-[76px] h-[34px] bg-[#594A42] rounded-full p-1 relative flex items-center justify-end shadow-inner transition-all duration-300 ease-out group-hover:bg-[#433731]">
            <div className="w-[26px] h-[26px] bg-[#EBE7DF] rounded-full flex items-center justify-center shadow-md text-[#594A42] transition-all duration-300 ease-out group-hover:bg-white group-hover:scale-110">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </Link>
      </nav>

      {/* Konten Utama */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 flex flex-col items-center">
        {/* Kontainer Peta */}
        <div
          onClick={() => handleNavigate("/map")}
          className={`w-full h-[280px] transition-all duration-700 ease-smooth ${
            isTransitioning
              ? "opacity-0 scale-[0.98] blur-sm"
              : "opacity-100 scale-100 hover:shadow-lg"
          }`}
        >
          <iframe
            title="Map Area"
            src="https://www.openstreetmap.org/export/embed.html?bbox=78.4616%2C17.3600%2C78.4866%2C17.3750&layer=mapnik"
            className="w-full h-full border-0 opacity-80"
            style={{ pointerEvents: "none" }}
          ></iframe>
          <div className="absolute top-5 left-5 w-9 h-9 bg-[#EBE7DF]/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md border border-gray-300">
            <svg
              className="w-4 h-4 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          </div>
          <div className="absolute bottom-8 right-6 w-10 h-10 bg-[#EBE7DF]/90 backdrop-blur-sm rounded-full shadow-md border border-gray-300 flex items-center justify-center">
            <div className="w-4 h-4 bg-transparent rounded-full border-[2.5px] border-gray-500"></div>
          </div>
        </div>

        {/* Search Bar*/}
        <div
          onClick={() => handleNavigate("/searching")}
          className={`flex w-full max-w-[480px] relative shadow-lg rounded-full bg-[#fdfcfa] border border-gray-300 h-14 cursor-text transition-all duration-700 ease-smooth ${
            isTransitioning
              ? "scale-[1.1] -translate-y-[280px] opacity-100" // Search bar jadi fokus utama pas transisi
              : "-mt-7"
          }`}
        >
          <input
            type="text"
            placeholder="Mau nugas di mana hari ini?"
            className="flex-1 px-6 py-2 bg-transparent outline-none text-sm text-gray-700 rounded-l-full placeholder-gray-400 font-medium cursor-pointer"
            readOnly
          />
          <button className="w-16 bg-[#E5DFCF] border-l border-gray-300 rounded-r-full flex items-center justify-center hover:bg-[#d5cebd] transition-colors">
            <svg
              className="w-5 h-5 text-gray-700"
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

        {/* Tombol Filter Lokasi */}
        <div
          className={`flex flex-wrap justify-center gap-4 mt-8 mb-12 transition-all duration-500 ease-in-out ${isTransitioning ? "opacity-0 translate-y-10" : "opacity-100 translate-y-0"}`}
        >
          <button className="px-8 py-2.5 rounded-full bg-[#594A42] text-white font-semibold text-sm shadow-md hover:bg-[#4A3B32] active:scale-95 transition-all">
            Show Everything
          </button>
          {["Jakarta", "Bogor", "Bandung"].map((city) => (
            <button
              key={city}
              className="px-10 py-2.5 rounded-full bg-[#fdfcfa] text-[#594A42] font-semibold text-sm border border-gray-300 shadow-sm hover:bg-[#F5F2EB] hover:border-[#594A42] active:scale-95 transition-all"
            >
              {city}
            </button>
          ))}
        </div>
      </main>

      {/* Bagian Grid Daftar Tempat (Cards) */}
      <div
        className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-500 ease-in-out delay-75 ${isTransitioning ? "opacity-0 translate-y-12" : "opacity-100 translate-y-0"}`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {placesData?.map((place) => (
            <div
              key={place.id}
              className="bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border border-gray-100 flex flex-col cursor-pointer group"
            >
              <div className="h-48 overflow-hidden relative">
                <img
                  src={place.image}
                  alt={place.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-green-800 flex items-center gap-1 shadow-sm">
                  🔌 {place.colokanProbability}
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-[#594A42] transition-colors">
                      {place.name}
                    </h3>
                    <p className="text-sm text-green-700 font-medium">
                      {place.overthinkingStatus}
                    </p>
                  </div>
                  <span className="bg-[#EBE7DF] text-[#594A42] text-xs px-2 py-1 rounded-md font-semibold">
                    {place.mood}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm text-gray-600 mt-auto bg-gray-50 p-4 rounded-2xl group-hover:bg-[#F5F2EB] transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔊</span> {place.noiseLevel}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📶</span> {place.wifiStatus}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👥</span> {place.visitors} Orang
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
