import './styles/main.css';
import { CosmicBackgroundScene } from './scenes/CosmicBackgroundScene.js';
import { InternetGlobeScene } from './scenes/InternetGlobeScene.js';
import { MovableNeuralGlobeScene } from './scenes/MovableNeuralGlobeScene.js';
import { ChronoParticleMorphScene } from './scenes/ChronoParticleMorphScene.js';
import { NetworkTooltip } from './components/NetworkTooltip.js';
import { ProjectCardDeck } from './components/ProjectCardDeck.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize AuthKit-style 3D Project Card Deck
  const projectDeck = new ProjectCardDeck('#project-card-deck');

  const cosmicCanvas = document.getElementById('global-cosmic-bg');
  let cosmicScene = null;
  if (cosmicCanvas) {
    cosmicScene = new CosmicBackgroundScene(cosmicCanvas);
  }

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

    if (statusEl) {
      statusEl.style.cursor = 'pointer';
      statusEl.title = 'Click to replay cosmic sequence';
      statusEl.addEventListener('click', () => {
        globeScene.replay();
      });
    }
  }

  // Initialize Interactive 3D Movable Neural Globe for Section 03 (About)
  const neuralCanvas = document.getElementById('neural-globe-canvas');
  let neuralScene = null;
  if (neuralCanvas) {
    neuralScene = new MovableNeuralGlobeScene(neuralCanvas);
  }

  // Initialize Dala-Inspired 3D Real-Time Precision Clock for Skills Section
  const chronoCanvas = document.getElementById('chrono-particles-canvas');
  const liveClockEl = document.getElementById('chrono-live-clock');

  let chronoScene = null;
  if (chronoCanvas) {
    chronoScene = new ChronoParticleMorphScene(chronoCanvas);
  }

  // Helper function to update live HUD clock readout
  const updateLiveClock = () => {
    if (!liveClockEl) return;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    liveClockEl.textContent = `${hh}:${mm}:${ss}`;
  };

  // Header scroll state and global scroll progress
  const header = document.getElementById('site-header');
  const handleScroll = () => {
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
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  // Initial call to sync states
  handleScroll();

  // Master Render Loop
  const animate = () => {
    requestAnimationFrame(animate);
    if (cosmicScene) {
      cosmicScene.update();
    }
    if (globeScene) {
      globeScene.update();
    }
    if (neuralScene) {
      neuralScene.update();
    }
    if (chronoScene) {
      chronoScene.update();
      updateLiveClock();
    }
  };
  animate();

  // Window Resizing
  window.addEventListener('resize', () => {
    if (cosmicScene) {
      cosmicScene.onResize();
    }
    if (globeScene) {
      globeScene.onResize();
    }
    if (neuralScene) {
      neuralScene.onResize();
    }
    if (chronoScene) {
      chronoScene.onResize();
    }
  });
});



