// =========================
// 🪟 OPEN
// =========================
export function openPlayerModal(player){

  let modal = document.getElementById("playerModal");

  // =========================
  // 🏗 CREATE (falls fehlt)
  // =========================
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

    // =========================
    // ❌ CLOSE EVENTS
    // =========================
    modal.querySelector(".close-btn").onclick = closePlayerModal;

    modal.querySelector(".modal-overlay").onclick = (e) => {
      if(e.target.classList.contains("modal-overlay")){
        closePlayerModal();
      }
    };
  }

  // =========================
  // 🧠 FILL DATA
  // =========================
  const name = `${player.first_name || ""} ${player.last_name || ""}`.trim();

  modal.querySelector("#modalName").textContent = name || "Spieler";
  modal.querySelector("#modalRating").textContent = player.overall ?? "-";

  // Avatar
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

  statsEl.innerHTML = `
    ${renderStat("Attack", player.attack)}
    ${renderStat("Defense", player.defense)}
    ${renderStat("Control", player.control)}
  `;

  // =========================
  // 🚀 SHOW
  // =========================
  requestAnimationFrame(() => {
    modal.classList.add("show");
  });
}
function renderStat(label, value){

  const v = value ?? 0;

  return `
    <div class="stat-row">
      <span>${label}</span>
      <div class="stat-bar">
        <div class="fill" style="width:${v}%"></div>
      </div>
      <span>${v}</span>
    </div>
  `;
}

// =========================
// ❌ CLOSE
// =========================
export function closePlayerModal(){
  const modal = document.getElementById("playerModal");
  if(!modal) return;

  modal.classList.remove("show");
}
