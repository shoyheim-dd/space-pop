export class Input {
  private keys = new Set<string>();
  private mouseDown = false;
  private mousePos = { x: 0, y: 0 };

  constructor(canvas: HTMLCanvasElement) {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });

    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.mouseDown = true;
    });

    canvas.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouseDown = false;
    });

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mousePos.x = e.clientX - rect.left;
      this.mousePos.y = e.clientY - rect.top;
    });

    // Prevent context menu on right-click for special ability
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 2) this.keys.add('_rightclick');
    });
    canvas.addEventListener('mouseup', (e) => {
      if (e.button === 2) this.keys.delete('_rightclick');
    });

    window.addEventListener('blur', () => {
      this.keys.clear();
      this.mouseDown = false;
    });
  }

  isDown(key: string): boolean {
    return this.keys.has(key.toLowerCase());
  }

  get shooting(): boolean {
    return this.isDown(' ') || this.mouseDown;
  }

  get special(): boolean {
    return this.isDown('shift') || this.keys.has('_rightclick');
  }

  get moveLeft(): boolean {
    return this.isDown('arrowleft') || this.isDown('a');
  }

  get moveRight(): boolean {
    return this.isDown('arrowright') || this.isDown('d');
  }

  get moveUp(): boolean {
    return this.isDown('arrowup') || this.isDown('w');
  }

  get moveDown(): boolean {
    return this.isDown('arrowdown') || this.isDown('s');
  }

  get pause(): boolean {
    return this.isDown('p') || this.isDown('escape');
  }
}
