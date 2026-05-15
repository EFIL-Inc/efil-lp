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
// Smoothly crossfades between adjacent panels using continuous progress.
// ───────────────────────────────────────────────────────────
const laptopSection = document.querySelector('#laptop-section');
const laptopCanvas = document.getElementById('laptop-canvas');

if (laptopSection && laptopCanvas) {
  const laptop = createLaptopScene(laptopCanvas);
  const textPanels = laptopSection.querySelectorAll('.laptop-text');
  const dots = laptopSection.querySelectorAll('.laptop-dot');
  const N = textPanels.length;

  // Convert text panels to inline-style controlled (override .is-active class
  // mechanism for continuous interpolation)
  textPanels.forEach((panel) => {
    panel.style.transition = 'none'; // we handle smoothness via per-frame updates
  });

  /**
   * Continuous panel update.
   * progress: 0..1 across the entire section
   * Maps to N segments. Within each segment:
   *   - First 70%: panel fully visible (settled)
   *   - Last 30%: crossfade to next panel
   */
  function updatePanels(progress) {
    const f = progress * N;             // 0..N
    const idx = Math.min(N - 1, Math.floor(f));
    const localT = f - idx;             // 0..1 within current segment
    const FADE_START = 0.70;            // when crossfade begins within segment
    let crossfadeT = 0;
    if (localT > FADE_START) {
      crossfadeT = (localT - FADE_START) / (1 - FADE_START);
    }
    // Smooth ease for crossfade
    const eased = crossfadeT * crossfadeT * (3 - 2 * crossfadeT);

    textPanels.forEach((panel, i) => {
      let opacity = 0;
      let y = 30;
      if (i === idx) {
        opacity = 1 - eased;
        y = eased * -10;            // slide up slightly as it leaves
      } else if (i === idx + 1) {
        opacity = eased;
        y = (1 - eased) * 30;       // come up from below
      }
      panel.style.opacity = String(opacity);
      panel.style.transform = `translateY(${y}px)`;
      panel.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none';
    });

    // Dominant index = which panel is currently most visible
    const dominantIdx = (idx === N - 1 || crossfadeT < 0.5) ? idx : idx + 1;
    dots.forEach((d, i) => {
      d.classList.toggle('is-active', i === dominantIdx);
    });

    // Laptop screen content — also driven by continuous progress
    laptop.setProgress(progress);
  }

  // Initial state
  updatePanels(0);

  // ── Setup: switches between desktop pin-mode and mobile autoplay-mode ──
  let scrollTriggerInstance = null;
  let mobileInterval = null;
  let mobileObserver = null;
  let mobileIdx = 0;
  let inView = false;

  function teardown() {
    if (scrollTriggerInstance) {
      scrollTriggerInstance.kill();
      scrollTriggerInstance = null;
    }
    if (mobileInterval) {
      clearInterval(mobileInterval);
      mobileInterval = null;
    }
    if (mobileObserver) {
      mobileObserver.disconnect();
      mobileObserver = null;
    }
  }

  function setupDesktop() {
    teardown();
    scrollTriggerInstance = ScrollTrigger.create({
      trigger: laptopSection,
      start: 'top top',
      // Reduced pin distance: 0.7 viewport per card transition (was 1.0)
      end: () => `+=${(N - 1) * window.innerHeight * 0.7}`,
      pin: true,
      pinSpacing: true,
      // pinType:'transform' avoids fixed-position jolt with Lenis smooth scroll
      pinType: 'transform',
      scrub: 0.4,                  // snappier (was 1)
      anticipatePin: 1,
      invalidateOnRefresh: true,
      fastScrollEnd: true,
      onUpdate: (self) => {
        updatePanels(self.progress);
      },
    });
  }

  function setupMobile() {
    teardown();
    // Tap-to-switch: dots become interactive
    dots.forEach((d, i) => {
      d.style.cursor = 'pointer';
      d.style.pointerEvents = 'auto';
      // Replace any existing handler — clone to drop listeners
      const newDot = d.cloneNode(true);
      d.parentNode.replaceChild(newDot, d);
    });
    // Re-query dots after replacement
    const freshDots = laptopSection.querySelectorAll('.laptop-dot');
    freshDots.forEach((d, i) => {
      d.addEventListener('click', () => {
        mobileIdx = i;
        // Snap to centered position within segment i (no transition)
        const targetProgress = (i + 0.35) / N;
        updatePanels(targetProgress);
      });
    });

    // Auto-advance only when section is in view
    if (!prefersReducedMotion) {
      mobileObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            inView = entry.isIntersecting;
          });
        },
        { threshold: 0.25 },
      );
      mobileObserver.observe(laptopSection);
      mobileInterval = setInterval(() => {
        if (!inView) return;
        mobileIdx = (mobileIdx + 1) % N;
        const targetProgress = (mobileIdx + 0.35) / N;
        updatePanels(targetProgress);
      }, 4500);
    }
  }

  function activateMode() {
    if (!prefersReducedMotion && lgQuery.matches) {
      setupDesktop();
    } else {
      setupMobile();
    }
  }

  activateMode();

  // React to viewport resizes that cross the lg breakpoint
  if (typeof lgQuery.addEventListener === 'function') {
    lgQuery.addEventListener('change', () => activateMode());
  } else if (typeof lgQuery.addListener === 'function') {
    lgQuery.addListener(() => activateMode());
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
