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

