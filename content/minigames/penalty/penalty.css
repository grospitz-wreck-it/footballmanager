/* penalty.css */

.penalty-game {
  width: 100%;
  aspect-ratio: 16 / 9;
  position: relative;
  overflow: hidden;
  font-family: 'Courier New', monospace;
  image-rendering: pixelated;
  background: #000;
}

/* HUD bleibt */
.penalty-hud {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 22px;
  z-index: 20;
  position: relative;

  background:
    linear-gradient(
      to bottom,
      rgba(5,10,40,0.96),
      rgba(15,20,60,0.88)
    );

  border-bottom: 3px solid #00f7ff;

  color: #ffe66d;
  text-transform: uppercase;
  letter-spacing: 2px;
}

/* Stadium.webp übernimmt alles */
.penalty-pitch {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;

  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: #111;
}

/* Alle alten generierten Feldlayer deaktivieren */
.penalty-pitch::before,
.penalty-pitch::after,
.penalty-goal,
.penalty-spot,
.stadium-crowd {
  display: none !important;
}

/* Keeper */
.penalty-keeper {
  width: 150px;
  height: 150px;

  position: absolute;
  z-index: 15;

  transform: translate(-50%, -50%);

  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;

  background-color: transparent;
  border: none;

  image-rendering: pixelated;

  transition:
    transform 0.1s ease,
    left 0.08s linear,
    top 0.08s linear;

  filter:
    drop-shadow(0 5px 4px rgba(0,0,0,0.45));
}

.penalty-keeper::before,
.penalty-keeper::after {
  display: none;
  content: none;
}

/* Ball */
.penalty-ball {
  width: 58px;
  height: 58px;

  position: absolute;
  z-index: 18;

  transform: translate(-50%, -50%);

  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;

  background-color: transparent;
  border: none;

  image-rendering: pixelated;

  filter:
    drop-shadow(0 4px 4px rgba(0,0,0,0.35));
}
