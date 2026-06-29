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
import { PiLeafFill } from "react-icons/pi";

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
        <div className="absolute left-[50%] top-[43%] -translate-x-1/2 -translate-y-1/2">

          <div className="relative">

            {/* Pin */}
            <div className="w-16 h-16 bg-[#556B2F] rounded-full flex items-center justify-center shadow-xl">

              {/* Icon Daun */}
              <PiLeafFill
                  size={30}
                  className="text-white"
              />

            </div>

            {/* Ujung Pin */}
            <div
              className="absolute left-1/2 -translate-x-1/2 -bottom-3
                        w-5 h-5 bg-[#556B2F]
                        rotate-45">
            </div>

          </div>

        </div>

        {/* LOCATION CARD 1 */}
        <div className="absolute top-20 left-12 bg-white rounded-2xl p-4 shadow-xl w-[220px]">

          <div className="flex items-center">

            {/* Icon */}
            <div className="w-10 h-10 rounded-full bg-[#7A5230] flex items-center justify-center mr-3 flex-shrink-0">
              <FaCoffee className="text-white text-sm" />
            </div>

            {/* Text */}
            <div>
              <h3 className="font-bold text-[#5E4B45] text-lg leading-5">
                Kopi Selasar
              </h3>

              <p className="text-gray-500 text-sm mt-1">
                250 m
              </p>
            </div>

          </div>

        </div>

        {/* LOCATION CARD 2 */}
        <div className="absolute top-32 right-32 bg-white rounded-2xl p-4 shadow-xl w-[220px]">

          <div className="flex items-center">

            <div className="w-10 h-10 rounded-full bg-[#7A5230] flex items-center justify-center mr-3 flex-shrink-0">
              <FaUsers className="text-white text-sm" />
            </div>

            <div>
              <h3 className="font-bold text-[#5E4B45] text-lg leading-5">
                CoWork Hub
              </h3>

              <p className="text-gray-500 text-sm mt-1">
                650 m
              </p>
            </div>

          </div>

        </div>

        {/* LOCATION CARD 3 */}
        <div className="absolute bottom-40 left-20 bg-white rounded-2xl p-4 shadow-xl w-[220px]">

          <div className="flex items-center">

            <div className="w-10 h-10 rounded-full bg-[#6B563D] flex items-center justify-center mr-3 flex-shrink-0">
              <FaBook className="text-white text-sm" />
            </div>

            <div>
              <h3 className="font-bold text-[#5E4B45] text-lg leading-5">
                Perpus Kota
              </h3>

              <p className="text-gray-500 text-sm mt-1">
                1.2 km
              </p>
            </div>

          </div>

        </div>

        {/* LOCATION CARD 4 */}
        <div className="absolute bottom-44 right-24 bg-white rounded-2xl p-4 shadow-xl w-[220px]">

          <div className="flex items-center">

            <div className="w-10 h-10 rounded-full bg-[#7A5230] flex items-center justify-center mr-3 flex-shrink-0">
              <FaCoffee className="text-white text-sm" />
            </div>

            <div>
              <h3 className="font-bold text-[#5E4B45] text-lg leading-5">
                Ruang Teduh
              </h3>

              <p className="text-gray-500 text-sm mt-1">
                400 m
              </p>
            </div>

          </div>

        </div>

        {/* LOCATION CARD 5 */}
        <div className="absolute bottom-20 left-[40%] bg-white rounded-2xl p-4 shadow-xl w-[220px]">

          <div className="flex items-center">

            <div className="w-10 h-10 rounded-full bg-[#556B2F] flex items-center justify-center mr-3 flex-shrink-0">
              <FaTree className="text-white text-sm" />
            </div>

            <div>
              <h3 className="font-bold text-[#5E4B45] text-lg leading-5">
                Taman Literasi
              </h3>

              <p className="text-gray-500 text-sm mt-1">
                800 m
              </p>
            </div>

          </div>

        </div>

        {/* FLOATING MAP BUTTON */}
        <div className="absolute bottom-20 right-6 flex flex-col gap-3 z-50">

          {/* Current Location */}
          <button
            className="w-12 h-12 bg-white rounded-full shadow-lg
                      flex items-center justify-center
                      hover:scale-105 transition"
          >
            <FaCrosshairs
              size={18}
              className="text-[#5E4B45]"
            />
          </button>

          {/* Navigation */}
          <button
            className="w-12 h-12 bg-white rounded-full shadow-lg
                      flex items-center justify-center
                      hover:scale-105 transition"
          >
            <FaLocationArrow
              size={18}
              className="text-[#5E4B45] -rotate-45"
            />
          </button>

        </div>

      </div>

      {/* DETAIL CARD */}
      <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-10 pb-10">

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex">

          {/* IMAGE */}
          <img
            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb"
            alt="Kebon Raya"
            className="w-[350px] h-[240px] object-cover"
          />

          {/* CONTENT */}
          <div className="flex-1 p-6">

            <div className="flex justify-between">

              <div>
                <h2 className="text-3xl font-bold text-[#5E4B45]">
                  Kebon Raya Escape
                </h2>

                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <FaMapMarkerAlt />
                  Jl. Otto Iskandardinata No.13
                </div>
              </div>

              <span className="px-4 py-2 bg-[#EFE7E2] rounded-xl">
                Alam
              </span>

            </div>

            <div className="grid grid-cols-4 mt-6 text-sm">

              <div>
                <p className="font-semibold flex items-center gap-1">
                  Colokan <FaPlug />
                </p>
                <p>Terbatas</p>
              </div>

              <div>
                <p className="font-semibold flex items-center gap-1">
                  WiFi <FaWifi />
                </p>
                <p>Cepat</p>
              </div>

              <div>
                <p className="font-semibold flex items-center gap-1">
                  <FaUsers />
                  3-5 orang
                </p>
                <p>Cocok</p>
              </div>

              <div className="flex justify-end">
                <FaBookmark size={22} />
              </div>

            </div>

            <div className="border-t my-5"></div>

            <div className="flex justify-between items-center">

              <p>
                Cocok untuk: Me time, Hangout
              </p>

              <div className="bg-[#EFE7E2] px-4 py-2 rounded-xl font-semibold">
                80% Match
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}