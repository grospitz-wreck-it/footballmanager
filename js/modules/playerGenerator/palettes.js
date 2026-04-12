export function getPalette(code) {
  const map = {
    DE: { primary: '#000000' },
    FR: { primary: '#0055A4' },
    BR: { primary: '#009C3B' },
  };

  return map[code] || { primary: '#888' };
}
