import './styles/main.css';
import { createMeetingScene } from './three/meeting-scene.js';
import Lenis from 'lenis';

// ----- Smooth scroll -----
const lenis = new Lenis({
  duration: 1.1,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
});
function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// ----- Fade-in observer -----
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

// ----- Three.js scene mounting -----
const sceneRegistry = {
  meeting: createMeetingScene,
  // mail, slides, hiring, contract, sns, system - placeholders for now
};

const sceneInstances = new Map();

const sceneObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const canvas = entry.target;
      const sceneKey = canvas.dataset.scene;
      if (!sceneKey || !sceneRegistry[sceneKey]) return;

      if (entry.isIntersecting) {
        let inst = sceneInstances.get(canvas);
        if (!inst) {
          inst = sceneRegistry[sceneKey](canvas);
          sceneInstances.set(canvas, inst);
        }
        inst.play();
      }
    });
  },
  { threshold: 0.4 },
);

document.querySelectorAll('canvas[data-scene]').forEach((canvas) => {
  sceneObserver.observe(canvas);
});

// Click to replay
document.querySelectorAll('canvas[data-scene]').forEach((canvas) => {
  canvas.style.cursor = 'pointer';
  canvas.addEventListener('click', () => {
    const inst = sceneInstances.get(canvas);
    if (inst) inst.play();
  });
});

console.log('[EFIL LP v2] initialized');
