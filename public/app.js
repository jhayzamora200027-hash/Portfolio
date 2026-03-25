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
  // initialize icon based on attribute
  if (themeToggle) {
    themeToggle.textContent = root.getAttribute('data-theme') === 'light' ? '☀️' : '🌙';
    themeToggle.addEventListener('click', () => {
      const isLight = root.getAttribute('data-theme') === 'light';
      if (isLight) {
        root.removeAttribute('data-theme');
        themeToggle.textContent = '🌙';
        themeToggle.setAttribute('aria-pressed', 'false');
      } else {
        root.setAttribute('data-theme', 'light');
        themeToggle.textContent = '☀️';
        themeToggle.setAttribute('aria-pressed', 'true');
      }
    });
  }

  // Collect iso groups (moving shapes in the hero SVG)
  const isoGroups = Array.from(document.querySelectorAll('.iso-group.moving'));

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

    // Hover repulsion: push shapes away from cursor when close
    if (motionSvg && motionPath) {
      const svgPoint = motionSvg.createSVGPoint();
      function clientToSvgCoords(evt){
        svgPoint.x = evt.clientX; svgPoint.y = evt.clientY;
        const ctm = motionSvg.getScreenCTM();
        if (!ctm) return {x: svgPoint.x, y: svgPoint.y};
        return svgPoint.matrixTransform(ctm.inverse());
      }

      motionSvg.addEventListener('pointermove', (e) => {
        const p = clientToSvgCoords(e);
        if (!p) return;
        isoGroups.forEach(g => {
          const len = (g._s || 0) % g._pathLen;
          const pt = motionPath.getPointAtLength(len);
          const dx = p.x - pt.x; const dy = p.y - pt.y;
          const dist = Math.hypot(dx, dy);
          const threshold = 120; // px
          if (dist < threshold) {
            // strength 0..1
            const strength = (threshold - dist) / threshold;
            // project repulsion onto path tangent to determine direction along path
            const pt2 = motionPath.getPointAtLength((len + 2) % g._pathLen);
            const tx = pt2.x - pt.x; const ty = pt2.y - pt.y;
            const dot = dx * tx + dy * ty;
            const sign = dot > 0 ? -1 : 1; // if cursor ahead, push backward
            // nudge position and velocity
            g._s = (g._s + sign * strength * 48) % g._pathLen;
            g._v = (g._v || 0) + sign * strength * (60 + Math.random() * 80);
            // visual feedback
            g._popping = performance.now();
          }
        });
      });

      // pointerleave: gently reduce velocities
      motionSvg.addEventListener('pointerleave', () => {
        isoGroups.forEach(g => {
          g._v = (g._v || 0) * 0.25;
        });
      });
    }

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
      // log once per second to help debugging in user browsers
      if (ts - lastLog > 1000) { console.log('animateSvg running', Math.round(ts)); lastLog = ts; }
      isoGroups.forEach((g) => {
        const phase = parseFloat(g.dataset.phase) || 0;
        const t = ts/1000;
        // If motionPath exists, move along the path
        if (motionPath && motionSvg && g._pathLen) {
          const speed = g._speed || 50; // px/sec
          const offset = g._phaseOffset || 0;
          const len = (t * speed + offset) % g._pathLen;
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
            const inner = g.querySelector('.cube') || g.querySelector('circle') || g.querySelector('polygon');
            if (inner) {
              const tilt = Math.sin(t * 2.3 + g._phaseOffset/100) * 6; // small tilt oscillation
              inner.setAttribute('transform', `translate(0, ${-bobOffset}) rotate(${rollAngle}) rotate(${tilt})`);
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
