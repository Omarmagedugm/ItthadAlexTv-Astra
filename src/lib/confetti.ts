import confetti from 'canvas-confetti';

// 1. Bulletproof polyfill for OffscreenCanvas getBoundingClientRect
if (typeof HTMLCanvasElement !== 'undefined' && HTMLCanvasElement.prototype.transferControlToOffscreen) {
  try {
    delete (HTMLCanvasElement.prototype as any).transferControlToOffscreen;
  } catch (e) {
    (HTMLCanvasElement.prototype as any).transferControlToOffscreen = undefined;
  }
}

if (typeof OffscreenCanvas !== 'undefined' && !(OffscreenCanvas.prototype as any).getBoundingClientRect) {
  try {
    (OffscreenCanvas.prototype as any).getBoundingClientRect = function () {
      return {
        top: 0,
        left: 0,
        right: (this as any).width || 0,
        bottom: (this as any).height || 0,
        width: (this as any).width || 0,
        height: (this as any).height || 0,
        x: 0,
        y: 0,
        toJSON: () => ({})
      };
    };
  } catch (e) {
    // Ignore in strict sealed environments
  }
}

/**
 * 2. Safe Confetti instance explicitly configured with useWorker: false.
 * Prevents canvas-confetti from spawning worker blobs where OffscreenCanvas crashes
 * with getBoundingClientRect errors, ensuring high-performance, 60fps animations on the main canvas.
 */
let rawSafeConfetti: any = null;
try {
  if (typeof window !== 'undefined' && typeof confetti.create === 'function') {
    rawSafeConfetti = confetti.create(undefined, { resize: true, useWorker: false });
  } else {
    rawSafeConfetti = confetti;
  }
} catch (e) {
  rawSafeConfetti = confetti;
}

export const safeConfetti = (options?: any) => {
  try {
    if (typeof rawSafeConfetti === 'function') {
      return rawSafeConfetti(options);
    }
    if (typeof confetti === 'function') {
      return confetti(options);
    }
  } catch (err) {
    console.warn('[Confetti] Non-fatal animation bypass:', err);
  }
  return Promise.resolve(null);
};

(safeConfetti as any).reset = () => {
  try {
    if (rawSafeConfetti && typeof rawSafeConfetti.reset === 'function') {
      rawSafeConfetti.reset();
    } else if (confetti && typeof confetti.reset === 'function') {
      confetti.reset();
    }
  } catch (e) {}
};

if (typeof window !== 'undefined') {
  (window as any).confetti = safeConfetti;
}

export default safeConfetti;
