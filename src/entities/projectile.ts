import { Vec2, vec2, normalize, sub, scale, add, distance } from '../utils/math';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants';

export type ProjectileType = 'cap' | 'fizz' | 'bubble' | 'foam' | 'candy' | 'chip' | 'water' | 'leaf' | 'bensin' | 'enemy';

export class Projectile {
  pos: Vec2;
  vel: Vec2;
  radius: number;
  damage: number;
  type: ProjectileType;
  isPlayerOwned: boolean;
  alive = true;
  age = 0;
  target?: Vec2; // for homing bubbles

  constructor(pos: Vec2, vel: Vec2, type: ProjectileType, isPlayerOwned: boolean) {
    this.pos = { ...pos };
    this.vel = { ...vel };
    this.type = type;
    this.isPlayerOwned = isPlayerOwned;

    switch (type) {
      case 'cap':
        this.radius = 4;
        this.damage = 1;
        break;
      case 'fizz':
        this.radius = 3;
        this.damage = 1;
        break;
      case 'bubble':
        this.radius = 6;
        this.damage = 1;
        break;
      case 'foam':
        this.radius = 10;
        this.damage = 2;
        break;
      case 'candy':
        this.radius = 6;
        this.damage = 1;
        break;
      case 'chip':
        this.radius = 8;
        this.damage = 1;
        break;
      case 'leaf':
        this.radius = 7;
        this.damage = 1;
        break;
      case 'water':
        this.radius = 8;
        this.damage = 1;
        break;
      case 'bensin':
        this.radius = 9;
        this.damage = 2;
        break;
      case 'enemy':
        this.radius = 4;
        this.damage = 1;
        break;
    }
  }

  update(dt: number): void {
    this.age += dt;

    // Homing behavior for bubbles
    if (this.type === 'bubble' && this.target) {
      const dir = normalize(sub(this.target, this.pos));
      const homingStrength = 200;
      this.vel.x += dir.x * homingStrength * dt;
      this.vel.y += dir.y * homingStrength * dt;
      // Cap speed
      const speed = Math.sqrt(this.vel.x ** 2 + this.vel.y ** 2);
      if (speed > 500) {
        this.vel.x = (this.vel.x / speed) * 500;
        this.vel.y = (this.vel.y / speed) * 500;
      }
    }

    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;

    // Remove if off screen
    if (this.pos.y < -20 || this.pos.y > CANVAS_HEIGHT + 20 ||
        this.pos.x < -20 || this.pos.x > CANVAS_WIDTH + 20) {
      this.alive = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);

    switch (this.type) {
      case 'cap':
        ctx.fillStyle = '#ccc';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#999';
        ctx.fillRect(-2, -2, 4, 4);
        break;

      case 'fizz':
        ctx.fillStyle = '#FF8C00';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        break;

      case 'bubble':
        ctx.strokeStyle = 'rgba(124, 252, 0, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        // Highlight
        ctx.fillStyle = 'rgba(124, 252, 0, 0.2)';
        ctx.fill();
        break;

      case 'foam':
        ctx.fillStyle = 'rgba(210, 180, 140, 0.7)';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        // Foam bubbles
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        for (let i = 0; i < 3; i++) {
          const angle = (i / 3) * Math.PI * 2 + this.age * 3;
          ctx.beginPath();
          ctx.arc(Math.cos(angle) * 4, Math.sin(angle) * 4, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case 'candy': {
        // Colorful candy pieces
        const candyColors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF92B2', '#B491FF'];
        const candyColor = candyColors[Math.floor(this.age * 5) % candyColors.length];
        ctx.fillStyle = candyColor;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        // Shine on candy
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(-this.radius * 0.4, -this.radius * 0.4, this.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'chip': {
        // Stick chip projectile
        const chipWidth = this.radius * 1.1;
        const chipHeight = this.radius * 3.2;
        ctx.fillStyle = '#d8ac57';
        ctx.beginPath();
        ctx.moveTo(-chipWidth / 2, -chipHeight / 2 + 2);
        ctx.lineTo(chipWidth / 2, -chipHeight / 2 + 2);
        ctx.lineTo(chipWidth / 2, chipHeight / 2 - 2);
        ctx.quadraticCurveTo(chipWidth / 2, chipHeight / 2, chipWidth / 2 - 2, chipHeight / 2);
        ctx.lineTo(-chipWidth / 2 + 2, chipHeight / 2);
        ctx.quadraticCurveTo(-chipWidth / 2, chipHeight / 2, -chipWidth / 2, chipHeight / 2 - 2);
        ctx.closePath();
        ctx.fill();

        // Seasoning dots
        ctx.fillStyle = '#c19237';
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.arc(i * 2.5, -chipHeight / 6 + 1, 1.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(i * 2.5, chipHeight / 6 + 2, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Highlight stripe
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-chipWidth / 2 + 1, -chipHeight / 2 + 4);
        ctx.lineTo(chipWidth / 2 - 1, -chipHeight / 2 + 4);
        ctx.stroke();
        break;
      }

      case 'leaf': {
        ctx.fillStyle = '#4f9c3a';
        ctx.strokeStyle = '#2f6d24';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, -this.radius);
        ctx.bezierCurveTo(this.radius * 1.4, -this.radius * 0.7, this.radius * 1.1, this.radius * 0.6, 0, this.radius);
        ctx.bezierCurveTo(-this.radius * 1.1, this.radius * 0.6, -this.radius * 1.4, -this.radius * 0.7, 0, -this.radius);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#27601e';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -this.radius);
        ctx.lineTo(0, this.radius);
        ctx.moveTo(0, 0);
        ctx.lineTo(this.radius * 0.7, -this.radius * 0.2);
        ctx.moveTo(0, 0);
        ctx.lineTo(-this.radius * 0.7, -this.radius * 0.2);
        ctx.stroke();
        break;
      }

      case 'water': {
        ctx.fillStyle = 'rgba(85, 175, 255, 0.9)';
        ctx.strokeStyle = 'rgba(235, 250, 255, 0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -this.radius);
        ctx.bezierCurveTo(this.radius * 0.8, -this.radius * 0.6, this.radius * 0.6, this.radius * 0.4, 0, this.radius);
        ctx.bezierCurveTo(-this.radius * 0.6, this.radius * 0.4, -this.radius * 0.8, -this.radius * 0.6, 0, -this.radius);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.arc(-this.radius * 0.2, -this.radius * 0.1, this.radius * 0.25, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'bensin': {
        // Black fuel drop projectile
        const dropHeight = this.radius * 2.4;
        const dropWidth = this.radius * 1.2;
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.moveTo(0, -dropHeight / 2);
        ctx.bezierCurveTo(dropWidth / 2, -dropHeight / 2 + 6, dropWidth / 2, dropHeight / 4, 0, dropHeight / 2);
        ctx.bezierCurveTo(-dropWidth / 2, dropHeight / 4, -dropWidth / 2, -dropHeight / 2 + 6, 0, -dropHeight / 2);
        ctx.closePath();
        ctx.fill();

        // Subtle shine
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.beginPath();
        ctx.ellipse(-this.radius * 0.2, -dropHeight * 0.15, this.radius * 0.35, this.radius * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();

        // Light smoky trail
        const glow = ctx.createRadialGradient(0, 0, this.radius * 0.2, 0, 0, this.radius * 2.4);
        glow.addColorStop(0, 'rgba(60, 60, 60, 0.45)');
        glow.addColorStop(1, 'rgba(30, 30, 30, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'enemy': {
        // Glowing mini-star
        const r = this.radius;
        const spikes = 5;
        const outerR = r * 1.4;
        const innerR = r * 0.55;
        const rot = this.age * 3; // slow spin

        // Outer glow
        const glow = ctx.createRadialGradient(0, 0, innerR, 0, 0, outerR * 2.5);
        glow.addColorStop(0, 'rgba(255, 200, 80, 0.6)');
        glow.addColorStop(0.5, 'rgba(255, 120, 40, 0.2)');
        glow.addColorStop(1, 'rgba(255, 60, 20, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, outerR * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Star shape
        ctx.fillStyle = '#ffe570';
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
          const rad = i % 2 === 0 ? outerR : innerR;
          const angle = (i * Math.PI) / spikes - Math.PI / 2 + rot;
          const sx = Math.cos(angle) * rad;
          const sy = Math.sin(angle) * rad;
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.closePath();
        ctx.fill();

        // Bright center
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, innerR * 0.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }

    ctx.restore();
  }
}
