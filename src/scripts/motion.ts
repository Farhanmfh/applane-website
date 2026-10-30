// Page-wide motion: scroll reveals, word-by-word headings, counters, button glow.
// Everything is progressive: without JS or with reduced motion, content is simply visible.

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const inr = new Intl.NumberFormat('en-IN');

function splitWords(root: HTMLElement) {
  let i = 0;
  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const parts = (child.textContent ?? '').split(/(\s+)/);
        const frag = document.createDocumentFragment();
        for (const part of parts) {
          if (!part) continue;
          if (/^\s+$/.test(part)) { frag.append(document.createTextNode(part)); continue; }
          const line = document.createElement('span');
          line.className = 'split-line';
          const word = document.createElement('span');
          word.className = 'split-word';
          word.style.setProperty('--i', String(i++));
          word.textContent = part;
          line.append(word);
          frag.append(line);
        }
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE && (child as Element).tagName !== 'BR') {
        walk(child);
      }
    }
  };
  walk(root);
}

function countUp(el: HTMLElement) {
  const target = Number(el.dataset.count);
  const prefix = el.dataset.prefix ?? '';
  const suffix = el.dataset.suffix ?? '';
  if (reduce || !Number.isFinite(target)) { el.textContent = prefix + inr.format(target) + suffix; return; }
  const dur = 1400;
  const start = performance.now();
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - t, 4);
    el.textContent = prefix + inr.format(Math.round(target * eased)) + suffix;
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function init() {
  document.querySelectorAll<HTMLElement>('[data-split]').forEach(splitWords);

  const targets = document.querySelectorAll<HTMLElement>('[data-reveal], [data-split], [data-count], [data-inview]');
  if (!('IntersectionObserver' in window) || reduce) {
    targets.forEach((el) => {
      el.classList.add('is-in');
      if (el.dataset.count) countUp(el);
    });
    return;
  }

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target as HTMLElement;
      el.classList.add('is-in');
      if (el.dataset.count) countUp(el);
      io.unobserve(el);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  targets.forEach((el) => io.observe(el));

  // Pointer-follow glow on buttons (desktop only).
  if (window.matchMedia('(hover: hover)').matches) {
    document.addEventListener('pointermove', (e) => {
      const btn = (e.target as Element | null)?.closest?.('.btn') as HTMLElement | null;
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      btn.style.setProperty('--mx', `${e.clientX - r.left}px`);
      btn.style.setProperty('--my', `${e.clientY - r.top}px`);
    }, { passive: true });
  }
}

init();
