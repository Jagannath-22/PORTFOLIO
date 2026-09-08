/**
 * WateryHackerConsole — Glossy Watery Cyber Hacking Workstation
 * 
 * Features:
 * - Liquid glass / watery reflective dark aesthetic with subtle caustic ripples
 * - Cybernetic operative surveillance visual
 * - Real-time live hacking streams (eBPF packet interception, x86_64 register inspection, vulnerability payloads)
 * - Interactive exploit trigger buttons that dynamically inject live telemetry
 */
export class WateryHackerConsole {
  constructor(containerId, onFlipBack) {
    this.container = document.getElementById(containerId);
    this.onFlipBack = onFlipBack;
    if (!this.container) return;

    this.terminalLines = [
      { text: '[INIT] ATTACHING eBPF PROBE: sys_enter_execve()', color: '#74e7ff' },
      { text: '[NET] INTERCEPTING SOCKET FLOW: 104.16.24.1:443 -> LOCALHOST', color: '#8993a4' },
      { text: '[REGS] RAX: 0x00007ffd5a901000  RBX: 0x0000000000000000', color: '#8993a4' },
      { text: '[REGS] RCX: 0x000055c829e01140  RSP: 0x00007ffd5a900fe8', color: '#8993a4' },
      { text: '[DISASM] 0x55c829e01140: mov  rax, qword ptr [rbp - 0x18]', color: '#f2f4f7' },
      { text: '[DISASM] 0x55c829e01144: test rax, rax', color: '#f2f4f7' },
      { text: '[DISASM] 0x55c829e01147: jz   0x55c829e01160 <verifier_bypass>', color: '#c99a55' },
      { text: '[EXPLOIT] CVE-2025-44912: 64-BIT SCALAR BOUNDS RE-VERIFIED', color: '#74e7ff' },
      { text: '[STATUS] PRIVILEGE ESCALATION VALIDATED // RING BUFFER READY', color: '#74e7ff' },
      { text: '[ML-KEM] NTT POLYNOMIAL MULTIPLICATION: 256 CONSTANT-TIME CYCLES', color: '#c99a55' }
    ];

    this.streamIndex = 0;
    this.initDOM();
    this.startStreaming();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="watery-terminal-card">
        <!-- Glossy Watery Surface Ripple Canvas -->
        <canvas class="watery-ripple-canvas" id="terminal-water-canvas"></canvas>

        <!-- Glass Terminal Top Bar with Return Flip Button -->
        <div class="terminal-glass-bar">
          <div class="terminal-traffic-lights">
            <span class="light-dot red"></span>
            <span class="light-dot yellow"></span>
            <span class="light-dot green"></span>
          </div>
          <div class="terminal-status-title">
            <span class="glitch-text">OPERATIVE_SESSION // SHELL_ROOT</span>
            <span class="active-badge">ACTIVE</span>
          </div>
          <button class="flip-back-btn" id="btn-flip-back-hourglass" type="button" title="Rotate back to Cosmic Sandglass">
            <span>⤺ CHRONO-GLASS</span>
          </button>
        </div>

        <!-- Operative Holographic Persona Banner -->
        <div class="terminal-operative-header">
          <div class="operative-avatar-box">
            <div class="avatar-mesh">
              <span class="avatar-icon">⚡</span>
            </div>
            <div class="avatar-ring"></div>
          </div>
          <div class="operative-meta">
            <div class="operative-callsign">TARGET: KERNEL SPACE 0x0</div>
            <div class="operative-sub">eBPF VERIFIER ANALYSIS & MEMORY PROBE</div>
          </div>
          <div class="operative-stats">
            <div class="stat-pill"><span class="stat-lbl">LATENCY</span> <span class="stat-val">0.4μs</span></div>
            <div class="stat-pill"><span class="stat-lbl">RING_BUF</span> <span class="stat-val">99.8%</span></div>
          </div>
        </div>

        <!-- Live Streaming Log Window -->
        <div class="terminal-stream-window" id="terminal-stream-logs">
          <!-- Lines injected here dynamically -->
        </div>

        <!-- Interactive Hacker Action Bar -->
        <div class="terminal-action-deck">
          <button class="hack-btn" id="btn-inject-ebpf">
            <span class="btn-indicator"></span>
            <span>INJECT eBPF PROBE</span>
          </button>
          <button class="hack-btn" id="btn-verify-bounds">
            <span class="btn-indicator"></span>
            <span>AUDIT BOUNDS</span>
          </button>
          <button class="hack-btn" id="btn-crack-ntt">
            <span class="btn-indicator"></span>
            <span>TEST NTT LATTICE</span>
          </button>
        </div>
      </div>
    `;

    // Interactive button hooks
    document.getElementById('btn-inject-ebpf')?.addEventListener('click', () => {
      this.pushCustomLine('[INJECT] ATTACHING TC INGRESS HOOK -> VERIFIER PASS [OK]', '#74e7ff');
    });

    document.getElementById('btn-verify-bounds')?.addEventListener('click', () => {
      this.pushCustomLine('[AUDIT] R1.umin_value=0 R1.umax_value=0xffffffff -> PRUNED [SAFE]', '#c99a55');
    });

    document.getElementById('btn-crack-ntt')?.addEventListener('click', () => {
      this.pushCustomLine('[CRYPTO] CONSTANT-TIME INSTRUCTION VERIFIED: ZERO TIMING LEAK DETECTED', '#74e7ff');
    });

    document.getElementById('btn-flip-back-hourglass')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.onFlipBack) {
        this.onFlipBack();
      }
    });

    // Initialize subtle water ripple canvas
    this.initWaterCanvas();
  }

  initWaterCanvas() {
    const canvas = document.getElementById('terminal-water-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const resize = () => {
      canvas.width = canvas.clientWidth || 500;
      canvas.height = canvas.clientHeight || 420;
    };
    resize();
    window.addEventListener('resize', resize);

    let t = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      t += 0.02;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Liquid sheen gradient
      const grad = ctx.createRadialGradient(
        w * 0.3 + Math.sin(t * 0.7) * 40,
        h * 0.4 + Math.cos(t * 0.5) * 30,
        10,
        w * 0.5,
        h * 0.5,
        w * 0.6
      );
      grad.addColorStop(0, 'rgba(116, 231, 255, 0.045)');
      grad.addColorStop(0.5, 'rgba(49, 93, 145, 0.025)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Subtle watery caustic line
      ctx.strokeStyle = 'rgba(116, 231, 255, 0.08)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let x = 0; x < w; x += 12) {
        const y = h * 0.15 + Math.sin(x * 0.02 + t) * 8 + Math.cos(x * 0.01 - t * 0.8) * 6;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };
    animate();
  }

  startStreaming() {
    const logBox = document.getElementById('terminal-stream-logs');
    if (!logBox) return;

    // Stream initial lines
    this.terminalLines.forEach((l) => this.appendLine(l.text, l.color));

    // Perpetual streaming interval
    setInterval(() => {
      const line = this.terminalLines[this.streamIndex % this.terminalLines.length];
      this.streamIndex++;
      this.appendLine(line.text, line.color);
    }, 2400);
  }

  appendLine(text, color) {
    const logBox = document.getElementById('terminal-stream-logs');
    if (!logBox) return;

    const row = document.createElement('div');
    row.className = 'terminal-log-row';
    row.style.color = color || '#8993a4';

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');

    row.innerHTML = `<span class="time-stamp">${timeStr}</span> <span class="log-text">${text}</span>`;
    logBox.appendChild(row);

    // Keep log height tidy
    if (logBox.children.length > 14) {
      logBox.removeChild(logBox.children[0]);
    }
    logBox.scrollTop = logBox.scrollHeight;
  }

  pushCustomLine(text, color) {
    this.appendLine(text, color);
  }
}
