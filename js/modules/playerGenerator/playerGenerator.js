import { drawPlayer } from './playerRenderer.js';
import { getPalette } from './palettes.js';

const cache = new Map();

function createRNG(seed) {
  return function () {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function idToSeed(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getPlayerTexture(id, country) {
  const key = id + "_" + country;
  if (cache.has(key)) return cache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  const rand = createRNG(idToSeed(id));
  const palette = getPalette(country);

  drawPlayer(ctx, rand, palette);

  cache.set(key, canvas);
  return canvas;
}
