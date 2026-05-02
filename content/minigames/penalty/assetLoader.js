import { PENALTY_ASSETS } from './penaltySprites.js';

export async function loadPenaltyAssets() {
  const loadedAssets = {};

  for (const [category, assets] of Object.entries(
    PENALTY_ASSETS
  )) {
    loadedAssets[category] = {};

    for (const [key, path] of Object.entries(
      assets
    )) {
      const img = new Image();

      img.src = path;

      await new Promise(
        (resolve, reject) => {
          img.onload = () =>
            resolve();

          img.onerror = () =>
            reject(
              new Error(
                `Failed loading asset: ${path}`
              )
            );
        }
      );

      loadedAssets[category][key] =
        img;
    }
  }

  return loadedAssets;
}
