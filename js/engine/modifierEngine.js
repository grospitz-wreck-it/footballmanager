// =========================
// ⚙️ MODIFIER ENGINE
// =========================

export function applyModifiers(base, modifiers){

  let value = base;

  modifiers.forEach(mod => {
    if(mod.attack){
      value += base * mod.attack;
    }
  });

  return value;
}
