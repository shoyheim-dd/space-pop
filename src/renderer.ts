import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './utils/constants';
import { randomRange } from './utils/math';

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  alpha: number;
}

interface BgBubble {
  x: number;
  y: number;
  radius: number;
  speed: number;
  alpha: number;
  wobble: number;
}

// Space background images (NASA public domain, stored locally)
const SPACE_BG_URLS = [
  '/images/space-bg-1.jpg',
  '/images/space-bg-2.jpg',
];

export class Renderer {
  readonly ctx: CanvasRenderingContext2D;
  private stars: Star[] = [];
  private bgBubbles: BgBubble[] = [];
  private bgImage: HTMLImageElement | null = null;
  private bgLoaded = false;
  private bgScrollY = 0;

  constructor(private canvas: HTMLCanvasElement) {
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    this.ctx = canvas.getContext('2d')!;

    // Load a random space background image
    this.loadBackgroundImage();

    // Generate starfield
    for (let i = 0; i < 80; i++) {
      this.stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: randomRange(0.5, 2),
        speed: randomRange(10, 40),
        alpha: randomRange(0.3, 1),
      });
    }

    // Generate background bubbles
    for (let i = 0; i < 15; i++) {
      this.bgBubbles.push(this.makeBubble());
    }
  }

  private makeBubble(): BgBubble {
    return {
      x: Math.random() * CANVAS_WIDTH,
      y: CANVAS_HEIGHT + randomRange(10, 100),
      radius: randomRange(3, 12),
      speed: randomRange(20, 50),
      alpha: randomRange(0.05, 0.2),
      wobble: randomRange(0, Math.PI * 2),
    };
  }

  private loadBackgroundImage(): void {
    const url = SPACE_BG_URLS[Math.floor(Math.random() * SPACE_BG_URLS.length)];
    const img = new Image();
    img.onload = () => {
      this.bgImage = img;
      this.bgLoaded = true;
    };
    img.src = url;
  }

  clear(): void {
    if (this.bgLoaded && this.bgImage) {
      // Draw space image as scrolling background
      const img = this.bgImage;
      // Scale image to cover canvas width, tile vertically
      const scale = CANVAS_WIDTH / img.width;
      const scaledH = img.height * scale;

      // Scroll the background slowly
      const y1 = (this.bgScrollY % scaledH) - scaledH;
      const y2 = y1 + scaledH;
      const y3 = y2 + scaledH;

      this.ctx.globalAlpha = 0.6;
      this.ctx.drawImage(img, 0, y1, CANVAS_WIDTH, scaledH);
      this.ctx.drawImage(img, 0, y2, CANVAS_WIDTH, scaledH);
      if (y3 < CANVAS_HEIGHT) {
        this.ctx.drawImage(img, 0, y3, CANVAS_WIDTH, scaledH);
      }
      this.ctx.globalAlpha = 1;

      // Dark overlay to keep game elements visible
      this.ctx.fillStyle = 'rgba(10, 10, 46, 0.45)';
      this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      // Fallback solid background
      this.ctx.fillStyle = COLORS.background;
      this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  }

  updateBackground(dt: number): void {
    // Scroll space background
    this.bgScrollY += 15 * dt;

    // Stars
    for (const star of this.stars) {
      star.y += star.speed * dt;
      if (star.y > CANVAS_HEIGHT) {
        star.y = 0;
        star.x = Math.random() * CANVAS_WIDTH;
      }
      this.ctx.globalAlpha = star.alpha;
      this.ctx.fillStyle = COLORS.star;
      this.ctx.fillRect(star.x, star.y, star.size, star.size);
    }

    // Bubbles
    for (const b of this.bgBubbles) {
      b.y -= b.speed * dt;
      b.wobble += dt * 2;
      const wx = Math.sin(b.wobble) * 8;

      if (b.y + b.radius < 0) {
        Object.assign(b, this.makeBubble());
      }

      this.ctx.globalAlpha = b.alpha;
      this.ctx.beginPath();
      this.ctx.arc(b.x + wx, b.y, b.radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = COLORS.bubble;
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }

    this.ctx.globalAlpha = 1;
  }

  drawText(text: string, x: number, y: number, size: number, color = '#fff', align: CanvasTextAlign = 'center'): void {
    this.ctx.font = `bold ${size}px 'Segoe UI', system-ui, sans-serif`;
    this.ctx.textAlign = align;
    this.ctx.fillStyle = color;
    this.ctx.fillText(text, x, y);
  }
}
