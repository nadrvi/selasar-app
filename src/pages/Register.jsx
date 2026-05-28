import { Link } from "react-router-dom";
import logoSelasar from "../assets/logo.png";
import textLogo from "../assets/text-logo.png";

export default function Register() {
  return (
    <div className="min-h-screen bg-neutral-800 flex items-center justify-center p-4">
      <div className="flex flex-col md:flex-row bg-white rounded-3xl shadow-xl overflow-hidden max-w-4xl w-full min-h-[500px]">
        {/* Sisi Kiri: Area Form Input */}
        <div className="md:w-1/2 p-10 bg-gray-100 relative flex flex-col justify-center items-center">
          {/* Tombol Back */}
          <Link
            to="/"
            className="absolute top-6 left-6 w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-all font-bold shadow-md"
          >
            ←
          </Link>
          <img
            src={textLogo}
            alt="Selasar Typography"
            className="h-16 w-auto object-contain mb-8 drop-shadow-sm"
          />

          <form className="w-full max-w-sm flex flex-col gap-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nama Depan"
                className="w-1/2 px-4 py-3 rounded-full bg-gray-200 outline-none focus:ring-2 focus:ring-green-700 transition-all"
              />
              <input
                type="text"
                placeholder="Nama Belakang"
                className="w-1/2 px-4 py-3 rounded-full bg-gray-200 outline-none focus:ring-2 focus:ring-green-700 transition-all"
              />
            </div>

            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-3 rounded-full bg-gray-200 outline-none focus:ring-2 focus:ring-green-700 transition-all"
            />

            <div className="flex gap-2 relative">
              <input
                type="password"
                placeholder="Password"
                className="w-1/2 px-4 py-3 rounded-full bg-gray-200 outline-none focus:ring-2 focus:ring-green-700 transition-all"
              />
              <input
                type="password"
                placeholder="Konfirmasi PW"
                className="w-1/2 px-4 py-3 rounded-full bg-gray-200 outline-none focus:ring-2 focus:ring-green-700 transition-all"
              />
            </div>

 
            {/* <div className="flex justify-center gap-3 py-2">
              <div className="w-6 h-6 rounded-full bg-gray-400 hover:bg-green-600 cursor-pointer transition-colors"></div>
              <div className="w-6 h-6 rounded-full bg-gray-400 hover:bg-green-600 cursor-pointer transition-colors"></div>
              <div className="w-6 h-6 rounded-full bg-gray-400 hover:bg-green-600 cursor-pointer transition-colors"></div>
              <div className="w-6 h-6 rounded-full bg-gray-400 hover:bg-green-600 cursor-pointer transition-colors"></div>
            </div> */}

            {/* Tombol Register */}
            <button
              type="button"
              className="w-full mt-2 bg-gray-400 hover:bg-green-700 text-white font-semibold py-3 rounded-full transition-all shadow-md"
            >
              Daftar
            </button>
          </form>
        </div>

        {/* Sisi Kanan: Logo Utama */}
        <div className="md:w-1/2 p-10 flex flex-col items-center justify-center bg-white border-t md:border-t-0 md:border-l border-gray-200">
          <img
            src={logoSelasar}
            alt="Logo Selasar"
            className="w-72 h-auto object-contain drop-shadow-sm hover:scale-105 transition-transform duration-300"
          />
        </div>
      </div>
    </div>
  );
}
