// =========================
// 📢 ADS ENGINE (SUPABASE FINAL PRO)
// =========================

import { supabase } from "../client.js";

function getSessionId() {

  let id = localStorage.getItem("session_id");

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("session_id", id);
  }

  return id;
}

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

    // =========================
    // 📅 DATE FILTER
    // =========================
    if (c.start_date && now < new Date(c.start_date).getTime()) return false;
    if (c.end_date && now > new Date(c.end_date).getTime()) return false;

    // =========================
    // 🎯 TARGETING (NEW SYSTEM)
    // =========================
    const t = c.targeting || {};

    // 👉 TEAM TARGETING
    if (t.teams?.length) {
      if (!teamId || !t.teams.includes(teamId)) return false;
    }

    // 👉 LEAGUE TARGETING (optional future-proof)
    if (t.leagues?.length) {
      if (!leagueId || !t.leagues.includes(leagueId)) return false;
    }

    // 👉 STATES / CITIES (optional – falls du später nutzt)
    // aktuell passt dein Game diese Werte noch nicht rein
    // → daher bewusst "soft" ignoriert

    return true;
  });
}

// =========================
// 📊 TRACKING
// =========================
async function trackEvent(campaignId, type) {
  try {

    const payload = {
      campaign_id: campaignId,
      type: type,

      // 🔥 optional aber extrem wertvoll
      session_id: getSessionId(),

      // fallback falls DB kein default hat
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from("ad_events")
      .insert(payload);

    if (error) {
      console.warn(`❌ Tracking DB Error (${type}):`, error.message);
    }

  } catch (e) {
    console.warn(`❌ Tracking Crash (${type}):`, e);
  }
}

// =========================
// 🎬 RENDER (optimized + rotation)
// =========================
function renderAds() {

  const el = document.getElementById("adContainer");
  if (!el) return;

  const campaigns = getMatchingAds();

  if (!campaigns.length) {
    el.innerHTML = `<div>Keine Werbung</div>`;
    lastRenderedAdId = null;
    return;
  }

  // 👉 Kampagne rotieren
  const campaign = campaigns[adIndex % campaigns.length];

  const adSets = campaign.ad_sets || [];
  if (!adSets.length) return;

  // 👉 zufälliges AdSet
  const set = adSets[Math.floor(Math.random() * adSets.length)];

  const assets = set.assets || [];
  if (!assets.length) return;

  // 👉 zufälliges Asset
  const asset = assets[Math.floor(Math.random() * assets.length)];
  const img = asset?.url;

  if (!img) return;

  // 👉 dedupe (verhindert unnötige Updates)
  if (lastRenderedAdId === asset.id) return;
  lastRenderedAdId = asset.id;

  // =========================
  // 🔥 SOFT RENDER (KEIN FLICKER)
  // =========================
  let imgEl = el.querySelector("img");
  let linkEl = el.querySelector(".adLink");

  if (imgEl) {

    // 👉 nur Bild austauschen
    imgEl.src = img;

    // 👉 Link updaten (falls vorhanden)
    if (linkEl && campaign.link) {
      linkEl.href = campaign.link;
    }

  } else {

    // 👉 initial render
    el.innerHTML = `
      <div class="adItem">
        ${
          campaign.link
            ? `<a href="${campaign.link}" target="_blank" rel="noopener" class="adLink">
                 <img src="${img}" alt="Ad" loading="lazy">
               </a>`
            : `<img src="${img}" alt="Ad" loading="lazy">`
        }
      </div>
    `;

    imgEl = el.querySelector("img");
    linkEl = el.querySelector(".adLink");
  }

  // =========================
  // 👁️ TRACKING
  // =========================
  trackEvent(campaign.id, "impression");

  if (linkEl) {
    linkEl.onclick = () => {
      trackEvent(campaign.id, "click");
    };
  }
}
// =========================
// 🔄 ROTATION (fixed)
// =========================
function rotateAds() {

  const campaigns = getMatchingAds();
  if (!campaigns.length) return;

  // 👉 safety: falls liste sich ändert
  if (adIndex >= campaigns.length) {
    adIndex = 0;
  }

  adIndex = (adIndex + 1) % campaigns.length;

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
let adInterval = null;

async function startAdEngine() {

  console.log("📢 Ads Engine gestartet (PRO)");

  await loadCampaigns();
  renderAds();

  // 👉 Doppel-Interval verhindern
  if (adInterval) {
    clearInterval(adInterval);
  }

  adInterval = setInterval(async () => {

    const before = campaignsCache.length;

    await loadCampaigns();

    const after = campaignsCache.length;

    // 👉 nur rotieren wenn gleiche Anzahl
    if (before === after) {
      rotateAds();
    } else {
      renderAds(); // neue Daten sofort anzeigen
    }

  }, 8000);

  // 👉 Events (einmalig safe)
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
