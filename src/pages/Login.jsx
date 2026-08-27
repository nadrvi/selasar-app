import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  signInWithPopup, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail 
} from "firebase/auth";
import { 
  auth, 
  googleProvider, 
  facebookProvider, 
  githubProvider 
} from "../data/firebase";

import logoSelasar from "../assets/Logo.png";
import Daun from "../assets/Daun.png";
import DaunBawah from "../assets/Daun_half.png";

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);

  // Modal State Reset Password
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetStatus, setResetStatus] = useState({ type: "", msg: "" });
  const [isResetSending, setIsResetSending] = useState(false);

  // Brute Force Protection
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (lockoutTimer <= 0) return;
    const timer = setInterval(() => {
      setLockoutTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutTimer]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isResetModalOpen) {
        setIsResetModalOpen(false);
      }
    };

    if (isResetModalOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isResetModalOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name] || errors.general) {
      setErrors({ ...errors, [e.target.name]: "", general: "" });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (lockoutTimer > 0) return;

    let newErrors = {};
    if (!formData.email) newErrors.email = "Email wajib diisi.";
    if (!formData.password) newErrors.password = "Password wajib diisi.";
    if (!isCaptchaVerified) newErrors.captcha = "Centang verifikasi keamanan.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("authToken", user.accessToken);
      localStorage.setItem("selasarUser", JSON.stringify({
        name: user.displayName || user.email.split("@")[0],
        email: user.email,
        photo: user.photoURL
      }));

      setIsExiting(true);
      setTimeout(() => navigate("/beranda"), 500);
    } catch (error) {
      console.error("Firebase Login Error:", error);
      const nextAttempts = failedAttempts + 1;

      if (nextAttempts >= 3) {
        setLockoutTimer(30);
        setFailedAttempts(0);
        setErrors({ password: "Terlalu banyak percobaan gagal. Akun dikunci 30 detik." });
      } else {
        setFailedAttempts(nextAttempts);
        if (error.code === "auth/invalid-credential" || error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
          setErrors({ password: `Email atau password salah. (Sisa percobaan: ${3 - nextAttempts})` });
        } else {
          setErrors({ general: error.message });
        }
      }
    }
  };

  // FULLY SYNCED THIRD-PARTY LOGIN (Google, Facebook, GitHub)
  const handleSocialLogin = async (providerName) => {
    if (lockoutTimer > 0) return;
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
      localStorage.setItem("selasarUser", JSON.stringify({
        name: user.displayName || `${providerName} User`,
        email: user.email,
        photo: user.photoURL,
      }));

      setIsExiting(true);
      setTimeout(() => navigate("/beranda"), 500);
    } catch (error) {
      console.error("Social Auth Error:", error);
      if (error.code === "auth/popup-closed-by-user") return;

      if (error.code === "auth/account-exists-with-different-credential") {
        setErrors({ general: "Email ini sudah terdaftar dengan metode login yang berbeda." });
      } else if (error.code === "auth/popup-blocked") {
        setErrors({ general: "Popup diblokir oleh browser. Izinkan popup untuk login." });
      } else {
        setErrors({ general: `Gagal masuk via ${providerName}. ${error.message}` });
      }
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleOpenResetModal = (e) => {
    e.preventDefault();
    setResetEmail(formData.email || "");
    setResetStatus({ type: "", msg: "" });
    setIsResetModalOpen(true);
  };

  const handleCloseResetModal = () => {
    setIsResetModalOpen(false);
    setResetStatus({ type: "", msg: "" });
  };

  const handleSendResetLink = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      setResetStatus({ type: "error", msg: "Masukkan alamat email Anda." });
      return;
    }

    setIsResetSending(true);
    setResetStatus({ type: "", msg: "" });

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetStatus({
        type: "success",
        msg: "Link instruksi reset password telah dikirim ke email Anda! Silakan periksa folder Inbox atau Spam.",
      });
    } catch (error) {
      console.error("Firebase Reset Password Error:", error);
      if (error.code === "auth/user-not-found") {
        setResetStatus({
          type: "error",
          msg: "Email ini belum terdaftar di sistem.",
        });
      } else if (error.code === "auth/invalid-email") {
        setResetStatus({
          type: "error",
          msg: "Format email tidak valid.",
        });
      } else {
        setResetStatus({
          type: "error",
          msg: `Gagal mengirim link reset: ${error.message}`,
        });
      }
    } finally {
      setIsResetSending(false);
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

  const LoadingSpinner = () => (
    <svg className="animate-spin h-5 w-5 text-[#594A42]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden select-none">
      <div className={`w-full max-w-[1050px] min-h-[620px] flex flex-col md:flex-row rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
        isExiting ? "opacity-0 scale-105 -translate-y-12" : isLoaded ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-12"
      }`}>

        <div className="hidden md:flex md:w-[50%] bg-[#F0EBE3] items-center justify-center relative overflow-hidden group p-8">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-white/40 rounded-full blur-3xl transition-transform duration-1000 group-hover:scale-125" />
          <img src={logoSelasar} alt="Selasar" className="w-[280px] lg:w-[330px] object-contain transition-transform duration-700 hover:scale-105 relative z-10" />
        </div>

        <div className="w-full md:w-[50%] bg-[#967E72] relative flex flex-col justify-center p-6 sm:p-10 md:p-12 overflow-hidden">
          <img src={Daun} alt="" aria-hidden="true" className="absolute -top-10 -right-6 md:w-52 opacity-75 pointer-events-none z-0" />
          <img src={DaunBawah} alt="" aria-hidden="true" className="absolute -bottom-6 -left-10 md:w-64 opacity-75 pointer-events-none z-0" />

          <div className="flex items-center gap-4 mb-6 relative z-10">
            <button 
              onClick={handleBackToLogin} 
              className="w-11 h-11 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-[#594A42] hover:bg-white active:scale-95 transition-all shadow-md shrink-0 cursor-pointer"
              aria-label="Kembali"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </button>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Selamat Datang!</h2>
          </div>

          <div className="w-full relative z-10 bg-white/10 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl">
            {lockoutTimer > 0 && (
              <div className="mb-5 p-3.5 bg-rose-500/20 border border-rose-300/40 rounded-2xl text-center text-xs text-white font-semibold animate-pulse">
                Sistem dikunci sementara. Coba lagi dalam <span className="font-extrabold text-amber-300">{lockoutTimer}s</span>
              </div>
            )}

            {errors.general && (
              <div className="mb-4 p-3 bg-rose-500/30 border border-rose-300/50 rounded-xl text-xs text-white text-center font-medium">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleLogin} className="flex flex-col w-full space-y-4">
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-bold text-white/90 pl-1">Email</label>
                <input
                  type="email"
                  name="email"
                  autoComplete="username"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={lockoutTimer > 0}
                  placeholder="nama@email.com"
                  className={`w-full px-5 py-3.5 rounded-full bg-white/95 text-gray-800 text-sm font-medium outline-none transition-all placeholder-gray-400 ${
                    errors.email ? "ring-2 ring-rose-400" : "focus:ring-2 focus:ring-[#594A42]"
                  } ${lockoutTimer > 0 ? "opacity-60 cursor-not-allowed" : ""}`}
                />
                {errors.email && <p className="text-[11px] text-rose-200 font-semibold pl-3">{errors.email}</p>}
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-xs font-bold text-white/90 pl-1">Password</label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={lockoutTimer > 0}
                    placeholder="Masukkan password"
                    className={`w-full pl-5 pr-12 py-3.5 rounded-full bg-white/95 text-gray-800 text-sm font-medium outline-none transition-all placeholder-gray-400 ${
                      errors.password ? "ring-2 ring-rose-400" : "focus:ring-2 focus:ring-[#594A42]"
                    } ${lockoutTimer > 0 ? "opacity-60 cursor-not-allowed" : ""}`}
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

                <div className="flex justify-end pr-2 pt-1">
                  <button
                    type="button"
                    onClick={handleOpenResetModal}
                    className="text-xs text-[#F0EBE3] hover:text-white transition-colors font-semibold underline underline-offset-2 cursor-pointer"
                  >
                    Lupa Password?
                  </button>
                </div>

                {errors.password && <p className="text-[11px] text-rose-200 font-semibold pl-3">{errors.password}</p>}
              </div>

              <div className="bg-white/15 backdrop-blur-sm p-3.5 rounded-2xl border border-white/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="captcha"
                    checked={isCaptchaVerified}
                    onChange={(e) => {
                      setIsCaptchaVerified(e.target.checked);
                      if (errors.captcha) setErrors({ ...errors, captcha: "" });
                    }}
                    className="w-4 h-4 accent-[#594A42] rounded cursor-pointer"
                  />
                  <label htmlFor="captcha" className="text-xs text-white font-bold cursor-pointer">
                    Saya bukan robot
                  </label>
                </div>
              </div>
              {errors.captcha && <p className="text-[11px] text-rose-200 font-semibold pl-3 -mt-2">{errors.captcha}</p>}

              <button
                type="submit"
                disabled={lockoutTimer > 0}
                className={`w-full bg-[#594A42] hover:bg-[#433731] active:scale-[0.98] text-white py-3.5 rounded-full font-extrabold text-sm transition-all shadow-lg hover:shadow-xl cursor-pointer mt-2 ${
                  lockoutTimer > 0 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Masuk Ke Akun
              </button>

              <div className="flex items-center pt-2 pb-1">
                <hr className="flex-1 border-white/20" />
                <span className="px-3 text-[10px] text-[#F0EBE3]/80 font-bold tracking-widest uppercase">Atau Lanjut Dengan</span>
                <hr className="flex-1 border-white/20" />
              </div>

              <div className="flex justify-center items-center gap-4">
                {["Google", "Facebook", "GitHub"].map((prov) => (
                  <button
                    key={prov}
                    type="button"
                    onClick={() => handleSocialLogin(prov)}
                    disabled={loadingProvider !== null || lockoutTimer > 0}
                    aria-label={`Login dengan ${prov}`}
                    className={`w-12 h-12 bg-white rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer shadow-md ${
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

              <button 
                type="button" 
                onClick={handleGoToRegister} 
                className="w-full bg-transparent hover:bg-white/10 active:scale-[0.98] text-white py-3 rounded-full text-center border border-white/40 font-bold text-xs transition-all cursor-pointer mt-2"
              >
                Buat Akun Baru
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* MODAL RESET PASSWORD */}
      {isResetModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={handleCloseResetModal}
        >
          <div 
            className="bg-[#EBE7DF] dark:bg-[#2A2521] border border-white/40 dark:border-[#3D342D] w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl relative transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCloseResetModal}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 text-[#594A42] dark:text-[#F5F2EB] flex items-center justify-center hover:bg-black/10 transition-colors cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-xl font-extrabold text-[#594A42] dark:text-[#F5F2EB] mb-2">
              Reset Password
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 font-medium mb-6">
              Masukkan email asli Anda yang terdaftar di Firebase Auth.
            </p>

            {resetStatus.msg && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-semibold mb-4 ${
                  resetStatus.type === "success"
                    ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                    : "bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-400"
                }`}
              >
                {resetStatus.msg}
              </div>
            )}

            <form onSubmit={handleSendResetLink} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#594A42] dark:text-[#F5F2EB] pl-1 block mb-1">
                  Email Terdaftar
                </label>
                <input
                  type="email"
                  autoFocus
                  autoComplete="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full px-5 py-3.5 rounded-full bg-white dark:bg-[#1F1B18] text-gray-800 dark:text-[#F5F2EB] text-sm font-medium outline-none border border-gray-300 dark:border-[#3D342D] focus:ring-2 focus:ring-[#8B6B4F]"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseResetModal}
                  className="w-1/2 py-3.5 rounded-full font-bold text-xs text-[#594A42] dark:text-[#F5F2EB] bg-black/5 dark:bg-white/5 hover:bg-black/10 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isResetSending}
                  className="w-1/2 py-3.5 rounded-full font-bold text-xs text-white bg-[#594A42] hover:bg-[#433731] transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isResetSending ? "Mengirim..." : "Kirim Link Real"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}