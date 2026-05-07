import './styles/main.css';
import { createHeroScene } from './three/hero-scene.js';
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

// ── Laptop section: pin + scroll-driven screen swap + text crossfade ──
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

  // Pinned scroll-driven flow only on lg+ (desktop). Smaller viewports show
  // a tap-to-cycle compact layout instead.
  const lgQuery = window.matchMedia('(min-width: 1024px)');

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

// Hero: always-on background scene
const heroCanvas = document.querySelector('canvas[data-scene="hero"]');
if (heroCanvas) createHeroScene(heroCanvas);

console.log('[EFIL LP v2] initialized');
