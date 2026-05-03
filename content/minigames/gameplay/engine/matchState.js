export function createInitialMatchState(config) {
  return {
    phase: 'IDLE',
    ball: { x: 0.22, y: 0.52, owner: 'HOME' },
    home: [{ x: 0.18, y: 0.5 }, { x: 0.3, y: 0.42 }, { x: 0.4, y: 0.56 }],
    away: [{ x: 0.72, y: 0.45 }, { x: 0.78, y: 0.55 }, { x: 0.65, y: 0.5 }],
    score: { home: 0, away: 0 },
    colors: config.team
  };
}
