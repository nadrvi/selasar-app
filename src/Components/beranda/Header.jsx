import React from 'react';
import { Settings, User } from 'lucide-react';
import myLogo from '../../assets/text-logo.png';

const Header = () => {
  return (
    // Kita gunakan grid 3 kolom agar logo selalu di tengah secara matematis
    <header className="grid grid-cols-3 items-center w-full py-4">
      
      {/* Kolom 1: Kosong */}
      <div></div>

      {/* Kolom 2: Logo */}
      <div className="flex justify-center">
        <img 
          src={myLogo}
          alt="Logo Selasar" 
          className="h-22 w-auto object-contain" 
        />
      </div>

      {/* Kolom 3: Tombol Settings & User */}
      <div className="flex justify-end">
        <div className="flex items-center bg-[#5F4B41] p-1.5 rounded-full shadow-md">
          <button className="p-2 text-white hover:bg-white/20 rounded-full transition">
            <Settings size={20} />
          </button>
          <button className="bg-[#EBE3D5] p-2 text-[#5F4B41] rounded-full shadow-sm ml-1 transition">
            <User size={20} />
          </button>
        </div>
      </div>
      
    </header>
  );
};

export default Header;