import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import {
  FaArrowLeft,
  FaUser,
  FaShieldAlt,
  FaBell,
  FaMoon,
  FaSun,
  FaQuestionCircle,
  FaInfoCircle,
  FaChevronRight,
  FaChevronDown,
  FaSignOutAlt,
  FaTimes,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaCheckCircle,
  FaExclamationCircle,
  FaEnvelope,
  FaGlobe,
  FaHeart,
} from "react-icons/fa";

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
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
  );
}

function SettingItem({
  icon: Icon,
  title,
  onClick,
  hasToggle,
  toggleState,
  onToggle,
  isDanger,
  theme,
  darkMode,
}) {
  const [pulse, setPulse] = useState(false);
  const firstRender = useRef(true);

  useEffect(() => {
    if (!hasToggle) return;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toggleState]);

  return (
    <button
      onClick={hasToggle ? onToggle : onClick}
      className={`w-full flex items-center justify-between p-4 ${theme.cardBg} ${theme.itemHover} ${theme.itemActive} transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-[0.98] group outline-none focus-visible:ring-2 focus-visible:ring-[#8B6B4F] rounded-2xl`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`relative w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110 group-hover:-rotate-6 group-active:scale-90 group-active:rotate-0 ${
            isDanger
              ? darkMode
                ? "bg-red-500/10 text-red-400"
                : "bg-red-50 text-red-500"
              : theme.iconBg
          }`}
        >
          <span key={Icon} className="icon-pop inline-flex">
            <Icon size={16} />
          </span>
        </div>
        <span
          className={`font-semibold transition-colors duration-300 ${
            isDanger
              ? darkMode
                ? "text-red-400"
                : "text-red-600"
              : theme.textPrimary
          }`}
        >
          {title}
        </span>
      </div>

      {hasToggle ? (
        <div className="relative">
          {pulse && (
            <span
              className={`absolute inset-0 rounded-full pulse-ring-fx pointer-events-none ${
                toggleState ? "bg-[#594A42]/50" : "bg-gray-400/40"
              }`}
            />
          )}
          <div
            className={`relative w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
              toggleState
                ? "bg-[#594A42]"
                : darkMode
                  ? "bg-[#3D342D]"
                  : "bg-gray-300"
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                toggleState ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </div>
        </div>
      ) : (
        <FaChevronRight
          className={`text-gray-400 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:translate-x-1.5 ${
            isDanger ? "hidden" : "block"
          }`}
          size={14}
        />
      )}
    </button>
  );
}

function BottomSheet({ isOpen, onClose, title, icon: Icon, children, theme }) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [dragY, setDragY] = useState(0);
  const dragInfo = useRef({ startY: 0, dragging: false });

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMounted(true);
      setDragY(0);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setVisible(true)),
      );
    } else {
      setVisible(false);
      const t = setTimeout(() => {
        setMounted(false);
        setDragY(0);
      }, 420);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!mounted) return null;

  const onDragStart = (e) => {
    dragInfo.current = { startY: e.clientY, dragging: true };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onDragMove = (e) => {
    if (!dragInfo.current.dragging) return;
    const delta = e.clientY - dragInfo.current.startY;
    if (delta > 0) setDragY(delta);
  };

  const onDragEnd = () => {
    if (!dragInfo.current.dragging) return;
    dragInfo.current.dragging = false;
    if (dragY > 110) onClose();
    setDragY(0);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        style={{
          transform: dragY ? `translateY(${dragY}px)` : undefined,
          // eslint-disable-next-line react-hooks/refs
          transition: dragInfo.current.dragging ? "none" : undefined,
        }}
        className={`relative w-full sm:max-w-md ${theme.cardBg} rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[85vh] overflow-y-auto transition-all duration-[420ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
          visible
            ? "translate-y-0 opacity-100 sm:scale-100"
            : "translate-y-full sm:translate-y-6 opacity-0 sm:scale-95"
        }`}
      >
        <div
          className={`sticky top-0 ${theme.cardBg} pt-2 pb-3 px-6 border-b ${theme.cardBorder}`}
        >
          <div
            onPointerDown={onDragStart}
            onPointerMove={onDragMove}
            onPointerUp={onDragEnd}
            onPointerCancel={onDragEnd}
            className="sm:hidden w-full flex justify-center pt-1 pb-2 cursor-grab active:cursor-grabbing touch-none"
          >
            <div className="w-10 h-1.5 rounded-full bg-gray-400/40 transition-transform" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {Icon && (
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center ${theme.iconBg}`}
                >
                  <Icon size={14} />
                </div>
              )}
              <h3 className={`font-bold text-lg ${theme.textPrimary}`}>
                {title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 active:scale-90 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#8B6B4F]"
            >
              <FaTimes className={theme.textSecondary} size={14} />
            </button>
          </div>
        </div>
        <div className="p-6 select-text">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode: toggleDarkModeGlobal, theme } = useTheme();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Toggle state untuk UI Pengaturan
  const [notifEnabled, setNotifEnabled] = useState(true);

  // Bottom sheet aktif: null | 'password' | 'help' | 'about' | 'logout'
  const [activeModal, setActiveModal] = useState(null);

  // Toast notifikasi ringan
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const toastExitTimer = useRef(null);

  // Form ganti password
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwVisible, setPwVisible] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [pwError, setPwError] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [shake, setShake] = useState(false);

  // Accordion FAQ
  const [openFaq, setOpenFaq] = useState(null);

  // Logout
  const [loggingOut, setLoggingOut] = useState(false);

  // Animasi masuk halaman
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!activeModal) return;
    document.body.style.overflow = "hidden";
    // eslint-disable-next-line react-hooks/immutability
    const onKey = (e) => e.key === "Escape" && closeModal();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [activeModal]);

  const showToast = (message, tone = "success") => {
    clearTimeout(toastTimer.current);
    clearTimeout(toastExitTimer.current);
    setToast({ message, tone, leaving: false });
    toastExitTimer.current = setTimeout(() => {
      setToast((t) => (t ? { ...t, leaving: true } : t));
    }, 2200);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  const closeModal = () => {
    setActiveModal(null);
    setPwError("");
    setPwSuccess(false);
  };

  // Fungsi navigasi keluar yang smooth
  const handleNavigate = (path) => {
    setIsExiting(true);
    setTimeout(() => {
      navigate(path);
    }, 400);
  };

  const handleBack = () => {
    setIsExiting(true);
    setTimeout(() => {
      navigate(-1);
    }, 400);
  };

  const toggleNotif = () => {
    const next = !notifEnabled;
    setNotifEnabled(next);
    showToast(next ? "Notifikasi diaktifkan" : "Notifikasi dimatikan");
  };

  const toggleDarkMode = (e) => {
    const next = !darkMode;
    toggleDarkModeGlobal(e);
    showToast(next ? "Mode gelap diaktifkan" : "Mode gelap dimatikan");
  };

  const triggerPwError = (msg) => {
    setPwError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const handlePwSubmit = (e) => {
    e.preventDefault();
    if (!pwForm.current) return triggerPwError("Masukkan kata sandi saat ini");
    if (pwForm.next.length < 8)
      return triggerPwError("Kata sandi baru minimal 8 karakter");
    if (pwForm.next !== pwForm.confirm)
      return triggerPwError("Konfirmasi kata sandi tidak cocok");

    setPwError("");
    setPwSaving(true);
    setTimeout(() => {
      setPwSaving(false);
      setPwSuccess(true);
      setTimeout(() => {
        setPwForm({ current: "", next: "", confirm: "" });
        setPwSuccess(false);
        closeModal();
        showToast("Kata sandi berhasil diperbarui");
      }, 650);
    }, 700);
  };

  const handleLogoutConfirm = () => {
    setLoggingOut(true);
    setTimeout(() => {
      setLoggingOut(false);
      setActiveModal(null);
      showToast("Berhasil keluar akun");
      handleNavigate("/");
    }, 800);
  };

  const faqs = [
    {
      q: "Bagaimana cara mengubah kata sandi saya?",
      a: "Buka Keamanan & Password, masukkan kata sandi lama dan kata sandi baru, lalu simpan perubahan.",
    },
    {
      q: "Bagaimana cara menghubungi dukungan pelanggan?",
      a: "Kirim email ke support@selasar.app atau chat kami setiap hari pukul 09.00–21.00 WIB.",
    },
    {
      q: "Apakah data pribadi saya aman?",
      a: "Seluruh data akun dienkripsi dan tidak pernah dibagikan ke pihak ketiga tanpa izin kamu.",
    },
    {
      q: "Bagaimana cara menghapus akun saya?",
      a: "Hubungi tim support lewat Pusat Bantuan untuk memproses penghapusan akun secara permanen.",
    },
  ];

  const inputBase = `w-full rounded-2xl border ${theme.inputBorder} ${theme.inputBg} ${theme.textPrimary} px-4 py-3 pr-11 text-sm outline-none focus:border-[#8B6B4F] focus:ring-4 focus:ring-[#8B6B4F]/10 transition-all duration-300`;

  return (
    <div
      className={`min-h-screen ${theme.pageBg} pb-12 font-sans select-none transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isLoaded && !isExiting
          ? "opacity-100 scale-100"
          : "opacity-0 scale-[0.98]"
      }`}
    >
      <style>{`
        @keyframes toastIn {
          0% { transform: translate(-50%, -24px) scale(0.92); opacity: 0; }
          60% { transform: translate(-50%, 4px) scale(1.02); opacity: 1; }
          100% { transform: translate(-50%, 0) scale(1); opacity: 1; }
        }
        @keyframes toastOut {
          0% { transform: translate(-50%, 0) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -16px) scale(0.95); opacity: 0; }
        }
        @keyframes shakeX {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .animate-shake { animation: shakeX 0.4s ease-in-out; }

        @keyframes iconPop {
          0% { transform: scale(0.4) rotate(-20deg); opacity: 0; }
          60% { transform: scale(1.15) rotate(6deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .icon-pop { animation: iconPop 0.35s cubic-bezier(0.34,1.56,0.64,1); }

        @keyframes pulseRingFx {
          0% { transform: scale(0.6); opacity: 0.6; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        .pulse-ring-fx { animation: pulseRingFx 0.5s ease-out; }

        @keyframes successPopFx {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .success-pop-fx { animation: successPopFx 0.4s cubic-bezier(0.34,1.56,0.64,1); }

        @keyframes logoPop {
          0% { transform: scale(0.5) rotate(-8deg); opacity: 0; }
          70% { transform: scale(1.08) rotate(3deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .logo-pop { animation: logoPop 0.5s cubic-bezier(0.34,1.56,0.64,1); }

        @keyframes heartBeat {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.25); }
          40% { transform: scale(1); }
          60% { transform: scale(1.2); }
        }
        .heart-beat { animation: heartBeat 1.8s ease-in-out infinite; }

        /* Transisi lingkaran membesar saat ganti Mode Gelap (View Transitions API) */
        ::view-transition-old(root) { animation: none; }
        ::view-transition-new(root) { animation: revealCircle 0.6s ease-in-out; }
        @keyframes revealCircle {
          from { clip-path: circle(0% at var(--reveal-x, 50%) var(--reveal-y, 50%)); }
          to { clip-path: circle(150% at var(--reveal-x, 50%) var(--reveal-y, 50%)); }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      {toast &&
        createPortal(
          <div
            className="fixed top-6 left-1/2 z-[200]"
            style={{
              animation: toast.leaving
                ? "toastOut 0.3s ease forwards"
                : "toastIn 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards",
            }}
          >
            <div
              className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-white ${
                toast.tone === "error" ? "bg-red-500" : "bg-[#594A42]"
              }`}
            >
              {toast.tone === "error" ? (
                <FaExclamationCircle size={16} />
              ) : (
                <FaCheckCircle size={16} />
              )}
              <span className="text-sm font-semibold whitespace-nowrap">
                {toast.message}
              </span>
            </div>
          </div>,
          document.body,
        )}

      {/* Header */}
      <header
        className={`sticky top-0 z-50 ${theme.headerBg} backdrop-blur-md px-6 py-6 flex items-center gap-4 shadow-sm transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isLoaded ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
        }`}
      >
        <button
          onClick={handleBack}
          className={`group w-10 h-10 ${theme.circleBtnBg} rounded-full flex items-center justify-center ${theme.textPrimary} shadow-sm hover:scale-110 active:scale-90 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] focus-visible:ring-2 focus-visible:ring-[#8B6B4F]`}
        >
          <FaArrowLeft
            size={16}
            className="transition-transform duration-300 group-hover:-translate-x-0.5"
          />
        </button>
        <h1
          className={`text-xl font-bold ${theme.textPrimary} transition-colors duration-500`}
        >
          Pengaturan
        </h1>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 mt-6 flex flex-col gap-6">
        {/* Section: Akun */}
        <section
          className={`transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isLoaded
              ? "translate-y-0 opacity-100 scale-100"
              : "translate-y-8 opacity-0 scale-[0.97]"
          }`}
        >
          <h2
            className={`text-sm font-bold ${theme.textSecondary} uppercase tracking-wider mb-3 px-4 transition-colors duration-500`}
          >
            Akun
          </h2>
          <div
            className={`${theme.cardBg} rounded-3xl overflow-hidden shadow-sm border ${theme.cardBorder} transition-colors duration-500 flex flex-col`}
          >
            <SettingItem
              icon={FaUser}
              title="Profil Saya"
              onClick={() => handleNavigate("/profile")}
              theme={theme}
              darkMode={darkMode}
            />
            <div
              className={`h-px ${theme.divider} w-full transition-colors duration-500`}
            />
            <SettingItem
              icon={FaShieldAlt}
              title="Keamanan & Password"
              onClick={() => setActiveModal("password")}
              theme={theme}
              darkMode={darkMode}
            />
          </div>
        </section>

        {/* Section: Preferensi */}
        <section
          className={`transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] delay-75 ${
            isLoaded
              ? "translate-y-0 opacity-100 scale-100"
              : "translate-y-8 opacity-0 scale-[0.97]"
          }`}
        >
          <h2
            className={`text-sm font-bold ${theme.textSecondary} uppercase tracking-wider mb-3 px-4 transition-colors duration-500`}
          >
            Preferensi
          </h2>
          <div
            className={`${theme.cardBg} rounded-3xl overflow-hidden shadow-sm border ${theme.cardBorder} transition-colors duration-500 flex flex-col`}
          >
            <SettingItem
              icon={FaBell}
              title="Notifikasi Push"
              hasToggle
              toggleState={notifEnabled}
              onToggle={toggleNotif}
              theme={theme}
              darkMode={darkMode}
            />
            <div
              className={`h-px ${theme.divider} w-full transition-colors duration-500`}
            />
            <SettingItem
              icon={darkMode ? FaSun : FaMoon}
              title="Mode Gelap"
              hasToggle
              toggleState={darkMode}
              onToggle={toggleDarkMode}
              theme={theme}
              darkMode={darkMode}
            />
          </div>
        </section>

        {/* Section: Bantuan */}
        <section
          className={`transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] delay-150 ${
            isLoaded
              ? "translate-y-0 opacity-100 scale-100"
              : "translate-y-8 opacity-0 scale-[0.97]"
          }`}
        >
          <h2
            className={`text-sm font-bold ${theme.textSecondary} uppercase tracking-wider mb-3 px-4 transition-colors duration-500`}
          >
            Bantuan & Info
          </h2>
          <div
            className={`${theme.cardBg} rounded-3xl overflow-hidden shadow-sm border ${theme.cardBorder} transition-colors duration-500 flex flex-col`}
          >
            <SettingItem
              icon={FaQuestionCircle}
              title="Pusat Bantuan"
              onClick={() => setActiveModal("help")}
              theme={theme}
              darkMode={darkMode}
            />
            <div
              className={`h-px ${theme.divider} w-full transition-colors duration-500`}
            />
            <SettingItem
              icon={FaInfoCircle}
              title="Tentang Selasar"
              onClick={() => setActiveModal("about")}
              theme={theme}
              darkMode={darkMode}
            />
          </div>
        </section>

        {/* Section: Logout */}
        <section
          className={`mt-4 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] delay-200 ${
            isLoaded
              ? "translate-y-0 opacity-100 scale-100"
              : "translate-y-8 opacity-0 scale-[0.97]"
          }`}
        >
          <div
            className={`${theme.cardBg} rounded-3xl overflow-hidden shadow-sm border ${
              darkMode ? "border-red-500/20" : "border-red-100"
            } transition-colors duration-500`}
          >
            <SettingItem
              icon={FaSignOutAlt}
              title="Keluar Akun"
              isDanger
              onClick={() => setActiveModal("logout")}
              theme={theme}
              darkMode={darkMode}
            />
          </div>
        </section>

        <div className="text-center mt-6 mb-10">
          <p
            className={`text-xs ${theme.textSecondary} font-medium opacity-70 transition-colors duration-500`}
          >
            Selasar App v1.0.0
          </p>
        </div>
      </main>

      {/* Bottom Sheet: Ganti Password */}
      <BottomSheet
        isOpen={activeModal === "password"}
        onClose={closeModal}
        title="Keamanan & Password"
        icon={FaLock}
        theme={theme}
      >
        <form
          onSubmit={handlePwSubmit}
          className={`flex flex-col gap-4 ${shake ? "animate-shake" : ""}`}
        >
          {[
            { key: "current", label: "Kata Sandi Saat Ini" },
            { key: "next", label: "Kata Sandi Baru" },
            { key: "confirm", label: "Konfirmasi Kata Sandi Baru" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label
                className={`text-xs font-semibold ${theme.textSecondary} block mb-1.5`}
              >
                {label}
              </label>
              <div className="relative">
                <input
                  type={pwVisible[key] ? "text" : "password"}
                  value={pwForm[key]}
                  onChange={(e) =>
                    setPwForm({ ...pwForm, [key]: e.target.value })
                  }
                  className={inputBase}
                  placeholder="••••••••"
                  autoComplete={
                    key === "current" ? "current-password" : "new-password"
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    setPwVisible({ ...pwVisible, [key]: !pwVisible[key] })
                  }
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme.textSecondary} hover:opacity-70 hover:scale-110 active:scale-90 transition-all duration-200`}
                  tabIndex={-1}
                >
                  <span
                    key={pwVisible[key] ? "hide" : "show"}
                    className="icon-pop inline-flex"
                  >
                    {pwVisible[key] ? (
                      <FaEyeSlash size={14} />
                    ) : (
                      <FaEye size={14} />
                    )}
                  </span>
                </button>
              </div>
            </div>
          ))}

          {pwError && (
            <div className="flex items-center gap-2 text-red-500 text-xs font-semibold">
              <FaExclamationCircle size={12} />
              <span>{pwError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={pwSaving || pwSuccess}
            className={`mt-2 w-full ${
              pwSuccess
                ? "bg-emerald-600"
                : "bg-[#594A42] hover:bg-[#4A3D36] hover:shadow-lg hover:shadow-[#594A42]/30 hover:-translate-y-0.5"
            } disabled:opacity-90 text-white font-semibold rounded-2xl py-3.5 flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] active:translate-y-0 focus-visible:ring-2 focus-visible:ring-[#8B6B4F]`}
          >
            {pwSuccess ? (
              <>
                <FaCheckCircle className="success-pop-fx" size={16} /> Tersimpan
              </>
            ) : pwSaving ? (
              <>
                <Spinner /> Menyimpan...
              </>
            ) : (
              "Simpan Perubahan"
            )}
          </button>
        </form>
      </BottomSheet>

      {/* Bottom Sheet: Pusat Bantuan */}
      <BottomSheet
        isOpen={activeModal === "help"}
        onClose={closeModal}
        title="Pusat Bantuan"
        icon={FaQuestionCircle}
        theme={theme}
      >
        <div className="flex flex-col gap-2">
          {faqs.map((item, i) => (
            <div
              key={i}
              className={`rounded-2xl ${theme.faqBg} border px-4 py-3 transition-all duration-300 ${
                openFaq === i
                  ? darkMode
                    ? "border-[#C4A876]/50"
                    : "border-[#8B6B4F]/50"
                  : theme.cardBorder
              }`}
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className={`w-full flex items-center justify-between gap-3 text-left ${theme.textPrimary} font-semibold text-sm focus-visible:ring-2 focus-visible:ring-[#8B6B4F] rounded-lg outline-none transition-transform duration-200 active:scale-[0.99]`}
              >
                <span>{item.q}</span>
                <FaChevronDown
                  size={12}
                  className={`shrink-0 ${theme.textSecondary} transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                    openFaq === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`grid transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  openFaq === i
                    ? "grid-rows-[1fr] opacity-100 mt-2"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p
                    className={`text-sm ${theme.textSecondary} leading-relaxed pb-0.5 transition-transform duration-300 ${
                      openFaq === i ? "translate-y-0" : "-translate-y-1"
                    }`}
                  >
                    {item.a}
                  </p>
                </div>
              </div>
            </div>
          ))}

          <div
            className={`mt-2 flex items-center gap-3 rounded-2xl px-4 py-3 ${theme.faqBg} border ${theme.cardBorder}`}
          >
            <FaEnvelope className={theme.textSecondary} size={14} />
            <span className={`text-sm ${theme.textPrimary}`}>
              support@selasar.app
            </span>
          </div>
        </div>
      </BottomSheet>

      {/* Bottom Sheet: Tentang Selasar */}
      <BottomSheet
        isOpen={activeModal === "about"}
        onClose={closeModal}
        title="Tentang Selasar"
        theme={theme}
      >
        <div className="flex flex-col items-center text-center gap-3">
            <img src="./src/assets/Logo.png" alt="Selasar Logo" className="size-30 logo-pop"/>
          <div>
            <p className={`text-xs ${theme.textSecondary}`}>Versi 1.0.0</p>
          </div>
          <p
            className={`text-sm ${theme.textSecondary} leading-relaxed max-w-xs`}
          >
            Ruang cerita, ruang berbagi. Selasar dibuat untuk menemani
            percakapan dan koneksi yang lebih hangat.
          </p>
          <div className="flex flex-col gap-2 w-full mt-2">
            <div
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${theme.faqBg} border ${theme.cardBorder}`}
            >
              <FaGlobe className={theme.textSecondary} size={14} />
              <span className={`text-sm ${theme.textPrimary}`}>
                selasar.app
              </span>
            </div>
            <div
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${theme.faqBg} border ${theme.cardBorder}`}
            >
              <FaEnvelope className={theme.textSecondary} size={14} />
              <span className={`text-sm ${theme.textPrimary}`}>
                support@selasar.app
              </span>
            </div>
          </div>
          <p
            className={`text-xs ${theme.textSecondary} flex items-center gap-1 mt-2 opacity-70`}
          >
            Dibuat dengan{" "}
            <FaHeart className="heart-beat text-red-400" size={10} /> di
            Indonesia oleh tim Selasar
          </p>
        </div>
      </BottomSheet>

      {/* Bottom Sheet: Konfirmasi Logout */}
      <BottomSheet
        isOpen={activeModal === "logout"}
        onClose={closeModal}
        title="Keluar Akun"
        icon={FaSignOutAlt}
        theme={theme}
      >
        <div className="flex flex-col gap-5">
          <p className={`text-sm ${theme.textSecondary} leading-relaxed`}>
            Yakin mau keluar dari akun kamu? Kamu perlu masuk lagi untuk
            mengakses Selasar.
          </p>
          <div className="flex gap-3">
            <button
              onClick={closeModal}
              className={`flex-1 rounded-2xl py-3 font-semibold text-sm border ${theme.cardBorder} ${theme.textPrimary} hover:bg-black/5 active:scale-[0.97] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#8B6B4F]`}
            >
              Batal
            </button>
            <button
              onClick={handleLogoutConfirm}
              disabled={loggingOut}
              className="flex-1 rounded-2xl py-3 font-semibold text-sm bg-red-500 hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/30 disabled:opacity-70 text-white flex items-center justify-center gap-2 active:scale-[0.97] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-red-400"
            >
              {loggingOut ? (
                <>
                  <Spinner /> Keluar...
                </>
              ) : (
                "Ya, Keluar"
              )}
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
