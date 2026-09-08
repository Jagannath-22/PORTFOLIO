/**
 * ScrollNarrative — Maps page scroll position to normalized progress [0.0, 1.0].
 * Drives camera parallax and section navigation transitions smoothly.
 */
export class ScrollNarrative {
  constructor(onProgress) {
    this.onProgress = onProgress;
    this.progress = 0;
    this.ticking = false;

    this._onScroll = this._onScroll.bind(this);
    window.addEventListener('scroll', this._onScroll, { passive: true });
    this._onScroll();
  }

  _onScroll() {
    if (!this.ticking) {
      requestAnimationFrame(() => {
        this._update();
        this.ticking = false;
      });
      this.ticking = true;
    }
  }

  _update() {
    const scrollY = window.scrollY || window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    this.progress = docHeight > 0 ? Math.min(Math.max(scrollY / docHeight, 0), 1) : 0;

    if (this.onProgress) {
      this.onProgress(this.progress);
    }
  }

  destroy() {
    window.removeEventListener('scroll', this._onScroll);
  }
}
