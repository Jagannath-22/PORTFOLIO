export class TerminalDrawer {
  constructor(container) {
    this.container = container;
    this.isOpen = false;
    this.render();
    this.initEventListeners();
  }

  render() {
    this.container.innerHTML = `
      <div id="terminal-drawer" class="terminal-drawer">
        <div class="terminal-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="font-mono" style="font-size: 0.72rem; color: var(--text-secondary);">
              SEC_SHELL // v4.2.0 • BGP RIS TELEMETRY ACTIVE
            </span>
          </div>
          <button id="close-terminal-btn" style="background: transparent; border: none; color: var(--text-muted); font-family: var(--font-mono); font-size: 0.72rem; cursor: pointer;">[ESC / CLOSE]</button>
        </div>

        <div id="terminal-output" class="terminal-body">
          <div style="color: var(--text-muted);">
            Type '<span style="color: var(--accent-cyan);">help</span>' to inspect system commands.
          </div>
          <div style="color: var(--text-secondary); margin-top: 4px;">
            BGP PEERING ENGINE: ONLINE • 18 AS NODES MONITORED • 0 ROUTE HIJACKS
          </div>
        </div>

        <div class="terminal-input-row">
          <span class="font-mono" style="color: var(--accent-cyan); font-size: 0.8rem;">guest@jagannath:~$</span>
          <input type="text" id="terminal-cli" class="terminal-input" placeholder="command..." autocomplete="off" spellcheck="false">
        </div>
      </div>

      <button id="open-terminal-pill" style="position: fixed; bottom: 24px; right: 32px; z-index: 90; background: rgba(5,8,17,0.85); border: 1px solid var(--border-subtle); color: var(--text-secondary); padding: 6px 12px; font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.12em; cursor: pointer; border-radius: 2px; backdrop-filter: blur(8px);">
        [~] SEC_SHELL
      </button>
    `;
  }

  initEventListeners() {
    const drawer = document.getElementById('terminal-drawer');
    const openBtn = document.getElementById('open-terminal-pill');
    const closeBtn = document.getElementById('close-terminal-btn');
    const input = document.getElementById('terminal-cli');

    const toggle = (open) => {
      this.isOpen = open !== undefined ? open : !this.isOpen;
      if (this.isOpen) {
        drawer.classList.add('open');
        setTimeout(() => input.focus(), 250);
      } else {
        drawer.classList.remove('open');
      }
    };

    if (openBtn) openBtn.addEventListener('click', () => toggle(true));
    if (closeBtn) closeBtn.addEventListener('click', () => toggle(false));

    window.addEventListener('keydown', (e) => {
      if (e.key === '`' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        toggle();
      }
      if (e.key === 'Escape' && this.isOpen) {
        toggle(false);
      }
    });

    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const cmd = input.value.trim();
          if (cmd) {
            this.executeCommand(cmd);
            input.value = '';
          }
        }
      });
    }
  }

  print(text, color = 'var(--accent-cyan)') {
    const output = document.getElementById('terminal-output');
    if (!output) return;
    const line = document.createElement('div');
    line.style.color = color;
    line.style.marginTop = '4px';
    line.innerHTML = text;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
  }

  executeCommand(cmd) {
    this.print(`guest@jagannath:~$ <span style="color: #f2f4f7;">${cmd}</span>`);
    const lower = cmd.toLowerCase();

    if (lower === 'help') {
      this.print(`
Available commands:
  • <span style="color: var(--accent-cyan)">whoami</span>      - Researcher credentials
  • <span style="color: var(--accent-cyan)">bgp-status</span>  - Global autonomous system routing status
  • <span style="color: var(--accent-cyan)">work</span>        - Selected systems engineering projects
  • <span style="color: var(--accent-cyan)">research</span>    - Published security advisories & CVEs
  • <span style="color: var(--accent-cyan)">clear</span>       - Clear console buffer
      `);
    } else if (lower === 'whoami') {
      this.print(`
JAGANNATH SAHOO
Role: Cybersecurity Researcher · Systems · Software Engineer
Focus: Low-level systems, network protocols, eBPF telemetry, post-quantum crypto.
      `, 'var(--text-primary)');
    } else if (lower === 'bgp-status') {
      this.print(`
[GLOBAL BGP TOPOLOGY]
• AS13335 (Cloudflare) ⇄ AS15169 (Google)    [RTT: 2.8ms - STABLE]
• AS3356 (Lumen)       ⇄ AS7922 (Comcast)   [RTT: 11.4ms - STABLE]
• AS9002 (RETN)        ⇄ AS3257 (GTT)       [RTT: 22.3ms - STABLE]
• AS2914 (NTT)         ⇄ AS55836 (Jio)      [RTT: 88.5ms - STABLE]
RPKI Validation: ACTIVE • ROA Prefix Mismatches: 0
      `, 'var(--accent-cyan)');
    } else if (lower === 'work') {
      this.print(`
01. AGENTSHIELD - eBPF Network Security & Telemetry Platform
02. ARM / TF-M SECURITY RESEARCH - Trusted Firmware-M Memory Boundaries
03. E-COMMERCE PLATFORM - High-Throughput Distributed Microservices
      `, 'var(--text-secondary)');
    } else if (lower === 'research') {
      this.print(`
• CVE-2025-44912: Linux Kernel eBPF Subsystem Integer Truncation (Critical)
• Formal Verification of ML-KEM/Kyber Constant-Time Polynomial Math (IEEE S&P)
• Autonomous Global BGP Route Hijack Detection Engine
      `, 'var(--accent-amber)');
    } else if (lower === 'clear') {
      const output = document.getElementById('terminal-output');
      if (output) output.innerHTML = '';
    } else {
      this.print(`Command not recognized: '${cmd}'. Type 'help' for manual.`, 'var(--text-muted)');
    }
  }
}
