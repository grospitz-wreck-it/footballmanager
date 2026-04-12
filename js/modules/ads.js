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

// =========================
// 📥 LOAD FROM SUPABASE
// =========================
async function loadCampaigns() {
  try {
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("active", true);

    console.log("📦 SUPABASE DATA:", data);

    if (error) {
      console.error("❌ Supabase Fehler:", error);
      campaignsCache = [];
      return;
    }

    campaignsCache = data || [];

    console.log("✅ campaignsCache gesetzt:", campaignsCache);

  } catch (e) {
    console.error("❌ Load Fehler:", e);
    campaignsCache = [];
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
// 🎬 RENDER (FIXED)
// =========================
function renderAds() {

  const el = document.getElementById("adContainer");
  if (!el) return;

  const ads = getMatchingAds();
  if (!ads.length) {
    el.innerHTML = `<div>Keine Werbung</div>`;
    return;
  }

  const ad = ads[0];
  const img = ad.assets?.[0]?.url;

  if (!img) {
    el.innerHTML = `<div>Kein Asset</div>`;
    return;
  }

  // 🔥 Rendering (JETZT RICHTIG PLATZIERT)
  el.innerHTML = ad.link
    ? `<a href="${ad.link}" target="_blank" rel="noopener" data-id="${ad.id}" class="adLink">
         <img src="${img}" alt="Ad" loading="lazy">
       </a>`
    : `<img src="${img}" alt="Ad" loading="lazy">`;

  // 👁️ IMPRESSION
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
  // 👁️ IMPRESSION
  // =========================
  trackEvent(ad.id, "impression");

  // =========================
  // 🖱 CLICK TRACKING
  // =========================
  const linkEl = el.querySelector(".adLink");

  if (linkEl) {
    linkEl.addEventListener("click", () => {
      trackEvent(ad.id, "click");
    }, { once: true });
  }
}

// =========================
// 🔄 ROTATION
// =========================
function rotateAds() {

  const ads = getMatchingAds();
  if (!ads.length) return;

  adIndex = (adIndex + 1) % ads.length;
  renderAds();
}

// =========================
// 🚀 ENGINE START
// =========================
async function startAdEngine() {

  console.log("📢 Ads Engine gestartet (PRO)");

  await loadCampaigns();
  renderAds();

  setInterval(async () => {
    await loadCampaigns();
    rotateAds();
  }, 8000);

  window.addEventListener("resize", renderAds);
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
