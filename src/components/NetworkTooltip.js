export class NetworkTooltip {
  constructor() {
    this.el = document.createElement('div');
    this.el.id = 'network-tooltip';
    document.body.appendChild(this.el);
  }

  show(nodeData, x, y) {
    if (!nodeData) {
      this.hide();
      return;
    }

    this.el.innerHTML = `
      <div class="tt-as">${nodeData.id} // ${nodeData.name}</div>
      <div>City: <span style="color: #f2f4f7;">${nodeData.city}</span></div>
      <div>Prefix: <span style="color: #f2f4f7;">${nodeData.prefix}</span></div>
      <div>Status: <span class="tt-status">${nodeData.status}</span></div>
      <div>RTT: <span style="color: #74e7ff;">${nodeData.rtt}</span></div>
    `;

    this.el.style.left = `${x + 16}px`;
    this.el.style.top = `${y + 16}px`;
    this.el.style.display = 'block';
  }

  hide() {
    this.el.style.display = 'none';
  }
}
