import { Vec2 } from '../utils/math';
import { CANVAS_HEIGHT, POWERUP_SHIELD_DURATION, POWERUP_DOUBLE_CARB_DURATION, POWERUP_FLAVOR_MIX_DURATION } from '../utils/constants';

export type PowerUpType = 'shakeUp' | 'freshCap' | 'doubleCarb' | 'flavorMix' | 'extraLife' | 'sidewinderBottle';

interface PowerUpDef {
  label: string;
  icon: string;
  color: string;
}

const POWERUP_DEFS: Record<PowerUpType, PowerUpDef> = {
  shakeUp:    { label: 'Shake-Up',           icon: '🫧', color: '#00e5ff' },
  freshCap:   { label: 'Fresh Cap',          icon: '🧢', color: '#4fc3f7' },
  doubleCarb: { label: 'Double Carbonation', icon: '⚡', color: '#ffeb3b' },
  flavorMix:  { label: 'Flavor Mix',         icon: '🌈', color: '#e040fb' },
  extraLife:  { label: 'Extra Life',         icon: '🥤', color: '#66bb6a' },
  sidewinderBottle: { label: 'Sidewinder Bottles', icon: '🍾', color: '#ff8a65' },
};

export const POWERUP_TYPES: PowerUpType[] = ['shakeUp', 'freshCap', 'doubleCarb', 'flavorMix', 'extraLife', 'sidewinderBottle'];

export class PowerUp {
  pos: Vec2;
  type: PowerUpType;
  radius = 14;
  alive = true;
  speed = 60;
  wobble = 0;
  color: string;
  icon: string;

  constructor(type: PowerUpType, pos: Vec2) {
    this.type = type;
    this.pos = { ...pos };
    const def = POWERUP_DEFS[type];
    this.color = def.color;
    this.icon = def.icon;
  }

  update(dt: number): void {
    this.pos.y += this.speed * dt;
    this.wobble += dt * 4;
    if (this.pos.y > CANVAS_HEIGHT + 20) this.alive = false;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const { x, y } = this.pos;
    const wobbleX = Math.sin(this.wobble) * 4;

    ctx.save();
    ctx.translate(x + wobbleX, y);

    // Glow
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 12;

    // Background circle
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Icon / custom tiny-bottle art
    ctx.shadowBlur = 0;
    if (this.type === 'sidewinderBottle') {
      // Tiny contour bottle silhouette (pronounced hip + narrow neck)
      const bw = 9;
      const bh = 13;

      const bottleGrad = ctx.createLinearGradient(-bw * 0.55, -bh * 0.55, bw * 0.55, bh * 0.5);
      bottleGrad.addColorStop(0, '#ffd2c3');
      bottleGrad.addColorStop(0.25, '#ff8a65');
      bottleGrad.addColorStop(1, '#d65d3a');
      ctx.fillStyle = bottleGrad;
      ctx.beginPath();
      ctx.moveTo(-bw * 0.36, bh * 0.48);
      ctx.quadraticCurveTo(-bw * 0.5, bh * 0.34, -bw * 0.45, bh * 0.1);
      ctx.quadraticCurveTo(-bw * 0.5, -bh * 0.05, -bw * 0.3, -bh * 0.2);
      ctx.quadraticCurveTo(-bw * 0.35, -bh * 0.32, -bw * 0.18, -bh * 0.42);
      ctx.lineTo(-bw * 0.1, -bh * 0.55);
      ctx.lineTo(bw * 0.1, -bh * 0.55);
      ctx.lineTo(bw * 0.18, -bh * 0.42);
      ctx.quadraticCurveTo(bw * 0.35, -bh * 0.32, bw * 0.3, -bh * 0.2);
      ctx.quadraticCurveTo(bw * 0.5, -bh * 0.05, bw * 0.45, bh * 0.1);
      ctx.quadraticCurveTo(bw * 0.5, bh * 0.34, bw * 0.36, bh * 0.48);
      ctx.closePath();
      ctx.fill();

      // Neck band
      ctx.fillStyle = '#ff9f80';
      ctx.fillRect(-bw * 0.11, -bh * 0.62, bw * 0.22, bh * 0.11);

      // Cap
      ctx.fillStyle = '#d7ccc8';
      ctx.fillRect(-bw * 0.17, -bh * 0.69, bw * 0.34, bh * 0.08);

      // White label strip to break cup-like silhouette
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillRect(-bw * 0.32, -bh * 0.03, bw * 0.64, bh * 0.16);

      // Outline for readability at small size
      ctx.strokeStyle = 'rgba(80, 30, 20, 0.55)';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Glass highlight
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(-bw * 0.22, -bh * 0.08, 1.4, bh * 0.36);
    } else {
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.icon, 0, 6);
    }

    ctx.restore();
  }
}
