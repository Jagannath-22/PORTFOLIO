import './styles/main.css';
import { CosmicBackgroundScene } from './scenes/CosmicBackgroundScene.js';
import { InternetGlobeScene } from './scenes/InternetGlobeScene.js';
import { MovableNeuralGlobeScene } from './scenes/MovableNeuralGlobeScene.js';
import { ChronoParticleMorphScene } from './scenes/ChronoParticleMorphScene.js';
import { ContactCosmicScene } from './scenes/ContactCosmicScene.js';
import { ResearchCosmicScene } from './scenes/ResearchCosmicScene.js';
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

  // Initialize 3D Cosmic Wave & Transparent Floating Prisms for Section 04 (Contact)
  const contactCanvas = document.getElementById('contact-cosmic-canvas');
  const contactSection = document.getElementById('contact');
  let contactScene = null;
  if (contactCanvas) {
    contactScene = new ContactCosmicScene(contactCanvas, contactSection);
  }

  // Initialize 3D Cosmic Telemetry Bodies & Fly-Through for Section 03 (Research)
  const researchCanvas = document.getElementById('research-cosmic-canvas');
  const researchSection = document.getElementById('research');
  let researchScene = null;
  if (researchCanvas) {
    researchScene = new ResearchCosmicScene(researchCanvas, researchSection);
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

    if (researchScene) {
      researchScene.updateScroll();
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  // Initial call to sync states
  handleScroll();

  // Interactive Nav Indicator with Smooth Sliding Transition Across Sections
  const initNavbarScrollIndicator = () => {
    const navLinks = document.getElementById('site-nav-links');
    const navIndicator = document.getElementById('nav-indicator');
    if (!navLinks || !navIndicator) return;

    const navItems = Array.from(navLinks.querySelectorAll('.nav-item'));
    const sectionData = navItems.map(item => {
      const href = item.getAttribute('href') || '';
      const id = href.replace('#', '');
      const el = document.getElementById(id);
      return { id, el, item };
    }).filter(s => s.el !== null);

    let activeItem = null;

    const setIndicator = (item) => {
      if (!item) {
        navIndicator.style.opacity = '0';
        return;
      }
      const left = item.offsetLeft;
      const width = item.offsetWidth;
      navIndicator.style.transform = `translateX(${left}px)`;
      navIndicator.style.width = `${width}px`;
      navIndicator.style.opacity = '1';
    };

    const updateActiveSection = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      // When reaching near the bottom of page, highlight the last section (Contact)
      const atBottom = (windowHeight + scrollY) >= (docHeight - 60);

      let current = null;
      if (atBottom && sectionData.length > 0) {
        current = sectionData[sectionData.length - 1];
      } else {
        // Section is active when its top is within the upper 40% of viewport
        const activationThreshold = windowHeight * 0.40;
        for (let i = sectionData.length - 1; i >= 0; i--) {
          const s = sectionData[i];
          const rect = s.el.getBoundingClientRect();
          if (rect.top <= activationThreshold && rect.bottom > 80) {
            current = s;
            break;
          }
        }
      }

      const nextItem = current ? current.item : null;
      if (nextItem !== activeItem) {
        if (activeItem) activeItem.classList.remove('active');
        if (nextItem) nextItem.classList.add('active');
        activeItem = nextItem;
        setIndicator(activeItem);
      } else if (activeItem) {
        // Keep synced on layout or zoom shifts
        setIndicator(activeItem);
      }
    };

    // Smooth scroll on click and immediate line slide
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const href = item.getAttribute('href') || '';
        if (href.startsWith('#')) {
          const id = href.replace('#', '');
          const target = document.getElementById(id);
          if (target) {
            e.preventDefault();
            if (activeItem) activeItem.classList.remove('active');
            item.classList.add('active');
            activeItem = item;
            setIndicator(activeItem);
            target.scrollIntoView({ behavior: 'smooth' });
            history.pushState(null, null, `#${id}`);
          }
        }
      });
    });

    const brandLink = document.querySelector('.nav-brand');
    if (brandLink) {
      brandLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        history.pushState(null, null, ' ');
        if (activeItem) activeItem.classList.remove('active');
        activeItem = null;
        setIndicator(null);
      });
    }

    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', () => {
      if (activeItem) setIndicator(activeItem);
    });

    // Initial positioning
    updateActiveSection();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        updateActiveSection();
      });
    }
  };

  initNavbarScrollIndicator();

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
    if (researchScene) {
      researchScene.update();
    }
    if (contactScene) {
      contactScene.update();
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
    if (researchScene) {
      researchScene.onResize();
    }
    if (contactScene) {
      contactScene.onResize();
    }
  });
});



