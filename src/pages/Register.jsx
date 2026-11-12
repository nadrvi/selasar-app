import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
} from "firebase/auth";
import {
  auth,
  googleProvider,
  facebookProvider,
  githubProvider,
} from "../data/firebase";
import { useTheme } from "../context/ThemeContext";
import { placesData } from "../data/place";
import { apiRegister, apiSocialLogin } from "../services/api";

import logoSelasar from "../assets/Logo.png";
import Daun from "../assets/Daun.png";

import {
  X,
  Eye,
  EyeOff,
  Info,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  Lock,
  Check,
  Sparkles,
} from "lucide-react";

// INPUT SANITIZER
const sanitizeInput = (val) => {
  if (typeof val !== "string") return "";
  return val.replace(/[<>]/g, "").trim();
};

export default function Register() {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();
  const dateInputRef = useRef(null);
  const modalScrollRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    birthday: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState(null);

  // Anti-Bot Honeypot & Timing
  const [honeypot, setHoneypot] = useState("");
  const formMountTime = useRef(Date.now());

  // Tooltips
  const [showPasswordTooltip, setShowPasswordTooltip] = useState(false);
  const [showBirthdayTooltip, setShowBirthdayTooltip] = useState(false);

  // Animation States
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 40);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => navigate("/"), 350);
  };

  // STRICT 4-POINT PASSWORD RULES AUDIT
  const passwordCriteria = {
    length: formData.password.length >= 8,
    casing: /[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password),
    number: /\d/.test(formData.password),
    special: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(formData.password),
  };

  const getPasswordStrength = () => {
    if (!formData.password)
      return {
        score: 0,
        text: "Belum diisi",
        color: "bg-gray-200 dark:bg-gray-700",
      };
    let passed = 0;
    if (passwordCriteria.length) passed++;
    if (passwordCriteria.casing) passed++;
    if (passwordCriteria.number) passed++;
    if (passwordCriteria.special) passed++;

    if (passed <= 1)
      return { score: 25, text: "Sangat Lemah", color: "bg-rose-500" };
    if (passed === 2)
      return { score: 50, text: "Cukup", color: "bg-amber-500" };
    if (passed === 3) return { score: 75, text: "Bagus", color: "bg-blue-500" };
    return { score: 100, text: "Sangat Kuat", color: "bg-emerald-500" };
  };

  const strength = getPasswordStrength();

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

    // BOT DEFENSE 1: Honeypot trap check
    if (honeypot.trim() !== "") {
      console.warn("Bot automated submission detected via honeypot.");
      setErrors({
        general: "Terdeteksi aktivitas otomatis yang mencurigakan.",
      });
      return;
    }

    // BOT DEFENSE 2: Form submission timing check (< 1400ms)
    if (Date.now() - formMountTime.current < 1400) {
      setErrors({
        general:
          "Pengisian form terlalu cepat. Mohon verifikasi secara manual.",
      });
      return;
    }

    const cleanUsername = sanitizeInput(formData.username);
    const cleanEmail = sanitizeInput(formData.email);
    const cleanPassword = formData.password;
    const cleanConfirm = formData.confirmPassword;

    let newErrors = {};

    // STRICT USERNAME VALIDATION
    if (!cleanUsername) {
      newErrors.username = "Username wajib diisi.";
    } else if (cleanUsername.length < 3 || cleanUsername.length > 24) {
      newErrors.username = "Panjang username antara 3 hingga 24 karakter.";
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUsername)) {
      newErrors.username = "Hanya boleh huruf, angka, underscore, atau titik.";
    }

    // STRICT EMAIL VALIDATION
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!cleanEmail) {
      newErrors.email = "Email wajib diisi.";
    } else if (!emailRegex.test(cleanEmail)) {
      newErrors.email = "Format email tidak valid.";
    }

    // STRICT PASSWORD VALIDATION
    if (!cleanPassword) {
      newErrors.password = "Password wajib diisi.";
    } else {
      if (!passwordCriteria.length) {
        newErrors.password = "Password minimal harus 8 karakter.";
      } else if (!passwordCriteria.casing) {
        newErrors.password = "Harus ada kombinasi huruf besar & kecil.";
      } else if (!passwordCriteria.number) {
        newErrors.password = "Harus mengandung minimal satu angka (0-9).";
      } else if (!passwordCriteria.special) {
        newErrors.password =
          "Harus mengandung minimal satu simbol unik (!@#$...).";
      }
    }

    // CONFIRM PASSWORD CHECK
    if (!cleanConfirm) {
      newErrors.confirmPassword = "Konfirmasi password wajib diisi.";
    } else if (cleanPassword !== cleanConfirm) {
      newErrors.confirmPassword =
        "Konfirmasi password tidak cocok dengan password di atas.";
    }

    // BOT DEFENSE 3: SLIDER SECURITY VERIFICATION
    if (!isCaptchaVerified) {
      newErrors.captcha = "Selesaikan geser verifikasi keamanan.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Simpan data akun LANGSUNG ke Database PostgreSQL (selasar-db)
      const dbResponse = await apiRegister({
        email: cleanEmail,
        username: cleanUsername,
        password: cleanPassword,
        birthday: formData.birthday || null,
        display_name: cleanUsername,
      });

      console.log("Akun berhasil tersimpan di database PostgreSQL:", dbResponse);

      // 2. Sinkronkan juga ke Firebase Auth (hybrid support)
      let fbUid = null;
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          cleanPassword,
        );
        fbUid = userCredential.user.uid;
        await updateProfile(userCredential.user, {
          displayName: cleanUsername,
        });
      } catch (fbErr) {
        console.warn("Firebase Auth fallback/skip:", fbErr.message);
      }

      // 3. Simpan sesi user aktif
      localStorage.setItem(
        "selasarUser",
        JSON.stringify({
          id: dbResponse.data?.id,
          name: cleanUsername,
          email: cleanEmail,
          uid: fbUid || dbResponse.data?.id,
          birthdate: formData.birthday || "",
        }),
      );

      setIsExiting(true);
      setTimeout(() => navigate("/login"), 400);
    } catch (error) {
      console.error("Register Error:", error);
      const errMsg = error.message || "";
      if (errMsg.includes("sudah terdaftar") || error.code === "auth/email-already-in-use") {
        setErrors({ email: "Email ini sudah terdaftar di database Selasar. Silakan langsung masuk." });
      } else if (errMsg.includes("Username ini sudah digunakan")) {
        setErrors({ username: "Username ini sudah dipakai orang lain. Pilih username lain." });
      } else if (error.code === "auth/weak-password") {
        setErrors({
          password: "Password terlalu lemah untuk standar keamanan.",
        });
      } else {
        setErrors({ general: `Gagal mendaftar ke database: ${errMsg}` });
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

      // Simpan langsung ke database PostgreSQL (selasar-db)
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
          general:
            "Popup diblokir oleh browser. Izinkan popup untuk mendaftar.",
        });
      } else {
        setErrors({
          general: `Gagal mendaftar via ${providerName}. ${error.message}`,
        });
      }
    } finally {
      setLoadingProvider(null);
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
        className="absolute -top-16 -left-16 w-64 md:w-80 opacity-20 dark:opacity-10 pointer-events-none transition-all duration-1000 -rotate-12"
      />

      {/* PINTEREST REGISTER MODAL CONTAINER */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative z-10 w-full max-w-[500px] my-auto transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
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
            aria-label="Ganti tema"
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

        {/* MODAL CARD INTERIOR (Scrolls up and down smoothly without buttons or scrollbars) */}
        <div
          ref={modalScrollRef}
          className="w-full max-h-[88vh] overflow-y-auto scroll-smooth scrollbar-none overscroll-contain bg-white dark:bg-[#2A2521] border border-gray-200/80 dark:border-[#3D342D] rounded-[32px] sm:rounded-[36px] shadow-[0_25px_60px_-15px_rgba(89,74,66,0.25)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] p-7 sm:p-9 md:p-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
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
                Selasar Security
              </span>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <ShieldCheck size={13} className="text-emerald-500" />{" "}
                Pendaftaran Terenkripsi
              </span>
            </div>
          </div>

          {/* HEADLINE */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#594A42] dark:text-[#F5F2EB] tracking-tight mb-2">
            Selamat Datang di Selasar
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-6">
            Daftar gratis untuk temukan sudut nugas terbaikmu
          </p>

          {/* GENERAL ERROR BANNER */}
          {errors.general && (
            <div className="mb-5 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-center gap-2.5 text-xs text-rose-800 dark:text-rose-300 font-semibold">
              <AlertCircle
                size={16}
                className="shrink-0 text-rose-600 dark:text-rose-400"
              />
              <span>{errors.general}</span>
            </div>
          )}

          {/* REGISTRATION FORM */}
          <form onSubmit={handleRegister} className="flex flex-col space-y-3.5">
            {/* BOT DEFENSE HONEYPOT */}
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

            {/* USERNAME FIELD */}
            <div>
              <div className="relative">
                <input
                  type="text"
                  name="username"
                  autoComplete="username"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  placeholder="Nama pengguna / Username"
                  className={`w-full px-4 sm:px-5 py-3.5 rounded-2xl bg-white dark:bg-[#1F1B18] text-gray-900 dark:text-[#F5F2EB] text-sm font-medium border-2 transition-all outline-none placeholder-gray-400 ${
                    errors.username
                      ? "border-rose-400 focus:border-rose-500"
                      : "border-gray-200 dark:border-[#3D342D] focus:border-[#594A42] dark:focus:border-[#C4A876]"
                  }`}
                />
              </div>
              {errors.username && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1.5 pl-1 flex items-center gap-1">
                  <AlertCircle size={13} /> {errors.username}
                </p>
              )}
            </div>

            {/* EMAIL FIELD */}
            <div>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  placeholder="Masukkan email kamu"
                  className={`w-full px-4 sm:px-5 py-3.5 rounded-2xl bg-white dark:bg-[#1F1B18] text-gray-900 dark:text-[#F5F2EB] text-sm font-medium border-2 transition-all outline-none placeholder-gray-400 ${
                    errors.email
                      ? "border-rose-400 focus:border-rose-500"
                      : "border-gray-200 dark:border-[#3D342D] focus:border-[#594A42] dark:focus:border-[#C4A876]"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1.5 pl-1 flex items-center gap-1">
                  <AlertCircle size={13} /> {errors.email}
                </p>
              )}
            </div>

            {/* PASSWORD FIELD WITH LIVE CRITERIA CHECKLIST */}
            <div>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  placeholder="Buat password"
                  className={`w-full pl-4 sm:pl-5 pr-20 py-3.5 rounded-2xl bg-white dark:bg-[#1F1B18] text-gray-900 dark:text-[#F5F2EB] text-sm font-medium border-2 transition-all outline-none placeholder-gray-400 ${
                    errors.password
                      ? "border-rose-400 focus:border-rose-500"
                      : "border-gray-200 dark:border-[#3D342D] focus:border-[#594A42] dark:focus:border-[#C4A876]"
                  }`}
                />

                <div className="absolute right-3.5 flex items-center gap-1 text-gray-400">
                  <div className="relative">
                    <button
                      type="button"
                      tabIndex={-1}
                      onMouseEnter={() => setShowPasswordTooltip(true)}
                      onMouseLeave={() => setShowPasswordTooltip(false)}
                      onClick={() =>
                        setShowPasswordTooltip(!showPasswordTooltip)
                      }
                      className="p-1 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
                      aria-label="Info password"
                    >
                      <Info size={17} />
                    </button>
                    {showPasswordTooltip && (
                      <div className="absolute right-0 bottom-full mb-2 w-56 p-2.5 rounded-xl bg-gray-900 text-white text-[11px] font-medium leading-relaxed shadow-xl z-30 pointer-events-none">
                        Password wajib memenuhi 4 kriteria keamanan di bawah.
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
                    aria-label={
                      showPassword ? "Sembunyikan password" : "Lihat password"
                    }
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* PASSWORD STRENGTH PROGRESS BAR */}
              {formData.password && (
                <div className="px-1 pt-1.5">
                  <div className="w-full h-1.5 bg-gray-200 dark:bg-[#3D342D] rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strength.color}`}
                      style={{ width: `${strength.score}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold mt-1 text-[#594A42] dark:text-[#C4A876]">
                    <span>Kekuatan Password</span>
                    <span>{strength.text}</span>
                  </div>
                </div>
              )}

              {/* STRICT LIVE SECURITY CRITERIA CHECKLIST */}
              <div className="bg-gray-50/90 dark:bg-[#201B17]/90 p-3 rounded-2xl border border-gray-200 dark:border-[#3D342D] mt-2 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Standar Keamanan Password:
                </p>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] font-semibold">
                  <span
                    className={`flex items-center gap-1.5 transition-colors ${passwordCriteria.length ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-gray-500"}`}
                  >
                    <Check
                      size={13}
                      className={
                        passwordCriteria.length ? "stroke-[3]" : "opacity-40"
                      }
                    />
                    Min. 8 karakter
                  </span>
                  <span
                    className={`flex items-center gap-1.5 transition-colors ${passwordCriteria.casing ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-gray-500"}`}
                  >
                    <Check
                      size={13}
                      className={
                        passwordCriteria.casing ? "stroke-[3]" : "opacity-40"
                      }
                    />
                    Huruf besar & kecil
                  </span>
                  <span
                    className={`flex items-center gap-1.5 transition-colors ${passwordCriteria.number ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-gray-500"}`}
                  >
                    <Check
                      size={13}
                      className={
                        passwordCriteria.number ? "stroke-[3]" : "opacity-40"
                      }
                    />
                    Angka (0-9)
                  </span>
                  <span
                    className={`flex items-center gap-1.5 transition-colors ${passwordCriteria.special ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-gray-500"}`}
                  >
                    <Check
                      size={13}
                      className={
                        passwordCriteria.special ? "stroke-[3]" : "opacity-40"
                      }
                    />
                    Simbol unik (!@#$...)
                  </span>
                </div>
              </div>

              {errors.password && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1.5 pl-1 flex items-center gap-1">
                  <AlertCircle size={13} /> {errors.password}
                </p>
              )}
            </div>

            {/* CONFIRM PASSWORD FIELD */}
            <div>
              <div className="relative flex items-center">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  placeholder="Konfirmasi password"
                  className={`w-full pl-4 sm:pl-5 pr-12 py-3.5 rounded-2xl bg-white dark:bg-[#1F1B18] text-gray-900 dark:text-[#F5F2EB] text-sm font-medium border-2 transition-all outline-none placeholder-gray-400 ${
                    errors.confirmPassword
                      ? "border-rose-400 focus:border-rose-500"
                      : "border-gray-200 dark:border-[#3D342D] focus:border-[#594A42] dark:focus:border-[#C4A876]"
                  }`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 p-1.5 text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200 transition-colors cursor-pointer"
                  aria-label={
                    showConfirmPassword
                      ? "Sembunyikan password"
                      : "Lihat password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1.5 pl-1 flex items-center gap-1">
                  <AlertCircle size={13} /> {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* BIRTHDAY INPUT */}
            <div>
              <div className="relative flex items-center">
                <input
                  type="text"
                  name="birthday"
                  ref={dateInputRef}
                  value={formData.birthday}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  placeholder="Masukkan tanggal lahir (HH/BB/TTTT)"
                  onFocus={(e) => (e.target.type = "date")}
                  onBlur={(e) => {
                    if (!e.target.value) e.target.type = "text";
                  }}
                  className="w-full pl-4 sm:pl-5 pr-20 py-3.5 rounded-2xl bg-white dark:bg-[#1F1B18] text-gray-900 dark:text-[#F5F2EB] text-sm font-medium border-2 border-gray-200 dark:border-[#3D342D] focus:border-[#594A42] dark:focus:border-[#C4A876] transition-all outline-none placeholder-gray-400"
                />

                <div className="absolute right-3.5 flex items-center gap-1 text-gray-400">
                  <div className="relative">
                    <button
                      type="button"
                      tabIndex={-1}
                      onMouseEnter={() => setShowBirthdayTooltip(true)}
                      onMouseLeave={() => setShowBirthdayTooltip(false)}
                      onClick={() =>
                        setShowBirthdayTooltip(!showBirthdayTooltip)
                      }
                      className="p-1 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
                      aria-label="Info tanggal lahir"
                    >
                      <Info size={17} />
                    </button>
                    {showBirthdayTooltip && (
                      <div className="absolute right-0 bottom-full mb-2 w-56 p-2.5 rounded-xl bg-gray-900 text-white text-[11px] font-medium leading-relaxed shadow-xl z-30 pointer-events-none">
                        Tanggal lahir membantu Selasar mempersonalisasi
                        rekomendasi spot dan promo ulang tahunmu.
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => {
                      if (dateInputRef.current) {
                        dateInputRef.current.type = "date";
                        if (
                          typeof dateInputRef.current.showPicker === "function"
                        ) {
                          dateInputRef.current.showPicker();
                        } else {
                          dateInputRef.current.focus();
                        }
                      }
                    }}
                    className="p-1 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
                    aria-label="Buka pemilih tanggal"
                  >
                    <Calendar size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* SLIDE-TO-VERIFY STRICT INTERACTIVE CHALLENGE */}
            <div className="pt-1">
              <SlideToVerifyRegister
                isVerified={isCaptchaVerified}
                onVerify={(val) => {
                  setIsCaptchaVerified(val);
                  if (errors.captcha) setErrors({ ...errors, captcha: "" });
                }}
                disabled={isSubmitting}
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
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-full font-extrabold text-sm transition-all duration-300 shadow-md cursor-pointer mt-2 text-white bg-[#594A42] hover:bg-[#433731] active:scale-[0.98] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
                  Mendaftarkan akun aman...
                </span>
              ) : (
                "Lanjutkan"
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
              disabled={loadingProvider !== null || isSubmitting}
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

            {/* COMPACT ALTERNATIVE SOCIAL LOGINS */}
            <div className="flex items-center justify-center gap-2 pt-1 text-xs text-gray-500 dark:text-gray-400">
              <span>Atau daftar via:</span>
              <button
                type="button"
                onClick={() => handleSocialLogin("Facebook")}
                disabled={loadingProvider !== null || isSubmitting}
                className="px-3 py-1.5 rounded-full border border-gray-200 dark:border-[#3D342D] hover:bg-gray-100 dark:hover:bg-[#201B17] font-semibold text-[#1877F2] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Facebook</span>
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin("GitHub")}
                disabled={loadingProvider !== null || isSubmitting}
                className="px-3 py-1.5 rounded-full border border-gray-200 dark:border-[#3D342D] hover:bg-gray-100 dark:hover:bg-[#201B17] font-semibold text-gray-800 dark:text-gray-200 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
                <span>GitHub</span>
              </button>
            </div>
          </form>

          {/* FOOTER SWITCH TO LOGIN & BUSINESS PARTNER */}
          <div className="mt-7 pt-4 border-t border-gray-100 dark:border-[#3D342D]/60 text-center space-y-2">
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              Sudah punya akun?{" "}
              <Link
                to="/login"
                className="font-extrabold text-[#594A42] dark:text-[#F5F2EB] hover:text-[#8B6B4F] dark:hover:text-[#C4A876] underline underline-offset-2 ml-0.5"
              >
                Masuk
              </Link>
            </p>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Punya cafe atau workspace?{" "}
              <a
                href="mailto:partner@selasar.app?subject=Kemitraan%20Spot%20Selasar"
                className="font-bold text-[#8B6B4F] dark:text-[#C4A876] hover:underline"
              >
                Daftarkan spotmu
              </a>
            </p>

            <p className="text-[10px] text-gray-400 dark:text-gray-500 pt-1 leading-relaxed">
              Dengan mendaftar, Anda menyetujui Ketentuan Layanan &bull;
              Kebijakan Privasi Selasar
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// SLIDE-TO-VERIFY REGISTER COMPONENT
function SlideToVerifyRegister({ isVerified, onVerify, disabled }) {
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
      {!isVerified && (
        <div
          className="absolute left-0 top-0 bottom-0 bg-[#594A42]/15 dark:bg-[#8B6B4F]/25 pointer-events-none transition-all duration-75"
          style={{ width: `${sliderPosition + 24}px` }}
        />
      )}

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
