# Penalty Minigame Module

Modulares Penalty-Minigame (ES Modules) zur späteren Einbettung in das bestehende Spielsystem.

## Module

- `penaltyGame.js`: Controller/Lifecycle (`start`, `reset`, `end`) und externe Hooks.
- `penaltyInput.js`: Pointer/Touch Input mit Zone- und Power-Ermittlung (tap/hold/swipe).
- `penaltyPhysics.js`: Ballkurve, Zieljitter und Shot-Resolution.
- `keeperAI.js`: Reaktion, Antizipation, Difficulty-Hooks.
- `keeperSpline.js`: Platzhalter-Kurvenstruktur für Keeper-Dives.
- `penaltyRenderer.js`: DOM-basiertes Rendering (16:9-friendly).
- `penaltyUI.js`: HUD, Round/Score/Feedback.
- `penaltyConfig.js`: Defaults + Deep-Merge Konfiguration.

## Öffentliche API

```js
import { startPenaltyGame, resetPenaltyGame, setPenaltyDifficulty, destroyPenaltyGame } from './penaltyGame.js';
```

- `startPenaltyGame(config)` erwartet `config.rootElement`.
- `resetPenaltyGame()` setzt die laufende Instanz zurück.
- `setPenaltyDifficulty(level)` setzt `easy|normal|hard` zur Laufzeit.

## Template/CSS

- `penaltyTemplate.html` enthält ein minimales Embed-Markup.
- `penalty.css` enthält isolierte Styles nur für das Minigame.

- `destroyPenaltyGame()` beendet und entfernt die Singleton-Instanz zur sauberen Freigabe.

## Demo

- `demo.html` kann direkt lokal geöffnet werden, um das Minigame isoliert zu testen.
