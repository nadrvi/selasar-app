import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaPen,
  FaPlug,
  FaWifi,
  FaUsers,
  FaClock,
  FaBookmark,
  FaRegBookmark,
  FaUserCircle,
  FaTimes,
  FaCheck,
  FaCamera,
} from "react-icons/fa";
import {
  getVisits,
  getStats,
  getFavorites as getStoredFavorites,
  toggleFavorite as toggleFavoriteStore,
} from "../utils/activityStore";

const preferenceIcons = {
  colokan: <FaPlug size={18} />,
  wifi: <FaWifi size={18} />,
  keramaian: <FaUsers size={18} />,
  durasi: <FaClock size={18} />,
};

const preferenceOptions = {
  colokan: ["Tersedia / Banyak", "Sedikit", "Tidak Perlu"],
  wifi: ["Minimal 30+ Mbps", "Standar (10-30 Mbps)", "Tidak Penting"],
  keramaian: ["Sepi", "Sedang", "Ramai"],
  durasi: ["<1 Jam", "1-3 Jam", "3+ Jam"],
};

const defaultPreferences = [
  { id: "colokan", title: "Colokan Favorit", value: "Tersedia / Banyak" },
  { id: "wifi", title: "WiFi Favorit", value: "Minimal 30+ Mbps" },
  { id: "keramaian", title: "Keramaian Favorit", value: "Sepi" },
  { id: "durasi", title: "Durasi Favorit", value: "1-3 Jam" },
];

export default function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  // ===== USER DATA (sinkron dari Login/Register) =====
  const [user, setUser] = useState({ name: "Tamu", email: "", quote: "" });
  const [avatar, setAvatar] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("selasarUser"));
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoggedIn(loggedIn);

    if (storedUser) {
      setUser({
        name: storedUser.name || "Tamu",
        email: storedUser.email || "",
        quote:
          storedUser.quote ||
          "Nugas bukan sekadar tugas, tapi juga soal tempat.",
      });
    }

    const storedAvatar = localStorage.getItem(
      `selasarAvatar_${storedUser?.email?.toLowerCase() || "guest"}`,
    );
    if (storedAvatar) setAvatar(storedAvatar);
  }, []);

  const persistUser = (updated) => {
    const merged = { ...user, ...updated };
    setUser(merged);
    const storedUser = JSON.parse(localStorage.getItem("selasarUser")) || {};
    localStorage.setItem(
      "selasarUser",
      JSON.stringify({ ...storedUser, ...merged }),
    );
  };

  // ===== AVATAR UPLOAD (di-scope per akun juga) =====
  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      setAvatar(base64);
      localStorage.setItem(
        `selasarAvatar_${user.email?.toLowerCase() || "guest"}`,
        base64,
      );
    };
    reader.readAsDataURL(file);
  };

  // ===== EDIT NAMA & QUOTE =====
  const [editOpen, setEditOpen] = useState(false);
  const [draftName, setDraftName] = useState(user.name);
  const [draftQuote, setDraftQuote] = useState(user.quote);

  const openEdit = () => {
    setDraftName(user.name);
    setDraftQuote(user.quote);
    setEditOpen(true);
  };

  const saveEdit = () => {
    persistUser({ name: draftName.trim() || "Tamu", quote: draftQuote });
    setEditOpen(false);
  };

  const [preferences, setPreferences] = useState(defaultPreferences);
  const [activePref, setActivePref] = useState(null);

  useEffect(() => {
    const storedPrefs = JSON.parse(localStorage.getItem("selasarPreferences"));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (storedPrefs) setPreferences(storedPrefs);
  }, []);

  const choosePreference = (id, value) => {
    setPreferences((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, value } : p));
      localStorage.setItem("selasarPreferences", JSON.stringify(next));
      return next;
    });
    setActivePref(null);
  };

  // ===== STATS, AKTIVITAS & FAVORIT  =====
  const [stats, setStats] = useState({
    visitedCount: 0,
    favoriteCount: 0,
    avgMatch: null,
  });
  const [activities, setActivities] = useState([]);
  const [savedEntryIds, setSavedEntryIds] = useState(new Set());
  const [activeActivity, setActiveActivity] = useState(null);

  useEffect(() => {
    const refresh = () => {
      setStats(getStats());
      setActivities(getVisits());
      setSavedEntryIds(
        new Set(getStoredFavorites().map((f) => `${f.source}:${f.id}`)),
      );
    };
    refresh();
    window.addEventListener("selasar-activity-updated", refresh);
    return () =>
      window.removeEventListener("selasar-activity-updated", refresh);
  }, []);

  const formatRelativeTime = (timestamp, now) => {
    const diffMin = Math.floor((now - timestamp) / 60000);
    if (diffMin < 1) return "Baru saja";
    if (diffMin < 60) return `${diffMin} menit lalu`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} jam lalu`;
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay} hari lalu`;
  };

  const toggleSave = (activity, e) => {
    e.stopPropagation();
    toggleFavoriteStore({
      source: activity.source,
      id: activity.id,
      name: activity.name,
      image: activity.image,
      match: activity.match,
    });
    setSavedEntryIds((prev) => {
      const next = new Set(prev);
      if (next.has(activity.entryId)) next.delete(activity.entryId);
      else next.add(activity.entryId);
      return next;
    });
    setStats(getStats());
  };

  return (
    <div className="min-h-screen bg-[#EDE8DE] dark:bg-[#1F1B18] pb-16 font-sans">
      {/* HERO */}
      <div className="relative h-[300px] w-full overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80"
          alt="Suasana cafe"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 p-3 bg-white/90 dark:bg-[#2A2521]/90 backdrop-blur-md rounded-full shadow-lg text-[#4A3B38] dark:text-[#F5F2EB] hover:scale-110 active:scale-95 transition-all"
        >
          <FaArrowLeft size={16} />
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-20 relative z-10">
        {/* PROFILE CARD */}
        <div className="bg-white dark:bg-[#2A2521] rounded-3xl shadow-lg overflow-hidden border border-gray-100 dark:border-[#3D342D] mb-8">
          <div className="bg-[#8B7365] dark:bg-[#5C4A40] p-6 sm:p-8 flex items-center gap-5 sm:gap-6">
            <div className="relative shrink-0 group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#D9D2C9] flex items-center justify-center overflow-hidden border-4 border-white/40 shadow-md">
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Foto profil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FaUserCircle size={64} className="text-white/90" />
                )}
              </div>
              <button
                aria-label="Ubah foto profil"
                onClick={handleAvatarClick}
                className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md text-[#5E4B45] hover:scale-110 active:scale-95 transition-all"
              >
                <FaCamera size={11} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-extrabold text-white tracking-wide uppercase leading-snug truncate">
                  {user.name}
                </h1>
                <button
                  onClick={openEdit}
                  aria-label="Edit profil"
                  className="shrink-0 w-7 h-7 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all active:scale-90"
                >
                  <FaPen size={10} />
                </button>
              </div>
              {user.email && (
                <p className="text-white/70 text-xs sm:text-sm font-medium mt-1 truncate">
                  {user.email}
                </p>
              )}
              <p className="text-white/85 text-sm sm:text-base font-medium mt-2 leading-relaxed">
                "{user.quote}"
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-[#3D342D] py-6">
            {[
              {
                label: "Tempat Dikunjungi",
                value: String(stats.visitedCount),
              },
              { label: "Favorit", value: String(stats.favoriteCount) },
              {
                label: "Mood Match Rata-rata",
                value: stats.avgMatch !== null ? `${stats.avgMatch}%` : "-",
              },
            ].map((stat) => (
              <div key={stat.label} className="text-center px-2">
                <p className="text-2xl sm:text-3xl font-extrabold text-[#4A3B38] dark:text-[#F5F2EB]">
                  {stat.value}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* PREFERENSI KAMU */}
        <div className="bg-white dark:bg-[#2A2521] rounded-3xl shadow-sm border border-gray-100 dark:border-[#3D342D] p-6 sm:p-8 mb-8">
          <h2 className="font-bold text-lg text-[#4A3B38] dark:text-[#F5F2EB] mb-5">
            Preferensi Kamu
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {preferences.map((pref) => (
              <div key={pref.id} className="relative">
                <button
                  onClick={() =>
                    setActivePref(activePref === pref.id ? null : pref.id)
                  }
                  className="w-full flex items-center gap-3 bg-[#EBE7DF] dark:bg-[#1F1B18] rounded-2xl p-4 text-left hover:ring-2 hover:ring-[#8B7365]/40 active:scale-[0.98] transition-all"
                >
                  <div className="w-11 h-11 shrink-0 rounded-xl bg-[#4A3B38] dark:bg-[#3D342D] text-white flex items-center justify-center shadow-sm">
                    {preferenceIcons[pref.id]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-[#4A3B38] dark:text-[#F5F2EB]">
                      {pref.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                      {pref.value}
                    </p>
                  </div>
                </button>

                {activePref === pref.id && (
                  <div className="absolute z-20 mt-2 left-0 right-0 bg-white dark:bg-[#2A2521] rounded-2xl shadow-xl border border-gray-100 dark:border-[#3D342D] p-2">
                    {preferenceOptions[pref.id].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => choosePreference(pref.id, opt)}
                        className={`w-full flex items-center justify-between text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                          pref.value === opt
                            ? "bg-[#4A3B38] text-white"
                            : "text-[#4A3B38] dark:text-[#F5F2EB] hover:bg-[#EBE7DF] dark:hover:bg-[#1F1B18]"
                        }`}
                      >
                        {opt}
                        {pref.value === opt && <FaCheck size={12} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* AKTIVITAS TERAKHIR */}
        <div className="bg-white dark:bg-[#2A2521] rounded-3xl shadow-sm border border-gray-100 dark:border-[#3D342D] p-6 sm:p-8">
          <h2 className="font-bold text-lg text-[#4A3B38] dark:text-[#F5F2EB] mb-5">
            Aktivitas Terakhir
          </h2>

          {activities.length > 0 ? (
            <div className="flex flex-col gap-4">
              {activities.map((item) => (
                <div
                  key={item.entryId}
                  onClick={() => setActiveActivity(item)}
                  className="flex items-center gap-4 bg-[#F3EFEA] dark:bg-[#1F1B18] rounded-2xl p-3 sm:p-4 cursor-pointer hover:ring-2 hover:ring-[#8B7365]/40 active:scale-[0.99] transition-all"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-16 sm:w-24 sm:h-16 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#4A3B38] dark:text-[#F5F2EB] truncate">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium truncate">
                      {formatRelativeTime(item.visitedAt, now)}
                      {item.subtitle ? ` · ${item.subtitle}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {item.match !== null && (
                      <span className="text-xs sm:text-sm font-bold text-[#4A3B38] dark:text-[#F5F2EB] border border-gray-300 dark:border-[#3D342D] rounded-lg px-3 py-1.5 whitespace-nowrap">
                        {item.match}% match
                      </span>
                    )}
                    <button
                      onClick={(e) => toggleSave(item, e)}
                      aria-label={
                        savedEntryIds.has(item.entryId)
                          ? "Hapus dari favorit"
                          : "Simpan ke favorit"
                      }
                      className={`transition-all duration-300 active:scale-90 ${
                        savedEntryIds.has(item.entryId)
                          ? "text-[#4A3B38] dark:text-[#F5F2EB]"
                          : "text-gray-300 dark:text-gray-500 hover:text-[#4A3B38] dark:hover:text-[#F5F2EB]"
                      }`}
                    >
                      {savedEntryIds.has(item.entryId) ? (
                        <FaBookmark size={18} />
                      ) : (
                        <FaRegBookmark size={18} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">
                Belum ada aktivitas. Coba jelajahi tempat di Beranda, Peta, atau
                Cari dulu ya!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL EDIT PROFIL */}
      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setEditOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#2A2521] rounded-3xl shadow-2xl w-full max-w-sm p-6 relative"
          >
            <button
              onClick={() => setEditOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-[#3D342D] transition-all"
            >
              <FaTimes size={14} />
            </button>
            <h3 className="font-bold text-lg text-[#4A3B38] dark:text-[#F5F2EB] mb-5">
              Edit Profil
            </h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">
                  Nama
                </label>
                <input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full bg-[#EBE7DF] dark:bg-[#1F1B18] text-[#4A3B38] dark:text-[#F5F2EB] outline-none focus:ring-2 focus:ring-[#8B7365] transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">
                  Quote
                </label>
                <textarea
                  value={draftQuote}
                  onChange={(e) => setDraftQuote(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#EBE7DF] dark:bg-[#1F1B18] text-[#4A3B38] dark:text-[#F5F2EB] outline-none focus:ring-2 focus:ring-[#8B7365] transition-all resize-none"
                />
              </div>
              <button
                onClick={saveEdit}
                className="w-full bg-[#4A3B38] hover:bg-[#342927] active:scale-95 text-white py-3 rounded-full font-semibold transition-all mt-2"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETAIL AKTIVITAS */}
      {activeActivity && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setActiveActivity(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#2A2521] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative"
          >
            <button
              onClick={() => setActiveActivity(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-[#4A3B38] hover:scale-110 active:scale-95 transition-all"
            >
              <FaTimes size={14} />
            </button>
            <img
              src={activeActivity.image}
              alt={activeActivity.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <div className="flex items-center justify-between gap-3 mb-2">
                <h3 className="font-bold text-lg text-[#4A3B38] dark:text-[#F5F2EB]">
                  {activeActivity.name}
                </h3>
                {activeActivity.match !== null && (
                  <span className="text-xs font-bold text-[#4A3B38] dark:text-[#F5F2EB] border border-gray-300 dark:border-[#3D342D] rounded-lg px-3 py-1.5 whitespace-nowrap shrink-0">
                    {activeActivity.match}% match
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">
                Dikunjungi {formatRelativeTime(activeActivity.visitedAt)}
              </p>
              {activeActivity.subtitle && (
                <p className="text-sm text-[#4A3B38] dark:text-[#F5F2EB] leading-relaxed">
                  {activeActivity.subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
