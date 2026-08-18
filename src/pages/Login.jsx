import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider, facebookProvider, githubProvider } from "../data/firebase";

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
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  const [loadingProvider, setLoadingProvider] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    let newErrors = {};

    if (!formData.email) newErrors.email = "Email wajib diisi yaa ";
    if (!formData.password) newErrors.password = "Password wajib diisi yaa ";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const storedUser = JSON.parse(localStorage.getItem("selasarUser"));
    if (!storedUser || storedUser.email !== formData.email || storedUser.password !== formData.password) {
      setErrors({ password: "Email atau password salah." });
      return;
    }

    localStorage.setItem("isLoggedIn", "true");
    setIsExiting(true);
    setTimeout(() => navigate("/beranda"), 500);
  };

  // FUNGSI UTAMA: Login Pihak Ketiga (Firebase)
  const handleSocialLogin = async (providerName) => {
    setLoadingProvider(providerName); // Aktifkan loading interaktif
    
    try {
      let provider;
      if (providerName === "Google") provider = googleProvider;
      if (providerName === "Facebook") provider = facebookProvider;
      if (providerName === "GitHub") provider = githubProvider;

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Berhasil Login! Simpan data user ke local storage
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("selasarUser", JSON.stringify({ 
        name: user.displayName || "Selasar Member", 
        email: user.email,
        photo: user.photoURL
      }));

      setIsExiting(true);
      setTimeout(() => navigate("/beranda"), 500);
      
    } catch (error) {
      console.error(error);
      alert(`Gagal login dengan ${providerName}. Detail: ${error.message}`);
    } finally {
      setLoadingProvider(null); // Matikan loading
    }
  };

  const handleGoToRegister = () => {
    setIsExiting(true);
    setTimeout(() => navigate("/register"), 500);
  };

  const handleBackToLogin = (e) => {
    e.preventDefault();
    setIsExiting(true);
    setTimeout(() => navigate("/"), 500);
  };

  // Komponen Spinner Loading (Tailwind)
  const LoadingSpinner = () => (
    <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  return (
    <div className="min-h-screen bg-neutral-800 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div className={`w-full max-w-[1000px] min-h-[600px] flex flex-col md:flex-row rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
        isExiting ? "opacity-0 scale-105 -translate-y-12" : isLoaded ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-12"
      }`}>
        
        {/* MOBILE LOGO */}
        <div className="md:hidden bg-[#F0EBE3] flex justify-center items-center py-10 relative z-20 shadow-md">
          <img src={logoSelasar} alt="Selasar" className="w-44 sm:w-52 object-contain" />
        </div>

        {/* LEFT SIDE DESKTOP */}
        <div className="hidden md:flex md:w-[55%] bg-[#F0EBE3] items-center justify-center relative overflow-hidden group">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/40 rounded-full blur-3xl transition-transform duration-1000 group-hover:scale-150"></div>
          <img src={logoSelasar} alt="Selasar" className="w-[280px] lg:w-[340px] object-contain transition-transform duration-700 hover:scale-105 relative z-10" />
          <button onClick={handleBackToLogin} className="hidden md:flex absolute top-8 left-8 w-11 h-11 bg-white/60 backdrop-blur-md rounded-full items-center justify-center text-[#8B7A6A] hover:bg-white active:scale-95 transition-all shadow-sm z-20">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </button>
        </div>

        {/* RIGHT SIDE */}
        <div className="w-full md:w-[45%] bg-[#967E72] relative flex items-center justify-center p-8 sm:p-10 md:p-12 overflow-hidden">
          <img src={Daun} alt="Daun" className="absolute -top-10 right-0 md:w-49 opacity-80 transition-all duration-1000 hover:rotate-6 hover:scale-105 z-0" />
          <img src={DaunBawah} alt="Daun" className="absolute -bottom-3 -left-10 md:w-70 opacity-80 transition-all duration-1000 hover:-rotate-6 hover:scale-105 z-0" />

          <div className="w-full max-w-[340px] flex flex-col relative z-10 bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] md:translate-y-2">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-white mb-1">Welcome Back!</h2>
              <p className="text-sm text-[#F0EBE3]/80">Please enter your details</p>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col w-full">
              {/* Form Input Biasa */}
              <div className="mb-1">
                <input type="text" name="email" value={formData.email} onChange={handleChange} placeholder="Email" className={`w-full px-5 py-3.5 rounded-full bg-white/90 backdrop-blur-sm text-gray-800 text-sm outline-none ${errors.email ? "border-2 border-red-400" : "border border-transparent focus:border-[#5B4744]"}`} />
              </div>
              <div className="mb-1 mt-3">
                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password" className={`w-full px-5 py-3.5 rounded-full bg-white/90 backdrop-blur-sm text-gray-800 text-sm outline-none ${errors.password ? "border-2 border-red-400" : "border border-transparent focus:border-[#5B4744]"}`} />
              </div>

              <div className="flex justify-end mt-2 mb-4 pr-2">
                <a href="#" className="text-xs text-[#F0EBE3] hover:text-white transition-colors font-medium">Forgot Password?</a>
              </div>

              <button type="submit" className="w-full bg-[#5B4744] hover:bg-[#463633] active:scale-95 text-white py-3.5 rounded-full font-semibold transition-all shadow-lg hover:shadow-xl">
                Log In
              </button>

              <div className="flex items-center my-6">
                <hr className="flex-1 border-white/20" />
                <span className="px-3 text-xs text-[#F0EBE3]/80 font-medium tracking-wide">OR CONTINUE WITH</span>
                <hr className="flex-1 border-white/20" />
              </div>

              {/* 3RD PARTY LOGIN BUTTONS DENGAN LOADING STATE */}
              <div className="flex justify-center items-center gap-4 mb-6">
                {/* Google */}
                <button
                  type="button"
                  onClick={() => handleSocialLogin("Google")}
                  disabled={loadingProvider !== null}
                  className={`w-12 h-12 bg-white rounded-full flex items-center justify-center transition-all duration-300 ${loadingProvider === "Google" ? "opacity-75 cursor-not-allowed scale-95" : "hover:scale-110 hover:shadow-lg active:scale-95"}`}
                >
                  {loadingProvider === "Google" ? <LoadingSpinner /> : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                </button>

                {/* Facebook */}
                <button
                  type="button"
                  onClick={() => handleSocialLogin("Facebook")}
                  disabled={loadingProvider !== null}
                  className={`w-12 h-12 bg-white rounded-full flex items-center justify-center transition-all duration-300 ${loadingProvider === "Facebook" ? "opacity-75 cursor-not-allowed scale-95" : "hover:scale-110 hover:shadow-lg active:scale-95"}`}
                >
                  {loadingProvider === "Facebook" ? <LoadingSpinner /> : (
                    <svg className="w-6 h-6" fill="#1877F2" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  )}
                </button>

                {/* GitHub */}
                <button
                  type="button"
                  onClick={() => handleSocialLogin("GitHub")}
                  disabled={loadingProvider !== null}
                  className={`w-12 h-12 bg-white rounded-full flex items-center justify-center transition-all duration-300 ${loadingProvider === "GitHub" ? "opacity-75 cursor-not-allowed scale-95" : "hover:scale-110 hover:shadow-lg active:scale-95"}`}
                >
                  {loadingProvider === "GitHub" ? <LoadingSpinner /> : (
                    <svg className="w-6 h-6" fill="#24292F" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                  )}
                </button>
              </div>

              <button type="button" onClick={handleGoToRegister} className="w-full bg-transparent hover:bg-white/10 active:scale-95 text-white py-3.5 rounded-full text-center border border-white/40 font-medium transition-all">
                Create new account
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}