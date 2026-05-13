import './styles/main.css';
import { createLaptopScene } from './three/laptop-scene.js';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Smooth scroll (Lenis) — wired into GSAP ScrollTrigger
const lenis = new Lenis({
  duration: 1.1,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
});
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);

// Fade-in observer
const fadeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 },
);
document.querySelectorAll('.fade-in').forEach((el) => fadeObserver.observe(el));

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const lgQuery = window.matchMedia('(min-width: 1024px)');

// ───────────────────────────────────────────────────────────
// Hero: typography-only — no 3D scene, no ScrollTrigger pin
// ───────────────────────────────────────────────────────────

// ───────────────────────────────────────────────────────────
// Laptop section: pin + scroll-driven screen swap + text crossfade
// ───────────────────────────────────────────────────────────
const laptopSection = document.querySelector('#laptop-section');
const laptopCanvas = document.getElementById('laptop-canvas');

if (laptopSection && laptopCanvas) {
  const laptop = createLaptopScene(laptopCanvas);
  const textPanels = laptopSection.querySelectorAll('.laptop-text');
  const dots = laptopSection.querySelectorAll('.laptop-dot');
  const N = textPanels.length;

  // Initial active panel
  if (textPanels[0]) textPanels[0].classList.add('is-active');
  if (dots[0]) dots[0].classList.add('is-active');

  function setActive(idx) {
    laptop.setProgress(idx / N);
    textPanels.forEach((panel, i) => {
      panel.classList.toggle('is-active', i === idx);
    });
    dots.forEach((d, i) => {
      d.classList.toggle('is-active', i === idx);
    });
  }

  if (!prefersReducedMotion && lgQuery.matches) {
    ScrollTrigger.create({
      trigger: laptopSection,
      start: 'top top',
      end: () => `+=${(N - 1) * window.innerHeight}`,
      pin: true,
      pinSpacing: true,
      scrub: 1,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const p = self.progress;
        const idx = Math.min(N - 1, Math.floor(p * N));
        laptop.setProgress(p);
        textPanels.forEach((panel, i) => {
          panel.classList.toggle('is-active', i === idx);
        });
        dots.forEach((d, i) => {
          d.classList.toggle('is-active', i === idx);
        });
      },
    });
  } else {
    // Mobile / reduced-motion: cycle through use cases on dot tap
    let mobileIdx = 0;
    const cycle = () => {
      mobileIdx = (mobileIdx + 1) % N;
      setActive(mobileIdx);
    };
    dots.forEach((d, i) => {
      d.style.cursor = 'pointer';
      d.style.pointerEvents = 'auto';
      d.addEventListener('click', () => setActive(i));
    });
    if (!prefersReducedMotion) {
      // Auto-advance every 4s on mobile
      setInterval(cycle, 4000);
    }
  }
}

// ───────────────────────────────────────────────────────────
// FAQ accordion
// ───────────────────────────────────────────────────────────
document.querySelectorAll('.faq-question-light').forEach((btn) => {
  btn.addEventListener('click', () => {
    const wrap = btn.nextElementSibling;
    const icon = btn.querySelector('.faq-icon');
    const isOpen = wrap.classList.contains('is-open');
    if (isOpen) {
      wrap.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      if (icon) { icon.textContent = '+'; icon.style.transform = 'rotate(0deg)'; }
    } else {
      wrap.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      if (icon) { icon.textContent = '−'; icon.style.transform = 'rotate(180deg)'; }
    }
  });
});

// ───────────────────────────────────────────────────────────
// Contact form: validation + FormSubmit AJAX
// ───────────────────────────────────────────────────────────
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  const successBox = document.getElementById('form-success');
  const submitBtn = contactForm.querySelector('button[type="submit"]');

  // Set min date for all date fields to tomorrow
  (() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const min = tomorrow.toISOString().split('T')[0];
    ['date1', 'date2', 'date3'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.min = min;
    });
  })();

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    let valid = true;

    const fields = [
      { id: 'name',    test: (v) => v.trim().length > 0 },
      { id: 'company', test: (v) => v.trim().length > 0 },
      { id: 'email',   test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) },
    ];
    fields.forEach(({ id, test }) => {
      const input = document.getElementById(id);
      if (!input) return;
      const err = input.parentElement.querySelector('.error-msg');
      if (!test(input.value)) {
        if (err) err.classList.remove('hidden');
        input.classList.add('border-gold-500');
        input.setAttribute('aria-invalid', 'true');
        valid = false;
      } else {
        if (err) err.classList.add('hidden');
        input.classList.remove('border-gold-500');
        input.removeAttribute('aria-invalid');
      }
    });

    // Date+time pairing: if one of pair filled, both required
    [1, 2, 3].forEach((n) => {
      const dateEl = document.getElementById('date' + n);
      const timeEl = document.getElementById('time' + n);
      if (!dateEl || !timeEl) return;
      const oneFilled = (dateEl.value && !timeEl.value) || (!dateEl.value && timeEl.value);
      if (oneFilled) {
        if (!dateEl.value) dateEl.classList.add('border-gold-500');
        if (!timeEl.value) timeEl.classList.add('border-gold-500');
        valid = false;
      } else {
        dateEl.classList.remove('border-gold-500');
        timeEl.classList.remove('border-gold-500');
      }
    });

    if (!valid) {
      if (successBox) successBox.classList.add('hidden');
      return;
    }

    // Submit via FormSubmit AJAX endpoint
    submitBtn.disabled = true;
    const originalBtnHTML = submitBtn.innerHTML;
    submitBtn.textContent = '送信中...';

    try {
      const formData = new FormData(contactForm);
      const res = await fetch(contactForm.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        if (successBox) {
          successBox.classList.remove('hidden');
          successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        contactForm.reset();
      } else {
        throw new Error('Submit failed');
      }
    } catch (err) {
      alert('送信に失敗しました。お手数ですが、しばらく経ってから再度お試しください。');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHTML;
    }
  });
}

// Make sure ScrollTrigger picks up final layout + initial scroll position
window.addEventListener('load', () => {
  ScrollTrigger.refresh();
});

console.log('[EFIL LP v2] initialized');
