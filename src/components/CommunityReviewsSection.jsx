import React, { useState, useEffect } from "react";
import {
  FaStar,
  FaWifi,
  FaPlug,
  FaVolumeUp,
  FaChair,
  FaLightbulb,
  FaThumbsUp,
  FaLaptop,
  FaBookOpen,
  FaCoffee,
  FaUsers,
  FaPen,
} from "react-icons/fa";
import { fetchPlaceReviews, toggleReviewHelpfulAPI } from "../services/api";

/* ─── Constants ────────────────────────────────────────────── */

const PURPOSE_MAP = {
  wfc:     { label: "Pejuang WFC",      icon: FaLaptop,   bg: "bg-blue-50   dark:bg-blue-900/30",   text: "text-blue-700  dark:text-blue-300"  },
  nugas:   { label: "Mahasiswa Nugas",  icon: FaBookOpen, bg: "bg-amber-50  dark:bg-amber-900/30",  text: "text-amber-700 dark:text-amber-300" },
  me_time: { label: "Solo Me-Time",     icon: FaCoffee,   bg: "bg-emerald-50 dark:bg-emerald-900/30",text: "text-emerald-700 dark:text-emerald-300" },
  meeting: { label: "Meeting",          icon: FaUsers,    bg: "bg-purple-50 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300" },
  hangout: { label: "Hangout",          icon: FaCoffee,   bg: "bg-rose-50   dark:bg-rose-900/30",   text: "text-rose-700  dark:text-rose-300"  },
};

const TAG_LABELS = {
  zoom_friendly:        { label: "Aman Zoom",        emoji: "🎧" },
  solo_friendly:        { label: "Solo Friendly",    emoji: "🧘" },
  clean_restroom:       { label: "Toilet Bersih",    emoji: "🚻" },
  musholla_ready:       { label: "Ada Musholla",     emoji: "🕌" },
  indoor_ac_smokefree:  { label: "Bebas Asap Rokok", emoji: "🚭" },
  safe_parking:         { label: "Parkir Aman",      emoji: "🅿️" },
  bright_lighting:      { label: "Terang",           emoji: "💡" },
  power_backup:         { label: "Ada Genset",       emoji: "⚡" },
};

const VISIT_TIME_LABEL = {
  morning: "Pagi", afternoon: "Siang", evening: "Sore", night: "Malam",
};

/* ─── Helpers ───────────────────────────────────────────────── */

function StarRow({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <FaStar
          key={s}
          size={12}
          className={s <= rating ? "text-amber-400" : "text-gray-200 dark:text-gray-700"}
        />
      ))}
    </div>
  );
}

function MetricPill({ icon: Icon, iconColor, label, value }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-2xl bg-white dark:bg-[#2A2521] border border-gray-100 dark:border-[#3D342D] text-center min-w-0">
      <Icon className={`text-base ${iconColor}`} />
      <span className="text-[11px] font-bold text-[#5E4B45] dark:text-[#F5F2EB] leading-tight">{label}</span>
      <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">{value}</span>
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────────── */

export default function CommunityReviewsSection({
  placeId,
  currentUser,
  onOpenWriteReview,
  refreshTrigger = 0,
}) {
  const [reviews, setReviews]                   = useState([]);
  const [summary, setSummary]                   = useState(null);
  const [communityInsights, setCommunityInsights] = useState(null);
  const [loading, setLoading]                   = useState(true);
  const [sort, setSort]                         = useState("latest");
  const [filterPurpose, setFilterPurpose]       = useState("all");

  const uid = currentUser?.id || currentUser?.uid;

  /* fetch */
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!placeId) return;
      setLoading(true);
      try {
        const res = await fetchPlaceReviews(placeId, sort, uid);
        if (alive && res.success) {
          setReviews(res.data || []);
          setSummary(res.summary || null);
          setCommunityInsights(res.community_insights || null);
        }
      } catch {}
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [placeId, sort, refreshTrigger, uid]);

  /* helpful toggle */
  const handleToggleHelpful = async (reviewId) => {
    if (!currentUser) { alert("Silakan login terlebih dahulu."); return; }
    setReviews(prev => prev.map(r =>
      r.id === reviewId
        ? { ...r, is_helpful_by_me: !r.is_helpful_by_me,
            helpful_count: r.is_helpful_by_me
              ? Math.max(0, Number(r.helpful_count) - 1)
              : Number(r.helpful_count) + 1 }
        : r
    ));
    try {
      const res = await toggleReviewHelpfulAPI(reviewId, uid);
      if (res?.success) {
        setReviews(prev => prev.map(r =>
          r.id === reviewId ? { ...r, is_helpful_by_me: res.isHelpful, helpful_count: res.helpful_count } : r
        ));
      }
    } catch {}
  };

  const filtered = reviews.filter(r => filterPurpose === "all" || r.visit_purpose === filterPurpose);

  /* ─── derived insight values ─── */
  const avgRating = summary?.avg_overall ? Number(summary.avg_overall).toFixed(1) : null;
  const wfcPct    = communityInsights?.wfc_score_pct ?? 0;

  const plugLabel = communityInsights?.plug_breakdown
    ? communityInsights.plug_breakdown.abundant > 0 ? "Melimpah"
    : communityInsights.plug_breakdown.sufficient > 0 ? "Cukup"
    : "Terbatas" : "-";

  const wifiLabel = communityInsights?.wifi_breakdown
    ? communityInsights.wifi_breakdown.super_fast > 0 ? "Sangat Kencang"
    : communityInsights.wifi_breakdown.good > 0 ? "Stabil"
    : "Lambat" : "-";

  const noiseLabel = communityInsights?.noise_breakdown
    ? communityInsights.noise_breakdown.quiet > 0 ? "Hening"
    : communityInsights.noise_breakdown.moderate > 0 ? "Kondusif"
    : "Ramai" : "-";

  const seatLabel = communityInsights?.seat_breakdown
    ? communityInsights.seat_breakdown.ergonomic > 0 ? "Ergonomis"
    : "Standar" : "-";

  /* ═══════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-5 text-[#5E4B45] dark:text-[#F5F2EB]">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-[#3D342D]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-extrabold tracking-tight">Ulasan Komunitas</h3>
            {reviews.length > 0 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#8B6B4F]/10 text-[#8B6B4F] dark:bg-[#C4A876]/20 dark:text-[#C4A876]">
                {reviews.length} ulasan
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
            Colokan · Wi-Fi · Suasana — langsung dari pengunjung
          </p>
        </div>
        <button
          onClick={onOpenWriteReview}
          className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 bg-[#8B6B4F] hover:bg-[#735840] text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95"
        >
          <FaPen size={10} />
          <span>Tulis Ulasan</span>
        </button>
      </div>

      {/* ── Scorecard ── */}
      {reviews.length > 0 && communityInsights && (
        <div className="rounded-2xl border border-gray-200/60 dark:border-[#3D342D] overflow-hidden">

          {/* top row: rating + WFC badge */}
          <div className="flex items-center gap-4 px-4 py-3.5 bg-[#F4EFE8]/80 dark:bg-[#1F1B18]/80">
            {/* big rating */}
            <div className="flex items-end gap-1.5 shrink-0">
              <span className="text-4xl font-black text-[#5E4B45] dark:text-[#F5F2EB] leading-none">
                {avgRating ?? "—"}
              </span>
              <div className="pb-0.5 space-y-0.5">
                <FaStar className="text-amber-400" size={16} />
                <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-none whitespace-nowrap">
                  {reviews.length} ulasan
                </p>
              </div>
            </div>

            {/* divider */}
            <div className="h-10 w-px bg-gray-200 dark:bg-gray-700 shrink-0" />

            {/* WFC badge */}
            <div className="min-w-0">
              {wfcPct > 0 ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <FaLaptop size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                      {wfcPct}% cocok WFC
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 leading-snug">
                    Colokan cukup &amp; Wi-Fi stabil
                  </p>
                </>
              ) : (
                <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                  Belum ada data WFC
                </p>
              )}
            </div>
          </div>

          {/* metric grid */}
          <div className="grid grid-cols-4 gap-2 p-3 bg-[#FAF8F5] dark:bg-[#211D1A]">
            <MetricPill icon={FaPlug}      iconColor="text-amber-500"   label="Colokan"  value={plugLabel}  />
            <MetricPill icon={FaWifi}      iconColor="text-blue-500"    label="Wi-Fi"    value={wifiLabel}  />
            <MetricPill icon={FaVolumeUp}  iconColor="text-purple-500"  label="Suasana"  value={noiseLabel} />
            <MetricPill icon={FaChair}     iconColor="text-emerald-500" label="Kursi"    value={seatLabel}  />
          </div>

          {/* safety tags */}
          {communityInsights.top_safety_tags?.length > 0 && (
            <div className="px-3 pb-3 bg-[#FAF8F5] dark:bg-[#211D1A] border-t border-gray-100 dark:border-[#3D342D] pt-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                Dikonfirmasi pengunjung
              </p>
              <div className="flex flex-wrap gap-1.5">
                {communityInsights.top_safety_tags.slice(0, 6).map(({ tag, count }) => {
                  const m = TAG_LABELS[tag] || { emoji: "✨", label: tag };
                  return (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-white dark:bg-[#2A2521] border border-gray-200 dark:border-[#3D342D] text-gray-700 dark:text-gray-300"
                    >
                      <span>{m.emoji}</span>
                      <span>{m.label}</span>
                      <span className="text-gray-400 dark:text-gray-500 font-normal">·{count}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* featured tip */}
          {communityInsights.featured_secret_tips?.length > 0 && (
            <div className="mx-3 mb-3 mt-0 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-800/50">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 dark:text-amber-200 mb-1">
                <FaLightbulb className="text-amber-500 shrink-0" />
                Tips dari komunitas
              </div>
              <p className="text-xs text-amber-900 dark:text-amber-200 italic leading-relaxed">
                "{communityInsights.featured_secret_tips[0].tip}"
              </p>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-semibold">
                — {communityInsights.featured_secret_tips[0].author}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Filter + Sort bar ── */}
      <div className="flex items-center justify-between gap-2">
        {/* purpose chips — scroll horizontally on overflow */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {[
            { key: "all", label: `Semua (${reviews.length})` },
            ...Object.entries(PURPOSE_MAP)
              .filter(([k]) => reviews.some(r => r.visit_purpose === k))
              .map(([k, v]) => ({
                key: k,
                label: `${v.label} (${reviews.filter(r => r.visit_purpose === k).length})`,
              })),
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterPurpose(key)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                filterPurpose === key
                  ? "bg-[#594A42] text-white"
                  : "bg-gray-100 dark:bg-[#1F1B18] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2A2521]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* sort */}
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="shrink-0 px-2.5 py-1.5 text-[11px] bg-white dark:bg-[#1F1B18] border border-gray-200 dark:border-[#3D342D] rounded-lg text-gray-600 dark:text-gray-300 focus:outline-none cursor-pointer"
        >
          <option value="latest">Terkini</option>
          <option value="highest">Rating ↑</option>
          <option value="helpful">Terbermanfaat</option>
        </select>
      </div>

      {/* ── Review list ── */}
      {loading ? (
        <div className="py-10 flex flex-col items-center gap-2 text-gray-400">
          <div className="w-5 h-5 border-2 border-[#8B6B4F] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Memuat ulasan...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center rounded-2xl bg-gray-50 dark:bg-[#1F1B18]/60 border border-dashed border-gray-200 dark:border-[#3D342D] space-y-2.5">
          <FaCoffee className="text-3xl text-gray-300 dark:text-gray-700 mx-auto" />
          <p className="text-sm font-bold text-gray-600 dark:text-gray-300">
            {filterPurpose === "all" ? "Belum ada ulasan." : "Belum ada ulasan untuk kategori ini."}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs mx-auto">
            Jadilah yang pertama berbagi info Wi-Fi, colokan, dan spot terbaik di sini!
          </p>
          <button
            onClick={onOpenWriteReview}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#8B6B4F] text-white rounded-xl text-xs font-bold hover:bg-[#735840] transition-all cursor-pointer"
          >
            <FaPen size={10} /> Bagikan Pengalaman
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(rev => {
            const p = PURPOSE_MAP[rev.visit_purpose] || { label: "Pengunjung", icon: FaCoffee, bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-300" };
            const Icon = p.icon;
            const timeLabel = VISIT_TIME_LABEL[rev.visit_time] ?? null;
            const dateStr = rev.visit_date
              ? new Date(rev.visit_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
              : null;

            return (
              <div
                key={rev.id}
                className="bg-white dark:bg-[#2A2521] rounded-2xl border border-gray-100 dark:border-[#3D342D] overflow-hidden"
              >
                {/* card header */}
                <div className="flex items-start gap-3 p-4">
                  {/* avatar */}
                  <div className="w-9 h-9 rounded-full shrink-0 bg-[#8B6B4F]/10 dark:bg-[#C4A876]/20 text-[#8B6B4F] dark:text-[#C4A876] font-black flex items-center justify-center text-sm overflow-hidden border border-gray-100 dark:border-[#3D342D]">
                    {rev.avatar_url
                      ? <img src={rev.avatar_url} alt="" className="w-full h-full object-cover" />
                      : (rev.display_name || rev.username || "U")[0].toUpperCase()
                    }
                  </div>

                  {/* name + meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-[#5E4B45] dark:text-[#F5F2EB] truncate">
                        {rev.display_name || rev.username || "Pengguna Selasar"}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${p.bg} ${p.text}`}>
                        <Icon size={9} />
                        {p.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                      {[dateStr, timeLabel && `Kunjungan ${timeLabel}`].filter(Boolean).join(" · ")}
                    </p>
                  </div>

                  {/* star badge */}
                  <div className="shrink-0 flex flex-col items-center bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/30 rounded-xl px-2.5 py-1.5">
                    <span className="text-sm font-black text-amber-700 dark:text-amber-300 leading-none">{rev.rating}.0</span>
                    <FaStar size={9} className="text-amber-400 mt-0.5" />
                  </div>
                </div>

                {/* secret tip */}
                {rev.secret_tip && (
                  <div className="mx-4 mb-3 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-800 dark:text-amber-200 mb-0.5">
                      <FaLightbulb className="text-amber-500 shrink-0" size={10} />
                      Tips spot terbaik
                    </div>
                    <p className="text-[11px] text-amber-900 dark:text-amber-200 italic leading-snug">
                      "{rev.secret_tip}"
                    </p>
                  </div>
                )}

                {/* review body */}
                {rev.body && (
                  <p className="px-4 pb-3 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                    {rev.body}
                  </p>
                )}

                {/* tags */}
                {Array.isArray(rev.safety_tags) && rev.safety_tags.length > 0 && (
                  <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                    {rev.safety_tags.map(tag => {
                      const m = TAG_LABELS[tag] || { emoji: "✨", label: tag };
                      return (
                        <span key={tag} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#F4EFE8] dark:bg-[#1F1B18] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#3D342D]">
                          {m.emoji} {m.label}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* footer */}
                <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-t border-gray-100 dark:border-[#3D342D] bg-gray-50/60 dark:bg-[#211D1A]/60">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    {rev.spent_per_person ? `~Rp ${rev.spent_per_person.replace("k", ".000").replace("<", "< ")}` : ""}
                  </span>
                  <button
                    onClick={() => handleToggleHelpful(rev.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer active:scale-95 ${
                      rev.is_helpful_by_me
                        ? "bg-[#8B6B4F] text-white border-[#8B6B4F]"
                        : "bg-white dark:bg-[#2A2521] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-[#3D342D] hover:border-[#8B6B4F] hover:text-[#8B6B4F]"
                    }`}
                  >
                    <FaThumbsUp size={10} />
                    {rev.helpful_count > 0 ? `Bermanfaat · ${rev.helpful_count}` : "Bermanfaat"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
