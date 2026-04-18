// =========================
// 📊 STAT RENDER (EINMAL!)
// =========================
function renderStat(label, value){

  const v = Math.max(0, Math.min(150, value ?? 0));

  return `
    <div style="margin:6px 0;">
      <div style="font-size:12px; opacity:0.8;">
        ${label} (${v})
      </div>
      <div style="
        background:#222;
        height:8px;
        border-radius:6px;
        overflow:hidden;
      ">
        <div style="
          width:${v}%;
          height:100%;
          background:linear-gradient(90deg,#00ff88,#22c55e);
          transition:width 0.3s ease;
        "></div>
      </div>
    </div>
  `;
}
function getPlayerStats(player){

  const pos = (player.position || "").toUpperCase();

  // =========================
  // ⚽ ATTACK
  // =========================
  let attack = player.shooting ?? 50;

  // =========================
  // 🛡 DEFENSE
  // =========================
  let defense = player.defending ?? 50;

  // =========================
  // 🎮 CONTROL
  // =========================
  let control = player.passing ?? 50;

  // =========================
  // 🧤 GK SPECIAL
  // =========================
  if(pos === "GK"){
    defense = player.goalkeeping ?? 50;
    attack = 10;
    control = 40;
  }

  return { attack, defense, control };
}

// =========================
// 🪟 OPEN
// =========================
export function openPlayerModal(player){
  console.log("PLAYER DEBUG:", player); // 👈 HIER

  let modal = document.getElementById("playerModal");

  if(!modal){
    modal = document.createElement("div");
    modal.id = "playerModal";

    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="player-modal">

          <button class="close-btn">✕</button>

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

    modal.querySelector(".close-btn").onclick = closePlayerModal;

    modal.querySelector(".modal-overlay").onclick = (e) => {
      if(e.target.classList.contains("modal-overlay")){
        closePlayerModal();
      }
    };
  }

  // =========================
  // 🧠 DATA
  // =========================
  const name = `${player.first_name || ""} ${player.last_name || ""}`.trim();

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

  const attack  = player.attack  ?? player.overall ?? 50;
  const defense = player.defense ?? player.overall ?? 50;
  const control = player.control ?? player.overall ?? 50;

  statsEl.innerHTML = `
    ${renderStat("Angriff", attack)}
    ${renderStat("Verteidigung", defense)}
    ${renderStat("Kontrolle", control)}
  `;

  // =========================
  // 🚀 SHOW
  // =========================
  requestAnimationFrame(() => {
    modal.classList.add("show");
  });
}


// =========================
// ❌ CLOSE
// =========================
export function closePlayerModal(){
  const modal = document.getElementById("playerModal");
  if(!modal) return;

  modal.classList.remove("show");
}
