import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  FaCrosshairs,
  FaPlug,
  FaWifi,
  FaArrowRight,
  FaTimes,
  FaCompass,
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";

// City default coordinates
const CITY_COORDINATES = {
  Jakarta: { center: [-6.25, 106.81], zoom: 13 },
  Bandung: { center: [-6.90, 107.61], zoom: 13 },
  Bogor: { center: [-6.60, 106.81], zoom: 12 },
  Semua: { center: [-6.55, 107.15], zoom: 9 },
  "Show Everything": { center: [-6.55, 107.15], zoom: 9 },
};

const getCategoryEmoji = (category) => {
  switch (category) {
    case "Cafe":
      return "☕";
    case "Coworking":
      return "💼";
    case "Perpustakaan":
      return "📚";
    case "Alam":
      return "🌲";
    default:
      return "📍";
  }
};

const createPinIcon = (category, isSelected = false) => {
  const emoji = getCategoryEmoji(category);
  const size = isSelected ? 46 : 38;
  const bg = isSelected ? "#8B6B4F" : "#594A42";
  const border = isSelected ? "#F5F2EB" : "#ffffff";
  const ring = isSelected
    ? "box-shadow: 0 0 0 4px rgba(139, 107, 79, 0.4), 0 8px 24px rgba(0,0,0,0.35);"
    : "box-shadow: 0 4px 14px rgba(0,0,0,0.25);";

  return L.divIcon({
    className: "selasar-marker-wrapper",
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: ${size}px;
        height: ${size}px;
        background: ${bg};
        border: 2.5px solid ${border};
        border-radius: 50%;
        ${ring}
        cursor: pointer;
        transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        transform: translate(-50%, -50%) ${isSelected ? "scale(1.15)" : "scale(1)"};
      ">
        <span style="font-size: ${isSelected ? "20px" : "16px"}; line-height: 1; user-select: none;">
          ${emoji}
        </span>
        <div style="
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
          width: 8px;
          height: 8px;
          background: ${bg};
          border-right: 2px solid ${border};
          border-bottom: 2px solid ${border};
        "></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

const createUserIcon = () => {
  return L.divIcon({
    className: "selasar-user-marker",
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        background: #2563eb;
        border: 3px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.35), 0 4px 12px rgba(0,0,0,0.3);
        transform: translate(-50%, -50%);
      ">
        <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

export default function SelasarMap({
  places = [],
  activeCity = "Semua",
  selectedPlaceId = null,
  onSelectPlace,
  mode = "preview", // "preview" (Beranda) or "full" (Map.jsx)
  onOpenFullMap,
  className = "",
}) {
  const containerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const tileLayerRef = useRef(null);
  const userMarkerRef = useRef(null);

  const { darkMode } = useTheme();
  const [localSpot, setLocalSpot] = useState(null);
  const activeSpot =
    (selectedPlaceId ? places.find((p) => p.id === selectedPlaceId) : null) ||
    localSpot;
  const [isLocating, setIsLocating] = useState(false);

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!containerRef.current || mapInstanceRef.current) return;

    const initialCity = CITY_COORDINATES[activeCity] || CITY_COORDINATES.Semua;
    const map = L.map(containerRef.current, {
      center: initialCity.center,
      zoom: initialCity.zoom,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: mode === "full",
      doubleClickZoom: true,
      dragging: true,
      touchZoom: true,
    });

    // Custom Tile Layer
    const tileUrl = darkMode
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: darkMode ? "abcd" : "abc",
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // FeatureGroup for markers
    const markersGroup = L.featureGroup().addTo(map);
    markersLayerRef.current = markersGroup;

    // Zoom control on bottom right for full mode
    if (mode === "full") {
      L.control
        .zoom({
          position: "bottomright",
        })
        .addTo(map);
    }

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Update Tiles on Dark Mode Change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const tileUrl = darkMode
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    tileLayerRef.current = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: darkMode ? "abcd" : "abc",
    }).addTo(map);
  }, [darkMode]);

  // 3. Update Markers when places or activeSpot changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markersLayerRef.current;
    if (!map || !group) return;

    group.clearLayers();

    places.forEach((place) => {
      if (!place.lat || !place.lng) return;

      const isSelected = activeSpot?.id === place.id;
      const marker = L.marker([place.lat, place.lng], {
        icon: createPinIcon(place.category, isSelected),
        zIndexOffset: isSelected ? 1000 : 100,
      });

      marker.on("click", () => {
        setLocalSpot(place);
        if (onSelectPlace) {
          onSelectPlace(place);
        }
        map.flyTo([place.lat, place.lng], Math.max(map.getZoom(), 14), {
          duration: 0.8,
        });
      });

      group.addLayer(marker);
    });
  }, [places, activeSpot, onSelectPlace]);

  // 4. Smooth Pan/Zoom when activeCity changes
  const flyToCity = useCallback(
    (cityName) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      const target = CITY_COORDINATES[cityName];
      if (cityName === "Semua" || cityName === "Show Everything" || !target) {
        if (places.length > 0) {
          const validCoords = places
            .filter((p) => p.lat && p.lng)
            .map((p) => [p.lat, p.lng]);
          if (validCoords.length > 0) {
            const bounds = L.latLngBounds(validCoords);
            map.flyToBounds(bounds, { padding: [40, 40], duration: 1.2 });
            return;
          }
        }
        map.flyTo(CITY_COORDINATES.Semua.center, CITY_COORDINATES.Semua.zoom, {
          duration: 1.2,
        });
      } else {
        map.flyTo(target.center, target.zoom, { duration: 1.2 });
      }
    },
    [places],
  );

  useEffect(() => {
    flyToCity(activeCity);
  }, [activeCity, flyToCity]);

  // 5. Handle Geolocation (Lokasi Saya)
  const handleLocateMe = (e) => {
    e.stopPropagation();
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung geolokasi.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;

        const map = mapInstanceRef.current;
        if (map) {
          if (userMarkerRef.current) {
            map.removeLayer(userMarkerRef.current);
          }
          const userMarker = L.marker([latitude, longitude], {
            icon: createUserIcon(),
            zIndexOffset: 1500,
          }).addTo(map);
          userMarkerRef.current = userMarker;

          map.flyTo([latitude, longitude], 15, { duration: 1.2 });
        }
      },
      () => {
        setIsLocating(false);
        // Fallback default
        alert("Tidak dapat mengambil lokasi. Pastikan izin GPS diaktifkan.");
      },
      { timeout: 10000 },
    );
  };

  // Reset to default view
  const handleResetView = (e) => {
    e.stopPropagation();
    flyToCity(activeCity);
  };

  return (
    <div
      className={`relative w-full overflow-hidden rounded-[1.75rem] sm:rounded-[2.5rem] shadow-md border border-gray-200 dark:border-[#3D342D] ${
        mode === "preview" ? "h-[280px] sm:h-[320px]" : "h-[340px] sm:h-[450px] md:h-[540px] lg:h-[620px]"
      } ${className}`}
    >
      {/* MAP CANVAS CONTAINER */}
      <div ref={containerRef} className="w-full h-full z-0 select-none" />

      {/* OVERLAY HEADER BADGE */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex items-center gap-1.5 sm:gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 sm:gap-2 bg-white/90 dark:bg-[#2A2521]/90 backdrop-blur-md px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full border border-white/60 dark:border-[#3D342D] shadow-sm">
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#594A42] dark:bg-[#C4A876] animate-pulse"></div>
          <span className="text-[#594A42] dark:text-[#F5F2EB] text-[11px] sm:text-xs font-bold tracking-wide">
            {places.length} Spot{" "}
            {activeCity !== "Semua" && activeCity !== "Show Everything"
              ? `di ${activeCity}`
              : "Tersebar"}
          </span>
        </div>

        {mode === "preview" && onOpenFullMap && (
          <button
            onClick={onOpenFullMap}
            className="flex items-center gap-1.5 bg-[#594A42] text-white px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold hover:bg-[#433731] transition-all hover:scale-105 active:scale-95 shadow-md"
          >
            <span>Peta Penuh</span>
            <FaArrowRight size={10} />
          </button>
        )}
      </div>

      {/* FLOATING MAP CONTROLS */}
      <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-20 flex flex-col gap-1.5 sm:gap-2">
        <button
          onClick={handleLocateMe}
          disabled={isLocating}
          aria-label="Cari Lokasi Saya"
          className="w-9 h-9 sm:w-10 sm:h-10 bg-white/95 dark:bg-[#2A2521]/95 backdrop-blur-md rounded-full shadow-md border border-gray-200 dark:border-[#3D342D] flex items-center justify-center text-[#594A42] dark:text-[#F5F2EB] hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
        >
          <FaCrosshairs
            size={14}
            className={isLocating ? "animate-spin text-blue-500" : ""}
          />
        </button>

        <button
          onClick={handleResetView}
          aria-label="Pusatkan Peta"
          className="w-9 h-9 sm:w-10 sm:h-10 bg-white/95 dark:bg-[#2A2521]/95 backdrop-blur-md rounded-full shadow-md border border-gray-200 dark:border-[#3D342D] flex items-center justify-center text-[#594A42] dark:text-[#F5F2EB] hover:scale-110 active:scale-95 transition-all"
        >
          <FaCompass size={14} />
        </button>
      </div>

      {/* MINI SPOT CARD ON PIN CLICK (PREVIEW MODE) */}
      {activeSpot && mode === "preview" && (
        <div className="absolute bottom-4 left-4 right-16 sm:right-auto sm:max-w-xs z-30 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-white/95 dark:bg-[#2A2521]/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-white/80 dark:border-[#3D342D] flex items-center gap-3 relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLocalSpot(null);
              }}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <FaTimes size={11} />
            </button>

            <img
              src={activeSpot.image}
              alt={activeSpot.name}
              className="w-14 h-14 rounded-xl object-cover shrink-0"
            />

            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B6B4F] dark:text-[#C4A876]">
                  {activeSpot.city}
                </span>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  {activeSpot.distance}
                </span>
              </div>
              <h4 className="font-extrabold text-sm text-[#594A42] dark:text-[#F5F2EB] truncate">
                {activeSpot.name}
              </h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1">
                  <FaPlug size={10} className="text-[#8B6B4F]" />{" "}
                  {activeSpot.colokanProbability}
                </span>
                <span className="flex items-center gap-1">
                  <FaWifi size={10} className="text-[#8B6B4F]" />{" "}
                  {activeSpot.wifiStatus?.split(" ")[0] || "Bagus"}
                </span>
              </p>
            </div>

            <button
              onClick={() => onSelectPlace && onSelectPlace(activeSpot)}
              className="px-2.5 py-1.5 bg-[#594A42] text-white rounded-xl text-[11px] font-bold hover:bg-[#433731] transition-all shrink-0 active:scale-95 shadow-sm"
            >
              Detail
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
