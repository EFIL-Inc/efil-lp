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

  if (!prefersReducedMotion) {
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
        // Each segment is 1/N of progress
        const idx = Math.min(N - 1, Math.floor(p * N));

        // Update laptop screen content
        laptop.setProgress(p);

        // Update active text panel
        textPanels.forEach((panel, i) => {
          panel.classList.toggle('is-active', i === idx);
        });
        // Update progress dots
        dots.forEach((d, i) => {
          d.classList.toggle('is-active', i === idx);
        });
      },
    });
  }
}

// Hero: always-on background scene
const heroCanvas = document.querySelector('canvas[data-scene="hero"]');
if (heroCanvas) createHeroScene(heroCanvas);

console.log('[EFIL LP v2] initialized');
