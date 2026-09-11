/**
 * ProjectCardDeck.js
 * AuthKit-style 3D Frosted Glass Card Deck Carousel
 * Manages 3 front-visible cards (left, center, right) + background stack with smooth 3D transitions.
 */

export class ProjectCardDeck {
  constructor(containerSelector = '#project-card-deck') {
    this.container = document.querySelector(containerSelector);
    if (!this.container) return;

    this.cards = Array.from(this.container.querySelectorAll('.project-glass-card'));
    if (this.cards.length === 0) return;

    this.prevBtn = document.querySelector('#deck-prev-btn');
    this.nextBtn = document.querySelector('#deck-next-btn');
    this.counterEl = document.querySelector('#deck-counter');
    this.dotsContainer = document.querySelector('#deck-dots');

    this.currentIndex = 0;
    this.totalCards = this.cards.length;
    this.isTransitioning = false;

    this.init();
  }

  init() {
    this.buildDots();
    this.bindEvents();
    this.updateCardPositions();
  }

  buildDots() {
    if (!this.dotsContainer) return;
    this.dotsContainer.innerHTML = '';
    this.cards.forEach((_, idx) => {
      const dot = document.createElement('button');
      dot.className = `deck-dot ${idx === 0 ? 'active' : ''}`;
      dot.setAttribute('aria-label', `Navigate to project ${idx + 1}`);
      dot.addEventListener('click', () => {
        this.goToIndex(idx);
      });
      this.dotsContainer.appendChild(dot);
    });
  }

  bindEvents() {
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.prev());
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.next());
    }

    // Direct click on left or right cards
    this.cards.forEach((card, idx) => {
      card.addEventListener('click', (e) => {
        // If clicking a link inside the center card, let it navigate
        if (e.target.closest('a') && idx === this.currentIndex) {
          return;
        }

        if (card.classList.contains('is-left')) {
          e.preventDefault();
          this.prev();
        } else if (card.classList.contains('is-right')) {
          e.preventDefault();
          this.next();
        }
      });
    });

    // Keyboard navigation when work section is in view
    window.addEventListener('keydown', (e) => {
      const section = document.getElementById('work');
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const inView = rect.top < window.innerHeight * 0.7 && rect.bottom > window.innerHeight * 0.3;

      if (inView) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.prev();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.next();
        }
      }
    });

    // Touch swipe and Mouse Drag support (Slide in both directions with high sensitivity)
    let startX = 0;
    let startY = 0;
    let isDragging = false;
    let dragTriggered = false;
    const DRAG_THRESHOLD = 16; // Highly sensitive: 16px movement triggers slide (was 45px)
    const viewport = this.container.closest('.project-deck-viewport') || this.container;

    const onPointerDown = (clientX, clientY) => {
      isDragging = true;
      dragTriggered = false;
      startX = clientX;
      startY = clientY || 0;
      viewport.classList.add('is-dragging');
    };

    const onPointerMove = (clientX, clientY) => {
      if (!isDragging || dragTriggered) return;
      const diffX = clientX - startX;
      const diffY = clientY ? Math.abs(clientY - startY) : 0;

      // When horizontal movement dominates and passes sensitive threshold
      if (Math.abs(diffX) > diffY) {
        if (diffX < -DRAG_THRESHOLD) {
          dragTriggered = true;
          this.next(); // Slide next
        } else if (diffX > DRAG_THRESHOLD) {
          dragTriggered = true;
          this.prev(); // Slide prev
        }
      }
    };

    const onPointerUp = (clientX) => {
      if (!isDragging) return;
      isDragging = false;
      viewport.classList.remove('is-dragging');

      if (!dragTriggered && typeof clientX === 'number') {
        const diff = clientX - startX;
        if (diff < -DRAG_THRESHOLD) {
          this.next();
        } else if (diff > DRAG_THRESHOLD) {
          this.prev();
        }
      }
      dragTriggered = false;
    };

    // Mouse drag
    viewport.addEventListener('mousedown', (e) => {
      if (e.target.closest('a') || e.target.closest('button')) return;
      onPointerDown(e.clientX, e.clientY);
    });

    window.addEventListener('mousemove', (e) => {
      if (isDragging) {
        onPointerMove(e.clientX, e.clientY);
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (isDragging) {
        onPointerUp(e.clientX);
      }
    });

    // Touch swipe
    viewport.addEventListener('touchstart', (e) => {
      const touch = e.changedTouches[0];
      if (touch) {
        onPointerDown(touch.clientX, touch.clientY);
      }
    }, { passive: true });

    viewport.addEventListener('touchmove', (e) => {
      if (isDragging) {
        const touch = e.changedTouches[0];
        if (touch) {
          onPointerMove(touch.clientX, touch.clientY);
        }
      }
    }, { passive: true });

    viewport.addEventListener('touchend', (e) => {
      const touch = e.changedTouches[0];
      onPointerUp(touch ? touch.clientX : null);
    }, { passive: true });

    // Trackpad / horizontal wheel swipe
    let wheelCooldown = false;
    viewport.addEventListener('wheel', (e) => {
      const deltaX = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : (e.shiftKey ? e.deltaY : 0);
      if (Math.abs(deltaX) > 18) {
        if (!wheelCooldown) {
          wheelCooldown = true;
          if (deltaX > 0) this.next();
          else this.prev();
          setTimeout(() => { wheelCooldown = false; }, 360);
        }
      }
    }, { passive: true });
  }

  prev() {
    this.goToIndex((this.currentIndex - 1 + this.totalCards) % this.totalCards);
  }

  next() {
    this.goToIndex((this.currentIndex + 1) % this.totalCards);
  }

  goToIndex(index) {
    if (index === this.currentIndex || this.isTransitioning) return;
    this.isTransitioning = true;
    this.currentIndex = index;
    this.updateCardPositions();
    setTimeout(() => {
      this.isTransitioning = false;
    }, 320);
  }

  updateCardPositions() {
    const total = this.totalCards;
    const cur = this.currentIndex;

    const leftIndex = (cur - 1 + total) % total;
    const rightIndex = (cur + 1) % total;

    this.cards.forEach((card, idx) => {
      card.classList.remove('is-left', 'is-center', 'is-right', 'is-hidden');

      if (idx === cur) {
        card.classList.add('is-center');
        card.setAttribute('aria-hidden', 'false');
        card.setAttribute('tabindex', '0');
      } else if (idx === leftIndex) {
        card.classList.add('is-left');
        card.setAttribute('aria-hidden', 'false');
        card.setAttribute('tabindex', '-1');
      } else if (idx === rightIndex) {
        card.classList.add('is-right');
        card.setAttribute('aria-hidden', 'false');
        card.setAttribute('tabindex', '-1');
      } else {
        card.classList.add('is-hidden');
        card.setAttribute('aria-hidden', 'true');
        card.setAttribute('tabindex', '-1');
      }
    });

    // Update pagination counter e.g. "01 / 04"
    if (this.counterEl) {
      const currentFormatted = String(cur + 1).padStart(2, '0');
      const totalFormatted = String(total).padStart(2, '0');
      this.counterEl.innerHTML = `<span class="counter-cur">${currentFormatted}</span><span class="counter-sep">/</span><span class="counter-total">${totalFormatted}</span>`;
    }

    // Update dots
    if (this.dotsContainer) {
      const dots = this.dotsContainer.querySelectorAll('.deck-dot');
      dots.forEach((dot, idx) => {
        if (idx === cur) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
    }
  }
}
