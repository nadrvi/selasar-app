import React, { useState, useEffect } from "react";
import {
  FaTimes,
  FaStar,
  FaWifi,
  FaPlug,
  FaVolumeMute,
  FaVolumeUp,
  FaChair,
  FaLightbulb,
  FaShieldAlt,
  FaCheck,
  FaCoffee,
  FaLaptop,
  FaBookOpen,
  FaUsers,
  FaClock,
  FaMoneyBillWave,
  FaCheckCircle,
} from "react-icons/fa";
import { submitPlaceReview } from "../services/api";

const VISIT_PURPOSES = [
  { id: "wfc", label: "WFC / Kerja", icon: FaLaptop, color: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900" },
  { id: "nugas", label: "Nugas / Kuliah", icon: FaBookOpen, color: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900" },
  { id: "me_time", label: "Solo Me-Time", icon: FaCoffee, color: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900" },
  { id: "meeting", label: "Meeting / Bisnis", icon: FaUsers, color: "text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900" },
  { id: "hangout", label: "Hangout Santai", icon: FaCoffee, color: "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900" },
];

const PLUG_OPTIONS = [
  { id: "abundant", label: "Melimpah (Hampir Tiap Meja)", desc: "Aman bawa banyak device" },
  { id: "sufficient", label: "Cukup Banyak", desc: "Ada di area tertentu" },
  { id: "limited", label: "Jarang / Terbatas", desc: "Perlu rebutan colokan" },
];

const WIFI_OPTIONS = [
  { id: "super_fast", label: "Super Kencang (>30 Mbps)", desc: "Aman Zoom & upload file besar" },
  { id: "good", label: "Cukup Cepat & Stabil", desc: "Lancar browsing & streaming" },
  { id: "slow", label: "Lambat / Kurang Stabil", desc: "Sering putus atau RTO" },
];

const NOISE_OPTIONS = [
  { id: "quiet", label: "Hening / Tenang", desc: "Library vibes, fokus maksimal" },
  { id: "moderate", label: "Kondusif", desc: "Obrolan santai, tetap nyaman" },
  { id: "lively", label: "Ramai / Musik Kencang", desc: "Butuh headphone ANC" },
];

const SEAT_OPTIONS = [
  { id: "ergonomic", label: "Ergonomis / Busa Empuk", desc: "Betah duduk 3+ jam" },
  { id: "standard", label: "Kursi Kayu Standar", desc: "Cukup nyaman untuk 1-2 jam" },
  { id: "stool", label: "Stool / Tanpa Sandaran", desc: "Kurang cocok untuk kerja lama" },
];

const SAFETY_TAGS = [
  { id: "zoom_friendly", label: "Aman Buat Zoom Call", emoji: "🎧" },
  { id: "solo_friendly", label: "Nyaman Sendirian (Solo)", emoji: "🧘" },
  { id: "clean_restroom", label: "Toilet Bersih & Wangi", emoji: "🚻" },
  { id: "musholla_ready", label: "Musholla Bersih Ada", emoji: "🕌" },
  { id: "indoor_ac_smokefree", label: "Indoor Bebas Rokok (AC)", emoji: "🚭" },
  { id: "safe_parking", label: "Parkir Aman & Luas", emoji: "🅿️" },
  { id: "bright_lighting", label: "Pencahayaan Terang", emoji: "💡" },
  { id: "power_backup", label: "Ada Genset / Backup", emoji: "⚡" },
];

const VISIT_TIMES = [
  { id: "morning", label: "Pagi (08:00 - 12:00)" },
  { id: "afternoon", label: "Siang (12:00 - 16:00)" },
  { id: "evening", label: "Sore (16:00 - 19:00)" },
  { id: "night", label: "Malam (19:00+)" },
];

const SPENT_RANGES = [
  { id: "<25k", label: "< Rp 25.000" },
  { id: "25k-50k", label: "Rp 25k - 50k" },
  { id: "50k-100k", label: "Rp 50k - 100k" },
  { id: ">100k", label: "> Rp 100.000" },
];

const RATING_LABELS = {
  1: "Kurang Nyaman",
  2: "Biasa Saja",
  3: "Cukup Nyaman",
  4: "Sangat Nyaman & Rekomen",
  5: "Spot Impian, Sempurna!",
};

export default function CommunityReviewModal({
  isOpen,
  onClose,
  place,
  currentUser,
  onSuccess,
  existingReview = null,
}) {
  const [rating, setRating] = useState(existingReview?.rating || 5);
  const [hoverRating, setHoverRating] = useState(0);
  const [visitPurpose, setVisitPurpose] = useState(existingReview?.visit_purpose || "wfc");
  const [plugScore, setPlugScore] = useState(existingReview?.plug_score || "abundant");
  const [wifiQuality, setWifiQuality] = useState(existingReview?.wifi_quality || "super_fast");
  const [noiseLevel, setNoiseLevel] = useState(existingReview?.noise_level || "quiet");
  const [seatComfort, setSeatComfort] = useState(existingReview?.seat_comfort || "ergonomic");
  const [safetyTags, setSafetyTags] = useState(existingReview?.safety_tags || ["zoom_friendly", "clean_restroom"]);
  const [secretTip, setSecretTip] = useState(existingReview?.secret_tip || "");
  const [body, setBody] = useState(existingReview?.body || "");
  const [visitTime, setVisitTime] = useState(existingReview?.visit_time || "afternoon");
  const [spentPerPerson, setSpentPerPerson] = useState(existingReview?.spent_per_person || "25k-50k");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating || 5);
      setVisitPurpose(existingReview.visit_purpose || "wfc");
      setPlugScore(existingReview.plug_score || "abundant");
      setWifiQuality(existingReview.wifi_quality || "super_fast");
      setNoiseLevel(existingReview.noise_level || "quiet");
      setSeatComfort(existingReview.seat_comfort || "ergonomic");
      setSafetyTags(existingReview.safety_tags || []);
      setSecretTip(existingReview.secret_tip || "");
      setBody(existingReview.body || "");
      setVisitTime(existingReview.visit_time || "afternoon");
      setSpentPerPerson(existingReview.spent_per_person || "25k-50k");
    }
  }, [existingReview]);

  if (!isOpen) return null;

  const toggleSafetyTag = (tagId) => {
    if (safetyTags.includes(tagId)) {
      setSafetyTags(safetyTags.filter((t) => t !== tagId));
    } else {
      setSafetyTags([...safetyTags, tagId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!currentUser) {
      setErrorMessage("Silakan login terlebih dahulu untuk menulis ulasan komunitas.");
      return;
    }

    if (!body.trim() && !secretTip.trim()) {
      setErrorMessage("Tulis sedikit cerita atau tips rahasia kamu agar ulasan lebih bermanfaat bagi komunitas!");
      return;
    }

    setLoading(true);

    try {
      // Map plug, wifi, noise to 1-5 ratings for backward compatibility
      const ratingPlugVal = plugScore === "abundant" ? 5 : plugScore === "sufficient" ? 4 : 2;
      const ratingWifiVal = wifiQuality === "super_fast" ? 5 : wifiQuality === "good" ? 4 : 2;
      const ratingAmbienceVal = noiseLevel === "quiet" ? 5 : noiseLevel === "moderate" ? 4 : 3;

      const payload = {
        place_id: place.id,
        user_id: currentUser.id || currentUser.uid,
        firebase_uid: currentUser.firebase_uid || currentUser.uid,
        email: currentUser.email,
        rating: Number(rating),
        rating_plug: ratingPlugVal,
        rating_wifi: ratingWifiVal,
        rating_ambience: ratingAmbienceVal,
        rating_price: spentPerPerson === "<25k" ? 5 : spentPerPerson === "25k-50k" ? 4 : spentPerPerson === "50k-100k" ? 3 : 2,
        body: body.trim(),
        visit_purpose: visitPurpose,
        plug_score: plugScore,
        wifi_quality: wifiQuality,
        noise_level: noiseLevel,
        seat_comfort: seatComfort,
        safety_tags: safetyTags,
        secret_tip: secretTip.trim(),
        visit_time: visitTime,
        spent_per_person: spentPerPerson,
      };

      const res = await submitPlaceReview(payload);

      if (res && res.success) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          if (onSuccess) onSuccess(res.data);
          onClose();
        }, 1500);
      } else {
        setErrorMessage(res?.message || "Gagal menyimpan ulasan. Coba lagi.");
      }
    } catch (err) {
      setErrorMessage(err.message || "Terjadi kendala saat mengirim ulasan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#2A2521] text-[#5E4B45] dark:text-[#F5F2EB] rounded-3xl shadow-2xl max-w-2xl w-full my-8 max-h-[90vh] flex flex-col overflow-hidden animate-scale-in relative border border-gray-100 dark:border-[#3D342D]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-[#3D342D] flex items-center justify-between sticky top-0 bg-white/90 dark:bg-[#2A2521]/90 backdrop-blur-md z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#8B6B4F]/10 text-[#8B6B4F] dark:bg-[#C4A876]/20 dark:text-[#C4A876]">
                Community Review
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">• Selasar WFC Index</span>
            </div>
            <h2 className="text-xl font-bold mt-1 text-[#5E4B45] dark:text-[#F5F2EB]">
              {place?.name || "Ulasan Kafe"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 dark:bg-[#3D342D] flex items-center justify-center text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white transition-all cursor-pointer"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isSuccess ? (
            <div className="py-12 flex flex-col items-center justify-center text-center animate-fade-in">
              <FaCheckCircle className="text-green-500 text-6xl mb-4 animate-bounce" />
              <h3 className="text-2xl font-bold text-[#5E4B45] dark:text-[#F5F2EB] mb-2">
                Ulasan Kamu Berhasil Disimpan!
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md">
                Terima kasih sudah berbagi informasi detail untuk komunitas Selasar. Ulasanmu membantu banyak pejuang WFC!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 text-sm border border-red-200 dark:border-red-900">
                  {errorMessage}
                </div>
              )}

              {/* 1. Tujuan Kunjungan */}
              <div>
                <label className="block text-sm font-bold mb-2">
                  1. Tujuan Utama Kunjungan Kamu
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {VISIT_PURPOSES.map((purpose) => {
                    const Icon = purpose.icon;
                    const isSelected = visitPurpose === purpose.id;
                    return (
                      <button
                        type="button"
                        key={purpose.id}
                        onClick={() => setVisitPurpose(purpose.id)}
                        className={`flex items-center gap-2 p-3 rounded-2xl border text-sm font-medium transition-all text-left cursor-pointer ${
                          isSelected
                            ? "border-[#8B6B4F] bg-[#8B6B4F] text-white shadow-sm ring-2 ring-[#8B6B4F]/20 dark:bg-[#8B6B4F] dark:border-[#8B6B4F]"
                            : "border-gray-200 dark:border-[#3D342D] bg-[#F4EFE8]/50 dark:bg-[#1F1B18]/50 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                      >
                        <Icon className={isSelected ? "text-white" : "text-[#8B6B4F] dark:text-[#C4A876]"} />
                        <span className="truncate">{purpose.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Rating Bintang */}
              <div className="bg-[#F4EFE8]/60 dark:bg-[#1F1B18]/60 p-4 rounded-2xl border border-gray-100 dark:border-[#3D342D]">
                <label className="block text-sm font-bold mb-1">
                  2. Rating Kepuasan Keseluruhan
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Seberapa nyaman tempat ini untuk menghabiskan waktu sesuai tujuanmu?
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                        className="text-2xl sm:text-3xl transition-transform hover:scale-110 cursor-pointer focus:outline-none"
                      >
                        <FaStar
                          className={
                            (hoverRating || rating) >= star
                              ? "text-amber-400 drop-shadow-sm"
                              : "text-gray-300 dark:text-gray-600"
                          }
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-[#8B6B4F] dark:text-[#C4A876]">
                    {RATING_LABELS[hoverRating || rating]}
                  </span>
                </div>
              </div>

              {/* 3. WFC & Work-Friendly Scorecards */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#5E4B45] dark:text-[#F5F2EB] flex items-center gap-2">
                  <FaLaptop className="text-[#8B6B4F] dark:text-[#C4A876]" />
                  3. Indeks Kenyamanan Kerja & WFC
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Colokan */}
                  <div className="p-3.5 rounded-2xl bg-[#F4EFE8]/40 dark:bg-[#1F1B18]/40 border border-gray-100 dark:border-[#3D342D]">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">
                      <FaPlug className="text-amber-500" /> Ketersediaan Colokan
                    </div>
                    <div className="space-y-1.5">
                      {PLUG_OPTIONS.map((opt) => (
                        <button
                          type="button"
                          key={opt.id}
                          onClick={() => setPlugScore(opt.id)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                            plugScore === opt.id
                              ? "bg-[#8B6B4F] text-white shadow-sm font-semibold"
                              : "bg-white dark:bg-[#2A2521] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#332C27]"
                          }`}
                        >
                          <div className="font-semibold">{opt.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* WiFi */}
                  <div className="p-3.5 rounded-2xl bg-[#F4EFE8]/40 dark:bg-[#1F1B18]/40 border border-gray-100 dark:border-[#3D342D]">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">
                      <FaWifi className="text-blue-500" /> Kualitas Koneksi Wi-Fi
                    </div>
                    <div className="space-y-1.5">
                      {WIFI_OPTIONS.map((opt) => (
                        <button
                          type="button"
                          key={opt.id}
                          onClick={() => setWifiQuality(opt.id)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                            wifiQuality === opt.id
                              ? "bg-[#8B6B4F] text-white shadow-sm font-semibold"
                              : "bg-white dark:bg-[#2A2521] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#332C27]"
                          }`}
                        >
                          <div className="font-semibold">{opt.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Noise */}
                  <div className="p-3.5 rounded-2xl bg-[#F4EFE8]/40 dark:bg-[#1F1B18]/40 border border-gray-100 dark:border-[#3D342D]">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">
                      <FaVolumeUp className="text-purple-500" /> Suasana & Kebisingan
                    </div>
                    <div className="space-y-1.5">
                      {NOISE_OPTIONS.map((opt) => (
                        <button
                          type="button"
                          key={opt.id}
                          onClick={() => setNoiseLevel(opt.id)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                            noiseLevel === opt.id
                              ? "bg-[#8B6B4F] text-white shadow-sm font-semibold"
                              : "bg-white dark:bg-[#2A2521] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#332C27]"
                          }`}
                        >
                          <div className="font-semibold">{opt.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Kursi */}
                  <div className="p-3.5 rounded-2xl bg-[#F4EFE8]/40 dark:bg-[#1F1B18]/40 border border-gray-100 dark:border-[#3D342D]">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">
                      <FaChair className="text-emerald-500" /> Kenyamanan Kursi & Meja
                    </div>
                    <div className="space-y-1.5">
                      {SEAT_OPTIONS.map((opt) => (
                        <button
                          type="button"
                          key={opt.id}
                          onClick={() => setSeatComfort(opt.id)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                            seatComfort === opt.id
                              ? "bg-[#8B6B4F] text-white shadow-sm font-semibold"
                              : "bg-white dark:bg-[#2A2521] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#332C27]"
                          }`}
                        >
                          <div className="font-semibold">{opt.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Fitur Kenyamanan & Keamanan (Tags) */}
              <div>
                <label className="block text-sm font-bold mb-1">
                  4. Keamanan & Fasilitas Komunitas (Pilih yang tersedia)
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2.5">
                  Membantu pengunjung lain mengetahui fasilitas esensial sebelum datang.
                </p>
                <div className="flex flex-wrap gap-2">
                  {SAFETY_TAGS.map((tag) => {
                    const isChecked = safetyTags.includes(tag.id);
                    return (
                      <button
                        type="button"
                        key={tag.id}
                        onClick={() => toggleSafetyTag(tag.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                          isChecked
                            ? "bg-[#8B6B4F]/15 dark:bg-[#C4A876]/20 border-[#8B6B4F] dark:border-[#C4A876] text-[#8B6B4F] dark:text-[#C4A876] font-bold"
                            : "bg-white dark:bg-[#1F1B18] border-gray-200 dark:border-[#3D342D] text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                      >
                        <span>{tag.emoji}</span>
                        <span>{tag.label}</span>
                        {isChecked && <FaCheck size={10} className="text-[#8B6B4F] dark:text-[#C4A876]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Tips Rahasia Komunitas */}
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40">
                <label className="block text-sm font-bold text-amber-900 dark:text-amber-200 mb-1 flex items-center gap-2">
                  <FaLightbulb className="text-amber-500" />
                  5. Tips Rahasia / Spot Terbaik Kamu
                </label>
                <p className="text-xs text-amber-700/80 dark:text-amber-300/70 mb-2.5">
                  Spot duduk paling favorit, waktu paling sepi, menu ter-worth it, atau tips parkir.
                </p>
                <input
                  type="text"
                  value={secretTip}
                  onChange={(e) => setSecretTip(e.target.value)}
                  placeholder="Contoh: Duduk di lantai 2 pojok kiri dekat rak buku, colokan ada 4 dan AC dingin banget!"
                  maxLength={160}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-[#2A2521] border border-amber-300 dark:border-amber-700 rounded-xl text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* 6. Ulasan Pengalaman Lengkap */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-bold">
                    6. Cerita Pengalaman Kamu
                  </label>
                  <span className="text-xs text-gray-400">
                    {body.length} / 500 karakter
                  </span>
                </div>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Ceritakan pengalamanmu... Bagaimana rasa kopinya, keramahan baristanya, atau suasana ruangannya?"
                  className="w-full p-3.5 text-sm bg-[#F4EFE8]/50 dark:bg-[#1F1B18]/50 border border-gray-200 dark:border-[#3D342D] rounded-2xl text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8B6B4F]"
                />
              </div>

              {/* 7. Waktu Kunjungan & Pengeluaran */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
                    <FaClock /> Waktu Kunjungan
                  </label>
                  <select
                    value={visitTime}
                    onChange={(e) => setVisitTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-[#F4EFE8]/50 dark:bg-[#1F1B18]/50 border border-gray-200 dark:border-[#3D342D] rounded-xl text-gray-800 dark:text-gray-200 focus:outline-none"
                  >
                    {VISIT_TIMES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
                    <FaMoneyBillWave /> Rata-rata Pengeluaran / Orang
                  </label>
                  <select
                    value={spentPerPerson}
                    onChange={(e) => setSpentPerPerson(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-[#F4EFE8]/50 dark:bg-[#1F1B18]/50 border border-gray-200 dark:border-[#3D342D] rounded-xl text-gray-800 dark:text-gray-200 focus:outline-none"
                  >
                    {SPENT_RANGES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-gray-100 dark:border-[#3D342D] flex items-center justify-end gap-3 sticky bottom-0 bg-white dark:bg-[#2A2521] py-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-[#3D342D] text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3D342D] transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-7 py-2.5 rounded-xl bg-[#594A42] hover:bg-[#433731] text-white text-sm font-bold shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Publikasikan Ulasan</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
