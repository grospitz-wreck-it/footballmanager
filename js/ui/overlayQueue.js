const queue = [];

let running = false;

export function enqueueOverlay(fn) {
  queue.push(fn);

  processQueue();
}

async function processQueue() {

  if (running) return;

  const next = queue.shift();

  if (!next) return;

  running = true;

  try {
    await next();
  } catch (e) {
    console.error(
      "❌ Overlay Queue Error",
      e
    );
  }

  running = false;

  processQueue();
}