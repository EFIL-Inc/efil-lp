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

// ── Scroll-driven flip animation for use case cards ──
// Rotation is bound directly to scroll position via ScrollTrigger scrub.
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  document.querySelectorAll('.flip-card').forEach((card) => {
    const isRight = card.classList.contains('flip-right');
    const isTop   = card.classList.contains('flip-top');

    const initial = {
      opacity: 0,
      transformPerspective: 1600,
      transformOrigin: isTop
        ? 'top center'
        : (isRight ? 'right center' : 'left center'),
    };
    if (isTop) {
      initial.rotateX = -55;
    } else {
      initial.rotateY = isRight ? 65 : -65;
    }
    gsap.set(card, initial);

    gsap.to(card, {
      opacity: 1,
      rotateX: 0,
      rotateY: 0,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: card,
        start: 'top 92%',  // begin when card top reaches 92% of viewport height
        end:   'top 45%',  // complete when card top reaches 45%
        scrub: 1,           // smooth scrub with 1s catch-up
      },
    });
  });
} else {
  // Reduced motion: just show all cards
  document.querySelectorAll('.flip-card').forEach((card) => {
    gsap.set(card, { opacity: 1, rotateX: 0, rotateY: 0 });
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
