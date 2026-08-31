/**
 * Hero fold animation.
 *
 * Runs on page load. Each .hero-fold-panel starts folded away from the
 * viewer (rotateX(-92deg), opacity 0) and unfolds into place with a
 * stagger. Panels are inside .hero-fold-word containers which set the
 * perspective, so the rotation reads as a real 3D fold.
 *
 * We respect prefers-reduced-motion by snapping to the final state.
 */

import { gsap } from 'gsap';

export function initHeroFold() {
  const run = () => {
    const roots = document.querySelectorAll<HTMLElement>('.hero-fold');
    if (!roots.length) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    roots.forEach((root) => {
      const panels = root.querySelectorAll<HTMLElement>('.hero-fold-panel');
      if (!panels.length) return;

      if (reduced) {
        gsap.set(panels, { opacity: 1, rotateX: 0 });
        return;
      }

      gsap.fromTo(
        panels,
        {
          opacity: 0,
          rotateX: -92,
          transformOrigin: '50% 0%',
          force3D: true,
        },
        {
          opacity: 1,
          rotateX: 0,
          duration: 0.65,
          ease: 'power3.out',
          stagger: 0.045,
          clearProps: 'willChange',
        }
      );
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
}
