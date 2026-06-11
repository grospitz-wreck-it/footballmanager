let insightChart = null;
let currentAssets = [];
import { supabase } from "./client.js";

const {
  data: { user }
} = await supabase.auth.getUser();

console.log("USER:", user);

const ADMIN_EMAILS = [
  "grospitz@gmail.com"
];

if (!user) {
  document.body.innerHTML =
    "<h1>DEBUG: Kein User gefunden</h1>";
  throw new Error("Not authenticated");
}

if (!ADMIN_EMAILS.includes(user.email)) {
  document.body.innerHTML =
    `<h1>DEBUG: Falscher User</h1><pre>${user.email}</pre>`;
  throw new Error("Not authorized");
}

console.log("ADMIN LOGIN OK");
// =====================
// STATE
// =====================
const state = {
  campaigns: [],
  events: [],
  gameEvents: [],
  editId: null,
  editEventId: null,
  inlineEditId: null,
  inlineEventEditId: null,
  partners: [],
selectedPartner: null,

  // 🔥 NEU
  inlineGameEventEditId: null,
  eventReferenceData: {
    leagues: [],
    teams: [],
  },
  eventScopeSelection: [],
};
let currentBroadcastEvent = null;
function getBroadcastEvents() {
  return [
    ...(state.events || []).map((e) => ({
      ...e,
      source: "event",
    })),

    ...(state.gameEvents || []).map((e) => ({
      ...e,
      source: "game",
    })),
  ];
}

function createBroadcastEvent() {

  currentBroadcastEvent = {

    id: null,

    title: "",

    type: "MATCH_INTRO",

    trigger: "always",

    probability: 1,

    hero_asset_id: null,

    assets: [],

    source: "game"

  };

  openBroadcastEditor(
    currentBroadcastEvent
  );

}
function openBroadcastEditor(event) {

  currentBroadcastEvent = event;

  const detail =
    document.getElementById(
      "broadcastDetail"
    );

  if (!detail) return;

  const heroAsset =
  getAssetByType(
    event.assets,
    "hero"
  );

const crowdAsset =
  getAssetByType(
    event.assets,
    "crowd"
  );

const overlayAsset =
  getAssetByType(
    event.assets,
    "overlay"
  );

  detail.innerHTML = `

    <div class="broadcastDetailInner">

      <div class="heroEditor">

  <div
    class="assetPreview heroPreview"
    id="selectHeroAsset"
  >

    ${
  heroAsset
    ? `
          ${
  heroAsset?.mediaType === "video"

    ? `
      <video
        class="detailHero"
        src="${heroAsset.url}"
        autoplay
        muted
        loop
      ></video>
    `

    : `
      <img
        class="detailHero"
        src="${heroAsset?.url || ""}"
      >
    `
}

          <button
            id="removeHeroAsset"
            type="button"
            class="assetDelete"
          >
            ✕
          </button>
        `
        : `
          <div
            class="detailHeroPlaceholder"
          >

            🖼

            <span>
              Hero hinzufügen
            </span>

          </div>
        `
    }

  </div>

  <input
    id="heroUpload"
    type="file"
    accept="image/*,video/*"
    hidden
  >

</div>
<div class="secondaryAssets">

  <div class="assetSlot">

    <strong>
      👥 Crowd
    </strong>

    ${
  crowdAsset

    ? (

      crowdAsset.mediaType === "video"

        ? `

          <video
            class="slotPreview"
            src="${crowdAsset.url}"
            autoplay
            muted
            loop
          ></video>

        `

        : `

          <img
            class="slotPreview"
            src="${crowdAsset.url}"
          >

        `

    )

    : `

      <div
        class="slotPlaceholder"
      >
        Kein Crowd Asset
      </div>

    `
}

    <button
      id="selectCrowdAsset"
      type="button"
      class="btn"
    >
      Crowd auswählen
    </button>
${
  crowdAsset
    ? `
      <button
        id="removeCrowdAsset"
        type="button"
        class="btn btn-danger"
      >
        🗑 Crowd entfernen
      </button>
    `
    : ""
}
    <input
      id="crowdUpload"
      type="file"
      accept="image/*,video/*"
      hidden
    >

  </div>

  <div class="assetSlot">

    <strong>
      📺 Overlay
    </strong>

    ${
  overlayAsset

    ? (

      overlayAsset.mediaType === "video"

        ? `

          <video
            class="slotPreview"
            src="${overlayAsset.url}"
            autoplay
            muted
            loop
          ></video>

        `

        : `

          <img
            class="slotPreview"
            src="${overlayAsset.url}"
          >

        `

    )

    : `

      <div
        class="slotPlaceholder"
      >
        Kein Overlay
      </div>

    `
}

    <button
      id="selectOverlayAsset"
      type="button"
      class="btn"
    >
      Overlay auswählen
    </button>
${
  overlayAsset
    ? `
      <button
        id="removeOverlayAsset"
        type="button"
        class="btn btn-danger"
      >
        🗑 Overlay entfernen
      </button>
    `
    : ""
}
    <input
      id="overlayUpload"
      type="file"
      accept="image/*,video/*"
      hidden
    >

  </div>

</div>
      <h2 style="margin-bottom:20px;">

        ${
          event.id
            ? "Event bearbeiten"
            : "Neues Event"
        }

      </h2>

      <div class="detailForm">

        <div class="field">

          <label>Titel</label>

          <input
            id="detailTitle"
            type="text"
            value="${event.title || ""}"
          >

        </div>

        <div class="field">

          <label>Typ</label>

          <select id="detailType">

            <option
              value="MATCH_INTRO"
              ${event.type === "MATCH_INTRO" ? "selected" : ""}
            >
              MATCH_INTRO
            </option>

            <option
              value="IDLE"
              ${event.type === "IDLE" ? "selected" : ""}
            >
              IDLE
            </option>

            <option
              value="PASS"
              ${event.type === "PASS" ? "selected" : ""}
            >
              PASS
            </option>

            <option
              value="DUEL"
              ${event.type === "DUEL" ? "selected" : ""}
            >
              DUEL
            </option>

            <option
              value="SHOT"
              ${event.type === "SHOT" ? "selected" : ""}
            >
              SHOT
            </option>

            <option
              value="SHOT_SAVED"
              ${event.type === "SHOT_SAVED" ? "selected" : ""}
            >
              SHOT_SAVED
            </option>
<option
  value="PENALTY_SAVED"
  ${event.type === "PENALTY_SAVED" ? "selected" : ""}
>
  PENALTY_SAVED
</option>
            <option
              value="GOAL"
              ${event.type === "GOAL" ? "selected" : ""}
            >
              GOAL
            </option>

            <option
              value="FOUL"
              ${event.type === "FOUL" ? "selected" : ""}
            >
              FOUL
            </option>

            <option
              value="PENALTY"
              ${event.type === "PENALTY" ? "selected" : ""}
            >
              PENALTY
            </option>

            <option
              value="HALFTIME"
              ${event.type === "HALFTIME" ? "selected" : ""}
            >
              HALFTIME
            </option>

            <option
              value="FULLTIME"
              ${event.type === "FULLTIME" ? "selected" : ""}
            >
              FULLTIME
            </option>

          </select>

        </div>

        <div class="field">

          <label>Trigger</label>

          <select id="detailTrigger">

            <option
              value="always"
              ${event.trigger === "always" ? "selected" : ""}
            >
              always
            </option>

            <option
              value="random"
              ${event.trigger === "random" ? "selected" : ""}
            >
              random
            </option>

            <option
              value="minute"
              ${event.trigger === "minute" ? "selected" : ""}
            >
              minute
            </option>

            <option
              value="score"
              ${event.trigger === "score" ? "selected" : ""}
            >
              score
            </option>

          </select>

        </div>

        <div class="field">

          <label>Wahrscheinlichkeit</label>

          <input
            id="detailProbability"
            type="number"
            step="0.01"
            min="0"
            max="1"
            value="${event.probability ?? 1}"
          >

        </div>

      </div>

      <div class="detailMeta">

        <div>

          <strong>ID</strong><br>

          ${event.id || "Neu"}

        </div>

        <div>

          <strong>Assets</strong><br>

          ${(event.assets || []).length}

        </div>

        <div>

          <strong>Quelle</strong><br>

          ${event.source || "-"}

        </div>

      </div>
<div class="partnerCard">

  <h3>
    Assets
  </h3>

  <div id="assetList"></div>

</div>
      <div class="detailActions">

        <button
          id="saveBroadcastEvent"
          class="btn btn-success"
        >
          💾 Speichern
        </button>

        ${
          event.id
            ? `
              <button
                id="deleteBroadcastEvent"
                class="btn btn-danger"
              >
                🗑 Löschen
              </button>
            `
            : ""
        }

      </div>

    </div>

  `;
currentAssets =
  currentBroadcastEvent.assets || [];

renderAssetList();
  document
  .getElementById(
    "saveBroadcastEvent"
  )
  ?.addEventListener(
    "click",
    saveBroadcastEvent
  );

document
  .getElementById(
    "deleteBroadcastEvent"
  )
  ?.addEventListener(
    "click",
    deleteBroadcastEvent
  );

// =====================
// HERO PICKER
// =====================

// =====================
// HERO PICKER
// =====================

document
  .getElementById(
    "selectHeroAsset"
  )
  ?.addEventListener(
    "click",
    () => {

      document
        .getElementById(
          "heroUpload"
        )
        ?.click();

    }
  );

// =====================
// CROWD PICKER
// =====================

document
  .getElementById(
    "selectCrowdAsset"
  )
  ?.addEventListener(
    "click",
    () => {

      document
        .getElementById(
          "crowdUpload"
        )
        ?.click();

    }
  );
// =====================
// OVERLAY PICKER
// =====================

document
  .getElementById(
    "selectOverlayAsset"
  )
  ?.addEventListener(
    "click",
    () => {

      document
        .getElementById(
          "overlayUpload"
        )
        ?.click();

    }
  );
  // =====================
// OVERLAY UPLOAD
// =====================

document
  .getElementById(
    "overlayUpload"
  )
  ?.addEventListener(
    "change",
    async (e) => {

      const file =
        e.target.files?.[0];

      if (!file)
        return;

      try {

        const assetId =
          crypto.randomUUID();

        const ext =
          file.name
            .split(".")
            .pop();

        const filename =
          `${assetId}.${ext}`;

        const { error } =
          await supabase
            .storage
            .from(
              "broadcast-assets"
            )
            .upload(
              filename,
              file
            );

        if (error)
          throw error;

        const {
          data
        } = supabase
          .storage
          .from(
            "broadcast-assets"
          )
          .getPublicUrl(
            filename
          );

        const publicUrl =
          data.publicUrl;

        console.log(
          "✅ OVERLAY URL:",
          publicUrl
        );

        const existingAssets =
          currentBroadcastEvent.assets || [];

        const withoutOverlay =
          existingAssets.filter(
            asset =>
              asset?.type !== "overlay"
          );

        currentBroadcastEvent.assets = [

          ...withoutOverlay,

          {
  id: assetId,
  url: publicUrl,
  type: "overlay",
  mediaType: file.type.startsWith("video")
    ? "video"
    : "image"
}

        ];

        openBroadcastEditor(
          currentBroadcastEvent
        );

      }

      catch (err) {

        console.error(err);

        alert(
          "Overlay Upload fehlgeschlagen"
        );

      }

    }
  );
// =====================
// HERO UPLOAD
// =====================

document
  .getElementById(
    "heroUpload"
  )
  ?.addEventListener(
    "change",
    async (e) => {

      const file =
        e.target.files?.[0];

      if (!file)
        return;

      try {

        const assetId =
          crypto.randomUUID();

        const ext =
          file.name
            .split(".")
            .pop();

        const filename =
          `${assetId}.${ext}`;

        const { error } =
          await supabase
            .storage
            .from(
              "broadcast-assets"
            )
            .upload(
              filename,
              file
            );

        if (error)
          throw error;

        const {
          data
        } = supabase
          .storage
          .from(
            "broadcast-assets"
          )
          .getPublicUrl(
            filename
          );

        const publicUrl =
          data.publicUrl;

        console.log(
          "✅ HERO URL:",
          publicUrl
        );

        currentBroadcastEvent.hero_asset_id =
          assetId;

        const existingAssets =
          currentBroadcastEvent.assets || [];

        const withoutHero =
          existingAssets.filter(
            asset =>
              asset?.type !== "hero"
          );

        currentBroadcastEvent.assets = [

          ...withoutHero,

          {
  id: assetId,
  url: publicUrl,
  type: "hero",
  mediaType: file.type.startsWith("video")
    ? "video"
    : "image"
}

        ];

        const heroImg =
          document.querySelector(
            ".detailHero"
          );

        if (heroImg) {

          heroImg.src =
            publicUrl;

        } else {

          openBroadcastEditor(
            currentBroadcastEvent
          );

        }

      }

      catch (err) {

        console.error(err);

        alert(
          "Upload fehlgeschlagen"
        );

      }

    }
  );
  // =====================
// CROWD UPLOAD
// =====================

document
  .getElementById(
    "crowdUpload"
  )
  ?.addEventListener(
    "change",
    async (e) => {

      const file =
        e.target.files?.[0];

      if (!file)
        return;

      try {

        const assetId =
          crypto.randomUUID();

        const ext =
          file.name
            .split(".")
            .pop();

        const filename =
          `${assetId}.${ext}`;

        const { error } =
          await supabase
            .storage
            .from(
              "broadcast-assets"
            )
            .upload(
              filename,
              file
            );

        if (error)
          throw error;

        const {
          data
        } = supabase
          .storage
          .from(
            "broadcast-assets"
          )
          .getPublicUrl(
            filename
          );

        const publicUrl =
          data.publicUrl;

        console.log(
          "✅ CROWD URL:",
          publicUrl
        );

        const existingAssets =
          currentBroadcastEvent.assets || [];

        const withoutCrowd =
          existingAssets.filter(
            asset =>
              asset?.type !== "crowd"
          );

        currentBroadcastEvent.assets = [

          ...withoutCrowd,

          {
  id: assetId,
  url: publicUrl,
  type: "crowd",
  mediaType: file.type.startsWith("video")
    ? "video"
    : "image"
}

        ];

        openBroadcastEditor(
          currentBroadcastEvent
        );

      }

      catch (err) {

        console.error(err);

        alert(
          "Crowd Upload fehlgeschlagen"
        );

      }

    }
  );
document
  .getElementById(
    "removeHeroAsset"
  )
  ?.addEventListener(
    "click",
    async () => {

      try {

        const heroId =
          currentBroadcastEvent.hero_asset_id;

        currentBroadcastEvent.assets =
          (
            currentBroadcastEvent.assets || []
          ).filter(
            asset =>
              asset?.id !== heroId
          );

        currentBroadcastEvent.hero_asset_id =
          null;

        openBroadcastEditor(
          currentBroadcastEvent
        );

        renderBroadcastRows();

      }

      catch (err) {

        console.error(err);

      }

    }
  );
// =====================
// REMOVE CROWD
// =====================

document
  .getElementById(
    "removeCrowdAsset"
  )
  ?.addEventListener(
    "click",
    () => {

      currentBroadcastEvent.assets =
        (
          currentBroadcastEvent.assets || []
        ).filter(
          asset =>
            asset?.type !== "crowd"
        );

      console.log(
        "AFTER REMOVE CROWD",
        currentBroadcastEvent.assets
      );

      openBroadcastEditor(
        currentBroadcastEvent
      );

    }
  );

// =====================
// REMOVE OVERLAY
// =====================

document
  .getElementById(
    "removeOverlayAsset"
  )
  ?.addEventListener(
    "click",
    () => {

      currentBroadcastEvent.assets =
        (
          currentBroadcastEvent.assets || []
        ).filter(
          asset =>
            asset?.type !== "overlay"
        );

      openBroadcastEditor(
        currentBroadcastEvent
      );

      renderBroadcastRows();

    }
  );

}
// =====================
// HELPERS
// =====================
const normalize = (v) => (v || "").toString().trim().toLowerCase();
function clearForm() {
  [
    "campaignName",
    "campaignCustomer",
    "campaignBudget",
    "campaignLink",
    "campaignStart",
    "campaignEnd",
    "targetStates",
    "targetCities",
    "targetTeams",
  ].forEach((id) => {
    const el = qs(id);
    if (el) el.value = "";
  });
}
function getHeroAsset(assets = []) {
  return assets.find(
    a => a?.type === "hero"
  );
}
function getAssetByType(
  assets = [],
  type
) {

  return assets.find(
    a => a?.type === type
  );

}
function calculateCampaignKPIs(campaign, data) {
  if (!data || !data.length) return campaign;

  const adSets = campaign.ad_sets || [];
  const targeting = campaign.targeting || {};

  const updatedSets = adSets.map((set) => {
    const relevant = data.filter((e) => {
      if (e.ad_type !== set.type) return false;

      if (set.placement && e.placement && e.placement !== set.placement) {
        return false;
      }

      if (targeting.states?.length) {
        const states = targeting.states.map(normalize);
        const eventRegion = normalize(e.region);

        if (!eventRegion || !states.includes(eventRegion)) {
          return false;
        }
      }

      if (targeting.cities?.length) {
        const cities = targeting.cities.map(normalize);
        const eventCity = normalize(e.city);

        if (!eventCity || !cities.includes(eventCity)) {
          return false;
        }
      }

      if (targeting.teams?.length) {
        const teams = targeting.teams.map(normalize);
        const eventTeam = normalize(e.team);

        if (!eventTeam || !teams.includes(eventTeam)) {
          return false;
        }
      }

      return true;
    });

    // 🔥 DAS HAT GEFEHLT
    const impressions = relevant.length;

    // =========================
    // 💰 REVENUE (CPM MODEL)
    // =========================
    const ecpm = 8;

    const revenue = impressions ? (impressions / 1000) * ecpm : 0;

    return {
      ...set,
      metrics: {
        impressions,
        revenue: Number(revenue.toFixed(2)),
      },
    };
  });

  return {
    ...campaign,
    ad_sets: updatedSets,
  };
}
const qs = (id) => document.getElementById(id);

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function uuid() {
  return crypto.randomUUID();
}

function copy(text) {
  navigator.clipboard.writeText(text);

  const el = document.createElement("div");
  el.innerText = "Copied";
  el.className = "copyToast";
  document.body.appendChild(el);

  setTimeout(() => el.remove(), 800);
}

function toggleFullscreen(el) {
  el.closest(".asset").classList.toggle("fullscreen");
}
function isDebugEnabled() {
  return localStorage.getItem("debugOverlay") === "true";
}

function formatDurationVerbose(seconds) {
  if (!seconds || seconds <= 0) return "0s";

  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);

  if (min === 0) return `${sec}s`;

  return `${min}m ${sec}s`;
}

function updateDebugButton() {
  const btn = document.getElementById("toggleDebug");
  if (!btn) return;

  const enabled = isDebugEnabled();

  btn.textContent = enabled ? "🐞 Debug ON" : "🐞 Debug OFF";

  btn.style.color = enabled ? "#0f0" : "#888";
}

document.getElementById("toggleDebug")?.addEventListener("click", () => {
  const next = !isDebugEnabled();

  localStorage.setItem("debugOverlay", next.toString());

  updateDebugButton();

  // 🔥 optional: direkt reload triggern
  window.dispatchEvent(
    new StorageEvent("storage", {
      key: "debugOverlay",
    }),
  );
});

function destroyChart() {
  if (insightChart) {
    insightChart.destroy();
    insightChart = null;
  }
}

// INIT
updateDebugButton();
// =====================
// FILE UPLOAD
// =====================
function detectAssetType(file, forcedType = "auto") {
  if (forcedType && forcedType !== "auto") return forcedType;

  const mime = file?.type || "";
  if (mime.includes("video")) return "video";
  if (mime.includes("audio")) return "audio";
  if (mime.includes("image")) return "image";

  const name = (file?.name || "").toLowerCase();
  if (/\.(mp3|wav|ogg|m4a)$/.test(name)) return "audio";
  if (/\.(mp4|webm|mov)$/.test(name)) return "video";

  return "image";
}

async function uploadFiles(bucket, files, forcedType = "auto") {
  let assets = [];

  for (const file of files) {
    const id = uuid();

    const safeName = file.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9._-]/g, "");

    const fileName = `${id}_${safeName}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) {
      console.error(error);
      continue;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);

    assets.push({
      id,
      url: data.publicUrl,
      type: detectAssetType(file, forcedType),
      name: file.name,
    });
  }

  return assets;
}

function getAssetType() {
  const el = document.getElementById("assetType");
  return el?.value || "image";
}

async function createCampaign() {
  const payload = {
    name: qs("campaignName").value,
    customer: qs("campaignCustomer").value,
    budget: Number(qs("campaignBudget").value || 0),
    link: qs("campaignLink").value,

    start_date: qs("campaignStart").value || null,
    end_date: qs("campaignEnd").value || null,

    targeting: {
      states: (qs("targetStates").value || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      cities: (qs("targetCities").value || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      teams: (qs("targetTeams").value || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    },

    ad_sets: [], // 🔥 NEU
    metrics_total: {},

    active: true,
  };

  const { data, error } = await supabase.from("campaigns").insert(payload);

  console.log("INSERT RESULT:", data);
  console.log("INSERT ERROR:", error);

  if (error) {
    alert("❌ Fehler beim Speichern");
    return;
  }

  clearForm();
  loadCampaigns();
}

async function addAssets() {
  const files = qs("assetUpload")?.files;
  const type = qs("assetType")?.value || "image";

  if (!files || !files.length) {
    alert("❌ Keine Assets ausgewählt");
    return;
  }

  const campaign = state.campaigns.find((c) => c.active);

  if (!campaign) {
    alert("❌ Keine aktive Kampagne");
    return;
  }

  if (!campaign.ad_sets?.length) {
    alert("❌ Erst Ad Type erstellen");
    return;
  }

  try {
    // =========================
    // 📤 UPLOAD
    // =========================
    const uploaded = await uploadFiles("ads", files);

    if (!uploaded?.length) {
      alert("❌ Upload fehlgeschlagen");
      return;
    }

    // =========================
    // 🧠 NORMALIZE
    // =========================
    const newAssets = uploaded.map((asset, index) => ({
      ...asset,
      type,
      layer: currentAssets.length + index,
    }));

    // 👉 UI STATE
    currentAssets.push(...newAssets);
    renderAssetList();

    // =========================
    // 💾 SAVE IN DB
    // =========================
    const updatedSets = campaign.ad_sets.map((set, i) => {
      if (i !== 0) return set;

      const existing = set.assets || [];

      return {
        ...set,
        assets: [
          ...existing,
          ...newAssets.map((a, idx) => ({
            ...a,
            layer: existing.length + idx,
          })),
        ],
      };
    });

    const { error } = await supabase
      .from("campaigns")
      .update({ ad_sets: updatedSets })
      .eq("id", campaign.id);

    if (error) {
      console.error(error);
      alert("❌ Fehler beim Speichern");
      return;
    }

    qs("assetUpload").value = "";

    await loadCampaigns();
  } catch (e) {
    console.error("❌ addAssets crash:", e);
    alert("❌ Unerwarteter Fehler");
  }
}

async function addAdSet() {
  const campaign = state.campaigns.find((c) => c.active);

  if (!campaign) {
    alert("❌ Erst Kampagne erstellen");
    return;
  }

  const adSet = {
    id: uuid(),
    type: qs("adType").value,
    placement: qs("adPlacement").value,
    freq_user: Number(qs("freqUser").value || 0),
    freq_day: Number(qs("freqDay").value || 0),
    daily_limit: Number(qs("dailyLimit").value || 0),
    assets: [],
    metrics: {},
  };

  const updated = [...(campaign.ad_sets || []), adSet];

  await supabase
    .from("campaigns")
    .update({ ad_sets: updated })
    .eq("id", campaign.id);

  loadCampaigns();
}

// =====================
// INLINE UPDATE CAMPAIGN
// =====================
async function saveInlineGameEvent(id) {
  const row = document.querySelector(`[data-id="${id}"]`);

  if (!row) return;

  const payload = {
    title: row.querySelector("[data-field='title']")?.value || "",

    type: row.querySelector("[data-field='type']")?.value || "",

    trigger: row.querySelector("[data-field='trigger']")?.value || "random",

    probability: Number(
      row.querySelector("[data-field='probability']")?.value || 0,
    ),

    value: Number(row.querySelector("[data-field='value']")?.value || 0),

    duration: Number(row.querySelector("[data-field='duration']")?.value || 0),

    cooldown: Number(row.querySelector("[data-field='cooldown']")?.value || 0),

    priority: Number(row.querySelector("[data-field='priority']")?.value || 0),

    category: row.querySelector("[data-field='category']")?.value || "default",

    is_guaranteed:
      row.querySelector("[data-field='is_guaranteed']")?.value === "true",
  };

  console.log("💾 SAVE INLINE GAME EVENT:", payload);

  const { error } = await supabase
    .from("event_definitions")
    .update(payload)
    .eq("id", id);

  if (error) {
    console.error("❌ Inline Game Event Save Failed:", error);

    alert("Speichern fehlgeschlagen");
    return;
  }

  state.inlineGameEventEditId = null;

  await loadGameEvents();
}

// =====================
// DELETE
// =====================
async function deleteCampaign(id) {
  await supabase.from("campaigns").delete().eq("id", id);
  loadCampaigns();
}

// =====================
// LOAD
// =====================
async function loadCampaigns() {
  // =========================
  // 🔥 LOAD CAMPAIGNS
  // =========================
  const { data: campaigns, error: cError } = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });
  console.log("LOADED CAMPAIGNS:", campaigns);

  if (cError) {
    console.error("❌ Campaign Load Error", cError);
    return;
  }

  if (!campaigns) return;

  // =========================
  // 🔥 LOAD EVENTS (EINMAL!)
  // =========================
  const { data: events, error: eError } = await supabase
    .from("analytics_events")
    .select("*");

  if (eError) {
    console.error("❌ Events Load Error", eError);
    return;
  }

  // =========================
  // 🔥 KPI CALC
  // =========================
  const enriched = campaigns.map((c) => calculateCampaignKPIs(c, events || []));

  renderCampaigns(enriched);
}

// =====================
// RENDER CAMPAIGNS
// =====================
function renderCampaigns(list) {
  state.campaigns = list;

  const container = qs("campaignList");
  container.innerHTML = "";

  list.forEach((c) => {
    const adSets = c.ad_sets || [];

    // =========================
    // 🔥 KPI CALC
    // =========================
    let totalRevenue = 0;

    adSets.forEach((s) => {
      totalRevenue += s.metrics?.revenue || 0;
    });

    // =========================
    // 🎯 BREAKDOWN UI
    // =========================
    const breakdownHTML = adSets
      .map((set) => {
        const revenue = set.metrics?.revenue || 0;
        const impressions = set.metrics?.impressions || 0;

        const share = totalRevenue
          ? Math.round((revenue / totalRevenue) * 100)
          : 0;

        return `
        <div style="margin-top:6px;">
          <div style="display:flex; justify-content:space-between; font-size:12px;">
            <span>${set.type.toUpperCase()}</span>
            <span>€${revenue} • ${share}%</span>
          </div>

          <div style="
            height:6px;
            background:#0f172a;
            border-radius:4px;
            overflow:hidden;
            margin-top:3px;
          ">
            <div style="
              width:${share}%;
              height:100%;
              background:linear-gradient(90deg,#22c55e,#3b82f6);
            "></div>
          </div>

          <div style="font-size:11px; color:#94a3b8;">
            IMP ${impressions}
          </div>
        </div>
      `;
      })
      .join("");

    // =========================
    // 🎮 ASSETS
    // =========================

    const adSetHTML = adSets
      .map((set) => {
        const assets = set.assets || [];

        const assetHTML = assets
          .map(
            (a) => `
    <div class="asset small">

  
      ${
  a.mediaType === "video"
    ? `<video src="${a.url}" style="height:40px;" muted></video>`
    : `<img src="${a.url}" style="height:40px;">`
}
    </div>
  `,
          )
          .join("");

        return `
    <div class="box" style="margin-top:10px;">
      <strong>${set.type.toUpperCase()}</strong><br>
      🎯 ${set.placement || "-"} • 🔁 ${set.freq_user || 0}/user

      <div class="assetRow">${assetHTML}</div>
    </div>
  `;
      })
      .join("");

    // =========================
    // 🎯 TARGETING
    // =========================
    const targeting = c.targeting?.states?.length
      ? c.targeting.states.join(", ")
      : "Alle";

    // =========================
    // 🎯 CARD
    // =========================
    const div = document.createElement("div");
    div.className = "adRow";

    div.innerHTML = `
      <div style="width:100%">

        <div class="adLeft">
          <div>
            <strong>${c.customer}</strong><br>
            ${c.name}<br>
            💰 ${c.budget}€
          </div>

          <div class="scopeTag">
            🎯 ${targeting}
          </div>
        </div>

        <!-- 🔥 KPI BREAKDOWN -->
        <div style="margin-top:10px;">
          ${breakdownHTML}
        </div>

        <!-- 🔽 AD TYPES -->
        <div style="margin-top:10px;">
          ${adSetHTML}
        </div>

        <div style="margin-top:10px;">
          <button data-action="delete" data-id="${c.id}">🗑️</button>
        </div>

      </div>
    `;

    container.appendChild(div);
  });
}
// =====================
// EVENTS
// =====================
function formatLeagueName(league) {
  const rawName = (league?.name || "Unbenannte Liga").trim();
  const regionName =
    league?.regions?.name || league?.regions?.states?.name || "";

  if (regionName && !rawName.toLowerCase().includes(regionName.toLowerCase())) {
    return `${rawName} (${regionName})`;
  }

  return rawName;
}

function normalizeScopeRefs(value) {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }

  if (value === null || value === undefined) return [];

  return String(value)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function getEventReferenceItems(scope) {
  if (scope === "league") return state.eventReferenceData.leagues;
  if (scope === "team") return state.eventReferenceData.teams;
  return [];
}

function getEventReferenceLabel(scope, value) {
  const refs = normalizeScopeRefs(value);
  if (!refs.length) return "";

  const items = getEventReferenceItems(scope);
  const labels = refs.map((ref) => {
    const item = items.find((i) => String(i.id) === String(ref));
    return item?.label || item?.name || ref;
  });

  return labels.join(", ");
}

function renderEventReferenceOptions(scope, selectedRefs = []) {
  const selected = new Set(selectedRefs.map(String));

  return getEventReferenceItems(scope)
    .map(
      (item) => `
    <option value="${escapeHtml(item.id)}" ${selected.has(String(item.id)) ? "selected" : ""}>
      ${escapeHtml(item.label || item.name || item.id)}
    </option>
  `,
    )
    .join("");
}

function renderInlineScopeRefField(event, scopeLabel) {
  const scope = event.scope || "global";
  const selectedRefs = normalizeScopeRefs(event.scope_ref);

  if (scope === "global") {
    return `
      <label class="field">
        <span>Auswahl</span>
        <input data-field="scope_ref" type="hidden" value="">
        <small>Global gilt automatisch für alle Spiele.</small>
      </label>
    `;
  }

  if (scope === "league") {
    return `
      <label class="field">
        <span>Liga auswählen</span>
        <select data-field="scope_ref">
          <option value="">Keine Liga gewählt</option>
          ${renderEventReferenceOptions("league", selectedRefs)}
        </select>
        <small>${escapeHtml(scopeLabel)}</small>
      </label>
    `;
  }

  return `
    <label class="field">
      <span>Teams auswählen</span>
      <select data-field="scope_ref" multiple size="6">
        ${renderEventReferenceOptions("team", selectedRefs)}
      </select>
      <small>${escapeHtml(scopeLabel)}</small>
    </label>
  `;
}

async function loadEventReferenceData() {
  try {
    const [competitionsResult, teamsResult] = await Promise.all([
      supabase.from("competitions").select(`
          id,
          name,
          level,
          region_id,
          regions (
            id,
            name,
            states ( name )
          )
        `),
      supabase.from("teams").select(`
          id,
          name,
          competition_id,
          competitions (
            id,
            name,
            level
          )
        `),
    ]);

    if (competitionsResult.error) throw competitionsResult.error;
    if (teamsResult.error) throw teamsResult.error;

    const leagues = (competitionsResult.data || [])
      .map((league) => ({
        id: String(league.id),
        name: league.name,
        label: formatLeagueName(league),
        level: Number(league.level) || 99,
      }))
      .sort(
        (a, b) => a.level - b.level || a.label.localeCompare(b.label, "de"),
      );

    const leagueLabelById = new Map(
      leagues.map((l) => [String(l.id), l.label]),
    );

    const teams = (teamsResult.data || [])
      .map((team) => ({
        id: String(team.id),
        name: team.name,
        leagueId: team.competition_id ? String(team.competition_id) : "",
        label: `${team.name}${team.competition_id ? ` (${leagueLabelById.get(String(team.competition_id)) || team.competitions?.name || "Liga"})` : ""}`,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "de"));

    state.eventReferenceData = { leagues, teams };
    renderEventScopePicker();
    loadEvents();
  } catch (error) {
    console.error("❌ Event references load failed:", error);
    const help = qs("eventScopeHelp");
    if (help)
      help.textContent =
        "Liga-/Team-Auswahl konnte nicht geladen werden. Das Speichern bleibt trotzdem möglich.";
  }
}

function syncEventScopeHidden() {
  const hidden = qs("eventScopeRef");
  if (hidden) hidden.value = state.eventScopeSelection.join(",");
}

function renderEventScopeSelected() {
  const container = qs("eventScopeSelected");
  if (!container) return;

  const scope = qs("eventScope")?.value || "global";
  const refs = state.eventScopeSelection;

  if (scope === "global" || !refs.length) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = refs
    .map(
      (ref) => `
    <span class="selectionChip">
      ${escapeHtml(getEventReferenceLabel(scope, ref) || ref)}
      <button type="button" data-action="removeEventScopeRef" data-ref="${escapeHtml(ref)}">×</button>
    </span>
  `,
    )
    .join("");
}

function renderEventScopePicker() {
  const scope = qs("eventScope")?.value || "global";
  const field = document.querySelector(".eventReferenceField");
  const search = qs("eventScopeSearch");
  const picker = qs("eventScopePicker");
  const help = qs("eventScopeHelp");

  if (!field || !search || !picker || !help) return;

  if (scope === "global") {
    field.hidden = true;
    state.eventScopeSelection = [];
    syncEventScopeHidden();
    renderEventScopeSelected();
    return;
  }

  field.hidden = false;

  search.placeholder =
    scope === "league"
      ? "Liga suchen, z.B. Kreisliga oder Region"
      : "Team suchen, z.B. Vereinsname";

  help.textContent =
    scope === "league"
      ? "Eine Liga anklicken. Die technische Liga-ID wird automatisch gespeichert."
      : "Ein oder mehrere Teams anklicken. Die technischen Team-IDs werden automatisch gespeichert.";

  const query = normalize(search.value);
  const items = getEventReferenceItems(scope)
    .filter((item) => !query || normalize(item.label).includes(query))
    .slice(0, 80);

  picker.innerHTML = "";

  if (!items.length) {
    const option = document.createElement("option");
    option.disabled = true;
    option.textContent =
      state.eventReferenceData.leagues.length ||
      state.eventReferenceData.teams.length
        ? "Keine Treffer"
        : "Daten werden geladen...";
    picker.appendChild(option);
  } else {
    items.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.id;
      option.textContent = item.label;
      option.selected = state.eventScopeSelection.includes(item.id);
      picker.appendChild(option);
    });
  }

  renderEventScopeSelected();
}

function selectEventScopeReference(value) {
  const scope = qs("eventScope")?.value || "global";
  if (!value || scope === "global") return;

  if (scope === "league") {
    state.eventScopeSelection = [String(value)];
  } else if (!state.eventScopeSelection.includes(String(value))) {
    state.eventScopeSelection.push(String(value));
  }

  syncEventScopeHidden();
  renderEventScopePicker();
}

function removeEventScopeReference(value) {
  state.eventScopeSelection = state.eventScopeSelection.filter(
    (ref) => ref !== String(value),
  );
  syncEventScopeHidden();
  renderEventScopePicker();
}

function getEventRuntimeConfig(event) {
  const configAsset = (event?.assets || []).find(
    (asset) => asset?.type === "config" && asset?.eventConfig,
  );
  const config = configAsset?.eventConfig || {};

  return {
    trigger: event?.trigger || config.trigger || "random",
    cooldown: Number(event?.cooldown ?? config.cooldown ?? 0),
  };
}

function withEventRuntimeConfig(assets, config) {
  const cleanAssets = (assets || []).filter(
    (asset) => asset?.type !== "config",
  );

  cleanAssets.push({
    id: "event_runtime_config",
    type: "config",
    eventConfig: {
      trigger: config.trigger || "random",
      cooldown: Number(config.cooldown || 0),
    },
  });

  return cleanAssets;
}

function getDisplayAssets(assets) {
  return (assets || []).filter((asset) => asset?.url);
}

function getTriggerLabel(trigger) {
  switch (trigger) {
    case "kickoff":
      return "Anpfiff";
    case "halftime":
      return "Halbzeit";
    case "late":
      return "Schlussphase";
    default:
      return "Zufällig im Live-Spiel";
  }
}

async function saveEvent() {
  const files = qs("eventMedia")?.files;
  const uploadedAssets = files?.length
    ? await uploadFiles("events", files, qs("eventAssetType")?.value || "auto")
    : [];

  if (files?.length && !uploadedAssets.length) {
    alert("❌ Upload fehlgeschlagen. Event wurde nicht gespeichert.");
    return;
  }

  const scope = qs("eventScope")?.value || "global";
  let scope_ref = qs("eventScopeRef")?.value || null;

  if (scope === "team" && scope_ref) {
    scope_ref = scope_ref.split(",").map((s) => s.trim());
  }

  const runtimeConfig = {
    trigger: qs("eventTrigger")?.value || "random",
    cooldown: Number(qs("eventCooldown")?.value || 0),
  };

  const payload = {
    title: qs("eventTitle").value,
    text: qs("eventDescription").value,

    probability: Number(qs("eventProbability").value || 0),
    duration: Number(qs("eventDuration").value || 0),

    effect_type: qs("eventEffectType").value,
    effect_target: qs("eventTarget").value,
    effect_value: Number(qs("eventValue").value || 0),

    modifier_attack: Number(qs("eventAttack").value || 0),
    modifier_defense: Number(qs("eventDefense").value || 0),

    assets: withEventRuntimeConfig(uploadedAssets, runtimeConfig),

    scope,
    scope_ref,
  };

  console.log("🚀 SAVE EVENT:", payload);

  let result;

  if (state.editEventId) {
    result = await supabase
      .from("game_events")
      .update(payload)
      .eq("id", state.editEventId);
  } else {
    result = await supabase.from("game_events").insert(payload);
  }

  if (result?.error) {
    console.error("❌ Save Event Error:", result.error);
    alert(
      `❌ Event wurde nicht gespeichert: ${result.error.message || "Supabase Fehler"}`,
    );
    return;
  }

  state.editEventId = null;
  clearEventForm();
  loadEvents();
}
function clearEventForm() {
  document
    .querySelectorAll(
      "#eventsTab input, #eventsTab textarea, #eventsTab select",
    )
    .forEach((i) => {
      if (i.type === "file") {
        i.value = "";
        return;
      }

      i.value = "";
    });

  if (qs("eventScope")) qs("eventScope").value = "global";
  if (qs("eventProbability")) qs("eventProbability").value = "0.1";
  if (qs("eventDuration")) qs("eventDuration").value = "0";
  if (qs("eventEffectType")) qs("eventEffectType").value = "modifier";
  if (qs("eventTarget")) qs("eventTarget").value = "both";
  if (qs("eventValue")) qs("eventValue").value = "0";
  if (qs("eventAttack")) qs("eventAttack").value = "0";
  if (qs("eventDefense")) qs("eventDefense").value = "0";
  if (qs("eventTrigger")) qs("eventTrigger").value = "random";
  if (qs("eventCooldown")) qs("eventCooldown").value = "0";
  if (qs("eventAssetType")) qs("eventAssetType").value = "auto";
  if (qs("eventScopeSearch")) qs("eventScopeSearch").value = "";

  state.eventScopeSelection = [];
  syncEventScopeHidden();
  renderEventScopePicker();
}

import { EVENT_REGISTRY } from "./engine/eventRegistry.js";

function loadEventTypes() {
  const select = qs("geType");
  if (!select) return;

  select.innerHTML = "";

  // =========================
  // 🧠 CORE MATCH EVENTS
  // =========================
  const coreEvents = [
    ["GOAL", "⚽ Tor"],
    ["SHOT", "🎯 Schuss"],
    ["SHOT_SAVED", "🧤 Parade"],
    ["FOUL", "🚫 Foul"],
    ["PENALTY_SAVED", "🧤 Elfmeter gehalten"],
    ["CORNER", "🚩 Ecke"],
    ["DUEL", "⚔️ Zweikampf"],
    ["MATCH_INTRO", "🎬 Match Intro"],
    ["HALFTIME", "⏸ Halbzeit"],
    ["IDLE", "🏟 Stadion Idle"],

    // 🔥 NEUE GAMEPLAY EVENTS
    ["PASS", "➡️ Pass"],
    ["DRIBBLE", "🌀 Dribbling"],
    ["INTERCEPTION", "🛑 Interception"],
    ["BALL_LOSS", "❌ Ballverlust"],
    ["BALL_RECOVERY", "🔄 Ballgewinn"],
    ["CLEARANCE", "🧹 Klärung"],

    // 🔥 WICHTIG
    ["FULLTIME", "⏱️ Abpfiff"],
  ];

  // =========================
  // 🎯 GROUP LABEL
  // =========================
  const group = document.createElement("optgroup");
  group.label = "Match Events";

  coreEvents.forEach(([value, label]) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;
    group.appendChild(opt);
  });

  select.appendChild(group);

  // =========================
  // 🧩 OPTIONAL: REGISTRY EVENTS
  // =========================
  if (typeof EVENT_REGISTRY !== "undefined") {
    const regGroup = document.createElement("optgroup");
    regGroup.label = "System Events";

    Object.values(EVENT_REGISTRY).forEach((e) => {
      const opt = document.createElement("option");
      opt.value = e.id;
      opt.textContent = e.label || e.id;

      regGroup.appendChild(opt);
    });

    select.appendChild(regGroup);
  }
}

async function loadInsights() {
  const { data: events } = await supabase
    .from("analytics_events")
    .select("event_name, session_id, created_at");

  if (!events || !events.length) return;

  // =========================
  // 🧠 SESSION BUILD
  // =========================
  const sessions = {};

  events.forEach((e) => {
    if (!sessions[e.session_id]) {
      sessions[e.session_id] = {
        start: e.created_at,
        end: e.created_at,
        events: [],
      };
    }

    sessions[e.session_id].events.push(e.event_name);

    if (e.created_at < sessions[e.session_id].start) {
      sessions[e.session_id].start = e.created_at;
    }

    if (e.created_at > sessions[e.session_id].end) {
      sessions[e.session_id].end = e.created_at;
    }
  });

  const sessionList = Object.values(sessions);

  // =========================
  // 🔥 KPI CALC
  // =========================
  const dau = new Set(events.map((e) => e.session_id)).size;

  const matches = events.filter((e) => e.event_name === "match_start").length;

  const durations = sessionList.map(
    (s) => (new Date(s.end) - new Date(s.start)) / 1000,
  );

  const avgSession = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;

  const matchesPerSession = sessionList.length
    ? (matches / sessionList.length).toFixed(2)
    : 0;

  // =========================
  // 🎯 SEGMENTATION
  // =========================
  let casual = 0;
  let core = 0;
  let hardcore = 0;

  sessionList.forEach((s) => {
    const matchCount = s.events.filter((e) => e === "match_start").length;

    if (matchCount <= 1) casual++;
    else if (matchCount <= 4) core++;
    else hardcore++;
  });

  // =========================
  // 💰 MONETIZATION (🔥 NEU)
  // =========================
  const adInterval = 120; // Sekunden pro Ad

  const adsPerSession = Math.floor(avgSession / adInterval);

  const totalImpressions = adsPerSession * sessionList.length;

  const avgCPM = 8; // € – später dynamisch möglich
  const revenue = ((totalImpressions / 1000) * avgCPM).toFixed(2);

  // =========================
  // 🔁 RETENTION PROXY
  // =========================
  const returningUsers = sessionList.filter((s) => s.events.length > 5).length;

  const retention = sessionList.length
    ? ((returningUsers / sessionList.length) * 100).toFixed(1)
    : 0;

  // =========================
  // 🧠 ENGAGEMENT SCORE
  // =========================
  const engagementScore =
    avgSession > 600 ? "🔥 HIGH" : avgSession > 300 ? "⚡ MEDIUM" : "🧊 LOW";

  // =========================
  // ⏱ FORMAT DURATION
  // =========================
  function formatDuration(seconds) {
    if (!seconds || seconds <= 0) return "0:00";

    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);

    return `${min}:${sec.toString().padStart(2, "0")}`;
  }

  // =========================
  // 🔥 UI UPDATE
  // =========================
  qs("insightDAU").textContent = dau;
  qs("insightSessions").textContent = sessionList.length;
  qs("insightMatches").textContent = matches;
  qs("insightAvg").textContent = formatDurationVerbose(avgSession);

  const mps = qs("insightMPS");
  if (mps) mps.textContent = matchesPerSession;

  const eng = qs("insightEngagement");
  if (eng) eng.textContent = engagementScore;

  const seg = qs("insightSegments");
  if (seg) {
    seg.innerHTML = `
      Casual: ${casual}<br>
      Core: ${core}<br>
      Hardcore: ${hardcore}
    `;
  }

  // =========================
  // 💰 MONETIZATION UI
  // =========================
  const monet = qs("insightMonetization");

  if (monet) {
    monet.innerHTML = `
      📺 Ads / Session: ${adsPerSession}<br>
      👁 Impressions: ${totalImpressions}<br>
      💰 Revenue: €${revenue}<br>
      🔁 Retention: ${retention}%
    `;
  }
}

async function getChartData() {
  const { data } = await supabase
    .from("analytics_events")
    .select("created_at, session_id")
    .order("created_at", { ascending: true });

  const map = {};

  data?.forEach((e) => {
    const date = new Date(e.created_at).toLocaleDateString();

    if (!map[date]) {
      map[date] = new Set();
    }

    map[date].add(e.session_id);
  });

  // 🔥 Sets → Zahlen
  const labels = Object.keys(map);
  const values = labels.map((d) => map[d].size);

  return { labels, values };
}

async function loadChart() {
  const ctx = document.getElementById("insightChart");

  // 🔥 FIX 1: Canvas existiert?
  if (!ctx) return;

  // 🔥 FIX 2: alten Chart sauber zerstören
  if (insightChart) {
    insightChart.destroy();
    insightChart = null;
  }

  const data = await getChartData();

  insightChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.labels,
      datasets: [
        {
          label: "Events",
          data: data.values,
        },
      ],
    },
  });
}

async function getGeoData() {
  const { data } = await supabase.from("analytics_events").select("region_id");

  const map = {};

  const REGION_MAP = {
    bayern: "DE-BY",
    nrw: "DE-NW",
    berlin: "DE-BE",
    hamburg: "DE-HH",
  };

  (data || []).forEach((e) => {
    if (!e.region_id) return;

    const key = REGION_MAP[e.region_id.toLowerCase()] || e.region_id;

    map[key] = (map[key] || 0) + 1;
  });

  return map;
}

let geoMap = null;

async function loadGeoMap() {
  const container = document.getElementById("geoMap");
  if (!container) return;

  if (geoMap) {
    geoMap.remove();
  }

  geoMap = L.map("geoMap").setView([51.2, 10.4], 6);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap",
  }).addTo(geoMap);

  const geoData = await getGeoData();
  console.log("GEO DATA:", geoData);
  const res = await fetch("./admin/data/germany.json");
  const germany = await res.json();

  function getColor(value) {
    if (value > 200) return "#800026";
    if (value > 100) return "#BD0026";
    if (value > 50) return "#E31A1C";
    if (value > 20) return "#FC4E2A";
    if (value > 10) return "#FD8D3C";
    if (value > 5) return "#FEB24C";
    if (value > 0) return "#FED976";
    return "#EEE";
  }

  function style(feature) {
    const regionId = feature.properties.id;
    const value = geoData[regionId] || 0;

    return {
      fillColor: getColor(value),
      weight: 1,
      opacity: 1,
      color: "#333",
      fillOpacity: 0.7,
    };
  }

  const geoLayer = L.geoJSON(germany, {
    style,

    onEachFeature: (feature, layer) => {
      const regionId = feature.properties.id;
      const value = geoData[regionId] || 0;

      layer.bindTooltip(`
        <strong>${feature.properties.name}</strong><br>
        👥 ${value} Nutzer
      `);

      layer.on({
        mouseover: (e) => {
          const l = e.target;
          l.setStyle({
            weight: 2,
            color: "#000",
            fillOpacity: 0.9,
          });
          l.bringToFront();
        },
        mouseout: (e) => {
          geoLayer.resetStyle(e.target);
        },
      });
    },
  }).addTo(geoMap);

  // 🔥 BONUS: Top Regionen anzeigen
  renderTopRegions(geoData);
}

function renderTopRegions(geoData) {
  const container = document.getElementById("topRegions");
  if (!container) return;

  const sorted = Object.entries(geoData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (!sorted.length) {
    container.innerHTML = "Keine Daten";
    return;
  }

  container.innerHTML = sorted
    .map(
      ([id, val], i) => `
    <div class="regionRow">
      <span>#${i + 1} Region ${id}</span>
      <strong>${val}</strong>
    </div>
  `,
    )
    .join("");
}

// =====================
// 🎮 GAME EVENTS (NEU)
// =====================

async function saveGameEvent() {
  const files = qs("geMedia")?.files;

  if (!files || !files.length) {
    alert("❌ Game Event braucht Asset!");
    return;
  }

  const assets = await uploadFiles("game-events", files);

  if (!assets.length) {
    alert("❌ Upload failed");
    return;
  }

  const payload = {
    title: qs("geTitle")?.value,
    type: qs("geType")?.value,
    trigger: qs("geTrigger")?.value,
    probability: Number(qs("geProbability")?.value || 0),
    value: Number(qs("geValue")?.value || 0),
    duration: Number(qs("geDuration")?.value || 0),
    assets: assets,
  };

  console.log("🎮 SAVE GAME EVENT:", payload);

  const { error } = await supabase.from("event_definitions").insert(payload);

  if (error) {
    console.error("❌ Save GameEvent Error:", error);
    alert("Speichern fehlgeschlagen");
    return;
  }

  console.log("✅ GameEvent gespeichert");

  // 🔥 reset form (optional aber sinnvoll)
  ["geTitle", "geProbability", "geValue", "geDuration"].forEach((id) => {
    const el = qs(id);
    if (el) el.value = "";
  });

  qs("geMedia").value = "";

  loadGameEvents();
}

async function loadGameEvents() {
  const { data } = await supabase
    .from("event_definitions")
    .select("*")
    .order("created_at", { ascending: false });

  state.gameEvents = data || [];
  renderGameEvents(data || []);
  populateTypeFilter();
  renderBroadcastRows();
}

async function deleteGameEvent(id) {
  if (!confirm("Event wirklich löschen?")) return;

  const { error } = await supabase
    .from("event_definitions")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("❌ Delete Error:", error);
    alert("Löschen fehlgeschlagen");
    return;
  }

  console.log("🗑️ GameEvent gelöscht:", id);

  loadGameEvents();
}

// =====================
// INLINE EVENT UPDATE
// =====================
async function saveInlineEvent(id) {
  const row = document.querySelector(`[data-event-row="${id}"]`);
  if (!row) return;

  const scope = row.querySelector("[data-field='scope']").value;
  const scopeRefEl = row.querySelector("[data-field='scope_ref']");
  let scope_ref = scopeRefEl?.multiple
    ? Array.from(scopeRefEl.selectedOptions).map((option) => option.value)
    : scopeRefEl?.value || null;

  if (scope === "team" && scope_ref) {
    scope_ref = normalizeScopeRefs(scope_ref);
  }

  const existing = state.events.find(
    (event) => String(event.id) === String(id),
  );
  const runtimeConfig = {
    trigger: row.querySelector("[data-field='trigger']")?.value || "random",
    cooldown: Number(row.querySelector("[data-field='cooldown']")?.value || 0),
  };

  const payload = {
    title: row.querySelector("[data-field='title']").value,
    text: row.querySelector("[data-field='description']").value,
    scope,
    scope_ref,

    effect_type: row.querySelector("[data-field='effect_type']").value,
    effect_target: row.querySelector("[data-field='effect_target']").value,

    effect_value: Number(
      row.querySelector("[data-field='effect_value']").value || 0,
    ),
    probability: Number(
      row.querySelector("[data-field='probability']").value || 0,
    ),
    duration: Number(row.querySelector("[data-field='duration']").value || 0),
    modifier_attack: Number(
      row.querySelector("[data-field='modifier_attack']").value || 0,
    ),
    modifier_defense: Number(
      row.querySelector("[data-field='modifier_defense']").value || 0,
    ),
    assets: withEventRuntimeConfig(
      getDisplayAssets(existing?.assets),
      runtimeConfig,
    ),
  };

  const { error } = await supabase
    .from("game_events")
    .update(payload)
    .eq("id", id);

  if (error) {
    console.error("❌ Inline Save Event Error:", error);
    alert(
      `❌ Event wurde nicht gespeichert: ${error.message || "Supabase Fehler"}`,
    );
    return;
  }

  state.inlineEventEditId = null;
  loadEvents();
}

// =====================
// LOAD EVENTS
// =====================
async function loadEvents() {
  const { data } = await supabase.from("game_events").select("*");

  state.events = data || [];

  populateTypeFilter();
  renderBroadcastRows();
}

function renderGameEvents(list) {
  state.gameEvents = list;

  const container = qs("gameEventList");
  if (!container) return;

  container.innerHTML = "";

  list.forEach((e) => {
    const isEdit = state.inlineGameEventEditId === e.id;
    const assets = e.assets || [];

    // =========================
    // 🎨 ASSETS
    // =========================
    const assetHTML = assets
      .map(
        (a) => `
        <div class="asset small">

          <button
            class="danger"
            data-action="deleteAsset"
            data-event-id="${e.id}"
            data-asset-id="${a.id}"
            data-table="event_definitions"
            style="
              position:absolute;
              top:4px;
              right:4px;
              z-index:5;
            "
          >
            ✕
          </button>

          ${
            (a.mediaType || a.type) === "video"
              ? `<video src="${a?.url || ""}" muted></video>`
              : `<img src="${a?.url || ""}">`
          }

        </div>
      `,
      )
      .join("");

    // =========================
    // 🧱 ROW
    // =========================
    const div = document.createElement("div");
    div.className = "eventRow";
    div.dataset.id = e.id;

    div.innerHTML = `
      <div>

        ${
          isEdit
            ? `
            <div class="inlineEventForm">

              <label class="field">
                <span>Titel</span>
                <input
                  data-field="title"
                  value="${e.title || ""}"
                >
              </label>

              <label class="field">
                <span>Eventtyp</span>
                <select data-field="type"></select>
              </label>

              <label class="field">
                <span>Trigger</span>
                <input
                  data-field="trigger"
                  value="${e.trigger || "random"}"
                >
              </label>

              <label class="field">
                <span>Wahrscheinlichkeit</span>
                <input
                  data-field="probability"
                  type="number"
                  step="0.01"
                  value="${e.probability || 0}"
                >
              </label>

              <label class="field">
                <span>Wert</span>
                <input
                  data-field="value"
                  type="number"
                  value="${e.value || 0}"
                >
              </label>

              <label class="field">
                <span>Dauer</span>
                <input
                  data-field="duration"
                  type="number"
                  value="${e.duration || 0}"
                >
              </label>
<label class="field">
  <span>Cooldown (Sek.)</span>
  <input
    data-field="cooldown"
    type="number"
    value="${e.cooldown || 0}"
  >
</label>

<label class="field">
  <span>Priorität</span>
  <input
    data-field="priority"
    type="number"
    value="${e.priority || 0}"
  >
</label>

<label class="field">
  <span>Kategorie</span>
  <input
    data-field="category"
    value="${e.category || "default"}"
  >
</label>

<label class="field">
  <span>Garantiert</span>

  <select data-field="is_guaranteed">
    <option value="false">
      Nein
    </option>

    <option
      value="true"
      ${e.is_guaranteed ? "selected" : ""}
    >
      Ja
    </option>
  </select>
</label>
            </div>
          `
            : `
            <div class="eventSummary">

              <div class="eventTitleLine">
                <strong>
                  ${e.title || "Unbenanntes Event"}
                </strong>
              </div>

              <div class="modifierGrid">

                <div class="modifierCard">
                  <span>Eventtyp</span>
                  <strong>${e.type || "-"}</strong>
                </div>

                <div class="modifierCard">
                  <span>Trigger</span>
                  <strong>${e.trigger || "random"}</strong>
                </div>

                <div class="modifierCard">
                  <span>Wahrscheinlichkeit</span>
                  <strong>
                    ${Math.round((e.probability || 0) * 100)}%
                  </strong>
                </div>

                <div class="modifierCard">
                  <span>Dauer</span>
                  <strong>${e.duration || 0}s</strong>
                </div>

              </div>

            </div>
          `
        }

      </div>

      <!-- 🎨 ASSETS -->
      <div class="assetRow">
        ${assetHTML}
      </div>

      <!-- 📤 UPLOAD -->
      <div style="margin-top:10px;">

        <input
          type="file"
          multiple
          data-upload="${e.id}"
        >

        <button
          data-action="uploadAssetInline"
          data-id="${e.id}"
          data-table="event_definitions"
        >
          ➕ Assets
        </button>

      </div>

      <!-- 🎛 ACTIONS -->
      <div class="eventActions">

        ${
          isEdit
            ? `
            <button
              data-action="saveGameEventInline"
              data-id="${e.id}"
            >
              💾
            </button>

            <button
              data-action="cancelGameEventInline"
            >
              ❌
            </button>
          `
            : `
            <button
              data-action="editGameEventInline"
              data-id="${e.id}"
            >
              ✏️
            </button>

            <button
              class="danger"
              data-action="deleteGameEvent"
              data-id="${e.id}"
            >
              🗑️
            </button>
          `
        }

      </div>
    `;

    container.appendChild(div);

    // =========================
    // 🧠 EVENT TYPES
    // =========================
    if (isEdit) {
      const select = div.querySelector("[data-field='type']");

      if (select) {
        select.innerHTML = "";

        const coreEvents = [
          ["GOAL", "⚽ Tor"],
          ["SHOT", "🎯 Schuss"],
          ["SHOT_SAVED", "🧤 Parade"],
          ["FOUL", "🚫 Foul"],
          ["CORNER", "🚩 Ecke"],
          ["DUEL", "⚔️ Zweikampf"],
          ["PENALTY_SAVED", "🧤 Elfmeter gehalten"],
          ["PASS", "➡️ Pass"],
          ["DRIBBLE", "🌀 Dribbling"],
          ["INTERCEPTION", "🛑 Interception"],
          ["BALL_LOSS", "❌ Ballverlust"],
          ["BALL_RECOVERY", "🔄 Ballgewinn"],
          ["CLEARANCE", "🧹 Klärung"],

          ["MATCH_INTRO", "🎬 Match Intro"],
          ["HALFTIME", "⏸ Halbzeit"],
          ["IDLE", "🏟 Stadion Idle"],
          ["FULLTIME", "⏱️ Abpfiff"],
        ];

        coreEvents.forEach(([value, label]) => {
          const opt = document.createElement("option");
          opt.value = value;
          opt.textContent = label;
          select.appendChild(opt);
        });

        select.value = e.type;
      }
    }
  });
}
function populateTypeFilter() {
  const select = document.getElementById("broadcastTypeFilter");

  if (!select) return;

  const types = [
    ...new Set(
      getBroadcastEvents()
        .map((e) => e.type)
        .filter(Boolean),
    ),
  ];

  select.innerHTML = `
    <option value="">
      Alle Typen
    </option>
    ${types
      .map(
        (type) => `
      <option value="${type}">
        ${type}
      </option>
    `,
      )
      .join("")}
  `;
}
function renderBroadcastRows() {

  const root =
    document.getElementById(
      "broadcastRows"
    );

  if (!root) return;

  const search =
    qs("broadcastSearch")
      ?.value
      ?.toLowerCase()
      ?.trim() || "";

  const type =
    qs("broadcastTypeFilter")
      ?.value || "";

  const rows =
    getBroadcastEvents()
      .filter((ev) => {

        const title =
          (
            ev.title ||
            ev.name ||
            ""
          )
            .toLowerCase();

        const matchesSearch =
          !search ||
          title.includes(search);

        const matchesType =
          !type ||
          ev.type === type;

        return (
          matchesSearch &&
          matchesType
        );

      });

  root.innerHTML =
    rows
      .map((ev) => {

        let assets =
          ev.assets;

        // JSON String → Array
        if (
          typeof assets ===
          "string"
        ) {

          try {

            assets =
              JSON.parse(
                assets
              );

          }

          catch {

            assets = [
              {
                url: assets
              }
            ];

          }

        }

        if (
          !Array.isArray(
            assets
          )
        ) {

          assets = [];

        }

        const heroAsset =
  getHeroAsset(
    assets
  );

        const created =
          ev.created_at
            ? new Date(
                ev.created_at
              ).toLocaleDateString(
                "de-DE"
              )
            : "-";

        return `

          <div
            class="broadcastRow"
            data-id="${ev.id}"
            data-source="${ev.source || "event"}"
          >

            <div
              class="broadcastThumb"
            >

             ${
  heroAsset
    ? heroAsset.mediaType === "video"
      ? `
        <video
          src="${heroAsset.url}"
          muted
          autoplay
          loop
        ></video>
      `
      : `
        <img
          src="${heroAsset.url}"
        >
      `
    : `
      <span>—</span>
    `
}

            </div>

            <span>
              ${ev.type || "EVENT"}
            </span>

            <span>
              ${ev.title || ev.name || "-"}
            </span>

            <span>
              ${created}
            </span>

            <span>
              ${assets.length}
            </span>

            <span>
              ›
            </span>

          </div>

        `;

      })
      .join("");

  root
    .querySelectorAll(
      ".broadcastRow"
    )
    .forEach((row) => {

      row.addEventListener(
        "click",
        () => {

          const id =
            row.dataset.id;

          const event =
            getBroadcastEvents()
              .find(
                e => e.id === id
              );

          if (!event)
            return;

          openBroadcastEditor(
            event
          );

        }
      );

    });

}

async function saveBroadcastEvent() {

  if (!currentBroadcastEvent)
    return;

  const table =
  currentBroadcastEvent.source === "game"
    ? "event_definitions"
    : "game_events";

  console.log(
    "CURRENT EVENT",
    structuredClone(
      currentBroadcastEvent
    )
  );

  const payload = {

    title:
      document.getElementById(
        "detailTitle"
      ).value,

    type:
      document.getElementById(
        "detailType"
      ).value,

    trigger:
      document.getElementById(
        "detailTrigger"
      ).value,

    probability: Number(
      document.getElementById(
        "detailProbability"
      ).value
    ),

    hero_asset_id:
      currentBroadcastEvent
        .hero_asset_id || null,

    assets:
      currentBroadcastEvent
        .assets || []

  };

  console.log(
    "💾 SAVE EVENT:",
    table,
    payload
  );

  try {

    // =====================
    // UPDATE
    // =====================

    if (
      currentBroadcastEvent.id
    ) {

      const { error } =
        await supabase

          .from(
            table
          )

          .update(
            payload
          )

          .eq(
            "id",
            currentBroadcastEvent.id
          );

      if (error)
        throw error;

    }

    // =====================
    // INSERT
    // =====================

    else {

      const { data, error } =
        await supabase

          .from(
            table
          )

          .insert([
            payload
          ])

          .select()

          .single();

      if (error)
        throw error;

      currentBroadcastEvent =
        data;

    }

    await loadEvents();
    await loadGameEvents();

    renderBroadcastRows();

    alert(
      "Event gespeichert"
    );

  }

  catch (err) {

    console.error(
      "❌ SAVE EVENT ERROR",
      err
    );

    alert(
      "Speichern fehlgeschlagen"
    );

  }

}
async function deleteBroadcastEvent() {

  if (!currentBroadcastEvent?.id) {

    alert(
      "Dieses Event wurde noch nicht gespeichert."
    );

    return;

  }

  const confirmed =
    confirm(
      "Event wirklich löschen?"
    );

  if (!confirmed)
    return;

  try {

    console.log(
      "DELETE EVENT",
      currentBroadcastEvent
    );

    const table =
      currentBroadcastEvent.source === "game"
        ? "event_definitions"
        : "game_events";

    console.log(
      "DELETE TABLE",
      table
    );

    const {
      data,
      error
    } = await supabase

      .from(
        table
      )

      .delete()

      .eq(
        "id",
        currentBroadcastEvent.id
      )

      .select();

    console.log(
      "DELETE RESULT",
      data
    );

    console.log(
      "DELETE ERROR",
      error
    );

    if (error)
      throw error;

    currentBroadcastEvent =
      null;

    document.getElementById(
      "broadcastDetail"
    ).innerHTML = `

      <div class="emptyState">
        Event auswählen
      </div>

    `;

    await loadEvents();
    await loadGameEvents();

    renderBroadcastRows();

    alert(
      "Event gelöscht"
    );

  }

  catch (err) {

    console.error(
      "DELETE FAILED",
      err
    );

    alert(
      "Löschen fehlgeschlagen"
    );

  }

}
// =====================
// DELETE EVENT
// =====================
async function deleteEvent(id) {
  await supabase.from("game_events").delete().eq("id", id);
  loadEvents();
}

// =====================
// Edit Assets
// =====================
async function removeAssetFromEvent(eventId, assetId, table) {
  const { data } = await supabase
    .from(table)
    .select("assets")
    .eq("id", eventId)
    .single();

  if (!data) return;

  const updated = (data.assets || []).filter((a) => a.id !== assetId);

  await supabase.from(table).update({ assets: updated }).eq("id", eventId);

  if (table === "game_events") loadEvents();
  if (table === "event_definitions") loadGameEvents();
}
async function uploadInlineAssets(eventId, files, table) {
  const bucket = table === "game_events" ? "events" : "game-events";

  const newAssets = await uploadFiles(bucket, files);

  if (!newAssets.length) return;

  const { data } = await supabase
    .from(table)
    .select("assets")
    .eq("id", eventId)
    .single();

  const updated = [...(data.assets || []), ...newAssets];

  await supabase.from(table).update({ assets: updated }).eq("id", eventId);

  if (table === "game_events") loadEvents();
  if (table === "event_definitions") loadGameEvents();
}

// =====================
// TABS
// =====================
function switchTab(tab) {

  document
    .querySelectorAll(
      ".tabContent"
    )
    .forEach(
      t =>
        t.classList.remove(
          "active"
        )
    );

  document
    .querySelectorAll(
      ".tabs button"
    )
    .forEach(
      b =>
        b.classList.remove(
          "active"
        )
    );

  // =====================
  // ADS
  // =====================

  if (tab === "ads") {

    qs("adsTab")
      ?.classList.add(
        "active"
      );

    qs("tabAds")
      ?.classList.add(
        "active"
      );

    loadCampaigns();

  }

  // =====================
  // BROADCAST
  // =====================

  if (
    tab === "broadcast"
  ) {

    qs("broadcastTab")
      ?.classList.add(
        "active"
      );

    qs("tabBroadcast")
      ?.classList.add(
        "active"
      );

    loadEvents();
    loadGameEvents();

  }

  // =====================
  // PARTNERS
  // =====================

  if (
    tab === "partners"
  ) {

    qs("partnersTab")
      ?.classList.add(
        "active"
      );

    qs("tabPartners")
      ?.classList.add(
        "active"
      );

    loadPartnerTeams();

  }

  // =====================
  // INSIGHTS
  // =====================

  if (
    tab === "insights"
  ) {

    qs("insightsTab")
      ?.classList.add(
        "active"
      );

    qs("tabInsights")
      ?.classList.add(
        "active"
      );

    destroyChart();

    loadInsights();
    loadChart();
    loadGeoMap();

  }

}

function renderAssetList() {
  const container = document.getElementById("assetList");
  if (!container) return;

  container.innerHTML = currentAssets
    .map(
      (a, i) => `
    <div style="
      display:flex;
      align-items:center;
      gap:8px;
      margin-bottom:6px;
      background:#111;
      padding:6px;
      border-radius:6px;
    ">
      
      <span style="width:80px;">${a.type}</span>

      ${
        (a.mediaType || a.type) === "video"
          ? `<video src="${a.url}" style="height:40px;" muted></video>`
          : `<img src="${a.url}" style="height:40px;">`
      }

      <button onclick="moveAsset(${i}, -1)">⬆️</button>
      <button onclick="moveAsset(${i}, 1)">⬇️</button>

      <button onclick="removeAsset(${i})">❌</button>
    </div>
  `,
    )
    .join("");
}
// =====================
// GLOBAL CLICK HANDLER
// =====================
document.addEventListener("click", async (e) => {
  const target = e.target.closest("[data-action]");
  if (!target) return;

  const a = target.dataset.action;

  console.log("🖱 ACTION:", a);

  // =====================
  // 🖼 DELETE ASSET
  // =====================
  if (a === "deleteAsset") {
    removeAssetFromEvent(
      target.dataset.eventId,
      target.dataset.assetId,
      target.dataset.table,
    );
  }

  // =====================
  // 📤 INLINE ASSET UPLOAD
  // =====================
  if (a === "uploadAssetInline") {
    const id = target.dataset.id;

    const table = target.dataset.table || "game_events";

    const input = document.querySelector(`input[data-upload="${id}"]`);

    if (!input || !input.files.length) {
      alert("Kein File");
      return;
    }

    const bucket = table === "game_events" ? "events" : "game-events";

    const uploaded = await uploadFiles(bucket, [...input.files]);

    const { data: current } = await supabase
      .from(table)
      .select("assets")
      .eq("id", id)
      .single();

    const assets = [...(current?.assets || []), ...uploaded];

    const { error } = await supabase
      .from(table)
      .update({ assets })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Upload fehlgeschlagen");
      return;
    }

    if (table === "game_events") {
      await loadEvents();
    }

    if (table === "event_definitions") {
      await loadGameEvents();
    }
  }
// =====================
// 📺 BROADCAST
// =====================

if (
  a ===
  "createBroadcastEvent"
) {

  createBroadcastEvent();

}
  // =====================
  // CAMPAIGNS
  // =====================
  if (a === "delete") {
    deleteCampaign(target.dataset.id);
  }

  // =====================
  // EVENTS
  // =====================
  if (a === "removeEventScopeRef") {
    removeEventScopeReference(target.dataset.ref);
  }

  if (a === "editInlineEvent") {
    state.inlineEventEditId = target.dataset.id;
    loadEvents();
  }

  if (a === "saveInlineEvent") {
    saveInlineEvent(target.dataset.id);
  }

  if (a === "deleteEvent") {
    deleteEvent(target.dataset.id);
  }

  // =====================
  // 🎮 GAME EVENTS
  // =====================
  if (a === "editGameEventInline") {
    state.inlineGameEventEditId = target.dataset.id;
    loadGameEvents();
  }

  if (a === "saveGameEventInline") {
    saveInlineGameEvent(target.dataset.id);
  }

  if (a === "deleteGameEvent") {
    deleteGameEvent(target.dataset.id);
  }
});

// =====================
// INIT
// =====================
document.addEventListener("DOMContentLoaded", () => {
  qs("createCampaignBtn")?.addEventListener("click", createCampaign);
  qs("addAdSetBtn")?.addEventListener("click", addAdSet);
  qs("addAssetBtn")?.addEventListener("click", addAssets);
  qs("createEventBtn")?.addEventListener("click", saveEvent);
  qs("eventScope")?.addEventListener("change", () => {
    state.eventScopeSelection = [];
    if (qs("eventScopeSearch")) qs("eventScopeSearch").value = "";
    syncEventScopeHidden();
    renderEventScopePicker();
  });
  qs("eventScopeSearch")?.addEventListener("input", renderEventScopePicker);
  qs("eventScopePicker")?.addEventListener("change", (e) => {
    selectEventScopeReference(e.target.value);
  });

  // 🔥 GAME EVENTS
  document.addEventListener("click", async (e) => {
    if (e.target.id === "saveGameEventBtn") {
      saveGameEvent();
    }
  });

  qs("tabAds")?.addEventListener("click", () => switchTab("ads"));
  qs("tabBroadcast")?.addEventListener("click", () => switchTab("broadcast"));
  qs("tabInsights")?.addEventListener("click", () => switchTab("insights"));
qs("tabPartners")
  ?.addEventListener(
    "click",
    () => switchTab("partners")
  );
  qs("partnerSearch")
  ?.addEventListener(
    "input",
    renderPartnerList
  );

qs("partnerLeagueFilter")
  ?.addEventListener(
    "change",
    renderPartnerList
  );
  // 🔥 INIT LOADS
  loadEventReferenceData();
  loadGameEvents();
  loadPartnerTeams();
  loadPartnerLeagues();
  loadPartners();
  setTimeout(loadEventTypes, 0);

  switchTab("ads");
  loadCampaigns();
  qs("broadcastSearch")?.addEventListener("input", renderBroadcastRows);

  qs("broadcastTypeFilter")?.addEventListener("change", renderBroadcastRows);
});
async function loadPartnerTeams() {

  const { data, error } =
    await supabase

      .from("teams")

      .select(`
        *,
        competitions (
          id,
          name
        )
      `)

      .order(
        "display_name"
      );

  if (error) {

    console.error(
      "PARTNER TEAMS ERROR",
      error
    );

    return;

  }

  state.partners =
    data || [];

  console.log(
    "LOADED PARTNER TEAMS",
    state.partners.length
  );

  renderPartnerList();

}
function renderPartnerList() {

  const root =
    document.getElementById(
      "partnerList"
    );

  if (!root)
    return;

  const search =
    document
      .getElementById(
        "partnerSearch"
      )
      ?.value
      ?.toLowerCase()
      ?.trim() || "";

  const leagueId =
    document
      .getElementById(
        "partnerLeagueFilter"
      )
      ?.value || "";

  const rows =
    state.partners.filter(
      team => {

        const teamName =
          (
            team.display_name ||
            team.name ||
            ""
          ).toLowerCase();

        const matchesSearch =
          teamName.includes(
            search
          );

        const matchesLeague =
          !leagueId ||
          team.competition_id ===
            leagueId;

        return (
          matchesSearch &&
          matchesLeague
        );

      }
    );

  root.innerHTML =
    rows
      .map(
        team => `

          <div
            class="partnerRow"
            data-id="${team.id}"
          >

            <div
              class="partnerName"
            >
              ${
                team.display_name ||
                team.name
              }
            </div>

            <div
              class="partnerLeague"
            >
              🏆 ${
                team.competitions?.name ||
                "Keine Liga"
              }
            </div>

            <div
              class="partnerOfficialName"
            >
              ${team.name}
            </div>

          </div>

        `
      )
      .join("");

  root
    .querySelectorAll(
      ".partnerRow"
    )
    .forEach(row => {

      row.addEventListener(
        "click",
        () => {

          openPartnerTeam(
            row.dataset.id
          );

        }
      );

    });

}
function openPartnerTeam(id) {

  const team =
  state.partners.find(
    t => t.id === id
  );

if (!team)
  return;

const partner =
  (
    state.partnerRecords || []
  ).find(
    p =>
      p.primary_team_id ===
      team.id
  );

  document.getElementById(
    "partnerDetail"
  ).innerHTML = `

    <div class="partnerHeader">

      <div>

        <h2>
          ${
            team.display_name ||
            team.name
          }
        </h2>

        <div class="partnerLeagueBadge">

          🏆 ${
            team.competitions?.name ||
            "Keine Liga"
          }

        </div>

      </div>

      <div
  class="partnerStatus"
>

  ${
    partner
      ? "🟢 Partner"
      : "⚪ Kein Partner"
  }

</div>

    </div>

    <div class="partnerCard">

      <h3>
        Stammdaten
      </h3>

      <div class="formGrid">

        <input
          placeholder="Offizieller Vereinsname"
          value="${
  partner?.official_name ||
  team.name
}"
        >

        <input
          placeholder="Website"
        >

        <input
          placeholder="Straße"
        >

        <input
          placeholder="PLZ / Ort"
        >

      </div>

    </div>

    <div class="partnerCard">

      <h3>
        Ansprechpartner
      </h3>

      <div class="formGrid">

        <input
          placeholder="Name"
        >

        <input
          placeholder="E-Mail"
        >

        <input
          placeholder="Telefon"
        >

      </div>

    </div>

    <div class="partnerCard">

      <h3>
        Teams
      </h3>

      <div
        class="partnerTeamSearch"
      >

        <input
          placeholder="🔍 Team hinzufügen"
        >

        <button
          class="btn"
        >
          +
        </button>

      </div>

      <div
        class="partnerTeams"
      >

        <div
          class="partnerTeamItem"
        >

          ${
            team.display_name ||
            team.name
          }

          <button>
            ✕
          </button>

        </div>

      </div>

    </div>

    <div class="partnerCard">

      <h3>
        Kader
      </h3>

      <div
        class="partnerInfoGrid"
      >

        <div>

          <strong>
            Status
          </strong>

          <div>
            ⚪ Kein Kader
          </div>

        </div>

        <div>

          <strong>
            Spieler
          </strong>

          <div>
            0
          </div>

        </div>

        <div>

          <strong>
            Letzter Import
          </strong>

          <div>
            —
          </div>

        </div>

      </div>

    </div>

    <div class="partnerCard">

      <h3>
        Dokumente
      </h3>

      <button
        class="btn"
      >
        📄 Dokument hochladen
      </button>

    </div>

    <div class="partnerCard">

      <h3>
        Erlöse
      </h3>

      <div
        class="partnerInfoGrid"
      >

        <div>

          <strong>
            Gesamt
          </strong>

          <div>
            0 €
          </div>

        </div>

        <div>

          <strong>
            Ausgeschüttet
          </strong>

          <div>
            0 €
          </div>

        </div>

        <div>

          <strong>
            Offen
          </strong>

          <div>
            0 €
          </div>

        </div>

      </div>

    </div>

    <div class="partnerCard">

      <h3>
        Notizen
      </h3>

      <textarea
        rows="8"
        placeholder="Interne Notizen..."
      ></textarea>

    </div>

    <div class="partnerFooter">

  ${
    partner

      ? `

        <button
          id="savePartner"
          class="btn btn-primary"
        >
          💾 Partner speichern
        </button>

      `

      : `

        <button
          id="createPartner"
          class="btn btn-primary"
        >
          🤝 Partner erstellen
        </button>

      `
      
  }

</div>

  `;
document
  .getElementById(
    "createPartner"
  )
  ?.addEventListener(
    "click",
    async () => {

      try {

        const {
          data: newPartner,
          error
        } =
          await supabase

            .from(
              "partners"
            )

            .insert([{

              primary_team_id:
                team.id,

              official_name:
                team.name,

              verified:
                false

            }])

            .select()

            .single();

        if (error)
          throw error;

        const {
          error:
            teamError
        } =
          await supabase

            .from(
              "partner_teams"
            )

            .insert([{

              partner_id:
                newPartner.id,

              team_id:
                team.id,

              is_primary:
                true,

              is_verified:
                false

            }]);

        if (teamError)
          throw teamError;

        await loadPartners();

        openPartnerTeam(
          team.id
        );

      }

      catch (err) {

        console.error(
  "PARTNER ERROR FULL",
  err
);

console.log(
  err.message
);

console.log(
  err.code
);

console.log(
  err.details
);

console.log(
  err.hint
);

        alert(
          JSON.stringify(
            err,
            null,
            2
          )
        );

      }

    }
  );
}

async function loadPartnerLeagues() {

  const { data } =
    await supabase

      .from("competitions")

      .select("*")
      .order("name");

  const select =
    qs(
      "partnerLeagueFilter"
    );

  if (!select)
    return;

  select.innerHTML = `

    <option value="">
      Alle Ligen
    </option>

    ${(
      data || []
    ).map(
      league => `

        <option
          value="${league.id}"
        >
          ${league.name}
        </option>

      `
    ).join("")}

  `;

}
async function loadPartners() {

  const { data } =
    await supabase

      .from("partners")

      .select("*");

  state.partnerRecords =
    data || [];

}