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

  // Card tilt interaction (subtle)
  document.querySelectorAll('.projects-grid .card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width/2;
      const cy = rect.top + rect.height/2;
      const dx = (e.clientX - cx) / rect.width;
      const dy = (e.clientY - cy) / rect.height;
      const rY = dx * 6; // rotateY
      const rX = -dy * 6; // rotateX
      card.style.transform = `perspective(800px) translateZ(0) rotateX(${rX}deg) rotateY(${rY}deg) translateY(-6px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });

  // Trigger SVG cube animations when hero iso-groups enter view
  const isoGroups = Array.from(document.querySelectorAll('.iso-group'));
  if (isoGroups.length) {
    // Helper to add initial classes (staggered)
    function addCubeClassesOnce(){
      console.log('triggering iso-group classes');
      isoGroups.forEach((g, i) => {
        const cube = g.querySelector('.cube');
        if (!cube) return;
        // ensure previous pop is reset so CSS animation can retrigger
        cube.classList.remove('pop');
        if (i === 0) cube.classList.add('delayed-1');
        if (i === 1) cube.classList.add('delayed-2');
        if (i === 2) cube.classList.add('delayed-3');
        // continuous motion classes
        if (i === 1) cube.classList.add('bounce');
        if (i === 2) cube.classList.add('roll');
        // trigger initial pop after small stagger
        setTimeout(()=>{
          cube.classList.remove('pop');
          void cube.offsetWidth;
          cube.classList.add('pop');
        }, 80 + i * 120);
      });
    }

    // Start repeating pop pulses so boxes visibly 'pop' periodically
    function startPulseCycles(){
      isoGroups.forEach((g,i)=>{
        const cube = g.querySelector('.cube');
        if (!cube) return;
        // randomize interval so they don't all pop at once
        const intervalMs = 2400 + Math.round(Math.random() * 1400) + (i*220);
        const id = setInterval(()=>{
          cube.classList.remove('pop');
          void cube.offsetWidth;
          cube.classList.add('pop');
        }, intervalMs);
        // store id for potential cleanup
        g.dataset.pulseInterval = id;
      });
    }

    // Use IntersectionObserver to trigger when visible, but also trigger immediately as a fallback
    if ('IntersectionObserver' in window) {
      const isoObs = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            console.log('iso groups entering view — triggering animations');
            addCubeClassesOnce();
            startPulseCycles();
            obs.disconnect();
          }
        });
      }, { threshold: 0.12 });
      isoGroups.forEach(g => isoObs.observe(g));
    } else {
      // immediate fallback
      addCubeClassesOnce();
      startPulseCycles();
    }

    // extra-protection: if elements are already in view on load, trigger shortly after
    setTimeout(()=>{
      try{
        const r = isoGroups[0] && isoGroups[0].getBoundingClientRect();
        if (r && r.top < window.innerHeight) {
          addCubeClassesOnce();
          startPulseCycles();
        }
      }catch(e){}
    }, 120);
  }

  // Start a JS-driven animation loop for the SVG groups (robust across browsers)
  try {
    isoGroups.forEach((g, i) => {
      const t = g.getAttribute('transform') || 'translate(0,0)';
      g.dataset.origTransform = t;
      g.dataset.phase = (i * 0.9);
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
      // log once per second to help debugging in user browsers
      if (ts - lastLog > 1000) { console.log('animateSvg running', Math.round(ts)); lastLog = ts; }
      isoGroups.forEach((g) => {
        const phase = parseFloat(g.dataset.phase) || 0;
        const t = ts/1000;
        const [ox, oy] = parseTranslate(g.dataset.origTransform || 'translate(0,0)');
        const dx = Math.sin(t * 1.25 + phase) * 12; // horizontal sway stronger
        const dy = Math.cos(t * 0.85 + phase) * 14; // vertical bob stronger
        // apply transform via CSS style for broader browser compatibility
        try {
          g.style.transform = `translate(${ox + dx}px, ${oy + dy}px)`;
          g.style.willChange = 'transform';
        } catch(e) {
          // fallback to setting attribute if style transform fails
          g.setAttribute('transform', `translate(${ox + dx}, ${oy + dy})`);
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
