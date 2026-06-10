import "react"
import {
  FaWifi,
  FaUsers,
  FaPlug,
  FaSearch,
  FaRegBookmark,
} from "react-icons/fa";

export default function Searching() {
  return (
    <div className="min-h-screen bg-[#F4EFE8] p-6">
      <div className="flex justify-center mb-6">
  <div className="text-center">
    <h1 className="text-5xl font-serif text-[#38442E] font-bold">
      Selasar
    </h1>

    <p className="text-[10px] tracking-[3px] text-[#8B6B4F]">
      TEMPAT NYAMAN, IDE BERKEMBANG
    </p>
  </div>
</div>

      <div className="flex justify-center mb-6">
        <div className="flex bg-white rounded-full border shadow-sm overflow-hidden w-full max-w-md">
          <input
            type="text"
            placeholder="Mau nugas di mana hari ini?"
            className="flex-1 px-4 py-2 outline-none text-sm"
          />

          <button className="px-4 text-[#5E4B45]">
            <FaSearch />
          </button>
        </div>
      </div>

<div className="bg-white rounded-2xl p-4 shadow-md mb-8">

  <h2 className="font-semibold text-[#4A3B35] mb-4">
    Pilih suasana yang kamu butuhkan
  </h2>

<div className="bg-[#EFE7E2] rounded-xl p-4 mb-4 flex gap-4">
          <div className="bg-[#6B554F] w-10 h-10 rounded-lg flex items-center justify-center text-white">
            <FaPlug />
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-[#4A3B35]">
              Ketersediaan Colokan
            </h3>

            <p className="text-xs text-gray-500 mb-3">
              Prioritaskan tempat dengan colokan
            </p>

            <div className="flex gap-2">
              <button className="px-4 py-1 bg-white rounded-full text-xs border">
                Tidak masalah
              </button>

              <button className="px-4 py-1 bg-[#6B554F] text-white rounded-full text-xs">
                Tersedia
              </button>

              <button className="px-4 py-1 bg-white rounded-full text-xs border">
                Banyak
              </button>
            </div>
          </div>
        </div>
</div>
    </div>
  );
}
