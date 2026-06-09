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
    </div>
  );
}
