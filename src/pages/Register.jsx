import { Link } from "react-router-dom";
import logoSelasar from "../assets/logo.png"; // Pastikan nama filenya sesuai

export default function Register() {
  return (
    <div className="min-h-screen bg-neutral-800 flex items-center justify-center p-4">
      {/* Container Card */}
      <div className="flex flex-col md:flex-row bg-white rounded-3xl shadow-xl overflow-hidden max-w-5xl w-full min-h-[600px]">
        
        {/* Kolom 1: Profil & Back Button (Sisi Kiri Abu-abu) */}
        <div className="md:w-1/3 bg-gray-400 p-8 relative flex flex-col items-center pt-20">
          {/* Tombol Back */}
          <Link to="/" className="absolute top-6 left-6 w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-all font-bold shadow-md">
            ←
          </Link>
          {/* Placeholder Foto Profil */}
          <div className="w-32 h-32 bg-gray-300 rounded-full border-4 border-white shadow-md flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-all">
            <span className="text-gray-500 text-sm font-medium">Upload Foto</span>
          </div>
        </div>

        {/* Kolom 2: Area Form Input */}
        <div className="md:w-1/3 bg-gray-100 p-8 flex flex-col justify-center shadow-inner">
          <form className="flex flex-col gap-4">
            {/* Input split 2 */}
            <div className="flex gap-2">
              <input type="text" placeholder="Nama Depan" className="w-1/2 px-4 py-2 rounded-full bg-gray-200 outline-none focus:ring-2 focus:ring-green-700" />
              <input type="text" placeholder="Nama Belakang" className="w-1/2 px-4 py-2 rounded-full bg-gray-200 outline-none focus:ring-2 focus:ring-green-700" />
            </div>
            
            <input type="email" placeholder="Email" className="w-full px-4 py-2 rounded-full bg-gray-200 outline-none focus:ring-2 focus:ring-green-700" />
            
            {/* Input split 2 */}
            <div className="flex gap-2 relative">
              <input type="password" placeholder="Password" className="w-1/2 px-4 py-2 rounded-full bg-gray-200 outline-none focus:ring-2 focus:ring-green-700" />
              <input type="password" placeholder="Konfirmasi" className="w-1/2 px-4 py-2 rounded-full bg-gray-200 outline-none focus:ring-2 focus:ring-green-700" />
            </div>

            {/* Opsi tambahan */}
            <div className="flex justify-center gap-3 py-4">
              <div className="w-6 h-6 rounded-full bg-gray-400 hover:bg-green-600 cursor-pointer transition-colors"></div>
              <div className="w-6 h-6 rounded-full bg-gray-400 hover:bg-green-600 cursor-pointer transition-colors"></div>
              <div className="w-6 h-6 rounded-full bg-gray-400 hover:bg-green-600 cursor-pointer transition-colors"></div>
              <div className="w-6 h-6 rounded-full bg-gray-400 hover:bg-green-600 cursor-pointer transition-colors"></div>
            </div>

            {/* Tombol Register */}
            <button type="button" className="w-2/3 mx-auto mt-2 bg-gray-400 hover:bg-green-700 text-white font-semibold py-2 rounded-full transition-all shadow-md">
              Daftar
            </button>
          </form>
        </div>

        {/* Kolom 3: Sisi Kanan Logo Asli */}
        <div className="md:w-1/3 bg-white p-8 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-gray-200">
           <img 
             src={logoSelasar} 
             alt="Logo Selasar" 
             className="w-56 h-auto object-contain drop-shadow-sm hover:scale-105 transition-transform duration-300" 
           />
        </div>

      </div>
    </div>
  );
}