import './styles/main.css';
import { createMeetingScene } from './three/meeting-scene.js';
import { createHeroScene } from './three/hero-scene.js';
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

// ── Stacked card deck animation (scroll-pinned, page-flip reveal) ──
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const stackSection = document.querySelector('#usecases-stack');

if (stackSection && !prefersReducedMotion) {
  const cards = stackSection.querySelectorAll('.stack-card');
  const N = cards.length;

  // Initial state: stack with z-index, top card visible, rest underneath
  cards.forEach((card, i) => {
    gsap.set(card, {
      zIndex: N - i,
      transformOrigin: 'top center',
      transformPerspective: 2400,
      rotateX: 0,
      opacity: 1,
    });
  });

  // Master timeline pinned to section
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: stackSection,
      start: 'top top',
      end: () => `+=${(N - 1) * window.innerHeight}`,
      pin: true,
      pinSpacing: true,
      scrub: 1,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        // Update progress indicator (which card is currently in view)
        const idx = Math.min(N - 1, Math.floor(self.progress * (N - 1)) + (self.progress > 0 ? 1 : 0));
        const indicator = document.getElementById('stack-progress-current');
        if (indicator) {
          indicator.textContent = String(idx + (self.progress > 0 ? 0 : 1)).padStart(2, '0');
        }
      },
    },
  });

  // For each card except the last, animate it flipping AWAY (revealing the one below)
  cards.forEach((card, i) => {
    if (i === N - 1) return;
    tl.to(card, {
      rotateX: -85,
      opacity: 0,
      ease: 'power1.in',
    }, i);
  });
}

// Hero: always-on background scene
const heroCanvas = document.querySelector('canvas[data-scene="hero"]');
if (heroCanvas) createHeroScene(heroCanvas);

// Use case scenes (lazy mount, replay on intersect)
const sceneRegistry = {
  meeting: createMeetingScene,
};
const sceneInstances = new Map();

const sceneObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const canvas = entry.target;
      const sceneKey = canvas.dataset.scene;
      if (!sceneKey || sceneKey === 'hero' || !sceneRegistry[sceneKey]) return;

      if (entry.isIntersecting) {
        let inst = sceneInstances.get(canvas);
        if (!inst) {
          inst = sceneRegistry[sceneKey](canvas);
          sceneInstances.set(canvas, inst);
        }
        inst.play && inst.play();
      }
    });
  },
  { threshold: 0.3 },
);

document.querySelectorAll('canvas[data-scene]').forEach((canvas) => {
  if (canvas.dataset.scene !== 'hero') sceneObserver.observe(canvas);
  canvas.style.cursor = 'pointer';
  canvas.addEventListener('click', () => {
    const inst = sceneInstances.get(canvas);
    if (inst && inst.play) inst.play();
  });
});

console.log('[EFIL LP v2] initialized');
