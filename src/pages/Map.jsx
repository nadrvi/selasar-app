import {
  Search,
  Grid2x2,
  Coffee,
  Users,
  BookOpen,
  Trees,
  LocateFixed,
  Navigation,
} from "lucide-react";

export default function App() {
  return (
    <div className="w-full min-h-screen bg-[#F5F1EA] overflow-hidden">
      {/* HEADER */}
      <div className="pt-4 md:pt-8 text-center">
        <h1 className="text-5xl md:text-7xl font-serif font-bold text-[#3E4A2D]">
          Selasar
        </h1>

        <p className="text-[8px] md:text-xs tracking-[3px] md:tracking-[5px] text-[#776B61] uppercase">
          Tempat Nyaman, Ide Berkembang
        </p>
      </div>

      {/* SEARCH */}
      <div className="max-w-3xl mx-auto px-4 mt-4">
        <div className="bg-white rounded-full shadow-md border border-[#D8D1CA] flex items-center overflow-hidden">
          <input
            type="text"
            placeholder="Mau nugas di mana hari ini?"
            className="flex-1 px-4 md:px-6 py-2 md:py-4 text-xs md:text-base outline-none bg-transparent"
          />

          <button className="px-4">
            <Search size={20} />
          </button>
        </div>
      </div>

      {/* FILTER */}
      <div className="flex gap-2 md:gap-4 overflow-x-auto px-4 justify-start md:justify-center mt-4 pb-2">
        <button className="shrink-0 flex items-center gap-2 px-3 md:px-6 py-2 md:py-4 rounded-xl bg-[#5B4741] text-white shadow-md text-xs md:text-base">
          <Grid2x2 size={16} />
          Semua
        </button>

        <button className="shrink-0 flex items-center gap-2 px-3 md:px-6 py-2 md:py-4 rounded-xl bg-white shadow-md text-xs md:text-base">
          <Coffee size={16} />
          Cafe
        </button>

        <button className="shrink-0 flex items-center gap-2 px-3 md:px-6 py-2 md:py-4 rounded-xl bg-white shadow-md text-xs md:text-base">
          <Users size={16} />
          Coworking
        </button>

        <button className="shrink-0 flex items-center gap-2 px-3 md:px-6 py-2 md:py-4 rounded-xl bg-white shadow-md text-xs md:text-base">
          <BookOpen size={16} />
          Perpustakaan
        </button>

        <button className="shrink-0 flex items-center gap-2 px-3 md:px-6 py-2 md:py-4 rounded-xl bg-white shadow-md text-xs md:text-base">
          <Trees size={16} />
          Alam
        </button>
      </div>

      {/* MAP */}
      <div className="relative mt-3 h-[80vh] md:h-[900px]">
        <img
          src="/map.png"
          alt="map"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* KOPI SELASAR */}
        <div className="absolute top-[8%] left-[4%] bg-white rounded-3xl shadow-xl px-3 md:px-5 py-2 md:py-4 flex items-center gap-3">
          <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-[#7B5B43] flex items-center justify-center text-white">
            <Coffee size={16} />
          </div>

          <div>
            <h3 className="font-bold text-xs md:text-lg">
              Kopi Selasar
            </h3>

            <p className="text-[10px] md:text-sm text-gray-500">
              250 m
            </p>
          </div>
        </div>

        {/* COWORK */}
        <div className="absolute top-[18%] right-[6%] bg-white rounded-3xl shadow-xl px-3 md:px-5 py-2 md:py-4 flex items-center gap-3">
          <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-[#7B5B43] flex items-center justify-center text-white">
            <Users size={16} />
          </div>

          <div>
            <h3 className="font-bold text-xs md:text-lg">
              CoWork Hub
            </h3>

            <p className="text-[10px] md:text-sm text-gray-500">
              650 m
            </p>
          </div>
        </div>

        {/* PERPUS */}
        <div className="absolute top-[42%] left-[3%] bg-white rounded-3xl shadow-xl px-3 md:px-5 py-2 md:py-4 flex items-center gap-3">
          <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-[#7B5B43] flex items-center justify-center text-white">
            <BookOpen size={16} />
          </div>

          <div>
            <h3 className="font-bold text-xs md:text-lg">
              Perpus Kota
            </h3>

            <p className="text-[10px] md:text-sm text-gray-500">
              1.2 km
            </p>
          </div>
        </div>

        {/* RUANG TEDUH */}
        <div className="absolute top-[52%] right-[4%] bg-white rounded-3xl shadow-xl px-3 md:px-5 py-2 md:py-4 flex items-center gap-3">
          <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-[#7B5B43] flex items-center justify-center text-white">
            <Coffee size={16} />
          </div>

          <div>
            <h3 className="font-bold text-xs md:text-lg">
              Ruang Teduh
            </h3>

            <p className="text-[10px] md:text-sm text-gray-500">
              400 m
            </p>
          </div>
        </div>

        {/* TAMAN */}
        <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 bg-white rounded-3xl shadow-xl px-3 md:px-5 py-2 md:py-4 flex items-center gap-3">
          <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-[#5D7637] flex items-center justify-center text-white">
            <Trees size={16} />
          </div>

          <div>
            <h3 className="font-bold text-xs md:text-lg">
              Taman Literasi
            </h3>

            <p className="text-[10px] md:text-sm text-gray-500">
              800 m
            </p>
          </div>
        </div>

        {/* USER LOCATION */}
        <div className="absolute top-[48%] left-1/2 -translate-x-1/2">
          <div className="absolute w-28 h-28 md:w-56 md:h-56 rounded-full bg-blue-400/20 -translate-x-1/2 -translate-y-1/2"></div>

          <div className="w-5 h-5 md:w-7 md:h-7 bg-blue-500 rounded-full border-4 border-white relative z-10"></div>

          <div className="absolute -top-14 md:-top-24 left-1/2 -translate-x-1/2">
            <div className="w-12 h-12 md:w-24 md:h-24 rounded-full bg-[#60773D] shadow-xl flex items-center justify-center">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="white"
              >
                <path d="M12 3C8 5 6 8 6 12c0 5 3 8 6 9 3-1 6-4 6-9 0-4-2-7-6-9z" />
              </svg>
            </div>
          </div>
        </div>

        {/* SMALL PINS */}
        <div className="absolute top-[18%] left-[18%] text-[#7B5B43] text-2xl">
          📍
        </div>

        <div className="absolute top-[27%] right-[20%] text-[#7B5B43] text-2xl">
          📍
        </div>

        <div className="absolute top-[52%] left-[18%] text-[#7B5B43] text-2xl">
          📍
        </div>

        <div className="absolute top-[60%] right-[12%] text-[#7B5B43] text-2xl">
          📍
        </div>

        <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 text-[#7B5B43] text-2xl">
          📍
        </div>

        {/* FLOATING BUTTONS */}
        <div className="absolute bottom-8 right-3 md:right-6 flex flex-col gap-3">
          <button className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-white shadow-lg flex items-center justify-center">
            <LocateFixed size={18} />
          </button>

          <button className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-white shadow-lg flex items-center justify-center">
            <Navigation size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}