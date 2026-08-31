/**
 * Reveal on scroll: fade + rise for outer wrappers and each top-level block
 * inside .prose-week. Elements start hidden (CSS in global.css) and gain
 * `.is-visible` when they enter the viewport from below.
 *
 * Uses IntersectionObserver so it stays cheap on long articles.
 * Respects prefers-reduced-motion — those users get instant visibility.
 */

export function initRevealOnScroll() {
  const run = () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Selectors: outer container (.reveal on home page) + every direct child
    // of a .prose-week article (h1-h6, p, ul, ol, table, blockquote, ...).
    const targets = document.querySelectorAll<HTMLElement>(
      '.reveal, .prose-week > *'
    );
    if (!targets.length) return;

    if (reduced || !('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        }
      },
      {
        // Reveal a little before the element fully enters — feels less abrupt.
        rootMargin: '0px 0px -8% 0px',
        threshold: 0.05,
      }
    );

    targets.forEach((el) => io.observe(el));
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
}
