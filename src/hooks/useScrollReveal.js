import { useEffect } from 'react';

/**
 * Scroll reveal: elements inside the given sections glide up and fade in
 * EVERY time they scroll into view (down or back up), for as long as the
 * page is open — no reload needed.
 *
 *  - every top-level block of a section (headers, panels, charts) slides up
 *  - the items of grids and lists (cards, chips, rows) zoom in with a stagger
 *
 * When an element has left the screen completely it quietly resets, so it
 * can play again next time. Respects reduced motion.
 */
const BLOCKS = ':scope > div > *';
const ITEMS = '.grid > *, ol > li, ul > li';
const SHOW_AT = 0.12; // share of the element that must be visible to play

export default function useScrollReveal(sectionIds) {
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach(({ target, isIntersecting, intersectionRatio }) => {
          if (isIntersecting && intersectionRatio >= SHOW_AT) {
            target.classList.add('reveal-in');
          } else if (!isIntersecting) {
            // fully off screen: reset so it animates again on the way back
            target.classList.remove('reveal-in');
          }
        });
      },
      { threshold: [0, SHOW_AT] }
    );

    let firstScan = true;
    const prepare = (el, zoom, delay) => {
      if (!el.classList.contains('reveal')) {
        el.classList.add('reveal');
        if (zoom) el.classList.add('reveal-zoom');
        el.style.setProperty('--rd', `${delay}ms`);
        // Already on screen at load: show straight away (no jump on first paint).
        // Content that appears later (new story page, "See all") animates in instead.
        if (firstScan) {
          const r = el.getBoundingClientRect();
          if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('reveal-in');
        }
      }
      io.observe(el);
    };

    const scan = () => {
      sectionIds.forEach((id) => {
        const section = document.getElementById(id);
        if (!section) return;
        section.querySelectorAll(BLOCKS).forEach((el) => prepare(el, false, 0));
        section.querySelectorAll(ITEMS).forEach((el) => {
          const i = Array.prototype.indexOf.call(el.parentElement.children, el);
          prepare(el, true, Math.min(i, 8) * 80);
        });
      });
      firstScan = false;
    };

    // Wait a tick so the sections have rendered their content
    const timer = setTimeout(scan, 50);

    // Pick up content that appears later (e.g. "See all species", story pages)
    const mo = new MutationObserver(() => {
      clearTimeout(mo.t);
      mo.t = setTimeout(scan, 120);
    });
    sectionIds.forEach((id) => {
      const section = document.getElementById(id);
      if (section) mo.observe(section, { childList: true, subtree: true });
    });

    return () => {
      clearTimeout(timer);
      clearTimeout(mo.t);
      mo.disconnect();
      io.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
