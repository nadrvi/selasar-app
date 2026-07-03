import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logoSelasar from "../assets/Logo.png";
import Daun from "../assets/Daun.png";
import DaunBawah from "../assets/Daun_half.png";

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  
  // State untuk animasi
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Trigger animasi masuk
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: "",
      });
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    let newErrors = {};

    if (!formData.email) newErrors.email = "Email wajib diisi.";
    if (!formData.password) newErrors.password = "Password wajib diisi.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const storedUser = JSON.parse(localStorage.getItem("selasarUser"));
    if (!storedUser) {
      setErrors({ email: "Akun tidak ditemukan." });
      return;
    }

    if (
      storedUser.email !== formData.email ||
      storedUser.password !== formData.password
    ) {
      setErrors({ password: "Email atau password salah." });
      return;
    }

    localStorage.setItem("isLoggedIn", "true");
    alert(`Selamat datang, ${storedUser.name}!`);

    setIsExiting(true);
    setTimeout(() => {
      navigate("/beranda");
    }, 500);
  };

  const handleGoToRegister = () => {
    setIsExiting(true);
    setTimeout(() => {
      navigate("/register");
    }, 500); // 500ms delay untuk animasi
  };

  return (
    <div className="min-h-screen bg-neutral-800 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* CARD UTAMA - Ditambahkan logika animasi transition */}
      <div 
        className={`w-full max-w-[1000px] min-h-[600px] flex flex-col md:flex-row rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
          isExiting 
            ? "opacity-0 scale-105 -translate-y-12" // Animasi keluar (Naik & Pudar)
            : isLoaded 
              ? "opacity-100 scale-100 translate-y-0" // Posisi normal
              : "opacity-0 scale-95 translate-y-12" // Animasi masuk awal (Dari bawah ke atas)
        }`}
      >
        {/* MOBILE LOGO */}
        <div className="md:hidden bg-[#F0EBE3] flex justify-center items-center py-10 ">
          <img src={logoSelasar} alt="Selasar" className="w-44 sm:w-52 object-contain" />
        </div>

        {/* LEFT SIDE DESKTOP */}
        <div className="hidden md:flex md:w-[60%] bg-[#F0EBE3] items-center justify-center">
          <img src={logoSelasar} alt="Selasar" className="w-[280px] lg:w-[340px] object-contain transition-transform duration-700 hover:scale-105" />
        </div>

        {/* RIGHT SIDE */}
        <div className="w-full md:w-[40%] bg-[#967E72] relative flex items-center justify-center p-8 sm:p-10 md:p-9 overflow-hidden">
          {/* DAUN ATAS */}
          <img src={Daun} alt="Daun" className="absolute -top-10 right-0 md:w-49 opacity-90 transition-transform duration-1000 hover:rotate-6" />

          {/* DAUN BAWAH */}
          <img src={DaunBawah} alt="Daun" className="absolute -bottom-3 -left-10 md:w-70 opacity-90 transition-transform duration-1000 hover:-rotate-6" />

          {/* FORM */}
          <form onSubmit={handleLogin} className="w-full max-w-[320px] flex flex-col relative z-10 md:translate-y-4">
            
            {/* EMAIL */}
            <div className="mb-2">
              <input
                type="text"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email or Phone Number"
                className={`w-full px-5 py-3 rounded-full bg-[#F2EEE8] text-gray-700 text-sm sm:text-base outline-none transition-all ${
                  errors.email ? "border-2 border-red-500" : "focus:ring-2 focus:ring-[#5B4744]"
                }`}
              />
              <div className="h-5 mt-1">
                {errors.email && <p className="text-xs text-red-200">{errors.email}</p>}
              </div>
            </div>

            {/* PASSWORD */}
            <div className="mb-2">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className={`w-full px-5 py-3 rounded-full bg-[#F2EEE8] text-gray-700 text-sm sm:text-base outline-none transition-all ${
                  errors.password ? "border-2 border-red-500" : "focus:ring-2 focus:ring-[#5B4744]"
                }`}
              />
              <div className="h-5 mt-1">
                {errors.password && <p className="text-xs text-red-200">{errors.password}</p>}
              </div>
            </div>

            {/* LOGIN */}
            <button type="submit" className="w-full bg-[#5B4744] hover:bg-[#463633] active:scale-95 text-white py-3 rounded-full font-semibold transition-all">
              Login
            </button>
            <div className="h-8"></div>

            {/* REGISTER (Diubah dari Link jadi Button) */}
            <button
              type="button"
              onClick={handleGoToRegister}
              className="w-full bg-white hover:bg-gray-100 active:scale-95 text-[#5B4744] py-3 rounded-full text-center border border-[#5B4744] font-semibold transition-all"
            >
              New account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}