import { useState, useEffect } from "react";
import {   useNavigate } from "react-router-dom";
import Daun from "../assets/daun.png";
import TextSelasar from "../assets/text-logo2.png";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    day: "",
    month: "",
    year: "",
    password: "",
    confirmPassword: "",
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
    setFormData({ ...formData, [e.target.name]: e.target.value });

    if (errors[e.target.name]) {
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors[e.target.name];
        return newErrors;
      });
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    let newErrors = {};

    if (!formData.username) newErrors.username = "Username wajib diisi.";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = "Email wajib diisi.";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Format email tidak valid.";
    }

    const passwordStrongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!formData.password) {
      newErrors.password = "Password wajib diisi.";
    } else if (!passwordStrongRegex.test(formData.password)) {
      newErrors.password = "Min 8 karakter, wajib ada huruf besar & angka.";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Konfirmasi password wajib diisi.";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Password tidak cocok.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const userAccount = {
      name: formData.username,
      email: formData.email,
      birthdate: `${formData.year}-${formData.month}-${formData.day}`,
      password: formData.password,
    };

    localStorage.setItem("selasarUser", JSON.stringify(userAccount));
    alert("Akun berhasil dibuat! Silakan login.");
    
    // Mainkan animasi keluar pas sukses register
    setIsExiting(true);
    setTimeout(() => {
      navigate("/");
    }, 500);
  };

  // Fungsi untuk tombol kembali ke Login dengan animasi
  const handleBackToLogin = (e) => {
    e.preventDefault();
    setIsExiting(true);
    setTimeout(() => {
      navigate("/");
    }, 500);
  };

  return (
    <div className="min-h-screen bg-neutral-800 flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden">
      {/* Container Utama - Ditambahkan logika animasi transition */}
      <div 
        className={`flex flex-col md:flex-row md:rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl overflow-hidden max-w-[1000px] w-full md:min-h-[300px] bg-[#BCAA97] transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
          isExiting 
            ? "opacity-0 scale-105 -translate-y-12" // Animasi keluar
            : isLoaded 
              ? "opacity-100 scale-100 translate-y-0" // Posisi normal
              : "opacity-0 scale-95 translate-y-12" // Animasi awal masuk
        }`}
      >
        {/* SISI KIRI (Area Form) */}
        <div className="md:w-[60%] flex flex-col relative ">
          {/* Header Cokelat Tua (Hanya muncul di Mobile/sm) */}
          <div className="w-full bg-[#8B7A6A] h-20 sm:h-24 flex items-center px-6 md:hidden">
            <button
              onClick={handleBackToLogin}
              className="w-10 h-10 bg-[#F0EBE3] rounded-full flex items-center justify-center text-[#8B7A6A] hover:bg-white active:scale-95 transition-all shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </button>
          </div>

          {/* Tombol Back Desktop (Muncul di md ke atas) */}
          <button
            onClick={handleBackToLogin}
            className="hidden md:flex absolute top-8 left-8 w-10 h-10 bg-[#F0EBE3] rounded-full items-center justify-center text-[#8B7A6A] hover:bg-white active:scale-95 transition-all shadow-md z-10 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </button>

          {/* Kolom Krem (Form Inputs) */}
          <div className="w-full flex-grow p-6 sm:p-8 md:px-12 lg:px-16 md:my-20 flex flex-col justify-center ">
            <form onSubmit={handleRegister} className="w-full flex flex-col gap-4">
              {/* Profile Section */}
              <div>
                <p className="text-[#7D7063] font-medium text-sm mb-2">Profile</p>
                <div className="flex flex-col gap-6">
                  <div className="relative">
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Username"
                      className={`w-full px-4 py-3 text-sm sm:text-base rounded-full bg-[#EBE5DC] text-gray-700 placeholder-gray-400 outline-none focus:ring-2 transition-all ${errors.username ? "ring-2 ring-red-500" : "focus:ring-[#52413E]"}`}
                    />
                    {errors.username && <p className="absolute left-3 top-full mt-1 text-xs text-red-600 font-medium">{errors.username}</p>}
                  </div>

                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Email"
                      className={`w-full px-4 py-3 text-sm sm:text-base rounded-full bg-[#EBE5DC] text-gray-700 placeholder-gray-400 outline-none focus:ring-2 transition-all ${errors.email ? "ring-2 ring-red-500" : "focus:ring-[#52413E]"}`}
                    />
                    {errors.email && <p className="absolute left-3 top-full mt-1 text-xs text-red-600 font-medium">{errors.email}</p>}
                  </div>
                </div>
              </div>

              {/* Birthdate Section */}
              <div className="mt-2">
                <p className="text-[#7D7063] font-medium text-sm mb-2">Birthdate</p>
                <div className="flex gap-2 w-full">
                  <input
                    type="text"
                    name="day"
                    maxLength="2"
                    value={formData.day}
                    onChange={handleChange}
                    placeholder="DD"
                    className="w-1/4 px-2 py-3 text-sm sm:text-base text-center rounded-full bg-[#EBE5DC] text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#52413E] transition-all"
                  />
                  <input
                    type="text"
                    name="month"
                    maxLength="2"
                    value={formData.month}
                    onChange={handleChange}
                    placeholder="MM"
                    className="w-1/4 px-2 py-3 text-sm sm:text-base text-center rounded-full bg-[#EBE5DC] text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#52413E] transition-all"
                  />
                  
                  {/* YYYY & Calendar */}
                  <div className="w-2/4 relative flex items-center">
                    <input
                      type="text"
                      name="year"
                      maxLength="4"
                      value={formData.year}
                      onChange={handleChange}
                      placeholder="YYYY"
                      className="w-full pl-2 pr-10 py-3 text-sm sm:text-base text-center rounded-full bg-[#EBE5DC] text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#52413E] transition-all"
                    />
                    <div className="absolute right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden hover:bg-[#7d6858] transition-colors ">
                      <div className="w-full h-full bg-[#937C6A] flex items-center justify-center text-white rounded-lg ">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                        </svg>
                      </div>
                      <input
                        type="date"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => {
                          if (!e.target.value) return;
                          const [year, month, day] = e.target.value.split("-");
                          setFormData((prev) => ({ ...prev, day, month, year }));
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Password Section */}
              <div className="mt-2">
                <p className="text-[#7D7063] font-medium text-sm mb-2">Password</p>
                <div className="flex flex-col gap-6">
                  <div className="relative">
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Password"
                      className={`w-full px-4 py-3 text-sm sm:text-base rounded-full bg-[#EBE5DC] text-gray-700 placeholder-gray-400 outline-none focus:ring-2 transition-all ${errors.password ? "ring-2 ring-red-500" : "focus:ring-[#52413E]"}`}
                    />
                    {errors.password && <p className="absolute left-3 top-full mt-1 text-xs text-red-600 font-medium leading-tight">{errors.password}</p>}
                  </div>

                  <div className="relative">
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirmation password"
                      className={`w-full px-4 py-3 text-sm sm:text-base rounded-full bg-[#EBE5DC] text-gray-700 placeholder-gray-400 outline-none focus:ring-2 transition-all ${errors.confirmPassword ? "ring-2 ring-red-500" : "focus:ring-[#52413E]"}`}
                    />
                    {errors.confirmPassword && <p className="absolute left-3 top-full mt-1 text-xs text-red-600 font-medium leading-tight">{errors.confirmPassword}</p>}
                  </div>
                </div>
              </div>

              {/* Tombol Register */}
              <button
                type="submit"
                className="w-full mt-4 bg-[#4A3B38] hover:bg-[#342927] active:scale-95 text-white font-semibold py-3 rounded-full transition-all shadow-md text-sm sm:text-base cursor-pointer"
              >
                Register
              </button>
            </form>
          </div>
        </div>

        {/* SISI KANAN (Area Logo) */}
        <div className="hidden md:flex md:w-[40%] bg-[#EDE8DE] flex-col items-center justify-center p-10 relative">
          <img src={Daun} alt="Daun" className="absolute -top-20 right-0 w-100 opacity-90 transition-transform duration-1000 hover:rotate-6" />
          <img src={TextSelasar} alt="Logo Selasar" className="lg:w-700 translate-y-[-20px] h-auto object-contain z-10 hover:scale-105 transition-transform duration-300" />
        </div>
      </div>
    </div>
  );
}