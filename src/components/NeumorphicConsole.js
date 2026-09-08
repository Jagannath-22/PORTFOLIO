import { sounds } from './SoundManager.js';

export class NeumorphicConsole {
  constructor(container) {
    this.container = container;
    this.timeRemaining = 847; // 14m 07s
    this.timerInterval = null;
    this.isSwapped = false;

    this.render();
    this.initTimer();
    this.initEventListeners();
  }

  render() {
    this.container.innerHTML = `
      <div id="neu-interactive-wrapper" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 32px; align-items: center; position: relative;">
        
        <!-- Left / Swappable Component A: Sand-to-Binary Hourglass & Hologram Operator -->
        <div id="hacker-avatar-card" class="neu-panel" style="padding: 28px; text-align: center; cursor: grab; user-select: none;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div class="tech-badge">[INCIDENT RESPONSE]</div>
            <div class="font-mono" style="font-size: 0.75rem; color: var(--accent-gold-light);">[DRAGGABLE ⇄ SWAP]</div>
          </div>
          
          <!-- Hourglass Canvas -->
          <div style="display: flex; justify-content: center; margin: 12px 0;">
            <canvas id="hourglass-canvas" width="280" height="340" style="max-width: 100%; border-radius: 12px;"></canvas>
          </div>

          <div class="font-mono" style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 12px;">
            SAND-TO-BINARY CONVERSION STREAM: <span style="color: var(--accent-cyan);">ACTIVE</span>
          </div>
        </div>

        <!-- Right / Swappable Component B: Tactile Incident Response Neumorphic Controls -->
        <div id="neu-controls-card" class="neu-panel" style="padding: 36px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
            <div>
              <div class="gold-badge" style="margin-bottom: 6px;">[SYS_SEC // DEFENSE CLOCK]</div>
              <h3 class="font-serif" style="font-size: 1.6rem; color: #ffffff;">TIME-TO-MITIGATION</h3>
            </div>
            <div class="neu-dial" id="interactive-dial">
              <div class="font-mono" id="dial-display" style="font-size: 1.1rem; font-weight: 700; color: var(--accent-cyan);">14:07</div>
            </div>
          </div>

          <div class="neu-inset" style="padding: 20px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span class="font-mono" style="font-size: 0.8rem; color: var(--text-secondary);">ZERO-TRUST ISOLATION</span>
              <span class="font-mono" style="font-size: 0.8rem; color: var(--accent-green);">99.4%</span>
            </div>
            <input type="range" class="defense-slider" min="50" max="100" value="99" style="width: 100%; accent-color: var(--accent-green); cursor: pointer;">

            <div style="display: flex; justify-content: space-between; margin-top: 16px; margin-bottom: 8px;">
              <span class="font-mono" style="font-size: 0.8rem; color: var(--text-secondary);">MEMORY CORRUPTION GUARD</span>
              <span class="font-mono" style="font-size: 0.8rem; color: var(--accent-cyan);">ARMED</span>
            </div>
            <input type="range" class="defense-slider" min="0" max="100" value="85" style="width: 100%; accent-color: var(--accent-cyan); cursor: pointer;">
          </div>

          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <button class="neu-btn" id="btn-isolate" style="flex: 1; justify-content: center;">
              ⚡ ISOLATE THREAT
            </button>
            <button class="neu-btn" id="btn-swap-layout" style="flex: 1; justify-content: center; border-color: rgba(212, 165, 116, 0.3); color: var(--accent-gold-light);">
              ⇄ SWAP POSITIONS
            </button>
          </div>
        </div>

      </div>
    `;
  }

  initTimer() {
    this.timerInterval = setInterval(() => {
      if (this.timeRemaining > 0) {
        this.timeRemaining--;
        const mins = Math.floor(this.timeRemaining / 60).toString().padStart(2, '0');
        const secs = (this.timeRemaining % 60).toString().padStart(2, '0');
        const display = document.getElementById('dial-display');
        if (display) display.textContent = `${mins}:${secs}`;
      }
    }, 1000);
  }

  initEventListeners() {
    const swapBtn = document.getElementById('btn-swap-layout');
    const isolateBtn = document.getElementById('btn-isolate');
    const wrapper = document.getElementById('neu-interactive-wrapper');
    const hackerCard = document.getElementById('hacker-avatar-card');
    const controlsCard = document.getElementById('neu-controls-card');

    const handleSwap = () => {
      sounds.playClick();
      this.isSwapped = !this.isSwapped;
      if (this.isSwapped) {
        hackerCard.style.order = '2';
        controlsCard.style.order = '1';
      } else {
        hackerCard.style.order = '1';
        controlsCard.style.order = '2';
      }
    };

    if (swapBtn) swapBtn.addEventListener('click', handleSwap);

    // Draggable / Grab Interaction
    let startX = 0;
    if (hackerCard) {
      hackerCard.addEventListener('mousedown', (e) => {
        startX = e.clientX;
        hackerCard.style.cursor = 'grabbing';
      });

      window.addEventListener('mouseup', (e) => {
        if (hackerCard.style.cursor === 'grabbing') {
          hackerCard.style.cursor = 'grab';
          if (Math.abs(e.clientX - startX) > 80) {
            handleSwap();
          }
        }
      });
    }

    if (isolateBtn) {
      isolateBtn.addEventListener('click', () => {
        sounds.playScan();
        isolateBtn.textContent = '✓ THREAT CONTAINED';
        isolateBtn.style.color = 'var(--accent-green)';
        setTimeout(() => {
          isolateBtn.textContent = '⚡ ISOLATE THREAT';
          isolateBtn.style.color = 'var(--text-primary)';
        }, 2000);
      });
    }

    // Dial rotation click interaction
    const dial = document.getElementById('interactive-dial');
    if (dial) {
      dial.addEventListener('click', () => {
        sounds.playClick();
        this.timeRemaining += 60; // Add 1 minute
      });
    }
  }
}
