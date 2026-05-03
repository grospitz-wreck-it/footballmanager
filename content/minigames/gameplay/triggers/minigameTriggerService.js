// /gameplay/triggers/minigameTriggerService.js

/**
 * MinigameTriggerService V1.4
 *
 * Ziel:
 * Produktionsreife Trigger-Vorbereitung
 * für:
 * - Penalty
 * - Freekick
 * - Keeper Challenge
 *
 * Noch isoliert:
 * Nur Trigger Contracts, keine Main-App Integration.
 */

import { EVENT_TYPES } from "../engine/eventContract.js";

export class MinigameTriggerService {
  constructor(config = {}) {
    this.thresholds = {
      penaltyFoulIntensity:
        config.penaltyFoulIntensity || 0.82,

      freekickZoneX:
        config.freekickZoneX || 0.82,

      keeperChallengeShotIntensity:
        config.keeperChallengeShotIntensity || 0.88,
    };

    this.pendingTrigger = null;
  }

  evaluate(event) {
    if (!event) return null;

    switch (event.type) {
      case EVENT_TYPES.FOUL:
        return this.checkPenalty(event) ||
               this.checkFreekick(event);

      case EVENT_TYPES.SHOT:
      case EVENT_TYPES.BIG_CHANCE:
        return this.checkKeeperChallenge(event);

      default:
        return null;
    }
  }

  checkPenalty(event) {
    const inBox =
      event.ball &&
      event.ball[0] >= 0.88;

    const intense =
      event.intensity >=
      this.thresholds.penaltyFoulIntensity;

    if (inBox && intense) {
      return this.buildTrigger(
        "PENALTY",
        event
      );
    }

    return null;
  }

  checkFreekick(event) {
    const edgeZone =
      event.ball &&
      event.ball[0] >= this.thresholds.freekickZoneX &&
      event.ball[0] < 0.88;

    if (edgeZone) {
      return this.buildTrigger(
        "FREEKICK",
        event
      );
    }

    return null;
  }

  checkKeeperChallenge(event) {
    const highIntensity =
      event.intensity >=
      this.thresholds.keeperChallengeShotIntensity;

    if (highIntensity) {
      return this.buildTrigger(
        "KEEPER_CHALLENGE",
        event
      );
    }

    return null;
  }

  buildTrigger(type, sourceEvent) {
    this.pendingTrigger = {
      id: `trigger_${Date.now()}`,
      type,

      sourceEventId:
        sourceEvent.id,

      minute:
        sourceEvent.minute,

      team:
        sourceEvent.team,

      ball:
        sourceEvent.ball,

      score:
        sourceEvent.score,

      intensity:
        sourceEvent.intensity,

      ui: {
        freezeFrame: true,
        overlayText:
          this.getOverlayText(type),
      },
    };

    return this.pendingTrigger;
  }

  getOverlayText(type) {
    switch (type) {
      case "PENALTY":
        return "Du übernimmst den Elfmeter!";

      case "FREEKICK":
        return "Freistoß-Chance!";

      case "KEEPER_CHALLENGE":
        return "Torwart-Duell!";

      default:
        return "Minigame!";
    }
  }

  consumeTrigger() {
    const trigger = this.pendingTrigger;
    this.pendingTrigger = null;
    return trigger;
  }

  hasPendingTrigger() {
    return !!this.pendingTrigger;
  }

  reset() {
    this.pendingTrigger = null;
  }
}
