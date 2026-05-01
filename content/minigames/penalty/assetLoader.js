import { PENALTY_ASSETS } from './penaltySprites.js';

export async function loadPenaltyAssets() {
  const loaded = {};

  async function loadCategory(category, assets) {
    loaded[category] = {};

    for (const [key, src] of Object.entries(assets)) {
      const img = new Image();
      img.src = src;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      loaded[category][key] = img;
    }
  }

  for (const [category, assets] of Object.entries(PENALTY_ASSETS)) {
    await loadCategory(category, assets);
  }

  return loaded;
}
