/**
 * Deck controller — drives the scroll-snap slide deck on a week detail page.
 *
 * Two content modes:
 * 1. STRUCTURED — the mdx uses <Slide> / <section class="slide-cover-deck">
 *    components. Detected when the deck-source contains .ppt-slide or
 *    .slide-cover-deck children. The pre-built sections are simply moved
 *    into place; no slicing.
 * 2. AUTO — plain markdown mdx. Falls back to slicing content by <h2>
 *    boundaries, wrapping each group in a <section class="slide slide-content">.
 *
 * Either way, the same navigation wiring runs on top: progress indicator,
 * side dot nav, keyboard shortcuts, URL hash sync, drawer.
 */

function hasStructuredSlides(source: HTMLElement): boolean {
  return !!source.querySelector(':scope > .ppt-slide, :scope > .slide-cover-deck');
}

function moveStructuredSlides(source: HTMLElement, target: HTMLElement): HTMLElement[] {
  const slides: HTMLElement[] = [];
  // Take a static list up front, since moving children mutates source.
  const nodes = Array.from(source.children) as HTMLElement[];
  for (const node of nodes) {
    if (node.classList.contains('ppt-slide') || node.classList.contains('slide-cover-deck')) {
      target.appendChild(node);
      slides.push(node);
    }
  }
  return slides;
}

function sliceMarkdownBySections(source: HTMLElement, target: HTMLElement): HTMLElement[] {
  const nodes = Array.from(source.children);
  const groups: HTMLElement[][] = [];
  let current: HTMLElement[] = [];

  for (const node of nodes) {
    if (node.tagName === 'H2') {
      if (current.length) groups.push(current);
      current = [node as HTMLElement];
    } else {
      current.push(node as HTMLElement);
    }
  }
  if (current.length) groups.push(current);

  const slides: HTMLElement[] = [];
  groups.forEach((group, i) => {
    const slide = document.createElement('section');
    slide.className = 'slide slide-content';
    slide.dataset.slideIndex = String(i + 1);
    const inner = document.createElement('div');
    inner.className = 'slide-inner';
    group.forEach((n) => inner.appendChild(n));
    slide.appendChild(inner);
    target.appendChild(slide);
    slides.push(slide);
  });

  return slides;
}

function buildDots(root: HTMLElement, slides: HTMLElement[], onJump: (i: number) => void) {
  const dotsHost = root.querySelector<HTMLElement>('.deck-dots');
  if (!dotsHost) return [] as HTMLButtonElement[];
  dotsHost.innerHTML = '';
  const buttons: HTMLButtonElement[] = [];
  slides.forEach((_, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'deck-dot';
    btn.setAttribute('aria-label', `跳到第 ${i + 1} 页`);
    btn.dataset.index = String(i);
    btn.addEventListener('click', () => onJump(i));
    dotsHost.appendChild(btn);
    buttons.push(btn);
  });
  return buttons;
}

function initDrawer(root: HTMLElement) {
  const drawer = root.querySelector<HTMLElement>('#deck-drawer');
  const openBtn = root.querySelector<HTMLButtonElement>('.deck-all-btn');
  const closeBtn = root.querySelector<HTMLButtonElement>('.deck-drawer-close');
  const backdrop = root.querySelector<HTMLElement>('.deck-drawer-backdrop');
  if (!drawer || !openBtn) return;

  const open = () => drawer.setAttribute('aria-hidden', 'false');
  const close = () => drawer.setAttribute('aria-hidden', 'true');
  openBtn.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  backdrop?.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.getAttribute('aria-hidden') === 'false') close();
  });
}

/**
 * Lightbox for issue-row thumbnails. Any element with data-lightbox-src
 * opens a full-screen overlay showing the image at its natural aspect.
 */
function initLightbox(root: HTMLElement) {
  const triggers = root.querySelectorAll<HTMLElement>('[data-lightbox-src]');
  if (!triggers.length) return;

  // Build overlay once, appended to body so it sits above the deck.
  const overlay = document.createElement('div');
  overlay.className = 'deck-lightbox';
  overlay.setAttribute('data-open', 'false');
  overlay.innerHTML = `
    <button type="button" class="deck-lightbox__close" aria-label="关闭">&times;</button>
    <img alt="" />
  `;
  document.body.appendChild(overlay);
  const img = overlay.querySelector<HTMLImageElement>('img')!;
  const closeBtn = overlay.querySelector<HTMLButtonElement>('.deck-lightbox__close')!;

  const open = (src: string, alt: string) => {
    img.src = src;
    img.alt = alt;
    overlay.setAttribute('data-open', 'true');
  };
  const close = () => {
    overlay.setAttribute('data-open', 'false');
    // Clear src after transition so we don't hold big images in memory.
    setTimeout(() => { img.src = ''; }, 300);
  };

  triggers.forEach((el) => {
    el.addEventListener('click', () => {
      const src = el.dataset.lightboxSrc ?? '';
      const alt = el.dataset.lightboxAlt ?? '';
      open(src, alt);
    });
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target === closeBtn) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.getAttribute('data-open') === 'true') close();
  });
}

export function initDeck() {
  const run = () => {
    const root = document.querySelector<HTMLElement>('.deck-root');
    if (!root) return;
    const source = root.querySelector<HTMLElement>('.deck-source .prose-week');
    const slidesHost = root.querySelector<HTMLElement>('.deck-slides');
    const cover = root.querySelector<HTMLElement>('.slide-cover');
    if (!source || !slidesHost) return;

    const structured = hasStructuredSlides(source);
    const contentSlides = structured
      ? moveStructuredSlides(source, slidesHost)
      : sliceMarkdownBySections(source, slidesHost);

    // Structured decks bring their own cover slide; skip the fallback cover.
    if (structured && cover) cover.remove();

    const allSlideEls: HTMLElement[] = structured
      ? contentSlides
      : [...(cover ? [cover] : []), ...contentSlides];

    if (!allSlideEls.length) return;

    // Progress indicator
    const totalEl = root.querySelector<HTMLElement>('.deck-progress-total');
    const currentEl = root.querySelector<HTMLElement>('.deck-progress-current');
    if (totalEl) totalEl.textContent = String(allSlideEls.length);

    // Side dots
    const dots = buildDots(root, allSlideEls, (i) => {
      allSlideEls[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    let activeIndex = 0;
    const setActive = (i: number) => {
      activeIndex = i;
      if (currentEl) currentEl.textContent = String(i + 1);
      dots.forEach((btn, idx) => btn.setAttribute('data-active', idx === i ? 'true' : 'false'));
      const target = `#slide-${i + 1}`;
      if (location.hash !== target) history.replaceState(null, '', target);
    };

    // Reveal animation on scroll-in
    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) e.target.classList.add('is-visible');
        }
      },
      { threshold: 0.15 }
    );
    allSlideEls.forEach((el) => revealObserver.observe(el));

    // Active-slide tracking
    const activeObserver = new IntersectionObserver(
      (entries) => {
        let best: IntersectionObserverEntry | null = null;
        for (const e of entries) {
          if (!best || e.intersectionRatio > best.intersectionRatio) best = e;
        }
        if (best && best.isIntersecting) {
          const idx = allSlideEls.indexOf(best.target as HTMLElement);
          if (idx >= 0) setActive(idx);
        }
      },
      { threshold: [0.4, 0.6, 0.8] }
    );
    allSlideEls.forEach((el) => activeObserver.observe(el));

    // Keyboard navigation
    const goTo = (i: number) => {
      const clamped = Math.max(0, Math.min(allSlideEls.length - 1, i));
      allSlideEls[clamped].scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    document.addEventListener('keydown', (e) => {
      const drawerOpen =
        root.querySelector('#deck-drawer')?.getAttribute('aria-hidden') === 'false';
      if (drawerOpen) return;
      if (['ArrowDown', 'PageDown', ' '].includes(e.key)) {
        e.preventDefault();
        goTo(activeIndex + 1);
      } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
        e.preventDefault();
        goTo(activeIndex - 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        goTo(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        goTo(allSlideEls.length - 1);
      }
    });

    // Jump to slide from URL hash on load
    const hashMatch = location.hash.match(/^#slide-(\d+)$/);
    if (hashMatch) {
      const idx = Number(hashMatch[1]) - 1;
      if (idx >= 0 && idx < allSlideEls.length) {
        requestAnimationFrame(() => {
          allSlideEls[idx].scrollIntoView({ behavior: 'auto', block: 'start' });
        });
      }
    } else {
      setActive(0);
    }

    initDrawer(root);
    initLightbox(root);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
}
