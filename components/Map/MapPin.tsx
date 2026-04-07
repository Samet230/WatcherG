// WatcherG — Leaflet harita pin bileşeni (v2)
// Her kategori → kendi haber penceresi stili

import type { Pin, NewsCategory } from "@/types/pin";
import {
  CATEGORY_CONFIG,
  PRIORITY_COLORS,
  PRIORITY_BORDER,
  getPinSize,
  getTimeLabel,
} from "@/types/pin";
import L from "leaflet";

// ─── PİN EKLEME ───────────────────────────────────

export function addPinToMap(map: L.Map, pin: Pin): L.CircleMarker {
  const radius = getPinSize(pin);
  const isCritical = pin.oncelik === "CRITICAL";
  const isHigh     = pin.oncelik === "HIGH";

  // Ana pin
  const marker = L.circleMarker([pin.koordinat.lat, pin.koordinat.lng], {
    radius,
    fillColor:   pin.renk,
    color:       isCritical ? PRIORITY_COLORS.CRITICAL : isHigh ? PRIORITY_COLORS.HIGH : "#ffffff",
    weight:      isCritical ? 2.5 : 1,
    opacity:     0.95,
    fillOpacity: 0.82,
  }).addTo(map);

  // CRITICAL / HIGH → ekstra pulse halkası
  if (isCritical || isHigh) {
    const pulse = L.circleMarker([pin.koordinat.lat, pin.koordinat.lng], {
      radius:      radius + 5,
      fillColor:   "transparent",
      color:       pin.renk,
      weight:      1,
      opacity:     0.3,
      fillOpacity: 0,
      interactive: false,
    }).addTo(map);
    marker.on("remove", () => map.removeLayer(pulse));
  }

  marker.bringToFront();

  // Haber kartı popup
  marker.bindPopup(buildNewsCard(pin), {
    className:   `wg-popup wg-popup--${pin.kategori} wg-popup--${pin.oncelik.toLowerCase()}`,
    closeButton: false,
    maxWidth:    340,
    minWidth:    300,
    autoPan:     true,
  });

  // Hover tooltip (mini)
  const cfg = CATEGORY_CONFIG[pin.kategori];
  marker.bindTooltip(
    `<div class="wg-tt">
      <span style="color:${PRIORITY_COLORS[pin.oncelik]}">● ${pin.oncelik}</span>
      &nbsp;
      <span style="color:${cfg.renk}">${cfg.ikon} ${cfg.etiket}</span>
      <br/>
      <span style="color:#C0FFD8">${pin.baslik.substring(0, 65)}${pin.baslik.length > 65 ? "…" : ""}</span>
    </div>`,
    { sticky: true, className: "wg-tooltip-wrap", offset: [14, 0] }
  );

  return marker;
}

export function addPinsToMap(map: L.Map, pins: Pin[]): L.CircleMarker[] {
  return pins.map(pin => addPinToMap(map, pin));
}

export function clearPinsFromMap(map: L.Map, markers: L.CircleMarker[]): void {
  markers.forEach(m => map.removeLayer(m));
}

// ─── HABER KARTI BUILDER ──────────────────────────

function buildNewsCard(pin: Pin): string {
  const cfg          = CATEGORY_CONFIG[pin.kategori];
  const borderColor  = PRIORITY_BORDER[pin.oncelik];
  const priorityColor = PRIORITY_COLORS[pin.oncelik];
  const timeLabel    = getTimeLabel(pin.tarih);
  const dateStr      = new Date(pin.tarih).toLocaleDateString("tr-TR", { day:"numeric", month:"short" });
  const timeStr      = new Date(pin.tarih).toLocaleTimeString("tr-TR", { hour:"2-digit", minute:"2-digit" });

  const gorselHtml = pin.gorsel
    ? `<div style="margin:10px 0;overflow:hidden;border:1px solid rgba(255,255,255,0.07)">
        <img src="${pin.gorsel}" alt="" style="width:100%;max-height:130px;object-fit:cover;display:block;filter:brightness(0.9) saturate(0.85)"/>
       </div>`
    : "";

  const categoryFields = buildCategoryFields(pin);

  return `
    <div style="background:#030A06;border:1px solid ${borderColor};font-family:monospace;font-size:11px;color:#C0FFD8;min-width:300px;max-width:340px;overflow:hidden">

      ${buildCardStyles()}

      <!-- HEADER BAR -->
      <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 12px;background:rgba(0,0,0,0.55);border-bottom:1px solid ${borderColor}">
        <div style="display:flex;align-items:center;gap:7px">
          <span style="width:7px;height:7px;border-radius:50%;background:${priorityColor};box-shadow:0 0 7px ${priorityColor};display:inline-block" class="wg-blink"></span>
          <span style="color:${priorityColor};letter-spacing:2px;font-size:9px">${pin.oncelik} PRIORITY</span>
        </div>
        <span style="color:#4A8862;font-size:9px;letter-spacing:1px">${timeLabel}</span>
      </div>

      <!-- BODY -->
      <div style="padding:11px 12px 0">

        <!-- KAYNAK + KATEGORİ -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:9px">
          <div>
            <div style="font-size:13px;font-weight:bold;color:#fff;letter-spacing:1px;line-height:1">
              @${pin.kaynak.replace(/\..+/, "").replace(/^(www\.)/,"").substring(0,22)}
            </div>
            <div style="display:inline-block;margin-top:4px;padding:2px 8px;border:1px solid ${cfg.renk}33;color:${cfg.renk};font-size:8px;letter-spacing:2px">
              ${cfg.ikon} ${cfg.etiket}
            </div>
          </div>
          <div style="padding:3px 9px;background:${priorityColor};color:#000;font-size:9px;font-weight:bold;letter-spacing:2px;flex-shrink:0">
            ${pin.oncelik}
          </div>
        </div>

        <!-- PENCERE TİPİ -->
        <div style="font-size:8px;letter-spacing:3.5px;color:#4A8862;margin-bottom:6px;padding-bottom:5px;border-bottom:1px solid rgba(0,255,136,0.07)">
          ${cfg.pencereBaslik}
        </div>

        <!-- BAŞLIK -->
        <div style="font-size:13px;line-height:1.5;color:#E0E0E0;margin-bottom:8px;font-family:sans-serif">
          ${pin.baslik}
        </div>

        <!-- GÖRSEL -->
        ${gorselHtml}

        <!-- KATEGORİ ÖZEL ALANLAR -->
        ${categoryFields}

      </div>

      <!-- FOOTER -->
      <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 12px;border-top:1px solid rgba(0,255,136,0.06);background:rgba(0,0,0,0.35);margin-top:8px">
        <div style="display:flex;gap:10px;align-items:center">
          ${pin.konum ? `<span style="color:#4A8862;font-size:9px">📍 ${pin.konum}</span>` : ""}
          <span style="color:#4A8862;font-size:9px">${dateStr} ${timeStr}</span>
        </div>
        <a href="${pin.detayUrl}" target="_blank" rel="noopener"
           style="display:flex;align-items:center;gap:3px;color:#00FF88;font-size:9px;letter-spacing:1px;text-decoration:none;padding:3px 8px;border:1px solid rgba(0,255,136,0.25)">
          ↗ Kaynağa Git
        </a>
      </div>

      <!-- GÜVENİLİRLİK BAR -->
      <div style="height:2px;background:linear-gradient(90deg,${cfg.renk} ${pin.kaynakSkoru}%,rgba(0,0,0,0.25) ${pin.kaynakSkoru}%)" title="Kaynak güvenilirliği: ${pin.kaynakSkoru}/100"></div>

    </div>`;
}

// ─── KATEGORİ ÖZEL İÇERİK ─────────────────────────

function buildCategoryFields(pin: Pin): string {
  const row  = `display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:9px;letter-spacing:1px`;
  const lbl  = `color:#4A8862`;
  const val  = `color:#C0FFD8;text-align:right;max-width:58%`;

  switch (pin.kategori as NewsCategory) {

    // ── ÇATIŞMA ──────────────────────────────
    case "conflict": return `
      <div style="background:rgba(255,68,68,0.06);padding:8px 9px;border:1px solid rgba(255,68,68,0.18);margin-bottom:8px">
        <div style="${row}">
          <span style="${lbl}">LOCATION</span>
          <span style="${val}">📍 ${pin.konum || "Konum bilinmiyor"}</span>
        </div>
        <div style="${row}">
          <span style="${lbl}">TYPE</span>
          <span style="color:#FF4444;letter-spacing:2px">● CONFLICT</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding-top:5px;font-size:9px">
          <span style="${lbl}">SOURCE SCORE</span>
          <span style="color:${pin.kaynakSkoru >= 80 ? "#00FF88" : pin.kaynakSkoru >= 50 ? "#FFD700" : "#FF4444"}">${pin.kaynakSkoru}/100</span>
        </div>
      </div>`;

    // ── AFET & DEPREM ─────────────────────────
    case "disaster": {
      const magMatch   = pin.ozet.match(/Büyüklük\s*([\d.]+)/i);
      const depthMatch = pin.ozet.match(/(\d+)\s*km/i);
      const mag   = magMatch   ? magMatch[1]   : null;
      const depth = depthMatch ? depthMatch[1] : null;
      return `
        <div style="background:rgba(255,136,0,0.06);padding:8px 9px;border:1px solid rgba(255,136,0,0.2);margin-bottom:8px">
          ${mag   ? `<div style="${row}"><span style="${lbl}">MAGNITUDE</span><span style="color:#FF8800;font-size:15px;font-family:monospace;font-weight:bold">M ${mag}</span></div>` : ""}
          ${depth ? `<div style="${row}"><span style="${lbl}">DEPTH</span><span style="${val}">${depth} km</span></div>` : ""}
          <div style="${row}">
            <span style="${lbl}">LOCATION</span>
            <span style="${val}">📍 ${pin.konum || "Konum bilinmiyor"}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding-top:5px;font-size:9px">
            <span style="${lbl}">DATA SOURCE</span>
            <span style="color:#00FF88">${pin.kaynak}</span>
          </div>
        </div>`;
    }

    // ── SAĞLIK ───────────────────────────────
    case "health": return `
      <div style="background:rgba(68,136,255,0.06);padding:8px 9px;border:1px solid rgba(68,136,255,0.2);margin-bottom:8px">
        <div style="${row}"><span style="${lbl}">ALERT TYPE</span><span style="color:#4488FF">● HEALTH ALERT</span></div>
        <div style="${row}"><span style="${lbl}">LOCATION</span><span style="${val}">📍 ${pin.konum || "Küresel"}</span></div>
        <div style="display:flex;justify-content:space-between;padding-top:5px;font-size:9px">
          <span style="${lbl}">SOURCE</span><span style="color:#4488FF">${pin.kaynak}</span>
        </div>
      </div>`;

    // ── SİYASET ──────────────────────────────
    case "politics": return `
      <div style="background:rgba(255,215,0,0.06);padding:8px 9px;border:1px solid rgba(255,215,0,0.2);margin-bottom:8px">
        <div style="${row}"><span style="${lbl}">TYPE</span><span style="color:#FFD700">● POLITICAL</span></div>
        <div style="${row}"><span style="${lbl}">LOCATION</span><span style="${val}">📍 ${pin.konum || "Küresel"}</span></div>
        <div style="display:flex;justify-content:space-between;padding-top:5px;font-size:9px">
          <span style="${lbl}">SOURCE</span><span style="color:#FFD700">${pin.kaynak}</span>
        </div>
      </div>`;

    // ── EKONOMİ ──────────────────────────────
    case "economy": return `
      <div style="background:rgba(0,255,136,0.04);padding:8px 9px;border:1px solid rgba(0,255,136,0.18);margin-bottom:8px">
        <div style="${row}"><span style="${lbl}">TYPE</span><span style="color:#00FF88">● MARKET UPDATE</span></div>
        <div style="${row}"><span style="${lbl}">REGION</span><span style="${val}">📍 ${pin.konum || "Küresel"}</span></div>
        <div style="display:flex;justify-content:space-between;padding-top:5px;font-size:9px">
          <span style="${lbl}">SOURCE</span><span style="color:#00FF88">${pin.kaynak}</span>
        </div>
      </div>`;

    case "technology": return `
      <div style="background:rgba(168,85,247,0.06);padding:8px 9px;border:1px solid rgba(168,85,247,0.2);margin-bottom:8px">
        <div style="${row}"><span style="${lbl}">TYPE</span><span style="color:#A855F7">● TECH WATCH</span></div>
        <div style="${row}"><span style="${lbl}">REGION</span><span style="${val}">📍 ${pin.konum || "Küresel"}</span></div>
        <div style="display:flex;justify-content:space-between;padding-top:5px;font-size:9px">
          <span style="${lbl}">SOURCE</span><span style="color:#A855F7">${pin.kaynak}</span>
        </div>
      </div>`;

    case "science": return `
      <div style="background:rgba(125,249,255,0.06);padding:8px 9px;border:1px solid rgba(125,249,255,0.2);margin-bottom:8px">
        <div style="${row}"><span style="${lbl}">TYPE</span><span style="color:#7DF9FF">● SCIENCE BRIEF</span></div>
        <div style="${row}"><span style="${lbl}">REGION</span><span style="${val}">📍 ${pin.konum || "Küresel"}</span></div>
        <div style="display:flex;justify-content:space-between;padding-top:5px;font-size:9px">
          <span style="${lbl}">SOURCE</span><span style="color:#7DF9FF">${pin.kaynak}</span>
        </div>
      </div>`;

    // ── GENEL ────────────────────────────────
    default: return `
      <div style="padding:4px 0 8px;font-size:9px;letter-spacing:1px;color:#4A8862;line-height:1.6">
        ${pin.ozet}
      </div>`;
  }
}

// ─── CSS ─────────────────────────────────────────

function buildCardStyles(): string {
  return `
    <style>
      @keyframes wgBlink{0%,100%{opacity:1}50%{opacity:.25}}
      .wg-blink{animation:wgBlink 1.2s ease-in-out infinite}
      .wg-popup .leaflet-popup-content-wrapper{
        padding:0;border-radius:0;
        box-shadow:0 0 40px rgba(0,0,0,0.85),0 0 1px rgba(0,255,136,0.15);
        overflow:hidden;
      }
      .wg-popup .leaflet-popup-content{margin:0;line-height:normal}
      .wg-popup .leaflet-popup-tip-container{display:none}
      .wg-tooltip-wrap{background:transparent;border:none;box-shadow:none;padding:0}
      .wg-tt{
        background:#030A06;
        border:1px solid rgba(0,255,136,0.2);
        padding:6px 10px;
        font-family:monospace;
        font-size:10px;
        letter-spacing:1px;
        max-width:220px;
        line-height:1.6;
        pointer-events:none;
      }
    </style>`;
}
