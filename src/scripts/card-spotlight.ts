/**
 * Card spotlight — a shared pointermove listener drives a cursor-following
 * glow on every .week-card. Each card gets four CSS custom properties:
 *
 *   --mx, --my   normalized cursor position within the card (percent)
 *   --a          opacity 0..1 that ramps up as the cursor approaches
 *
 * The pointer position is a *target*; the values actually written to the
 * card are smoothed toward the target every frame via exponential easing
 * (angle += diff * (1 - exp(-dt * k))), so the light drifts to catch up
 * to the cursor with a subtle lag instead of snapping.
 */

const PROXIMITY = 240;   // px beyond the card at which the glow starts fading in
const POS_K     = 9;     // higher = position catches up faster
const ALPHA_K   = 6;     // higher = fade in/out reacts faster

interface CardState {
  el: HTMLElement;
  // Target values updated on pointermove.
  targetMx: number;
  targetMy: number;
  targetA: number;
  // Smoothed values written to the DOM each frame.
  mx: number;
  my: number;
  a: number;
}

function makeState(el: HTMLElement): CardState {
  return { el, targetMx: 50, targetMy: 50, targetA: 0, mx: 50, my: 50, a: 0 };
}

export function initCardSpotlight() {
  const run = () => {
    let states: CardState[] = [];

    const collect = () => {
      states = Array.from(document.querySelectorAll<HTMLElement>('.week-card')).map(makeState);
    };
    collect();

    // Re-scan when new cards are added (e.g. after the reveal-on-scroll
    // observer inserts them). MutationObserver is cheap and only fires on
    // real DOM changes.
    const mo = new MutationObserver(() => {
      const current = new Set(states.map((s) => s.el));
      const found = Array.from(document.querySelectorAll<HTMLElement>('.week-card'));
      if (found.length !== states.length || found.some((el) => !current.has(el))) {
        collect();
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    const onMove = (e: PointerEvent) => {
      for (const s of states) {
        const rect = s.el.getBoundingClientRect();
        const dx = Math.max(rect.left - e.clientX, 0, e.clientX - rect.right);
        const dy = Math.max(rect.top - e.clientY, 0, e.clientY - rect.bottom);
        const dist = Math.hypot(dx, dy);

        const t = Math.max(0, 1 - dist / PROXIMITY);
        s.targetA = t * t * (3 - 2 * t); // smoothstep

        s.targetMx = ((e.clientX - rect.left) / rect.width) * 100;
        s.targetMy = ((e.clientY - rect.top) / rect.height) * 100;
      }
    };

    // Pointer left the window entirely — fade everyone out.
    const onLeave = () => {
      for (const s of states) s.targetA = 0;
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);

    // Animation loop: exponential smoothing toward the target each frame.
    // Runs continuously but writes are cheap (a couple of setProperty calls
    // per card, only while values are still converging).
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const posEase = 1 - Math.exp(-dt * POS_K);
      const alphaEase = 1 - Math.exp(-dt * ALPHA_K);

      for (const s of states) {
        const dmx = s.targetMx - s.mx;
        const dmy = s.targetMy - s.my;
        const da = s.targetA - s.a;

        // Skip DOM writes when everything is essentially at target.
        if (Math.abs(dmx) < 0.05 && Math.abs(dmy) < 0.05 && Math.abs(da) < 0.001) {
          continue;
        }

        s.mx += dmx * posEase;
        s.my += dmy * posEase;
        s.a  += da  * alphaEase;

        s.el.style.setProperty('--mx', `${s.mx.toFixed(2)}%`);
        s.el.style.setProperty('--my', `${s.my.toFixed(2)}%`);
        s.el.style.setProperty('--a', s.a.toFixed(3));
      }

      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
}
