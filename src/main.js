import './styles/main.css';
import { InternetGlobeScene } from './scenes/InternetGlobeScene.js';
import { NetworkTooltip } from './components/NetworkTooltip.js';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('internet-globe-canvas');
  const statusEl = document.getElementById('scene-status-label');
  const tooltip = new NetworkTooltip();

  let globeScene = null;
  if (canvas) {
    globeScene = new InternetGlobeScene(
      canvas,
      (nodeData, x, y) => {
        tooltip.show(nodeData, x, y);
      },
      (state, statusLabel) => {
        if (statusEl) {
          statusEl.textContent = statusLabel;
        }
      }
    );
  }

  // Header scroll state and scroll progress
  const header = document.getElementById('site-header');
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (header) {
      if (scrollY > 40) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }

    if (globeScene) {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? scrollY / maxScroll : 0;
      globeScene.setScrollProgress(progress);
    }
  }, { passive: true });

  // Master Render Loop
  const animate = () => {
    requestAnimationFrame(animate);
    if (globeScene) {
      globeScene.update();
    }
  };
  animate();

  // Window Resizing
  window.addEventListener('resize', () => {
    if (globeScene) {
      globeScene.onResize();
    }
  });
});
