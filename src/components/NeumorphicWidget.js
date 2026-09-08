import { sounds } from './SoundManager.js';

export class NeumorphicWidget {
  constructor(container) {
    this.container = container;
    this.isPlaying = true;
    this.render();
    this.initClockHands();
    this.initEventListeners();
  }

  render() {
    this.container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 40px; align-items: center;">
        
        <!-- Left Component: Exact Dark Neumorphic Widget Card (Image 3 Reference) -->
        <div class="neu-widget-card" style="max-width: 440px; margin: 0 auto; width: 100%;">
          
          <!-- Top Row: Date, Time, Status Pill & Audio Icons -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
            <div>
              <div class="font-sans" id="neu-widget-date" style="font-size: 1.4rem; font-weight: 700; color: #ffffff; line-height: 1.1;">09/08</div>
              <div class="font-mono" id="neu-widget-time" style="font-size: 1.1rem; color: var(--accent-cyan); font-weight: 600;">06:42 PM</div>
            </div>

            <!-- Inset Header Pill -->
            <div class="neu-pill-inset" style="padding: 6px 16px; display: flex; align-items: center; gap: 10px;">
              <span class="font-mono" style="font-size: 0.75rem; color: var(--text-secondary);">INCIDENT //</span>
              <span class="font-mono" style="font-size: 0.8rem; font-weight: 700; color: var(--accent-gold-light);">T.029 SEC</span>
            </div>

            <!-- Header Quick Icons -->
            <div style="display: flex; gap: 8px;">
              <div class="neu-icon-btn" title="Audio Telemetry">🎧</div>
              <div class="neu-icon-btn" title="Waveform Matrix">☵</div>
            </div>
          </div>

          <!-- Middle Row: Left Inset Analog Clock & Right Media/Incident Card -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: center; margin-bottom: 24px;">
            
            <!-- Inset Neumorphic Analog Clock (Image 3) -->
            <div class="neu-clock-inset">
              <div class="neu-clock-face">
                <div class="neu-clock-center"></div>
                <div class="neu-clock-hand hour-hand" id="analog-hour"></div>
                <div class="neu-clock-hand minute-hand" id="analog-minute"></div>
                <div class="neu-clock-hand second-hand" id="analog-second"></div>
                <!-- Hour Ticks -->
                <div class="clock-tick tick-12"></div>
                <div class="clock-tick tick-3"></div>
                <div class="clock-tick tick-6"></div>
                <div class="clock-tick tick-9"></div>
              </div>
            </div>

            <!-- Right Media / Incident Box (Image 3) -->
            <div class="neu-tile-card" style="padding: 16px; text-align: center;">
              <!-- Radar / Waveform Display -->
              <div style="width: 100%; height: 90px; background: #03060f; border-radius: 12px; overflow: hidden; position: relative; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(0, 245, 255, 0.15);">
                <div class="radar-scan-line"></div>
                <div class="font-mono" style="font-size: 0.7rem; color: var(--accent-cyan); z-index: 2;">
                  [MONITOR // 0x42]
                </div>
              </div>

              <div class="font-mono" style="font-size: 0.72rem; color: var(--text-muted); margin-top: 8px;">
                Track 039 / Zero_Trust
              </div>

              <!-- Mini Play/Pause Pill -->
              <div style="display: flex; justify-content: center; margin-top: 10px;">
                <button id="neu-play-toggle" class="neu-pill-btn" style="padding: 4px 16px; font-size: 0.75rem;">
                  <span id="play-icon">❚❚</span> LIVE MITIGATION
                </button>
              </div>
            </div>

          </div>

          <!-- Bottom Row: Inset Upload Pill & Action Button (Image 3) -->
          <div style="display: flex; gap: 12px; align-items: center;">
            <div class="neu-upload-pill" id="neu-upload-btn">
              <span>⇪</span>
              <span>DEPLOY REVERSE PROXY / ISOLATE</span>
            </div>
            <div class="neu-icon-btn" id="neu-settings-btn" title="Configure Thresholds">⚙</div>
          </div>

        </div>

        <!-- Right Component: Realistic Glass Sand Hourglass (Image 2 Reference) -->
        <div class="glass-card" style="text-align: center; padding: 24px; border-radius: 28px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div class="tech-badge">[REALISTIC PHYSICS]</div>
            <div class="gold-badge">PRECISION TIME // ZERO-DAY DRIFT</div>
          </div>

          <!-- Realistic Hourglass Canvas -->
          <div style="display: flex; justify-content: center;">
            <canvas id="realistic-hourglass-canvas" width="300" height="420" style="max-width: 100%; display: block;"></canvas>
          </div>

          <div class="font-mono" style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 12px;">
            GRANULAR SAND STREAM: <span style="color: var(--accent-gold-light);">ACTIVE</span> • BINARY CONVERSION AT IMPACT POINT
          </div>
        </div>

      </div>
    `;
  }

  initClockHands() {
    const updateHands = () => {
      const now = new Date();
      const secs = now.getSeconds();
      const mins = now.getMinutes();
      const hours = now.getHours();

      const secDeg = (secs / 60) * 360;
      const minDeg = ((mins + secs / 60) / 60) * 360;
      const hourDeg = (((hours % 12) + mins / 60) / 12) * 360;

      const secEl = document.getElementById('analog-second');
      const minEl = document.getElementById('analog-minute');
      const hourEl = document.getElementById('analog-hour');

      if (secEl) secEl.style.transform = `translateX(-50%) rotate(${secDeg}deg)`;
      if (minEl) minEl.style.transform = `translateX(-50%) rotate(${minDeg}deg)`;
      if (hourEl) hourEl.style.transform = `translateX(-50%) rotate(${hourDeg}deg)`;

      // Live digital date/time update
      const dateEl = document.getElementById('neu-widget-date');
      const timeEl = document.getElementById('neu-widget-time');
      if (dateEl) {
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        dateEl.textContent = `${month}/${day}`;
      }
      if (timeEl) {
        let h = hours % 12 || 12;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const m = mins.toString().padStart(2, '0');
        timeEl.textContent = `${h.toString().padStart(2, '0')}:${m} ${ampm}`;
      }
    };

    setInterval(updateHands, 1000);
    updateHands();
  }

  initEventListeners() {
    const playBtn = document.getElementById('neu-play-toggle');
    const playIcon = document.getElementById('play-icon');
    const uploadBtn = document.getElementById('neu-upload-btn');

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        sounds.playClick();
        this.isPlaying = !this.isPlaying;
        if (playIcon) playIcon.textContent = this.isPlaying ? '❚❚' : '▶';
      });
    }

    if (uploadBtn) {
      uploadBtn.addEventListener('click', () => {
        sounds.playScan();
        uploadBtn.style.color = 'var(--accent-green)';
        uploadBtn.innerHTML = '<span>✓</span> <span>PAYLOAD ISOLATION ACTIVE</span>';
        setTimeout(() => {
          uploadBtn.style.color = 'var(--text-primary)';
          uploadBtn.innerHTML = '<span>⇪</span> <span>DEPLOY REVERSE PROXY / ISOLATE</span>';
        }, 2200);
      });
    }
  }
}
