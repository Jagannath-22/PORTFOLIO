import { sounds } from './SoundManager.js';

export class SkillMatrix {
  constructor(container, onSkillSelect) {
    this.container = container;
    this.onSkillSelect = onSkillSelect;
    this.activeCategory = 'OFFENSIVE';
    this.skills = {
      OFFENSIVE: [
        { name: 'Heap Exploitation & Pwn', level: '95%', desc: 'Glibc heap grooming, tcache poisoning, use-after-free, fastbin dupes', tools: 'GDB, GEF, Pwntools, Radare2' },
        { name: 'Reverse Engineering', level: '92%', desc: 'x86_64 / ARM binary decompilation, firmware unpacking, anti-debug bypassing', tools: 'Ghidra, IDA Pro, Binary Ninja' },
        { name: 'Kernel Exploit Development', level: '88%', desc: 'Linux kernel page table corruption, SMEP/SMAP bypasses, eBPF JIT bugs', tools: 'QEMU, Kprobes, GDB Kernel' },
        { name: 'Web & API Red Teaming', level: '94%', desc: 'OAuth flows, SSRF, prototype pollution, second-order SQL injection', tools: 'Burp Suite Pro, Caido, Ffuf' }
      ],
      DEFENSIVE: [
        { name: 'Zero Trust & eBPF Telemetry', level: '96%', desc: 'Kernel-level runtime observability, SPIFFE/SPIRE workload attestation', tools: 'Tetragon, Tracee, Cilium' },
        { name: 'BGP Routing & DDoS Hardening', level: '90%', desc: 'RPKI ROA route origin validation, Flowspec rate-limiting, prefix defense', tools: 'BIRD, FRRouting, Cloudflare Edge' },
        { name: 'SIEM / SOAR Automation', level: '93%', desc: 'Detection engineering, Sigma rules, automated containment playbooks', tools: 'Splunk, Elastic SIEM, Shuffle SOAR' },
        { name: 'Memory Safety & Rust Systems', level: '91%', desc: 'Rewriting critical microservices in safe Rust, formal verification', tools: 'Rust, MIRI, Prusti, Cargo-Audit' }
      ],
      CRYPTO: [
        { name: 'Post-Quantum Cryptography', level: '89%', desc: 'Lattice-based encryption implementation (ML-KEM/Kyber, ML-DSA/Dilithium)', tools: 'OpenSSL 3.0, liboqs, PQClean' },
        { name: 'LSB Steganography & Bit Analysis', level: '94%', desc: 'Bit-plane extraction, DCT frequency coefficient payload embedding', tools: 'Stegsolve, Zsteg, Custom Python' },
        { name: 'AI Adversarial Defense & Red Teaming', level: '92%', desc: 'LLM prompt injection defense, model extraction mitigation, tensor watermarking', tools: 'Garak, PyRIT, Tensor Guard' },
        { name: 'Hardware Security & Enclaves', level: '86%', desc: 'Intel SGX, AWS Nitro Enclaves, TPM 2.0 remote attestation', tools: 'OpenEnclave, SGX-SDK' }
      ]
    };

    this.render();
    this.initEventListeners();
  }

  render() {
    const list = this.skills[this.activeCategory];

    this.container.innerHTML = `
      <div style="margin-bottom: 24px; display: flex; gap: 12px; flex-wrap: wrap;">
        <button class="neu-btn cat-btn ${this.activeCategory === 'OFFENSIVE' ? 'active' : ''}" data-cat="OFFENSIVE" style="${this.activeCategory === 'OFFENSIVE' ? 'border-color: var(--accent-red); color: var(--accent-red);' : ''}">
          🔴 OFFENSIVE SECURITY & PWN
        </button>
        <button class="neu-btn cat-btn ${this.activeCategory === 'DEFENSIVE' ? 'active' : ''}" data-cat="DEFENSIVE" style="${this.activeCategory === 'DEFENSIVE' ? 'border-color: var(--accent-cyan); color: var(--accent-cyan);' : ''}">
          🔵 ZERO TRUST & DEFENSE
        </button>
        <button class="neu-btn cat-btn ${this.activeCategory === 'CRYPTO' ? 'active' : ''}" data-cat="CRYPTO" style="${this.activeCategory === 'CRYPTO' ? 'border-color: var(--accent-gold); color: var(--accent-gold-light);' : ''}">
          🟡 CRYPTO & AI SECURITY
        </button>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
        ${list.map((s, i) => `
          <div class="neu-panel skill-card" data-idx="${i}" style="padding: 24px; cursor: pointer;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
              <h4 class="font-sans" style="font-size: 1.05rem; font-weight: 600; color: #ffffff;">${s.name}</h4>
              <span class="font-mono" style="font-size: 0.8rem; color: var(--accent-cyan); font-weight: 700;">${s.level}</span>
            </div>

            <!-- Progress bar -->
            <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.08); border-radius: 4px; margin-bottom: 14px; overflow: hidden;">
              <div style="width: ${s.level}; height: 100%; background: linear-gradient(90deg, var(--accent-cyan), var(--accent-gold)); border-radius: 4px;"></div>
            </div>

            <p class="font-sans" style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 12px;">
              ${s.desc}
            </p>

            <div class="font-mono" style="font-size: 0.72rem; color: var(--text-muted);">
              TOOLS: <span style="color: var(--accent-gold-light);">${s.tools}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  initEventListeners() {
    const catBtns = this.container.querySelectorAll('.cat-btn');
    catBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        sounds.playClick();
        this.activeCategory = e.currentTarget.dataset.cat;
        this.render();
        this.initEventListeners();
      });
    });

    const skillCards = this.container.querySelectorAll('.skill-card');
    skillCards.forEach((card) => {
      card.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.idx, 10);
        const item = this.skills[this.activeCategory][idx];
        sounds.playScan();
        if (this.onSkillSelect) {
          this.onSkillSelect(item);
        }
      });
    });
  }
}
