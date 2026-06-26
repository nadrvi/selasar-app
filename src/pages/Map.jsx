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
} from "react-icons/fa";

export default function Map() {
  return (
    <div className="min-h-screen bg-[#F4EFE8]">

      {/* HEADER */}
      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* LOGO */}
        <div className="flex justify-center">
          <div className="text-center">
            <h1 className="text-[64px] font-serif font-bold text-[#445234] leading-none">
              Selasar
            </h1>

            <p className="text-[10px] tracking-[3px] text-[#8B6B4F]">
              TEMPAT NYAMAN, IDE BERKEMBANG
            </p>
          </div>
        </div>

        {/* SEARCH */}
        <div className="flex justify-center mt-3">
          <div className="flex w-[450px] overflow-hidden rounded-full border bg-white shadow-sm">

            <input
              type="text"
              placeholder="Mau nugas di mana hari ini?"
              className="flex-1 px-4 py-2 text-sm outline-none"
            />

            <button className="px-4 border-l">
              <FaSearch />
            </button>

          </div>
        </div>

        {/* FILTER */}
        <div className="flex justify-center gap-3 mt-5 flex-wrap">

          <button className="bg-[#6B554F] text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2">
            Semua
          </button>

          <button className="bg-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 shadow">
            <FaCoffee />
            Cafe
          </button>

          <button className="bg-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 shadow">
            <FaUsers />
            Coworking
          </button>

          <button className="bg-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 shadow">
            <FaBook />
            Perpustakaan
          </button>

          <button className="bg-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 shadow">
            <FaTree />
            Alam
          </button>

        </div>

      </div>

      {/* MAP */}
      <div className="relative max-w-7xl mx-auto h-[700px] rounded-3xl overflow-hidden shadow-xl">

        {/* MAP IMAGE */}
        <img
          src="https://images.unsplash.com/photo-1524661135-423995f22d0b"
          alt="Map"
          className="w-full h-full object-cover opacity-30"
        />

        {/* MARKER USER */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2">

          <div className="w-28 h-28 bg-blue-400/20 rounded-full absolute -left-12 -top-12"></div>

          <div className="w-6 h-6 bg-blue-500 rounded-full border-4 border-white relative z-10"></div>

        </div>

        {/* MARKER SELASAR */}
        <div className="absolute left-[50%] top-[43%]">

          <div className="w-20 h-20 bg-[#556B2F] rounded-full flex items-center justify-center shadow-xl">

            <span className="text-white text-3xl">
              🌿
            </span>

          </div>

        </div>