// =========================
// 🎬 MATCH EVENT SLIDE SYSTEM
// =========================

import { on } from "../core/events.js";
import { EVENTS } from "../core/events.constants.js";

let container = null;

// =========================
// 🧱 CONTAINER
// =========================
function createContainer(){

  container = document.createElement("div");

  Object.assign(container.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    width: "320px",
    zIndex: 999999,
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    pointerEvents: "none"
  });

  document.body.appendChild(container);
}

// =========================
// 🎬 SLIDE
// =========================
function createSlide(event){

  if(!container) return;

  const slide = document.createElement("div");

  Object.assign(slide.style, {
    background: "#111",
    color: "#fff",
    padding: "10px",
    borderRadius: "8px",
    boxShadow: "0 0 10px rgba(0,0,0,0.5)",
    transform: "translateX(120%)",
    opacity: "0",
    transition: "all 0.4s ease",
    overflow: "hidden"
  });

  // =========================
  // 📝 TEXT
  // =========================
  const text = document.createElement("div");
  text.textContent = `${event.minute}' ${event.type}`;
  text.style.fontWeight = "bold";

  slide.appendChild(text);

  // =========================
  // 🎥 ASSET (IMAGE / VIDEO)
  // =========================
  if(event.assets?.length){

    const asset = event.assets[0];

    if(asset?.url){

      if(asset.type === "video"){
        const video = document.createElement("video");
        video.src = asset.url;
        video.autoplay = true;
        video.muted = true;
        video.loop = true;

        Object.assign(video.style, {
          width: "100%",
          marginTop: "6px",
          borderRadius: "6px"
        });

        slide.appendChild(video);
      }
      else{
        const img = document.createElement("img");
        img.src = asset.url;

        Object.assign(img.style, {
          width: "100%",
          marginTop: "6px",
          borderRadius: "6px"
        });

        slide.appendChild(img);
      }
    }
  }

  container.appendChild(slide);

  // =========================
  // 🎬 ANIMATION IN
  // =========================
  requestAnimationFrame(() => {
    slide.style.transform = "translateX(0)";
    slide.style.opacity = "1";
  });

  // =========================
  // ⏱ AUTO REMOVE
  // =========================
  setTimeout(() => {
    slide.style.transform = "translateX(120%)";
    slide.style.opacity = "0";

    setTimeout(() => slide.remove(), 400);
  }, 3000);
}

// =========================
// 🚀 INIT
// =========================
function initMatchEventSlides(){

  if(container) return;

  console.log("🎬 Slide System gestartet");

  createContainer();

  // 🔥 WICHTIGSTER TEIL
  on(EVENTS.MATCH_EVENT, (event) => {

  // ❌ keine Assets → kein Slide
  if(!event.assets || !event.assets.length){
    return;
  }

  console.log("🎬 SLIDE EVENT:", event);

  createSlide(event);
});
}

// =========================
// 📦 EXPORT
// =========================
export { initMatchEventSlides };
