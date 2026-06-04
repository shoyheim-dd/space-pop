import { Vec2 } from '../utils/math';
import { BottleType, BOTTLES, CANVAS_WIDTH, PLAYER_Y_MIN, PLAYER_Y_MAX, CARBONATION_PER_SHOT, CARBONATION_DECAY_RATE, CARBONATION_FLAT_DURATION } from '../utils/constants';
import { clamp } from '../utils/math';

export class Player {
  pos: Vec2;
  width = 20;
  height = 58;
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
  cheatShield = false;
  doubleCarb = false;
  doubleCarbTimer = 0;
  doubleCharacter = false;
  doubleCharacterTimer = 0;

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
      if (this.shieldTimer <= 0) {
        this.shieldActive = false;
        this.shieldTimer = 0;
      }
    }

    // Double carbonation timer
    if (this.doubleCarb) {
      this.doubleCarbTimer -= dt * 1000;
      if (this.doubleCarbTimer <= 0) this.doubleCarb = false;
    }

    // Double character timer
    if (this.doubleCharacter) {
      this.doubleCharacterTimer -= dt * 1000;
      if (this.doubleCharacterTimer <= 0) this.doubleCharacter = false;
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
    if (this.cheatShield) return false;
    if (this.shieldActive) {
      this.shieldActive = false;
      this.shieldTimer = 0;
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

    const bw = this.width;
    const bh = this.height;

    if (this.bottleType === 'candyCup') {
      const cupW = 44;
      const cupH = 38;

      // Cup body
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(-cupW / 2, -cupH / 2 + 6, cupW, cupH - 6, 12);
      ctx.fill();

      // Cup rim
      ctx.fillStyle = '#fff8f8';
      ctx.beginPath();
      ctx.roundRect(-cupW / 2, -cupH / 2, cupW, 12, 8);
      ctx.fill();

      // Cup stripes
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 2;
      for (let i = -2; i <= 2; i++) {
        const xPos = (i / 2) * 10;
        ctx.beginPath();
        ctx.moveTo(xPos, -cupH / 4 + 4);
        ctx.lineTo(xPos, cupH / 2 - 2);
        ctx.stroke();
      }

      // Candy pieces inside the cup
      const candyColors = ['#ffe7f7', '#ffb3d9', '#ffd280', '#d8fff0'];
      const candyPositions = [
        { x: -10, y: -10 },
        { x: 10, y: -8 },
        { x: -4, y: -2 },
        { x: 8, y: 2 },
        { x: -12, y: 4 },
      ];
      for (let i = 0; i < candyPositions.length; i++) {
        const candy = candyPositions[i];
        ctx.fillStyle = candyColors[i % candyColors.length];
        ctx.beginPath();
        ctx.ellipse(candy.x, candy.y, 8, 5, Math.PI / 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.ellipse(candy.x - 3, candy.y - 2, 2, 1.2, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Wrappers
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 2;
      for (const candy of candyPositions) {
        ctx.beginPath();
        ctx.moveTo(candy.x - 8, candy.y);
        ctx.lineTo(candy.x - 14, candy.y - 6);
        ctx.moveTo(candy.x - 8, candy.y);
        ctx.lineTo(candy.x - 14, candy.y + 6);
        ctx.moveTo(candy.x + 8, candy.y);
        ctx.lineTo(candy.x + 14, candy.y - 6);
        ctx.moveTo(candy.x + 8, candy.y);
        ctx.lineTo(candy.x + 14, candy.y + 6);
        ctx.stroke();
      }

      // Cup label
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillRect(-cupW / 4, 4, cupW / 2, 8);
      ctx.fillStyle = color;
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('CANDY', 0, 8);
    } else if (this.bottleType === 'chipBag') {
      const bagW = 44;
      const bagH = 52;

      // Bag body with a soft, crinkled edge
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(-bagW / 2, -bagH / 2 + 10);
      ctx.lineTo(-bagW / 2, bagH / 2 - 8);
      ctx.quadraticCurveTo(-bagW / 2, bagH / 2, -bagW / 2 + 10, bagH / 2);
      ctx.lineTo(bagW / 2 - 10, bagH / 2);
      ctx.quadraticCurveTo(bagW / 2, bagH / 2, bagW / 2, bagH / 2 - 8);
      ctx.lineTo(bagW / 2, -bagH / 2 + 10);
      ctx.quadraticCurveTo(bagW / 2, -bagH / 2, bagW / 2 - 8, -bagH / 2);
      ctx.lineTo(-bagW / 2 + 8, -bagH / 2);
      ctx.quadraticCurveTo(-bagW / 2, -bagH / 2, -bagW / 2, -bagH / 2 + 10);
      ctx.closePath();
      ctx.fill();

      // Top seal crinkles
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 2;
      for (let i = -2; i <= 2; i++) {
        const x = i * 8;
        ctx.beginPath();
        ctx.moveTo(x - 6, -bagH / 2 + 6);
        ctx.lineTo(x + 6, -bagH / 2 + 6);
        ctx.stroke();
      }

      // Bag creases
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const x = -bagW / 4 + i * (bagW / 3);
        ctx.beginPath();
        ctx.moveTo(x, -bagH / 2 + 12);
        ctx.lineTo(x + 2, bagH / 2 - 8);
        ctx.stroke();
      }

      // Chip label
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillRect(-bagW * 0.35, -6, bagW * 0.7, 14);
      ctx.fillStyle = '#7a3f1a';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('CHIPS', 0, 0);

      // Chips poking out of the top
      const chipColor = '#f5d071';
      for (let i = 0; i < 3; i++) {
        const x = -11 + i * 11;
        const y = -bagH / 2 + 10;
        ctx.fillStyle = chipColor;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 8, y + 10);
        ctx.lineTo(x + 8, y + 10);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#d09c3a';
        ctx.beginPath();
        ctx.arc(x, y + 6, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (this.bottleType === 'tree') {
      const treeW = 42;
      const treeH = 48;

      // Trunk
      ctx.fillStyle = '#6a4425';
      ctx.fillRect(-7, 0, 14, treeH * 0.35);

      // Roots
      ctx.strokeStyle = '#4b3421';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-7, treeH * 0.35);
      ctx.lineTo(-14, treeH * 0.48);
      ctx.moveTo(7, treeH * 0.35);
      ctx.lineTo(14, treeH * 0.48);
      ctx.stroke();

      // Canopy
      ctx.fillStyle = this.config.color;
      ctx.beginPath();
      ctx.arc(-12, -14, 16, 0, Math.PI * 2);
      ctx.arc(0, -26, 20, 0, Math.PI * 2);
      ctx.arc(12, -14, 16, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#2c6328';
      ctx.beginPath();
      ctx.arc(-10, -16, 8, 0, Math.PI * 2);
      ctx.arc(0, -26, 10, 0, Math.PI * 2);
      ctx.arc(10, -16, 8, 0, Math.PI * 2);
      ctx.fill();

      // Leaf veins
      ctx.strokeStyle = '#27601e';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -26);
      ctx.lineTo(0, 6);
      ctx.moveTo(-10, -16);
      ctx.lineTo(-5, -8);
      ctx.moveTo(10, -16);
      ctx.lineTo(5, -8);
      ctx.stroke();
    } else if (this.bottleType === 'bmwCar') {
      const carW = 42;
      const carH = 20;

      // Main body
      ctx.fillStyle = this.config.color;
      ctx.beginPath();
      ctx.moveTo(-carW / 2, carH / 4);
      ctx.lineTo(-carW / 2, 0);
      ctx.quadraticCurveTo(-carW / 2, -carH / 2 + 4, -carW / 4, -carH / 2 + 4);
      ctx.lineTo(carW / 4, -carH / 2 + 4);
      ctx.quadraticCurveTo(carW / 2, -carH / 2 + 4, carW / 2, 0);
      ctx.lineTo(carW / 2, carH / 4);
      ctx.quadraticCurveTo(carW / 2, carH / 2, carW / 2 - 6, carH / 2);
      ctx.lineTo(-carW / 2 + 6, carH / 2);
      ctx.quadraticCurveTo(-carW / 2, carH / 2, -carW / 2, carH / 4);
      ctx.closePath();
      ctx.fill();

      // Window area
      ctx.fillStyle = '#333333';
      ctx.beginPath();
      ctx.moveTo(-carW / 4, -carH / 2 + 4);
      ctx.lineTo(-carW / 8, -carH / 2 + 4);
      ctx.lineTo(-carW / 16, -carH / 4 + 2);
      ctx.lineTo(carW / 16, -carH / 4 + 2);
      ctx.lineTo(carW / 8, -carH / 2 + 4);
      ctx.lineTo(carW / 4, -carH / 2 + 4);
      ctx.lineTo(carW / 4, 0);
      ctx.lineTo(-carW / 4, 0);
      ctx.closePath();
      ctx.fill();

      // Wheels
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(-carW / 3, carH / 2 - 3, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(carW / 3, carH / 2 - 3, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#444444';
      ctx.beginPath();
      ctx.arc(-carW / 3, carH / 2 - 3, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(carW / 3, carH / 2 - 3, 2, 0, Math.PI * 2);
      ctx.fill();

      // Eyebrow headlights
      ctx.fillStyle = '#bbbbbb';
      ctx.fillRect(-carW / 2 - 1, -carH / 8, 3, 5);
      ctx.fillRect(carW / 2 - 2, -carH / 8, 3, 5);
    } else {
      // Classic contour bottle shape (Coca-Cola style)
      ctx.fillStyle = color;
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
    }

    // Shield glow
    if ((this.shieldActive && this.shieldTimer > 0) || this.cheatShield) {
      ctx.strokeStyle = 'rgba(255, 105, 180, 0.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, Math.PI * 2);
      ctx.stroke();
    } else if (this.shieldActive && this.shieldTimer <= 0) {
      this.shieldActive = false;
    }

    ctx.restore();
  }
}
