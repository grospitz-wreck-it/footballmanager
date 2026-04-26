// =========================
// 📊 STAT RENDER (EINMAL!)
// =========================
function renderStat(label, value){

  const v = Math.max(0, Math.min(100, Math.round(value ?? 0)));

  // 🔥 dynamische Farbe (rot → gelb → grün)
  let color = "#22c55e"; // grün

  if(v < 40) color = "#ef4444";      // rot
  else if(v < 70) color = "#f59e0b"; // gelb

  return `
    <div style="margin:8px 0;">
      <div style="
        display:flex;
        justify-content:space-between;
        font-size:12px;
        opacity:0.9;
      ">
        <span>${label}</span>
        <span>${v}</span>
      </div>

      <div style="
        background:#1a1a1a;
        height:10px;
        border-radius:999px;
        overflow:hidden;
        margin-top:3px;
      ">
        <div style="
          width:${v}%;
          height:100%;
          background:linear-gradient(90deg, ${color}, #22c55e);
          transition:width 0.4s ease;
        "></div>
      </div>
    </div>
  `;
}


function getPlayerStats(player){

  const pos = (player.position || "").toUpperCase();

  let attack  = player.shooting ?? 50;
  let defense = player.defending ?? 50;
  let control = player.passing ?? 50;

  // 🧤 GK Spezial
  if(pos === "GK"){
    defense = player.goalkeeping ?? 50;
    attack = 10;
    control = 40;
  }

  // 🔥 leichte Positionsgewichtung
  if(["ST","CF","FW"].includes(pos)){
    attack *= 1.1;
  }

  if(["CB","LB","RB"].includes(pos)){
    defense *= 1.1;
  }

  if(["CM","CDM","CAM"].includes(pos)){
    control *= 1.1;
  }

  // clamp
  const clamp = v => Math.max(0, Math.min(100, Math.round(v)));

  return {
    attack: clamp(attack),
    defense: clamp(defense),
    control: clamp(control)
  };
}

// =========================
// 🪟 OPEN
// =========================
export function openPlayerModal(player){
  console.log("PLAYER DEBUG:", player);

  let modal = document.getElementById("playerModal");

  // =========================
  // 🧱 CREATE (EINMAL)
  // =========================
  if(!modal){
    modal = document.createElement("div");
    modal.id = "playerModal";

    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="player-modal">

          <button class="close-btn">
            <img src="./gfx/close.png" />
          </button>

          <div class="card-top">
            <div class="rating" id="modalRating"></div>
            <div class="stars-top" id="modalStars"></div>
          </div>

          <div class="card-player">
            <img id="player-avatar" />
          </div>

          <div class="card-name" id="modalName"></div>

          <div class="card-stats" id="modalStats"></div>

        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // =========================
    // ❌ CLOSE BUTTON
    // =========================
    modal.querySelector(".close-btn").onclick = closePlayerModal;
  }

  // =========================
  // 🧠 ELEMENTE
  // =========================
  const card = modal.querySelector(".player-modal");
  const nameEl = modal.querySelector("#modalName");
  const ratingEl = modal.querySelector("#modalRating");
  const avatar = modal.querySelector("#player-avatar");
  const starsEl = modal.querySelector("#modalStars");
  const statsEl = modal.querySelector("#modalStats");

  // =========================
  // 🧠 DATA
  // =========================
  const name =
    player.name ||
    `${player.first_name || ""} ${player.last_name || ""}`.trim() ||
    "Spieler";

  nameEl.textContent = name;
  ratingEl.textContent = player.overall ?? "-";

  avatar.src = player.image || "./gfx/default_player.png";

  // =========================
  // ⭐ STARS
  // =========================
  starsEl.innerHTML = "";

  const tier = player.tier ?? 1;
  for(let i=0; i<tier; i++){
    const img = document.createElement("img");
    img.src = "./gfx/modal/star1.webp";
    starsEl.appendChild(img);
  }

  // =========================
  // 📊 STATS
  // =========================
  const stats = getPlayerStats(player);

  statsEl.innerHTML = `
    ${renderStat("Angriff", stats.attack)}
    ${renderStat("Verteidigung", stats.defense)}
    ${renderStat("Kontrolle", stats.control)}
  `;

  // =========================
  // 🎨 GLOW (MATCH FP-DOT)
  // =========================
  const role = (player.role || player.position || "MID").toUpperCase();
  card.setAttribute("data-role", role);

  // =========================
  // 📱 SWIPE DOWN RESET
  // =========================
  card.style.transform = "";
  card.style.transition = "";

  // =========================
  // 📱 SWIPE DOWN HANDLER
  // =========================
  let startY = 0;
  let currentY = 0;
  let dragging = false;

  card.ontouchstart = (e) => {
    startY = e.touches[0].clientY;
    dragging = true;
  };

  card.ontouchmove = (e) => {
    if (!dragging) return;

    currentY = e.touches[0].clientY;
    const delta = currentY - startY;

    if (delta > 0) {
      card.style.transform = `translateY(${delta}px) scale(0.98)`;
    }
  };

  card.ontouchend = () => {
    dragging = false;

    const delta = currentY - startY;

    if (delta > 80) {
      closePlayerModal();
    } else {
      card.style.transform = "";
    }
  };

  // =========================
  // 🚀 SHOW
  // =========================
  requestAnimationFrame(() => {
    modal.classList.add("show");
  });
}

  // =========================
  // 🧠 DATA
  // =========================
  const name =
  player.name ||
  `${player.first_name || ""} ${player.last_name || ""}`.trim() ||
  "Spieler";
  
  modal.querySelector("#modalName").textContent = name || "Spieler";
  modal.querySelector("#modalRating").textContent = player.overall ?? "-";

  // 🔥 REAL PLAYER IMAGE
  const avatar = modal.querySelector("#player-avatar");
  avatar.src = player.image || "./gfx/default_player.png";

  // =========================
  // ⭐ STARS
  // =========================
  const starsEl = modal.querySelector("#modalStars");
  starsEl.innerHTML = "";

  const tier = player.tier ?? 1;
  for(let i=0; i<tier; i++){
    const img = document.createElement("img");
    img.src = "./gfx/modal/star1.webp";
    starsEl.appendChild(img);
  }

  // =========================
// 📊 STATS
// =========================
const statsEl = modal.querySelector("#modalStats");

// 👉 echte Werte aus DB + Mapping
const stats = getPlayerStats(player);

statsEl.innerHTML = `
  ${renderStat("Angriff", stats.attack)}
  ${renderStat("Verteidigung", stats.defense)}
  ${renderStat("Kontrolle", stats.control)}
`;
  // =========================
  // 🚀 SHOW
  // =========================
  requestAnimationFrame(() => {
    modal.classList.add("show");
  });



// =========================
// ❌ CLOSE
// =========================
export function closePlayerModal(){
  const modal = document.getElementById("playerModal");
  if(!modal) return;

  modal.classList.remove("show");
}
