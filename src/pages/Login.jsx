import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logoSelasar from "../assets/logo.png";
import textLogo from "../assets/text-logo.png";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    let newErrors = {};
    setGlobalError("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = "Email wajib diisi.";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Format email tidak valid.";
    }

    if (!password) {
      newErrors.password = "Password wajib diisi.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const storedUser = localStorage.getItem("selasarUser");
    if (!storedUser) {
      setGlobalError("Akun tidak ditemukan. Silakan daftar dulu.");
      return;
    }

    const userData = JSON.parse(storedUser);
    if (email === userData.email && password === userData.password) {
      localStorage.setItem("isLoggedIn", "true");
      alert(`Selamat datang kembali, ${userData.name}!`);
      navigate("/beranda"); 
    } else {
      setGlobalError("Email atau Password salah.");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-800 flex items-center justify-center p-4">
      {/* Container: Otomatis vertikal (flex-col) di hp/tablet, horizontal (md:flex-row) di desktop */}
      <div className="flex flex-col md:flex-row bg-white rounded-3xl shadow-xl overflow-hidden max-w-4xl w-full min-h-[500px]">
        
        {/* Sisi Kiri (Desktop) / Atas (Mobile): Area Logo Utama */}
        <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col items-center justify-center bg-white border-b md:border-b-0 md:border-r border-gray-200">
          <img 
            src={logoSelasar} 
            alt="Logo Selasar" 
            className="w-44 md:w-72 h-auto object-contain drop-shadow-sm hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Sisi Kanan (Desktop) / Bawah (Mobile): Area Form */}
        <div className="w-full md:w-1/2 p-8 md:p-10 bg-gray-100 flex flex-col justify-center items-center">
          
          {/* textLogo: Sembunyi di hp/tablet (hidden), muncul mulai dari desktop (md:block) */}
          <img 
            src={textLogo} 
            alt="Selasar Typography" 
            className="hidden md:block h-20 w-auto object-contain mb-8 drop-shadow-sm"
          />
          
          <form onSubmit={handleLogin} className="w-full max-w-sm flex flex-col gap-4">
            {globalError && <div className="bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm text-center font-medium">{globalError}</div>}

            <div>
              <input 
                type="email" 
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors({...errors, email: ""}); }}
                placeholder="Email" 
                className={`w-full px-4 py-3 rounded-full bg-gray-200 text-gray-700 outline-none focus:ring-2 transition-all ${errors.email ? 'border-2 border-red-500 focus:ring-red-500' : 'focus:ring-green-700'}`}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1 ml-2">{errors.email}</p>}
            </div>

            <div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors({...errors, password: ""}); }}
                placeholder="Password" 
                className={`w-full px-4 py-3 rounded-full bg-gray-200 text-gray-700 outline-none focus:ring-2 transition-all ${errors.password ? 'border-2 border-red-500 focus:ring-red-500' : 'focus:ring-green-700'}`}
              />
              {errors.password && <p className="text-xs text-red-500 mt-1 ml-2">{errors.password}</p>}
            </div>
            
            <button type="submit" className="w-full mt-2 bg-gray-400 hover:bg-green-700 text-white font-semibold py-3 rounded-full transition-all shadow-md cursor-pointer">
              Login
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-600">
            Belum punya akun?{" "}
            <Link to="/register" className="text-green-700 font-semibold hover:underline">
              Daftar di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}