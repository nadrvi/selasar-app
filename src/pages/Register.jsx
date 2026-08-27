import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signInWithPopup 
} from "firebase/auth";
import { 
  auth, 
  googleProvider, 
  facebookProvider, 
  githubProvider 
} from "../data/firebase";

import Daun from "../assets/Daun.png";
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, text: "", color: "bg-gray-300" };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score: 25, text: "Lemah", color: "bg-rose-500" };
    if (score === 2 || score === 3) return { score: 65, text: "Sedang", color: "bg-amber-500" };
    return { score: 100, text: "Kuat", color: "bg-emerald-500" };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name] || errors.general) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[e.target.name];
        delete updated.general;
        return updated;
      });
    }
  };

  const handleRegister = async (e) => {
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

    if (!isCaptchaVerified) {
      newErrors.captcha = "Centang verifikasi keamanan.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      
      await updateProfile(userCredential.user, {
        displayName: formData.username,
      });

      localStorage.setItem("selasarUser", JSON.stringify({
        name: formData.username,
        email: formData.email,
        birthdate: `${formData.year}-${formData.month}-${formData.day}`,
      }));

      setIsExiting(true);
      setTimeout(() => navigate("/login"), 500);
    } catch (error) {
      console.error("Firebase Register Error:", error);
      if (error.code === "auth/email-already-in-use") {
        setErrors({ email: "Email ini sudah terdaftar di sistem." });
      } else if (error.code === "auth/weak-password") {
        setErrors({ password: "Password terlalu lemah untuk Firebase." });
      } else {
        setErrors({ general: `Gagal mendaftar: ${error.message}` });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = async (providerName) => {
    setLoadingProvider(providerName);
    setErrors({});

    try {
      let provider;
      if (providerName === "Google") provider = googleProvider;
      if (providerName === "Facebook") provider = facebookProvider;
      if (providerName === "GitHub") provider = githubProvider;

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("authToken", user.accessToken);
      localStorage.setItem(
        "selasarUser",
        JSON.stringify({
          name: user.displayName || `${providerName} User`,
          email: user.email,
          photo: user.photoURL,
        })
      );

      setIsExiting(true);
      setTimeout(() => navigate("/beranda"), 500);
    } catch (error) {
      console.error("Social Auth Error:", error);
      if (error.code === "auth/popup-closed-by-user") return;

      if (error.code === "auth/account-exists-with-different-credential") {
        setErrors({ general: "Email ini sudah terdaftar dengan metode login yang berbeda." });
      } else if (error.code === "auth/popup-blocked") {
        setErrors({ general: "Popup diblokir oleh browser. Izinkan popup untuk mendaftar." });
      } else {
        setErrors({ general: `Gagal mendaftar via ${providerName}. ${error.message}` });
      }
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleBackToLogin = (e) => {
    e.preventDefault();
    setIsExiting(true);
    setTimeout(() => navigate("/login"), 500);
  };

  const LoadingSpinner = () => (
    <svg className="animate-spin h-5 w-5 text-[#594A42]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden select-none">
      <div
        className={`flex flex-col md:flex-row rounded-[2.5rem] shadow-2xl overflow-hidden max-w-[1000px] w-full bg-[#BCAA97] transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
          isExiting ? "opacity-0 scale-105 -translate-y-12" : isLoaded ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-12"
        }`}
      >
        <div className="md:w-[60%] flex flex-col justify-center p-6 sm:p-10 md:p-12 relative">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={handleBackToLogin}
              className="w-11 h-11 bg-[#F0EBE3] rounded-full flex items-center justify-center text-[#594A42] hover:bg-white active:scale-95 transition-all shadow-md shrink-0 cursor-pointer"
              aria-label="Kembali"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </button>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#594A42] tracking-tight">Buat Akun Baru</h2>
          </div>

          {errors.general && (
            <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-xs text-rose-800 font-bold">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleRegister} className="w-full flex flex-col space-y-3.5">
            <div className="flex flex-col space-y-1">
              <input
                type="text"
                name="username"
                autoComplete="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Username"
                className={`w-full px-5 py-3.5 text-sm font-medium rounded-full bg-[#EBE5DC] text-gray-800 placeholder-gray-500 outline-none transition-all ${
                  errors.username ? "ring-2 ring-rose-500" : "focus:ring-2 focus:ring-[#594A42]"
                }`}
              />
              {errors.username && <p className="text-[11px] text-rose-700 font-semibold pl-3">{errors.username}</p>}
            </div>

            <div className="flex flex-col space-y-1">
              <input
                type="email"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                className={`w-full px-5 py-3.5 text-sm font-medium rounded-full bg-[#EBE5DC] text-gray-800 placeholder-gray-500 outline-none transition-all ${
                  errors.email ? "ring-2 ring-rose-500" : "focus:ring-2 focus:ring-[#594A42]"
                }`}
              />
              {errors.email && <p className="text-[11px] text-rose-700 font-semibold pl-3">{errors.email}</p>}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <input
                type="text"
                name="day"
                maxLength="2"
                value={formData.day}
                onChange={handleChange}
                placeholder="DD"
                className="w-full px-3 py-3.5 text-sm font-semibold text-center rounded-full bg-[#EBE5DC] text-gray-800 placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#594A42] transition-all"
              />
              <input
                type="text"
                name="month"
                maxLength="2"
                value={formData.month}
                onChange={handleChange}
                placeholder="MM"
                className="w-full px-3 py-3.5 text-sm font-semibold text-center rounded-full bg-[#EBE5DC] text-gray-800 placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#594A42] transition-all"
              />
              <input
                type="text"
                name="year"
                maxLength="4"
                value={formData.year}
                onChange={handleChange}
                placeholder="YYYY"
                className="w-full px-3 py-3.5 text-sm font-semibold text-center rounded-full bg-[#EBE5DC] text-gray-800 placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#594A42] transition-all"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className={`w-full pl-5 pr-12 py-3.5 text-sm font-medium rounded-full bg-[#EBE5DC] text-gray-800 placeholder-gray-500 outline-none transition-all ${
                    errors.password ? "ring-2 ring-rose-500" : "focus:ring-2 focus:ring-[#594A42]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 p-1 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.52 10.52 0 0 1-4.293 5.774M6.228 6.228 17.772 17.772M9.88 9.88a3 3 0 1 0 4.243 4.243" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12c1.349-3.938 5.106-7 9.964-7s8.615 3.062 9.964 7c-1.349 3.938-5.106 7-9.964 7s-8.615-3.062-9.964-7Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>

              {formData.password && (
                <div className="px-3 pt-1">
                  <div className="w-full h-1.5 bg-gray-300 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${passwordStrength.color}`} style={{ width: `${passwordStrength.score}%` }} />
                  </div>
                  <p className="text-[10px] text-[#594A42] font-bold mt-1">Kekuatan: {passwordStrength.text}</p>
                </div>
              )}
              {errors.password && <p className="text-[11px] text-rose-700 font-semibold pl-3">{errors.password}</p>}
            </div>

            <div className="flex flex-col space-y-1">
              <div className="relative flex items-center">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Konfirmasi Password"
                  className={`w-full pl-5 pr-12 py-3.5 text-sm font-medium rounded-full bg-[#EBE5DC] text-gray-800 placeholder-gray-500 outline-none transition-all ${
                    errors.confirmPassword ? "ring-2 ring-rose-500" : "focus:ring-2 focus:ring-[#594A42]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 p-1 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.52 10.52 0 0 1-4.293 5.774M6.228 6.228 17.772 17.772M9.88 9.88a3 3 0 1 0 4.243 4.243" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12c1.349-3.938 5.106-7 9.964-7s8.615 3.062 9.964 7c-1.349 3.938-5.106 7-9.964 7s-8.615-3.062-9.964-7Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-[11px] text-rose-700 font-semibold pl-3">{errors.confirmPassword}</p>}
            </div>

            <div className="bg-[#EBE5DC]/80 p-3.5 rounded-2xl border border-gray-300 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="captcha-reg"
                  checked={isCaptchaVerified}
                  onChange={(e) => setIsCaptchaVerified(e.target.checked)}
                  className="w-4 h-4 accent-[#594A42] rounded cursor-pointer"
                />
                <label htmlFor="captcha-reg" className="text-xs text-[#594A42] font-bold cursor-pointer">
                  Saya bukan robot
                </label>
              </div>
            </div>
            {errors.captcha && <p className="text-[11px] text-rose-700 font-semibold pl-3 -mt-2">{errors.captcha}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#594A42] hover:bg-[#433731] active:scale-[0.98] text-white font-extrabold py-3.5 rounded-full transition-all shadow-md text-sm cursor-pointer mt-2 disabled:opacity-60"
            >
              {isSubmitting ? "Mendaftarkan..." : "Daftar Sekarang"}
            </button>

            {/* Divider */}
            <div className="flex items-center pt-2 pb-1">
              <hr className="flex-1 border-[#594A42]/20" />
              <span className="px-3 text-[10px] text-[#594A42]/80 font-bold tracking-widest uppercase">Atau Daftar Dengan</span>
              <hr className="flex-1 border-[#594A42]/20" />
            </div>

            {/* Social Logins */}
            <div className="flex justify-center items-center gap-4">
              {["Google", "Facebook", "GitHub"].map((prov) => (
                <button
                  key={prov}
                  type="button"
                  onClick={() => handleSocialLogin(prov)}
                  disabled={loadingProvider !== null || isSubmitting}
                  aria-label={`Daftar dengan ${prov}`}
                  className={`w-12 h-12 bg-[#EBE5DC] rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer shadow-md ${
                    loadingProvider === prov ? "opacity-75 scale-95" : "hover:scale-110 hover:shadow-xl active:scale-95"
                  }`}
                >
                  {loadingProvider === prov ? (
                    <LoadingSpinner />
                  ) : prov === "Google" ? (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  ) : prov === "Facebook" ? (
                    <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="#24292F" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </form>
        </div>

        <div className="hidden md:flex md:w-[40%] bg-[#EDE8DE] flex-col items-center justify-center p-8 relative">
          <img src={Daun} alt="" aria-hidden="true" className="absolute -top-16 right-0 w-80 opacity-90 pointer-events-none" />
          <img src={TextSelasar} alt="Logo Selasar" className="w-64 h-auto object-contain z-10 hover:scale-105 transition-transform duration-300" />
        </div>
      </div>
    </div>
  );
}