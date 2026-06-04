import { Vec2 } from '../utils/math';
import { BottleType, BOTTLES, CANVAS_WIDTH, PLAYER_Y_MIN, PLAYER_Y_MAX, CARBONATION_PER_SHOT, CARBONATION_DECAY_RATE, CARBONATION_FLAT_DURATION } from '../utils/constants';
import { clamp } from '../utils/math';

export class Player {
  pos: Vec2;
  width = 24;
  height = 48;
  bottleType: BottleType;
  lives = 3;
  carbonation = 0; // 0–100
  isFlat = false;
  flatTimer = 0;
  shootCooldown = 0;
  specialCharge = 0; // 0–100
  invincible = false;
  invincibleTimer = 0;
  shieldActive = false;
  shieldTimer = 0;
  doubleCarb = false;
  doubleCarbTimer = 0;

  constructor(bottleType: BottleType) {
    this.bottleType = bottleType;
    this.pos = { x: CANVAS_WIDTH / 2, y: PLAYER_Y_MAX - 30 };
  }

  get config() {
    return BOTTLES[this.bottleType];
  }

  update(dt: number, moveX: number, moveY: number): void {
    const speed = this.config.speed;
    this.pos.x += moveX * speed * dt;
    this.pos.y += moveY * speed * dt;

    // Clamp position
    this.pos.x = clamp(this.pos.x, this.width / 2, CANVAS_WIDTH - this.width / 2);
    this.pos.y = clamp(this.pos.y, PLAYER_Y_MIN, PLAYER_Y_MAX);

    // Carbonation decay
    if (!this.isFlat) {
      this.carbonation = Math.max(0, this.carbonation - CARBONATION_DECAY_RATE * dt);
    } else {
      this.flatTimer -= dt * 1000;
      if (this.flatTimer <= 0) {
        this.isFlat = false;
        this.carbonation = 50;
      }
    }

    // Shoot cooldown
    if (this.shootCooldown > 0) {
      this.shootCooldown -= dt;
    }

    // Special charge builds over time
    this.specialCharge = Math.min(100, this.specialCharge + (100 / (this.config.specialCooldown / 1000)) * dt);

    // Invincibility timer
    if (this.invincible) {
      this.invincibleTimer -= dt * 1000;
      if (this.invincibleTimer <= 0) this.invincible = false;
    }

    // Shield timer
    if (this.shieldActive) {
      this.shieldTimer -= dt * 1000;
      if (this.shieldTimer <= 0) this.shieldActive = false;
    }

    // Double carbonation timer
    if (this.doubleCarb) {
      this.doubleCarbTimer -= dt * 1000;
      if (this.doubleCarbTimer <= 0) this.doubleCarb = false;
    }
  }

  canShoot(): boolean {
    return !this.isFlat && this.shootCooldown <= 0;
  }

  shoot(): void {
    const rate = this.doubleCarb ? this.config.fireRate * 2 : this.config.fireRate;
    this.shootCooldown = 1 / rate;
    this.carbonation += CARBONATION_PER_SHOT;
    if (this.carbonation >= 100) {
      this.isFlat = true;
      this.carbonation = 100;
      this.flatTimer = CARBONATION_FLAT_DURATION;
    }
  }

  hit(): boolean {
    if (this.invincible) return false;
    if (this.shieldActive) {
      this.shieldActive = false;
      return false;
    }
    this.lives--;
    this.invincible = true;
    this.invincibleTimer = 2000;
    return this.lives <= 0;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const { x, y } = this.pos;
    const color = this.config.color;

    // Blinking when invincible
    if (this.invincible && Math.floor(Date.now() / 100) % 2 === 0) return;

    ctx.save();
    ctx.translate(x, y);

    // Classic contour bottle shape (Coca-Cola style)
    const bw = this.width;
    const bh = this.height;

    // Bottle body — curved contour silhouette
    const bodyGrad = ctx.createLinearGradient(-bw * 0.5, -bh * 0.55, bw * 0.5, bh * 0.5);
    bodyGrad.addColorStop(0, 'rgba(255,255,255,0.18)');
    bodyGrad.addColorStop(0.16, color);
    bodyGrad.addColorStop(0.72, color);
    bodyGrad.addColorStop(1, 'rgba(0,0,0,0.28)');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    // Start at bottom-left of base
    ctx.moveTo(-bw * 0.38, bh * 0.5);
    // Bottom curve (base)
    ctx.quadraticCurveTo(-bw * 0.4, bh * 0.44, -bw * 0.36, bh * 0.38);
    // Lower body curve outward (wide hip)
    ctx.quadraticCurveTo(-bw * 0.48, bh * 0.15, -bw * 0.46, 0);
    // Waist pinch inward
    ctx.quadraticCurveTo(-bw * 0.38, -bh * 0.12, -bw * 0.28, -bh * 0.2);
    // Upper body / shoulder
    ctx.quadraticCurveTo(-bw * 0.34, -bh * 0.32, -bw * 0.22, -bh * 0.38);
    // Neck taper
    ctx.quadraticCurveTo(-bw * 0.16, -bh * 0.42, -bw * 0.12, -bh * 0.48);
    // Neck straight up
    ctx.lineTo(-bw * 0.1, -bh * 0.56);
    // Lip / rim
    ctx.lineTo(-bw * 0.14, -bh * 0.58);
    ctx.lineTo(-bw * 0.14, -bh * 0.62);
    // Across cap top
    ctx.lineTo(bw * 0.14, -bh * 0.62);
    ctx.lineTo(bw * 0.14, -bh * 0.58);
    ctx.lineTo(bw * 0.1, -bh * 0.56);
    // Right neck
    ctx.lineTo(bw * 0.12, -bh * 0.48);
    ctx.quadraticCurveTo(bw * 0.16, -bh * 0.42, bw * 0.22, -bh * 0.38);
    // Right shoulder
    ctx.quadraticCurveTo(bw * 0.34, -bh * 0.32, bw * 0.28, -bh * 0.2);
    // Right waist
    ctx.quadraticCurveTo(bw * 0.38, -bh * 0.12, bw * 0.46, 0);
    // Right hip
    ctx.quadraticCurveTo(bw * 0.48, bh * 0.15, bw * 0.36, bh * 0.38);
    // Right base
    ctx.quadraticCurveTo(bw * 0.4, bh * 0.44, bw * 0.38, bh * 0.5);
    // Bottom
    ctx.closePath();
    ctx.fill();

    // Right-side glass shading for a rounded 3D feel
    ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
    ctx.beginPath();
    ctx.moveTo(bw * 0.14, -bh * 0.44);
    ctx.quadraticCurveTo(bw * 0.36, -bh * 0.2, bw * 0.4, bh * 0.1);
    ctx.quadraticCurveTo(bw * 0.42, bh * 0.28, bw * 0.3, bh * 0.42);
    ctx.lineTo(bw * 0.2, bh * 0.42);
    ctx.quadraticCurveTo(bw * 0.28, bh * 0.24, bw * 0.26, bh * 0.1);
    ctx.quadraticCurveTo(bw * 0.24, -bh * 0.18, bw * 0.08, -bh * 0.38);
    ctx.closePath();
    ctx.fill();

    // Glass highlight (left edge reflection)
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.moveTo(-bw * 0.3, bh * 0.35);
    ctx.quadraticCurveTo(-bw * 0.38, bh * 0.1, -bw * 0.36, -bh * 0.05);
    ctx.quadraticCurveTo(-bw * 0.28, -bh * 0.15, -bw * 0.2, -bh * 0.22);
    ctx.lineTo(-bw * 0.14, -bh * 0.2);
    ctx.quadraticCurveTo(-bw * 0.22, -bh * 0.1, -bw * 0.28, bh * 0.0);
    ctx.quadraticCurveTo(-bw * 0.3, bh * 0.15, -bw * 0.24, bh * 0.32);
    ctx.closePath();
    ctx.fill();

    // Front glossy streak
    const gloss = ctx.createLinearGradient(-bw * 0.06, -bh * 0.48, bw * 0.1, bh * 0.2);
    gloss.addColorStop(0, 'rgba(255,255,255,0.35)');
    gloss.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gloss;
    ctx.beginPath();
    ctx.moveTo(-bw * 0.04, -bh * 0.45);
    ctx.quadraticCurveTo(bw * 0.02, -bh * 0.34, bw * 0.04, -bh * 0.18);
    ctx.quadraticCurveTo(bw * 0.06, 0, bw * 0.04, bh * 0.18);
    ctx.quadraticCurveTo(0, bh * 0.24, -bw * 0.06, bh * 0.16);
    ctx.quadraticCurveTo(-bw * 0.02, 0, -bw * 0.02, -bh * 0.18);
    ctx.quadraticCurveTo(-bw * 0.02, -bh * 0.32, -bw * 0.04, -bh * 0.45);
    ctx.closePath();
    ctx.fill();

    // Neck highlight
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(-bw * 0.06, -bh * 0.55, bw * 0.04, bh * 0.12);

    // Label band (white with slight transparency)
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.moveTo(-bw * 0.42, bh * 0.02);
    ctx.quadraticCurveTo(-bw * 0.36, -bh * 0.08, -bw * 0.28, -bh * 0.1);
    ctx.lineTo(bw * 0.28, -bh * 0.1);
    ctx.quadraticCurveTo(bw * 0.36, -bh * 0.08, bw * 0.42, bh * 0.02);
    ctx.quadraticCurveTo(bw * 0.44, bh * 0.1, bw * 0.44, bh * 0.16);
    ctx.lineTo(-bw * 0.44, bh * 0.16);
    ctx.quadraticCurveTo(-bw * 0.44, bh * 0.1, -bw * 0.42, bh * 0.02);
    ctx.closePath();
    ctx.fill();

    // Label text (bottle type initial)
    ctx.fillStyle = color;
    ctx.font = `bold ${Math.round(bh * 0.22)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.config.name[0], 0, bh * 0.03);

    // Cap (metallic)
    const capGrad = ctx.createLinearGradient(-bw * 0.14, -bh * 0.62, bw * 0.14, -bh * 0.58);
    capGrad.addColorStop(0, '#999');
    capGrad.addColorStop(0.5, '#ddd');
    capGrad.addColorStop(1, '#888');
    ctx.fillStyle = capGrad;
    ctx.fillRect(-bw * 0.14, -bh * 0.62, bw * 0.28, bh * 0.05);

    // Shield glow
    if (this.shieldActive) {
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}
