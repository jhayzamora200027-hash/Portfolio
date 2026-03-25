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
