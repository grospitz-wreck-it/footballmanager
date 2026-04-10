// 🧠 Simple Event Bus

const listeners = {};

export function on(event, callback) {
  if (!listeners[event]) listeners[event] = [];
  listeners[event].push(callback);
}

export function emit(event, data) {
  console.log("📡 Event:", event, data);

  if (!listeners[event]) return;

  listeners[event].forEach(cb => cb(data));
}
