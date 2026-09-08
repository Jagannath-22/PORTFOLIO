export class Navigation {
  constructor(container) {
    this.container = container;
    this.render();
    this.initScrollListener();
  }

  render() {
    this.container.innerHTML = `
      <header class="header-nav" id="main-header">
        <a href="#hero" class="nav-logo">JAGANNATH SAHOO</a>
        <nav>
          <ul class="nav-menu">
            <li><a href="#work" class="nav-item-link">WORK</a></li>
            <li><a href="#about" class="nav-item-link">ABOUT</a></li>
            <li><a href="#research" class="nav-item-link">RESEARCH</a></li>
            <li><a href="#contact" class="nav-item-link">CONTACT</a></li>
          </ul>
        </nav>
      </header>
    `;
  }

  initScrollListener() {
    const header = document.getElementById('main-header');
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }
}
