import { Vec2 } from '../utils/math';
import { CANVAS_HEIGHT } from '../utils/constants';

export type PowerUpType = 'doubleCharacter' | 'doubleAmmo' | 'extraLife';

interface PowerUpDef {
  label: string;
  icon: string;
  color: string;
}

const POWERUP_DEFS: Record<PowerUpType, PowerUpDef> = {
  doubleCharacter: { label: 'Double Character', icon: '👥', color: '#7c4dff' },
  doubleAmmo:      { label: 'Double Ammo',      icon: '💥', color: '#ffeb3b' },
  extraLife:       { label: 'Extra Life',       icon: '❤️', color: '#66bb6a' },
};

export const POWERUP_TYPES: PowerUpType[] = ['doubleCharacter', 'doubleAmmo', 'extraLife'];

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

    // Icon
    ctx.shadowBlur = 0;
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.icon, 0, 6);

    ctx.restore();
  }
}
