import { Link } from "react-router-dom";
import textLogo from "../assets/text-logo.png";
import { placesData } from "../data/place";

export default function Beranda() {
  return (
    <div className="min-h-screen bg-gray-50 pb-12 select-none">
      <nav className="bg-white px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-50">
        <img
          src={textLogo}
          alt="Selasar Logo"
          className="h-8 w-auto object-contain"
        />
        <div className="flex gap-6 items-center">
          <Link
            to="/beranda"
            className="text-green-800 font-semibold border-b-2 border-green-800"
          >
            Beranda
          </Link>
          <Link
            to="/search"
            className="text-gray-500 hover:text-green-700 transition-colors"
          >
            Cari
          </Link>
          <Link to="/profile">
            <div className="w-10 h-10 bg-gray-300 rounded-full border-2 border-green-700 overflow-hidden">
              {/* Placeholder Profil */}
              <img
                src="https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff"
                alt="Profile"
              />
            </div>
          </Link>
        </div>
      </nav>

      {/* Hero Section & Search */}
      <div className="px-6 md:px-12 py-10 max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-800 mb-2">
          Mau nugas di mana hari ini?
        </h1>
        <p className="text-gray-600 mb-8">
          Temukan spot ternyaman sesuai kondisimu secara real-time.
        </p>

        {/* Search Bar & Mood Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <input
            type="text"
            placeholder="Cari nama tempat atau lokasi..."
            className="flex-1 px-6 py-3 rounded-full bg-white border border-gray-200 shadow-sm outline-none focus:ring-2 focus:ring-green-700 transition-all"
          />
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {["Fokus", "Santai", "Healing", "Deadline mode"].map((mood) => (
              <button
                key={mood}
                className="px-5 py-2 whitespace-nowrap rounded-full bg-gray-200 text-gray-700 hover:bg-green-700 hover:text-white transition-colors text-sm font-medium"
              >
                {mood}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Daftar Tempat */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {placesData.map((place) => (
            <div
              key={place.id}
              className="bg-white rounded-3xl shadow-sm hover:shadow-xl transition-shadow overflow-hidden border border-gray-100 flex flex-col"
            >
              {/* Gambar Cover */}
              <div className="h-48 overflow-hidden relative">
                <img
                  src={place.image}
                  alt={place.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-green-800 flex items-center gap-1">
                  🔌 {place.colokanProbability}
                </div>
              </div>

              {/* Konten Card */}
              <div className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      {place.name}
                    </h3>
                    <p className="text-sm text-green-700 font-medium">
                      {place.overthinkingStatus}
                    </p>
                  </div>
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md font-semibold">
                    {place.mood}
                  </span>
                </div>

                {/* Indikator Real-time */}
                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm text-gray-600 mt-auto bg-gray-50 p-4 rounded-2xl">
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
