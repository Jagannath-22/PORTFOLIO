import { sounds } from './SoundManager.js';

export class StegoVault {
  constructor(container) {
    this.container = container;
    this.selectedBitPlane = 0; // 0 = LSB (Hidden data), 7 = MSB
    this.cipherShift = 13;
    this.hiddenMessage = "FLAG{0xRESILIENCE_STEGANO_CIPHER_UNLOCKED}";
    this.render();
    this.initCanvasMatrix();
    this.initEventListeners();
  }

  render() {
    this.container.innerHTML = `
      <div class="pixel-matrix-card" style="padding: 32px; border-radius: 16px;">
        <div class="pixel-corner tl"></div>
        <div class="pixel-corner tr"></div>
        <div class="pixel-corner bl"></div>
        <div class="pixel-corner br"></div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
          <div>
            <div class="tech-badge" style="margin-bottom: 8px;">[MODULE // STEGO_CRYPT]</div>
            <h3 class="font-pixel" style="font-size: 1.2rem; color: var(--accent-cyan); letter-spacing: 0.05em;">PIXEL MATRIX // LSB EXTRACTOR</h3>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="neu-btn bit-btn active" data-bit="0">LSB [BIT 0]</button>
            <button class="neu-btn bit-btn" data-bit="1">BIT 1</button>
            <button class="neu-btn bit-btn" data-bit="4">BIT 4</button>
            <button class="neu-btn bit-btn" data-bit="7">MSB [BIT 7]</button>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; align-items: center;">
          <!-- Pixel Visualizer Canvas -->
          <div style="text-align: center;">
            <canvas id="stego-canvas" width="280" height="240" style="background: #020409; border: 1px solid rgba(0, 245, 255, 0.3); border-radius: 8px; width: 100%; max-width: 320px;"></canvas>
            <div class="font-mono" style="font-size: 0.75rem; color: var(--text-muted); margin-top: 8px;">
              [RESOLUTION: 64x64 BITPLANE] • [LSB NOISE ANALYSIS]
            </div>
          </div>

          <!-- Decoded Data & Cryptographic Rotor -->
          <div class="neu-inset" style="padding: 20px;">
            <div style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--accent-gold-light); margin-bottom: 12px; display: flex; justify-content: space-between;">
              <span>HEX DUMP & STREAM DECODER</span>
              <span id="stego-status" style="color: var(--accent-green);">● EXTRACTED</span>
            </div>

            <div id="hex-output" class="font-mono" style="font-size: 0.78rem; color: var(--text-secondary); background: rgba(0,0,0,0.6); padding: 12px; border-radius: 8px; height: 110px; overflow-y: auto; line-height: 1.4; border: 1px solid rgba(255,255,255,0.05);">
              46 4c 41 47 7b 30 78 52 45 53 49 4c 49 45 4e 43 45 5f 53 54 45 47 41 4e 4f 7d
            </div>

            <div style="margin-top: 16px;">
              <label class="font-mono" style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: 6px;">
                CRYPTOGRAPHIC ROTOR SHIFT: <span id="shift-val" style="color: var(--accent-cyan);">ROT-13</span>
              </label>
              <input type="range" id="rotor-slider" min="0" max="25" value="13" style="width: 100%; accent-color: var(--accent-cyan); cursor: pointer;">
            </div>

            <div id="plaintext-result" class="font-mono" style="margin-top: 12px; padding: 8px 12px; background: rgba(0, 245, 255, 0.08); border-left: 3px solid var(--accent-cyan); font-size: 0.82rem; color: #ffffff; word-break: break-all;">
              PAYLOAD: ${this.hiddenMessage}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  initCanvasMatrix() {
    const canvas = document.getElementById('stego-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    const imgData = ctx.createImageData(w, h);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const bit = this.selectedBitPlane;
      let val = (Math.random() * 255) | 0;

      // In LSB (bit 0), render high-contrast hidden steganographic silhouette
      if (bit === 0) {
        const px = (i / 4) % w;
        const py = Math.floor((i / 4) / w);
        const inShape = Math.hypot(px - w / 2, py - h / 2) < 45;
        val = inShape ? 255 : (Math.random() > 0.85 ? 120 : 0);
      } else {
        val = (val >> bit) & 1 ? 255 : 0;
      }

      data[i] = bit === 0 ? 0 : val * 0.5;      // R
      data[i + 1] = val;                        // G
      data[i + 2] = bit === 0 ? val : val;      // B
      data[i + 3] = 255;
    }

    ctx.putImageData(imgData, 0, 0);
  }

  initEventListeners() {
    const bitBtns = this.container.querySelectorAll('.bit-btn');
    bitBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        sounds.playClick();
        bitBtns.forEach((b) => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.selectedBitPlane = parseInt(e.currentTarget.dataset.bit, 10);
        this.initCanvasMatrix();
      });
    });

    const slider = document.getElementById('rotor-slider');
    const shiftVal = document.getElementById('shift-val');
    const plaintext = document.getElementById('plaintext-result');

    if (slider) {
      slider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (shiftVal) shiftVal.textContent = `ROT-${val}`;
        if (plaintext) {
          const shifted = this.hiddenMessage.split('').map(c => {
            if (c >= 'A' && c <= 'Z') {
              return String.fromCharCode(((c.charCodeAt(0) - 65 + val) % 26) + 65);
            }
            return c;
          }).join('');
          plaintext.textContent = `CIPHERTEXT: ${shifted}`;
        }
      });
    }
  }
}
