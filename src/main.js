import './styles/main.css';
import { createMeetingScene } from './three/meeting-scene.js';
import { createHeroScene } from './three/hero-scene.js';
import Lenis from 'lenis';

// Smooth scroll
const lenis = new Lenis({
  duration: 1.1,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
});
function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

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
