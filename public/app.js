document.addEventListener('DOMContentLoaded', () => {
  // Small UI helpers for the portfolio
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile nav toggle
  const navToggle = document.getElementById('nav-toggle');
  const nav = document.querySelector('.nav');
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      if (!nav) return;
      const visible = nav.style.display === 'flex';
      nav.style.display = visible ? '' : 'flex';
    });
  }
  

  // Theme toggle (light/dark simulated)
  const themeToggle = document.getElementById('theme-toggle');
  const root = document.documentElement;
  themeToggle && themeToggle.addEventListener('click', () => {
    const isDark = root.getAttribute('data-theme') !== 'light';
    if (isDark) {
      root.setAttribute('data-theme', 'light');
      themeToggle.textContent = '🌙';
    } else {
      root.removeAttribute('data-theme');
      themeToggle.textContent = '🌙';
    }
  });

  // Simple scroll reveal for cards
  // Use IntersectionObserver for reliable reveal animations
  const revealTargets = document.querySelectorAll('.card, .skill, .portrait, .content-card');
  if (window.IntersectionObserver) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealTargets.forEach(t => obs.observe(t));
  } else {
    // fallback
    revealTargets.forEach(t => t.classList.add('reveal'));
  }

  // Start a JS-driven animation loop for the SVG groups (robust across browsers)
  try {
    isoGroups.forEach((g, i) => {
      const t = g.getAttribute('transform') || 'translate(0,0)';
      g.dataset.origTransform = t;
      // preserve any existing data-phase set in the HTML; otherwise set a small default
      if (!g.dataset.phase) g.dataset.phase = (i * 0.9);
    });

    // motion path setup (if present) and per-group behavior params
    const motionPath = document.getElementById('motion-path');
    const motionSvg = document.querySelector('.hero-bg');
    const pathLength = motionPath ? motionPath.getTotalLength() : 0;
    isoGroups.forEach((g,i)=>{
      g._pathLen = pathLength;
      g._speed = parseFloat(g.dataset.speed) || (50 + Math.round(Math.random()*40)); // px/sec
      g._phaseOffset = (parseFloat(g.dataset.phase) || (i * 40)) % (pathLength || 360);
      g._popping = 0;
      g._popOutToggle = false;
      // behavior tuning
      g._wobbleAmp = 4 + Math.random() * 14; // side wobble
      g._bobAmp = 6 + Math.random() * 18; // vertical bob
      g._spinSpeed = 0.6 + Math.random() * 1.6; // inner spin multiplier
      // initial path position (s) and velocity along path (v)
      g._s = (g._phaseOffset) || (Math.random() * (g._pathLen || 360));
      const dir = Math.random() > 0.5 ? 1 : -1;
      g._v = dir * (g._speed || 60);
      // attach a shadow element if not present
      if (!g.querySelector('.shadow')){
        const xmlns = "http://www.w3.org/2000/svg";
        const ell = document.createElementNS(xmlns, 'ellipse');
        ell.setAttribute('class', 'shadow');
        ell.setAttribute('cx', 0);
        ell.setAttribute('cy', 0);
        ell.setAttribute('rx', 36);
        ell.setAttribute('ry', 12);
        ell.setAttribute('opacity', 0.12);
        // insert shadow as first child so it sits under the shape
        g.insertBefore(ell, g.firstChild);
      }
    });

    const parseTranslate = (str) => {
      const m = /translate\(([-0-9.\.]+)\s*,?\s*([-0-9\.]+)\)/.exec(str);
      if (m) return [parseFloat(m[1]), parseFloat(m[2])];
      return [0,0];
    };

    let last = 0;
    let lastLog = 0;
    function animateSvg(ts){
      if (!ts) ts = performance.now();
      const dt = ts - last; last = ts;
      const dtSec = Math.max(0.001, dt/1000);
      // log once per second to help debugging in user browsers
      if (ts - lastLog > 1000) { console.log('animateSvg running', Math.round(ts)); lastLog = ts; }
      isoGroups.forEach((g) => {
        const phase = parseFloat(g.dataset.phase) || 0;
        const t = ts/1000;
        // If motionPath exists, move along the path
        if (motionPath && motionSvg && g._pathLen) {
          // advance path position by per-group velocity
          g._s = (g._s + (g._v || g._speed || 50) * dtSec) % g._pathLen;
          if (g._s < 0) g._s += g._pathLen;
          const len = g._s;
          const pt = motionPath.getPointAtLength(len);
          const pt2 = motionPath.getPointAtLength((len + 1) % g._pathLen);
          const angleRad = Math.atan2(pt2.y - pt.y, pt2.x - pt.x);
          const angleDeg = angleRad * 180 / Math.PI;

          // rolling angle to simulate a die rolling: proportional to distance along path
          const rollAngle = (len / 20) * 360 * (g._spinSpeed || 1); // adjust divisor for faster/slower roll

          // perpendicular wobble offset (side-to-side)
          const dxT = pt2.x - pt.x;
          const dyT = pt2.y - pt.y;
          const mag = Math.sqrt(dxT*dxT + dyT*dyT) || 1;
          const nx = -dyT / mag; // normalized perpendicular
          const ny = dxT / mag;
          const wob = Math.sin(t * (0.9 + (g._spinSpeed||1)) + (g._phaseOffset||0)/100) * g._wobbleAmp;
          const wobX = nx * wob;
          const wobY = ny * wob;

          // bobbing (vertical) based on shape's bob amplitude
          const bobOffset = Math.sin(t * (0.9 + (g._spinSpeed||1)) + (g._phaseOffset||0)/50) * g._bobAmp;

          // pop scaling via timestamp (set by pulse intervals)
          let scale = 1;
          if (g._popping && (ts - g._popping) < 700) {
            const elapsed = ts - g._popping;
            // ease: quick pop up then settle
            const p = Math.min(1, elapsed / 520);
            scale = 1 + (0.28 * (1 - Math.pow(1 - p, 2)));
          }

          const totalRotate = angleDeg + (g.dataset.shape === 'cube' ? rollAngle : 0);
          // build transform: translate to path point + wobble offsets, rotate by path tangent, and scale
          const tx = pt.x + wobX;
          const ty = pt.y + wobY - bobOffset * 0.5; // lift slightly when bobbing
          try {
            g.setAttribute('transform', `translate(${tx}, ${ty}) rotate(${angleDeg}) scale(${scale})`);
            // inner rotation + small tilt to simulate tumbling
            // Apply inner rotations differently depending on shape type
            const cubeInner = g.querySelector('g.cube');
            const circleEl = g.querySelector('circle');
            const marker = g.querySelector('.marker');
            const tilt = Math.sin(t * 2.3 + (g._phaseOffset||0)/100) * 6; // small tilt oscillation
            if (cubeInner) {
              // If explicitly marked as a die, rotate around its center using bbox
              if (g.dataset.roll === 'die') {
                try {
                  const bb = cubeInner.getBBox();
                  const cx = bb.x + bb.width/2;
                  const cy = bb.y + bb.height/2;
                  // translate to center, rotate by rollAngle, apply slight tilt, translate back
                  cubeInner.setAttribute('transform', `translate(${cx},${cy}) rotate(${rollAngle}) rotate(${tilt}) translate(${-cx},${-cy}) translate(0, ${-bobOffset})`);
                } catch (e) {
                  // fallback: basic rotate
                  cubeInner.setAttribute('transform', `translate(0, ${-bobOffset}) rotate(${rollAngle}) rotate(${tilt})`);
                }
              } else {
                // small rotation for non-die cubes
                cubeInner.setAttribute('transform', `translate(0, ${-bobOffset}) rotate(${rollAngle * 0.2}) rotate(${tilt})`);
              }
            } else if (circleEl && marker) {
              // Circle: rotate the visual marker to show rolling
              const r = parseFloat(circleEl.getAttribute('r') || 26);
              const rollDeg = (g._s * 360) / (2 * Math.PI * Math.max(1, r));
              // rotate marker around circle center (0,0)
              marker.setAttribute('transform', `rotate(${rollDeg}) translate(0, ${-bobOffset}) rotate(${tilt})`);
            } else {
              const inner = g.querySelector('polygon');
              if (inner) inner.setAttribute('transform', `translate(0, ${-bobOffset}) rotate(${rollAngle * 0.5}) rotate(${tilt})`);
            }
            // update shadow under the element
            const shadow = g.querySelector('.shadow');
            if (shadow) {
              // scale shadow by scale and bob (higher => smaller shadow)
              const srx = Math.max(8, 36 * (1 / Math.max(0.6, scale)));
              const sry = Math.max(4, 12 * (1 / Math.max(0.6, scale)));
              shadow.setAttribute('cx', 0);
              shadow.setAttribute('cy', 10 + Math.max(0, bobOffset/3));
              shadow.setAttribute('rx', srx);
              shadow.setAttribute('ry', sry);
              shadow.setAttribute('opacity', Math.max(0.06, 0.18 * (1 / Math.max(0.6, scale))));
            }
          } catch (e) {
            g.style.transform = `translate(${tx}px, ${ty}px) rotate(${angleDeg}deg) scale(${scale})`;
            const inner = g.querySelector('.cube') || g.querySelector('circle') || g.querySelector('polygon');
            if (inner) inner.style.transform = `translateY(${-bobOffset}px) rotate(${rollAngle}deg)`;
          }
        } else {
          // fallback gentle floating sway when no path
          const [ox, oy] = parseTranslate(g.dataset.origTransform || 'translate(0,0)');
          const dx = Math.sin(t * 1.25 + phase) * 12; // horizontal sway stronger
          const dy = Math.cos(t * 0.85 + phase) * 14; // vertical bob stronger
          try {
            g.style.transform = `translate(${ox + dx}px, ${oy + dy}px)`;
            g.style.willChange = 'transform';
          } catch(e) {
            g.setAttribute('transform', `translate(${ox + dx}, ${oy + dy})`);
          }
        }
      });
      requestAnimationFrame(animateSvg);
    }
    requestAnimationFrame(animateSvg);
  } catch (e) {
    console.warn('SVG animation loop failed', e);
  }

  // Instagram-like gallery behavior
  const tiles = Array.from(document.querySelectorAll('.ig-tile'));
  const modal = document.getElementById('ig-modal');
  const backdrop = document.getElementById('ig-backdrop');
  const fullImg = document.getElementById('ig-full');
  const titleEl = document.getElementById('ig-title');
  const descEl = document.getElementById('ig-desc');
  const closeBtn = document.getElementById('ig-close');
  const prevBtn = document.getElementById('ig-prev');
  const nextBtn = document.getElementById('ig-next');
  let currentIndex = -1;

  function openIndex(i){
    const tile = tiles[i];
    if (!tile) return;
    const src = tile.dataset.src;
    const title = tile.dataset.title || '';
    const desc = tile.dataset.desc || '';
    fullImg.src = src;
    fullImg.alt = title;
    titleEl.textContent = title;
    descEl.textContent = desc;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden','false');
    currentIndex = i;
  }

  function closeModal(){
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden','true');
    fullImg.src = '';
    currentIndex = -1;
  }

  tiles.forEach((t,i)=>{
    t.addEventListener('click', ()=> openIndex(i));
  });
  closeBtn && closeBtn.addEventListener('click', closeModal);
  backdrop && backdrop.addEventListener('click', closeModal);
  prevBtn && prevBtn.addEventListener('click', ()=>{ if (currentIndex>0) openIndex(currentIndex-1); });
  nextBtn && nextBtn.addEventListener('click', ()=>{ if (currentIndex<tiles.length-1) openIndex(currentIndex+1); });
  document.addEventListener('keydown',(e)=>{
    if (modal && !modal.classList.contains('hidden')){
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft') prevBtn && prevBtn.click();
      if (e.key === 'ArrowRight') nextBtn && nextBtn.click();
    }
  });

  // Contact form: basic mailto fallback
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value || 'No name';
      const email = document.getElementById('email').value || 'no-email';
      const subjectVal = document.getElementById('subject') ? document.getElementById('subject').value : '';
      const message = document.getElementById('message').value || '';
      const subject = encodeURIComponent(subjectVal || `Portfolio message from ${name}`);
      const body = encodeURIComponent(`From: ${name} <${email}>\n\n${message}`);
      window.location.href = `mailto:you@example.com?subject=${subject}&body=${body}`;
    });
  }

  // Smooth scroll for internal links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      if (href.startsWith('#')) {
        const el = document.querySelector(href);
        if (el) {
          e.preventDefault();
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });
});
