// =========================
// 📢 ADS ENGINE (SUPABASE FINAL PRO)
// =========================

import { createClient } from "https://esm.sh/@supabase/supabase-js";
import { game } from "../core/state.js";
import { SUPABASE_URL, SUPABASE_KEY } from "../config.js";

// =========================
// 🔌 INIT
// =========================
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// =========================
// 📦 STATE
// =========================
let campaignsCache = [];
let adIndex = 0;
let lastRenderedAdId = null;

// =========================
// 📥 LOAD FROM SUPABASE (optimized)
// =========================
async function loadCampaigns() {
  try {
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("active", true);

    if (error) {
      console.error("❌ Supabase Fehler:", error);
      return;
    }

    // 👉 Nur updaten wenn sich was geändert hat
    const newData = JSON.stringify(data || []);
    const oldData = JSON.stringify(campaignsCache);

    if (newData !== oldData) {
      campaignsCache = data || [];
      console.log("✅ campaignsCache updated");
    }

  } catch (e) {
    console.error("❌ Load Fehler:", e);
  }
}

// =========================
// 🎯 MATCHING ENGINE
// =========================
function getMatchingAds() {

  const now = Date.now();
  const leagueId = game.league?.current?.id;
  const teamId = game.team?.selectedId;

  return campaignsCache.filter(c => {

    if (c.start_date && now < new Date(c.start_date).getTime()) return false;
    if (c.end_date && now > new Date(c.end_date).getTime()) return false;

    if (c.scope === "global") return true;

    if (c.scope === "league" && c.scope_ref == leagueId) return true;

    if (c.scope === "team" && Array.isArray(c.scope_ref)) {
      return c.scope_ref.includes(teamId);
    }

    return false;
  });
}

// =========================
// 📊 TRACKING
// =========================
async function trackEvent(campaignId, type) {
  try {
    await supabase.from("ad_events").insert([
      {
        campaign_id: campaignId,
        type: type
      }
    ]);
  } catch (e) {
    console.warn(`Tracking Fehler (${type}):`, e);
  }
}

// =========================
// 🎬 RENDER (optimized + rotation)
// =========================
function renderAds() {

  const el = document.getElementById("adContainer");
  if (!el) return;

  const ads = getMatchingAds();

  if (!ads.length) {
    el.innerHTML = `<div>Keine Werbung</div>`;
    lastRenderedAdId = null;
    return;
  }

  // 👉 Rotation berücksichtigen
  const ad = ads[adIndex % ads.length];
  const img = ad.assets?.[0]?.url;

  if (!img) {
    el.innerHTML = `<div>Kein Asset</div>`;
    return;
  }

  // 👉 Nicht neu rendern wenn gleiche Ad
  if (lastRenderedAdId === ad.id) return;
  lastRenderedAdId = ad.id;

el.innerHTML = `
  <div class="adItem">
    ${
      ad.link
        ? `<a href="${ad.link}" target="_blank" rel="noopener" data-id="${ad.id}" class="adLink">
             <img src="${img}" alt="Ad" loading="lazy">
           </a>`
        : `<img src="${img}" alt="Ad" loading="lazy">`
    }
  </div>
`;

  // 👁️ IMPRESSION (nur einmal pro Anzeige)
  trackEvent(ad.id, "impression");

  // 🖱 CLICK TRACKING
  const linkEl = el.querySelector(".adLink");

  if (linkEl) {
    linkEl.addEventListener("click", () => {
      trackEvent(ad.id, "click");
    }, { once: true });
  }
}

// =========================
// 🔄 ROTATION (fixed)
// =========================
function rotateAds() {

  const ads = getMatchingAds();
  if (!ads.length) return;

  adIndex = (adIndex + 1) % ads.length;
  renderAds();
}

// =========================
// 🧠 DEBOUNCE HELPER
// =========================
function debounce(fn, delay = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

// =========================
// 🚀 ENGINE START
// =========================
async function startAdEngine() {

  console.log("📢 Ads Engine gestartet (PRO)");

  await loadCampaigns();
  renderAds();

  // 👉 weniger aggressive polling
  setInterval(async () => {
    await loadCampaigns();
    rotateAds();
  }, 8000);

  // 👉 optimierte events
  window.addEventListener("resize", debounce(renderAds, 250));
  window.addEventListener("focus", renderAds);
}

// =========================
// 📦 EXPORTS
// =========================
export {
  startAdEngine,
  renderAds,
  getMatchingAds
};
