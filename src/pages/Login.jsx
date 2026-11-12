import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  auth,
  googleProvider,
  facebookProvider,
  githubProvider,
} from "../data/firebase";
import { useTheme } from "../context/ThemeContext";
import { placesData } from "../data/place";
import { apiLogin, apiSocialLogin } from "../services/api";

import logoSelasar from "../assets/Logo.png";
import Daun from "../assets/Daun.png";

import {
  X,
  Eye,
  EyeOff,
  QrCode,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  Smartphone,
  ShieldAlert,
} from "lucide-react";

// STORAGE KEYS FOR PERSISTENT BRUTE-FORCE DEFENSE
const STORAGE_LOCKOUT_KEY = "selasar_sec_lockout_until";
const STORAGE_ATTEMPTS_KEY = "selasar_sec_failed_attempts";

// INPUT SANITIZER
const sanitizeInput = (val) => {
  if (typeof val !== "string") return "";
  return val.replace(/[<>]/g, "").trim();
};

export default function Login() {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();
  const modalScrollRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);

  // Security Anti-Bot Honeypot & Timing
  const [honeypot, setHoneypot] = useState("");
  const formMountTime = useRef(0);

  useEffect(() => {
    formMountTime.current = Date.now();
  }, []);

  // Modal State Reset Password
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetStatus, setResetStatus] = useState({ type: "", msg: "" });
  const [isResetSending, setIsResetSending] = useState(false);

  // Persistent Brute-Force & Lockout States
  const [failedAttempts, setFailedAttempts] = useState(() => {
    try {
      return parseInt(localStorage.getItem(STORAGE_ATTEMPTS_KEY) || "0", 10);
    } catch {
      return 0;
    }
  });

  const [lockoutTimer, setLockoutTimer] = useState(() => {
    try {
      const until = parseInt(
        localStorage.getItem(STORAGE_LOCKOUT_KEY) || "0",
        10,
      );
      const remaining = Math.ceil((until - Date.now()) / 1000);
      return remaining > 0 ? remaining : 0;
    } catch {
      return 0;
    }
  });

  // UI / Animation States
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qrScannedSuccess, setQrScannedSuccess] = useState(false);
  const [showMobileQr, setShowMobileQr] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 40);
    return () => clearTimeout(timer);
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutTimer <= 0) return;
    const interval = setInterval(() => {
      try {
        const until = parseInt(
          localStorage.getItem(STORAGE_LOCKOUT_KEY) || "0",
          10,
        );
        const rem = Math.ceil((until - Date.now()) / 1000);
        if (rem <= 0) {
          setLockoutTimer(0);
          localStorage.removeItem(STORAGE_LOCKOUT_KEY);
          clearInterval(interval);
        } else {
          setLockoutTimer(rem);
        }
      } catch {
        setLockoutTimer((prev) => (prev > 1 ? prev - 1 : 0));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => navigate("/"), 350);
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (isResetModalOpen) {
          setIsResetModalOpen(false);
        } else {
          handleClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isResetModalOpen, handleClose]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name] || errors.general) {
      setErrors({ ...errors, [e.target.name]: "", general: "" });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (lockoutTimer > 0) return;

    // BOT DEFENSE 1: Honeypot check
    if (honeypot.trim() !== "") {
      console.warn("Bot automated submission detected via honeypot.");
      setErrors({ general: "Terdeteksi aktivitas mencurigakan dari bot." });
      return;
    }

    // BOT DEFENSE 2: Timing submission check (< 1200ms)
    if (Date.now() - formMountTime.current < 1200) {
      setErrors({
        general: "Interaksi terlalu cepat. Mohon coba sesaat lagi.",
      });
      return;
    }

    const cleanEmail = sanitizeInput(formData.email);
    const cleanPassword = formData.password;

    let newErrors = {};
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!cleanEmail) {
      newErrors.email = "Email wajib diisi.";
    } else if (!emailRegex.test(cleanEmail)) {
      newErrors.email = "Format email tidak valid.";
    }

    if (!cleanPassword) {
      newErrors.password = "Password wajib diisi.";
    }

    if (!isCaptchaVerified) {
      newErrors.captcha = "Selesaikan geser verifikasi keamanan.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Verifikasi dan autentikasi LANGSUNG ke Database PostgreSQL (selasar-db)
      const dbResponse = await apiLogin({
        email: cleanEmail,
        password: cleanPassword,
      });

      const dbUser = dbResponse.data;
      console.log(
        "Login sukses terverifikasi dari PostgreSQL selasar-db:",
        dbUser,
      );

      // 2. Hubungkan ke Firebase Auth (opsional/hybrid)
      let fbToken = null;
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          cleanEmail,
          cleanPassword,
        );
        fbToken = userCredential.user.accessToken;
      } catch (fbErr) {
        console.warn("Firebase signin skip/hybrid:", fbErr.message);
      }

      // 3. Reset lockout counter on success
      localStorage.removeItem(STORAGE_LOCKOUT_KEY);
      localStorage.removeItem(STORAGE_ATTEMPTS_KEY);

      localStorage.setItem("isLoggedIn", "true");
      if (fbToken) localStorage.setItem("authToken", fbToken);
      localStorage.setItem(
        "selasarUser",
        JSON.stringify({
          id: dbUser.id,
          name: dbUser.display_name || dbUser.username,
          username: dbUser.username,
          email: dbUser.email,
          uid: dbUser.id,
          role: dbUser.role || "user",
          photo: dbUser.avatar_url || null,
        }),
      );

      setIsExiting(true);
      setTimeout(() => navigate("/beranda"), 400);
    } catch (error) {
      console.error("Login Error:", error);
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      localStorage.setItem(STORAGE_ATTEMPTS_KEY, String(nextAttempts));

      // PROGRESSIVE LOCKOUT SYSTEM
      if (nextAttempts >= 5) {
        const lockSec = 300;
        setLockoutTimer(lockSec);
        localStorage.setItem(
          STORAGE_LOCKOUT_KEY,
          String(Date.now() + lockSec * 1000),
        );
        setErrors({
          password: `Terlalu banyak percobaan gagal (${nextAttempts}x). Sistem dikunci selama 5 menit untuk alasan keamanan.`,
        });
      } else if (nextAttempts >= 4) {
        const lockSec = 60;
        setLockoutTimer(lockSec);
        localStorage.setItem(
          STORAGE_LOCKOUT_KEY,
          String(Date.now() + lockSec * 1000),
        );
        setErrors({
          password: `Percobaan ke-4 gagal. Sistem dikunci 60 detik.`,
        });
      } else if (nextAttempts >= 3) {
        const lockSec = 30;
        setLockoutTimer(lockSec);
        localStorage.setItem(
          STORAGE_LOCKOUT_KEY,
          String(Date.now() + lockSec * 1000),
        );
        setErrors({
          password: `3x percobaan salah. Sistem dikunci 30 detik demi keamanan akun Anda.`,
        });
      } else {
        const errMsg = error.message || "";
        if (
          errMsg.includes("tidak cocok") ||
          errMsg.includes("belum terdaftar")
        ) {
          setErrors({
            password: `Email atau password salah. (Sisa percobaan sebelum terkunci: ${3 - nextAttempts})`,
          });
        } else {
          setErrors({
            general:
              errMsg || "Gagal masuk ke sistem database. Cek koneksi backend.",
          });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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

      localStorage.removeItem(STORAGE_LOCKOUT_KEY);
      localStorage.removeItem(STORAGE_ATTEMPTS_KEY);

      // Simpan akun sosial LANGSUNG ke Database PostgreSQL (selasar-db)
      const dbUser = await apiSocialLogin({
        firebase_uid: user.uid,
        email: user.email,
        display_name: user.displayName || `${providerName} User`,
        avatar_url: user.photoURL,
      }).catch((err) => console.warn("Social DB sync warning:", err));

      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("authToken", user.accessToken);
      localStorage.setItem(
        "selasarUser",
        JSON.stringify({
          id: dbUser?.data?.id,
          name: user.displayName || `${providerName} User`,
          email: user.email,
          uid: user.uid,
          photo: user.photoURL,
        }),
      );

      setIsExiting(true);
      setTimeout(() => navigate("/beranda"), 400);
    } catch (error) {
      console.error("Social Auth Error:", error);
      if (error.code === "auth/popup-closed-by-user") return;

      if (error.code === "auth/account-exists-with-different-credential") {
        setErrors({
          general:
            "Email ini sudah terdaftar dengan metode login yang berbeda.",
        });
      } else if (error.code === "auth/popup-blocked") {
        setErrors({
          general: "Popup diblokir oleh browser. Izinkan popup untuk login.",
        });
      } else {
        setErrors({
          general: `Gagal masuk via ${providerName}. ${error.message}`,
        });
      }
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleSimulateQrScan = () => {
    setQrScannedSuccess(true);
    setTimeout(() => {
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem(
        "selasarUser",
        JSON.stringify({
          name: "Pengguna Selasar Mobile",
          email: "mobile.user@selasar.app",
          photo: null,
        }),
      );
      setIsExiting(true);
      setTimeout(() => navigate("/beranda"), 400);
    }, 1200);
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
    const cleanMail = sanitizeInput(resetEmail);
    if (!cleanMail) {
      setResetStatus({ type: "error", msg: "Masukkan alamat email Anda." });
      return;
    }

    setIsResetSending(true);
    setResetStatus({ type: "", msg: "" });

    try {
      await sendPasswordResetEmail(auth, cleanMail);
      setResetStatus({
        type: "success",
        msg: "Link reset password telah dikirim ke email Anda! Periksa folder Inbox atau Spam.",
      });
    } catch (error) {
      console.error("Firebase Reset Password Error:", error);
      if (error.code === "auth/user-not-found") {
        setResetStatus({
          type: "error",
          msg: "Email ini belum terdaftar di Selasar.",
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

  const samplePlaces = placesData.slice(0, 8);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-3 sm:p-5 md:p-8 overflow-hidden select-none bg-[#EBE7DF] dark:bg-[#1A1614] transition-colors duration-500">
      {/* ATMOSPHERIC PINTEREST-LIKE BACKDROP */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30 dark:opacity-20 transition-opacity duration-700">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4 transform scale-105 filter blur-sm">
          {samplePlaces.map((place) => (
            <div
              key={place.id}
              className="rounded-3xl overflow-hidden shadow-lg aspect-square bg-[#8B6B4F]/20"
            >
              <img
                src={place.image}
                alt={place.name}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {/* BACKDROP OVERLAY */}
      <div
        onClick={handleClose}
        className="absolute inset-0 bg-[#EBE7DF]/75 dark:bg-[#181412]/85 backdrop-blur-md transition-opacity duration-500 cursor-pointer"
        aria-label="Tutup dialog"
      />

      {/* FLOATING DECORATIVE LEAF ACCENT */}
      <img
        src={Daun}
        alt=""
        aria-hidden="true"
        className="absolute -top-16 -right-16 w-64 md:w-80 opacity-20 dark:opacity-10 pointer-events-none transition-all duration-1000 rotate-12"
      />

      {/* PINTEREST-STYLE AUTH CARD CONTAINER */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative z-10 w-full max-w-[890px] my-auto transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isExiting
            ? "opacity-0 scale-95 translate-y-6"
            : isLoaded
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 translate-y-8"
        }`}
      >
        {/* TOP-RIGHT ACTION CONTROLS (Pinned precisely in the top-right corner of the modal) */}
        <div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-30 flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={toggleDarkMode}
            className="w-10 h-10 rounded-full border border-gray-200 dark:border-[#403732] bg-white/95 dark:bg-[#2A2521]/95 backdrop-blur-md text-[#594A42] dark:text-[#F5F2EB] flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#3B322D] active:scale-95 transition-all shadow-md cursor-pointer"
            aria-label="Ganti mode gelap/terang"
            title="Ganti Tema"
          >
            {darkMode ? (
              <Sun size={17} className="text-amber-400" />
            ) : (
              <Moon size={17} />
            )}
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="w-10 h-10 rounded-full border border-gray-200 dark:border-[#403732] bg-white/95 dark:bg-[#2A2521]/95 backdrop-blur-md text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#3B322D] active:scale-95 transition-all shadow-md cursor-pointer"
            aria-label="Tutup dan kembali ke beranda"
            title="Tutup (Esc)"
          >
            <X size={20} strokeWidth={2.2} />
          </button>
        </div>

        {/* MODAL CARD INTERIOR (Scrolls up and down seamlessly without buttons or scrollbars) */}
        <div
          ref={modalScrollRef}
          className="w-full max-h-[88vh] overflow-y-auto scroll-smooth scrollbar-none overscroll-contain bg-white dark:bg-[#2A2521] border border-gray-200/80 dark:border-[#3D342D] rounded-[32px] sm:rounded-[36px] shadow-[0_25px_60px_-15px_rgba(89,74,66,0.25)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] flex flex-col md:flex-row [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {/* LEFT COLUMN: PINTEREST-STYLE LOGIN FORM */}
          <div className="w-full md:w-[56%] p-7 sm:p-9 md:p-11 flex flex-col justify-between relative">
            <div>
              {/* BRAND LOGO BADGE */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-20 h-20 rounded-2xl  flex items-center justify-center shadow-md p-1.5 transition-transform duration-300 hover:scale-105 shrink-0">
                  <img
                    src={logoSelasar}
                    alt="Selasar"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#8B6B4F] dark:text-[#C4A876] block">
                    Selasar Login
                  </span>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <ShieldCheck size={13} className="text-emerald-500" />{" "}
                    Proteksi Akun Aktif
                  </span>
                </div>
              </div>

              {/* HEADINGS */}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#594A42] dark:text-[#F5F2EB] tracking-tight mb-2">
                Selamat Datang di Selasar
              </h1>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-6">
                Masuk untuk menemukan sudut nugas terbaikmu
              </p>

              {/* LOCKOUT PROGRESSIVE BANNER WITH COUNTDOWN */}
              {lockoutTimer > 0 && (
                <div className="mb-5 p-4 bg-rose-50 dark:bg-rose-950/50 border-2 border-rose-400/80 rounded-2xl flex items-start gap-3 text-xs text-rose-800 dark:text-rose-200 font-semibold shadow-sm animate-pulse">
                  <ShieldAlert
                    size={18}
                    className="shrink-0 text-rose-600 mt-0.5"
                  />
                  <div>
                    <p className="font-extrabold text-sm mb-0.5">
                      Sistem Dikunci Sementara
                    </p>
                    <p>
                      Terlalu banyak percobaan gagal. Untuk keamanan akun Anda,
                      silakan tunggu{" "}
                      <span className="font-black text-rose-600 dark:text-rose-400 text-sm">
                        {lockoutTimer} detik
                      </span>{" "}
                      sebelum mencoba lagi.
                    </p>
                  </div>
                </div>
              )}

              {errors.general && (
                <div className="mb-5 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-center gap-2.5 text-xs text-rose-800 dark:text-rose-300 font-semibold">
                  <AlertCircle
                    size={16}
                    className="shrink-0 text-rose-600 dark:text-rose-400"
                  />
                  <span>{errors.general}</span>
                </div>
              )}

              {/* LOGIN FORM */}
              <form
                onSubmit={handleLogin}
                className="flex flex-col space-y-3.5"
              >
                {/* BOT DEFENSE HONEYPOT (Hidden from humans, bots will fill this) */}
                <div className="hidden" aria-hidden="true">
                  <input
                    type="text"
                    name="selasar_security_hp"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                {/* EMAIL FIELD */}
                <div>
                  <label className="block text-xs font-bold text-[#594A42] dark:text-[#F5F2EB] mb-1.5 pl-1">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      autoComplete="username"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={lockoutTimer > 0 || isSubmitting}
                      placeholder="nama@email.com"
                      className={`w-full px-4 sm:px-5 py-3.5 rounded-2xl bg-white dark:bg-[#1F1B18] text-gray-900 dark:text-[#F5F2EB] text-sm font-medium border-2 transition-all outline-none placeholder-gray-400 ${
                        errors.email
                          ? "border-rose-400 focus:border-rose-500"
                          : "border-gray-200 dark:border-[#3D342D] focus:border-[#594A42] dark:focus:border-[#C4A876]"
                      } ${lockoutTimer > 0 ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-[#28221E]" : ""}`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1.5 pl-1 flex items-center gap-1">
                      <AlertCircle size={13} /> {errors.email}
                    </p>
                  )}
                </div>

                {/* PASSWORD FIELD WITH TOGGLE */}
                <div>
                  <div className="flex items-center justify-between mb-1.5 pl-1">
                    <label className="text-xs font-bold text-[#594A42] dark:text-[#F5F2EB]">
                      Password
                    </label>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      autoComplete="current-password"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={lockoutTimer > 0 || isSubmitting}
                      placeholder="Masukkan password kamu"
                      className={`w-full pl-4 sm:pl-5 pr-12 py-3.5 rounded-2xl bg-white dark:bg-[#1F1B18] text-gray-900 dark:text-[#F5F2EB] text-sm font-medium border-2 transition-all outline-none placeholder-gray-400 ${
                        errors.password
                          ? "border-rose-400 focus:border-rose-500"
                          : "border-gray-200 dark:border-[#3D342D] focus:border-[#594A42] dark:focus:border-[#C4A876]"
                      } ${lockoutTimer > 0 ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-[#28221E]" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      className="absolute right-3.5 p-1.5 text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200 transition-colors cursor-pointer"
                      aria-label={
                        showPassword ? "Sembunyikan password" : "Lihat password"
                      }
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <div className="flex justify-end pr-1 mt-1.5">
                    <button
                      type="button"
                      onClick={handleOpenResetModal}
                      className="text-xs font-bold text-[#8B6B4F] dark:text-[#C4A876] hover:text-[#594A42] dark:hover:text-[#F5F2EB] transition-colors cursor-pointer hover:underline"
                    >
                      Lupa password?
                    </button>
                  </div>

                  {errors.password && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1.5 pl-1 flex items-center gap-1">
                      <AlertCircle size={13} /> {errors.password}
                    </p>
                  )}
                </div>

                {/* SLIDE-TO-VERIFY STRICT INTERACTIVE SECURITY CHALLENGE */}
                <div className="pt-1">
                  <SlideToVerify
                    isVerified={isCaptchaVerified}
                    onVerify={(val) => {
                      setIsCaptchaVerified(val);
                      if (errors.captcha) setErrors({ ...errors, captcha: "" });
                    }}
                    disabled={lockoutTimer > 0}
                  />
                  {errors.captcha && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold pl-1 mt-1 flex items-center gap-1">
                      <AlertCircle size={13} /> {errors.captcha}
                    </p>
                  )}
                </div>

                {/* PRIMARY PILL BUTTON */}
                <button
                  type="submit"
                  disabled={lockoutTimer > 0 || isSubmitting}
                  className={`w-full py-3.5 px-6 rounded-full font-extrabold text-sm transition-all duration-300 shadow-md cursor-pointer mt-2 text-white ${
                    lockoutTimer > 0 || isSubmitting
                      ? "bg-gray-300 dark:bg-[#3D342D] text-gray-500 cursor-not-allowed"
                      : "bg-[#594A42] hover:bg-[#433731] active:scale-[0.98] hover:shadow-lg"
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Memverifikasi kredensial...
                    </span>
                  ) : (
                    "Masuk"
                  )}
                </button>

                {/* OR DIVIDER */}
                <div className="flex items-center py-2">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-[#3D342D]" />
                  <span className="px-3 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                    ATAU
                  </span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-[#3D342D]" />
                </div>

                {/* GOOGLE BUTTON */}
                <button
                  type="button"
                  onClick={() => handleSocialLogin("Google")}
                  disabled={loadingProvider !== null || lockoutTimer > 0}
                  className="w-full py-3.5 px-4 rounded-full border-2 border-gray-200 dark:border-[#3D342D] bg-white dark:bg-[#1F1B18] hover:bg-gray-50 dark:hover:bg-[#25201C] text-gray-800 dark:text-gray-200 font-bold text-sm flex items-center justify-center gap-3 transition-all duration-300 shadow-sm active:scale-[0.98] cursor-pointer"
                >
                  {loadingProvider === "Google" ? (
                    <span className="flex items-center gap-2 text-xs">
                      <svg
                        className="animate-spin h-4 w-4 text-[#594A42]"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Menghubungkan ke Google...
                    </span>
                  ) : (
                    <>
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <span>Lanjut dengan Google</span>
                    </>
                  )}
                </button>

                {/* COMPACT ALTERNATIVE LOGINS (Facebook & GitHub) */}
                <div className="flex items-center justify-center gap-2 pt-1 text-xs text-gray-500 dark:text-gray-400">
                  <span>Atau masuk via:</span>
                  <button
                    type="button"
                    onClick={() => handleSocialLogin("Facebook")}
                    disabled={loadingProvider !== null || lockoutTimer > 0}
                    className="px-3 py-1.5 rounded-full border border-gray-200 dark:border-[#3D342D] hover:bg-gray-100 dark:hover:bg-[#201B17] font-semibold text-[#1877F2] transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <svg
                      className="w-3.5 h-3.5 fill-current"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span>Facebook</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSocialLogin("GitHub")}
                    disabled={loadingProvider !== null || lockoutTimer > 0}
                    className="px-3 py-1.5 rounded-full border border-gray-200 dark:border-[#3D342D] hover:bg-gray-100 dark:hover:bg-[#201B17] font-semibold text-gray-800 dark:text-gray-200 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <svg
                      className="w-3.5 h-3.5 fill-current"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      />
                    </svg>
                    <span>GitHub</span>
                  </button>
                </div>

                {/* MOBILE TOGGLE FOR QR SCAN */}
                <div className="md:hidden pt-2">
                  <button
                    type="button"
                    onClick={() => setShowMobileQr(!showMobileQr)}
                    className="w-full py-2.5 px-4 rounded-2xl bg-gray-100 dark:bg-[#1F1B18] text-xs font-bold text-[#594A42] dark:text-[#C4A876] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <QrCode size={16} />
                    <span>
                      {showMobileQr
                        ? "Sembunyikan QR Code"
                        : "Atau Masuk dengan Scan QR"}
                    </span>
                  </button>
                </div>

                {/* MOBILE EXPANDED QR CODE */}
                {showMobileQr && (
                  <div className="md:hidden p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#1F1B18] border border-gray-200 dark:border-[#3D342D] flex flex-col items-center text-center animate-fade-in">
                    <div className="w-36 h-36 bg-white p-2.5 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-center">
                      <QrCodeGraphic size={120} />
                    </div>
                    <p className="text-xs font-semibold text-[#594A42] dark:text-[#F5F2EB] mt-3">
                      Scan via aplikasi kamera ponselmu
                    </p>
                    <button
                      type="button"
                      onClick={handleSimulateQrScan}
                      className="mt-2 text-[11px] font-bold text-[#8B6B4F] dark:text-[#C4A876] hover:underline"
                    >
                      Simulasi Scan Masuk
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* FOOTER SWITCH TO REGISTER & TERMS */}
            <div className="mt-8 pt-4 border-t border-gray-100 dark:border-[#3D342D]/60 text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                Belum punya akun di Selasar?{" "}
                <Link
                  to="/register"
                  className="font-extrabold text-[#594A42] dark:text-[#F5F2EB] hover:text-[#8B6B4F] dark:hover:text-[#C4A876] underline underline-offset-2 ml-1"
                >
                  Daftar sekarang
                </Link>
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2">
                Ketentuan Layanan &bull; Kebijakan Privasi &bull; Selasar
                Indonesia
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: PINTEREST-STYLE QR CODE SCANNER */}
          <div className="hidden md:flex md:w-[44%] border-l border-gray-100 dark:border-[#3D342D] bg-[#FAF8F5]/80 dark:bg-[#221D1A]/80 p-8 sm:p-10 flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#8B6B4F]/5 dark:bg-[#C4A876]/5 rounded-full blur-3xl pointer-events-none" />

            {/* QR CODE CARD */}
            <div
              className="relative group cursor-pointer"
              onClick={handleSimulateQrScan}
              title="Klik untuk simulasi scan instan"
            >
              <div className="w-56 h-56 bg-white dark:bg-[#1A1614] rounded-3xl p-4 shadow-[0_15px_35px_-10px_rgba(89,74,66,0.18)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] border border-gray-200/80 dark:border-[#3D342D] flex flex-col items-center justify-center relative transition-transform duration-500 group-hover:scale-105">
                <QrCodeGraphic size={190} />

                {/* INSTANT SCAN SIMULATION BADGE OVERLAY */}
                {qrScannedSuccess && (
                  <div className="absolute inset-0 bg-[#594A42]/95 rounded-3xl flex flex-col items-center justify-center text-white p-4 animate-fade-in">
                    <CheckCircle2
                      size={40}
                      className="text-emerald-400 mb-2 animate-bounce"
                    />
                    <p className="text-xs font-bold">QR Terverifikasi!</p>
                    <p className="text-[10px] text-gray-200 mt-1">
                      Mengalihkan ke beranda...
                    </p>
                  </div>
                )}
              </div>

              {/* SIMULATE SCAN FLOATING PILL */}
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-[#2A2521] border border-gray-200 dark:border-[#3D342D] shadow-sm text-[11px] font-bold text-[#8B6B4F] dark:text-[#C4A876] transition-all group-hover:border-[#8B6B4F]">
                <Sparkles size={12} />
                <span>Klik QR untuk simulasi masuk</span>
              </div>
            </div>

            <div className="mt-6 max-w-[280px]">
              <h3 className="text-base font-extrabold text-[#594A42] dark:text-[#F5F2EB] leading-snug">
                Atau,{" "}
                <span className="text-[#8B6B4F] dark:text-[#C4A876]">
                  masuk instan
                </span>{" "}
                dengan scan kode lewat ponselmu
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium leading-relaxed">
                Buka kamera ponsel kamu dan arahkan ke kode QR ini untuk login
                cepat tanpa perlu mengetik kata sandi.
              </p>
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-[#594A42]/70 dark:text-[#F5F2EB]/70">
              <Smartphone size={15} />
              <span>Tersambung ke Selasar App</span>
            </div>
          </div>
        </div>
      </div>

      {/* PASSWORD RESET MODAL */}
      {isResetModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
          onClick={handleCloseResetModal}
        >
          <div
            className="bg-white dark:bg-[#2A2521] border border-gray-200 dark:border-[#3D342D] w-full max-w-md max-h-[85vh] overflow-y-auto scrollbar-none rounded-[32px] p-7 sm:p-9 shadow-2xl relative transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCloseResetModal}
              className="absolute top-5 right-5 w-9 h-9 rounded-full border border-gray-200 dark:border-[#403732] bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-300 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Tutup"
            >
              <X size={18} />
            </button>

            <div className="w-11 h-11 rounded-2xl bg-[#594A42]/10 dark:bg-[#8B6B4F]/20 text-[#594A42] dark:text-[#C4A876] flex items-center justify-center mb-4">
              <Sparkles size={20} />
            </div>

            <h3 className="text-xl font-extrabold text-[#594A42] dark:text-[#F5F2EB] mb-2 tracking-tight">
              Reset Password
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 font-medium mb-5 leading-relaxed">
              Masukkan alamat email yang terdaftar di akun Selasar kamu. Kami
              akan mengirimkan tautan untuk membuat password baru.
            </p>

            {resetStatus.msg && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-semibold mb-4 flex items-center gap-2.5 ${
                  resetStatus.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                    : "bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
                }`}
              >
                {resetStatus.type === "success" ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                <span>{resetStatus.msg}</span>
              </div>
            )}

            <form onSubmit={handleSendResetLink} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#594A42] dark:text-[#F5F2EB] pl-1 block mb-1.5">
                  Email Terdaftar
                </label>
                <input
                  type="email"
                  autoFocus
                  autoComplete="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full px-5 py-3.5 rounded-2xl bg-white dark:bg-[#1F1B18] text-gray-900 dark:text-[#F5F2EB] text-sm font-medium outline-none border-2 border-gray-200 dark:border-[#3D342D] focus:border-[#594A42] dark:focus:border-[#C4A876] transition-all placeholder-gray-400"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseResetModal}
                  className="w-1/2 py-3.5 rounded-full font-bold text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isResetSending}
                  className="w-1/2 py-3.5 rounded-full font-extrabold text-xs text-white bg-[#594A42] hover:bg-[#433731] transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isResetSending ? "Mengirim..." : "Kirim Tautan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// SLIDE-TO-VERIFY STRICT BOT DEFENSE COMPONENT
export function SlideToVerify({ isVerified, onVerify, disabled }) {
  const [sliderPosition, setSliderPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef(null);

  const handleStart = (clientX) => {
    if (isVerified || disabled) return;
    setIsDragging(true);
  };

  const handleMove = (clientX) => {
    if (!isDragging || isVerified || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const handleWidth = 44;
    const maxTrack = rect.width - handleWidth;
    let newX = clientX - rect.left - handleWidth / 2;
    if (newX < 0) newX = 0;
    if (newX > maxTrack) newX = maxTrack;
    setSliderPosition(newX);

    // If dragged >= 90% of track length
    if (newX >= maxTrack * 0.9) {
      setIsDragging(false);
      setSliderPosition(maxTrack);
      onVerify(true);
    }
  };

  const handleEnd = () => {
    if (!isDragging || isVerified) return;
    setIsDragging(false);
    setSliderPosition(0);
  };

  useEffect(() => {
    const onMouseMove = (e) => handleMove(e.clientX);
    const onMouseUp = () => handleEnd();
    const onTouchMove = (e) => {
      if (e.touches && e.touches[0]) handleMove(e.touches[0].clientX);
    };
    const onTouchEnd = () => handleEnd();

    if (isDragging) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      window.addEventListener("touchmove", onTouchMove);
      window.addEventListener("touchend", onTouchEnd);
    }

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [isDragging, isVerified]);

  return (
    <div
      ref={trackRef}
      className={`w-full h-12 rounded-2xl relative overflow-hidden select-none transition-colors duration-300 flex items-center ${
        isVerified
          ? "bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500/70"
          : "bg-gray-100 dark:bg-[#1F1B18] border-2 border-gray-200 dark:border-[#3D342D]"
      }`}
    >
      {/* Dynamic Slide Background Color */}
      {!isVerified && (
        <div
          className="absolute left-0 top-0 bottom-0 bg-[#594A42]/15 dark:bg-[#8B6B4F]/25 pointer-events-none transition-all duration-75"
          style={{ width: `${sliderPosition + 24}px` }}
        />
      )}

      {/* Label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-4">
        {isVerified ? (
          <span className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 size={16} className="text-emerald-500" />{" "}
            Terverifikasi Aman (Bukan Robot)
          </span>
        ) : (
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wide flex items-center gap-1.5 animate-pulse">
            Geser untuk verifikasi keamanan &gt;&gt;
          </span>
        )}
      </div>

      {/* Slider Thumb Handle */}
      {!isVerified && (
        <div
          onMouseDown={(e) => handleStart(e.clientX)}
          onTouchStart={(e) =>
            e.touches && e.touches[0] && handleStart(e.touches[0].clientX)
          }
          style={{ transform: `translateX(${sliderPosition}px)` }}
          className={`absolute left-1 top-1 bottom-1 w-10 bg-[#594A42] hover:bg-[#433731] text-white rounded-xl flex items-center justify-center cursor-grab active:cursor-grabbing shadow-md transition-shadow z-10 active:scale-95 ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
          title="Geser ke kanan untuk verifikasi"
        >
          <ShieldCheck size={18} />
        </div>
      )}
    </div>
  );
}

// HIGH FIDELITY SELASAR BRANDED QR CODE SVG
function QrCodeGraphic({ size = 180 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-gray-900 dark:text-white"
    >
      <rect x="15" y="15" width="46" height="46" rx="8" fill="currentColor" />
      <rect
        x="23"
        y="23"
        width="30"
        height="30"
        rx="4"
        fill="white"
        className="dark:fill-[#1A1614]"
      />
      <rect x="29" y="29" width="18" height="18" rx="3" fill="currentColor" />

      <rect x="139" y="15" width="46" height="46" rx="8" fill="currentColor" />
      <rect
        x="147"
        y="23"
        width="30"
        height="30"
        rx="4"
        fill="white"
        className="dark:fill-[#1A1614]"
      />
      <rect x="153" y="29" width="18" height="18" rx="3" fill="currentColor" />

      <rect x="15" y="139" width="46" height="46" rx="8" fill="currentColor" />
      <rect
        x="23"
        y="147"
        width="30"
        height="30"
        rx="4"
        fill="white"
        className="dark:fill-[#1A1614]"
      />
      <rect x="29" y="153" width="18" height="18" rx="3" fill="currentColor" />

      <rect x="71" y="20" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="85" y="20" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="99" y="20" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="113" y="20" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="127" y="20" width="8" height="8" rx="2" fill="currentColor" />

      <rect x="71" y="34" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="99" y="34" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="127" y="34" width="8" height="8" rx="2" fill="currentColor" />

      <rect x="71" y="48" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="85" y="48" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="113" y="48" width="8" height="8" rx="2" fill="currentColor" />

      <rect x="20" y="71" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="34" y="71" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="48" y="71" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="20" y="85" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="48" y="85" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="20" y="99" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="34" y="99" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="48" y="99" width="8" height="8" rx="2" fill="currentColor" />

      <rect x="20" y="113" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="34" y="113" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="48" y="113" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="20" y="127" width="8" height="8" rx="2" fill="currentColor" />

      <rect x="139" y="71" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="153" y="71" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="167" y="71" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="181" y="71" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="139" y="85" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="167" y="85" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="153" y="99" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="181" y="99" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="139" y="113" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="167" y="113" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="139" y="127" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="153" y="127" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="181" y="127" width="8" height="8" rx="2" fill="currentColor" />

      <rect x="71" y="139" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="85" y="139" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="113" y="139" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="127" y="139" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="153" y="139" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="181" y="139" width="8" height="8" rx="2" fill="currentColor" />

      <rect x="71" y="153" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="99" y="153" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="139" y="153" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="167" y="153" width="8" height="8" rx="2" fill="currentColor" />

      <rect x="85" y="167" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="113" y="167" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="127" y="167" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="153" y="167" width="8" height="8" rx="2" fill="currentColor" />

      <rect x="71" y="181" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="99" y="181" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="139" y="181" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="181" y="181" width="8" height="8" rx="2" fill="currentColor" />

      <rect
        x="68"
        y="68"
        width="64"
        height="64"
        rx="18"
        fill="white"
        className="dark:fill-[#1A1614]"
        stroke="#594A42"
        strokeWidth="2.5"
      />

      <g transform="translate(80, 80)">
        <circle cx="20" cy="20" r="18" fill="#594A42" />
        <path d="M12 16C12 21 16 25 21 25C26 25 30 21 30 16H12Z" fill="white" />
        <path
          d="M29 17H31C32.1 17 33 17.9 33 19C33 20.1 32.1 21 31 21H29V17Z"
          stroke="white"
          strokeWidth="1.5"
        />
        <path
          d="M17 11C17 9 19 9 19 7"
          stroke="#C4A876"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M22 12C22 10 24 10 24 8"
          stroke="#C4A876"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
