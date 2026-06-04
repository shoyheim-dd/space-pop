import { Vec2 } from '../utils/math';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants';
import { randomRange } from '../utils/math';

export type EnemyType = 'mentos' | 'iceCube' | 'straw' | 'cupLid' | 'sugarCube' | 'water' | 'carrot' | 'broccoli' | 'tomato' | 'smog1' | 'smog2' | 'smog3' | 'alien1' | 'alien2' | 'alien3' | 'kid1' | 'kid2' | 'kid3';

interface EnemyDef {
  hp: number;
  points: number;
  width: number;
  height: number;
  color: string;
  shootChance: number; // per second
}

const ENEMY_DEFS: Record<EnemyType, EnemyDef> = {
  mentos: { hp: 1, points: 10, width: 24, height: 28, color: '#ffffff', shootChance: 0.3 },
  iceCube: { hp: 2, points: 25, width: 26, height: 26, color: '#87CEEB', shootChance: 0.2 },
  straw: { hp: 1, points: 15, width: 8, height: 36, color: '#ff6b6b', shootChance: 0.5 },
  cupLid: { hp: 3, points: 30, width: 32, height: 12, color: '#dddddd', shootChance: 0.15 },
  sugarCube: { hp: 1, points: 5, width: 16, height: 16, color: '#fffacd', shootChance: 0.1 },
  water: { hp: 2, points: 12, width: 22, height: 30, color: '#4ea6ff', shootChance: 0.25 },
  carrot: { hp: 2, points: 14, width: 20, height: 38, color: '#ff9f3c', shootChance: 0.3 },
  broccoli: { hp: 3, points: 18, width: 24, height: 32, color: '#70b238', shootChance: 0.25 },
  tomato: { hp: 2, points: 16, width: 22, height: 24, color: '#ef4e4e', shootChance: 0.35 },
  smog1: { hp: 2, points: 15, width: 26, height: 24, color: '#9ea09d', shootChance: 0.2 },
  smog2: { hp: 2, points: 15, width: 28, height: 26, color: '#7a7c78', shootChance: 0.22 },
  smog3: { hp: 3, points: 18, width: 30, height: 28, color: '#5f615d', shootChance: 0.18 },
  alien1: { hp: 2, points: 14, width: 24, height: 32, color: '#5fbf5f', shootChance: 0.25 },
  alien2: { hp: 2, points: 14, width: 24, height: 32, color: '#4caf50', shootChance: 0.25 },
  alien3: { hp: 2, points: 14, width: 24, height: 32, color: '#7dd47d', shootChance: 0.25 },
  kid1: { hp: 1, points: 12, width: 20, height: 24, color: '#ff9b5c', shootChance: 0.2 },
  kid2: { hp: 1, points: 12, width: 20, height: 24, color: '#a8d6ff', shootChance: 0.2 },
  kid3: { hp: 1, points: 12, width: 20, height: 24, color: '#d3a0ff', shootChance: 0.2 },
};

export class Enemy {
  pos: Vec2;
  vel: Vec2 = { x: 0, y: 0 };
  type: EnemyType;
  hp: number;
  maxHp: number;
  points: number;
  width: number;
  height: number;
  color: string;
  shootChance: number;
  alive = true;
  flashTimer = 0;
  gridX = 0; // position in the formation grid
  gridY = 0;

  constructor(type: EnemyType, pos: Vec2) {
    this.type = type;
    this.pos = { ...pos };
    const def = ENEMY_DEFS[type];
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.points = def.points;
    this.width = def.width;
    this.height = def.height;
    this.color = def.color;
    this.shootChance = def.shootChance;
  }

  update(dt: number): void {
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;

    if (this.flashTimer > 0) this.flashTimer -= dt;
  }

  hit(damage: number): boolean {
    this.hp -= damage;
    this.flashTimer = 0.1;
    if (this.hp <= 0) {
      this.alive = false;
      return true;
    }
    return false;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const { x, y } = this.pos;

    ctx.save();
    ctx.translate(x, y);

    if (this.flashTimer > 0) {
      ctx.fillStyle = '#fff';
    } else {
      ctx.fillStyle = this.color;
    }

    switch (this.type) {
      case 'mentos':
        // Mentos pill shape with 3D shading
        const gradient = ctx.createLinearGradient(-this.width / 2, -this.height / 2, this.width / 2, this.height / 2);
        gradient.addColorStop(0, '#f7f7f7');
        gradient.addColorStop(0.4, '#ffffff');
        gradient.addColorStop(1, '#e5e5e5');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 12);
        ctx.fill();

        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.roundRect(-this.width / 2 + 2, -this.height / 2 + 2, this.width - 4, this.height / 2, 10);
        ctx.fill();
        break;

      case 'iceCube':
        // Translucent cube
        ctx.globalAlpha = 0.8;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#fff';
        ctx.fillRect(-this.width / 2 + 4, -this.height / 2 + 4, 8, 8);
        ctx.globalAlpha = 1;
        break;

      case 'straw':
        // Striped straw
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        ctx.fillStyle = '#fff';
        for (let sy = -this.height / 2; sy < this.height / 2; sy += 8) {
          ctx.fillRect(-this.width / 2, sy, this.width, 4);
        }
        break;

      case 'cupLid':
        // Flat lid
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 1;
        ctx.stroke();
        break;

      case 'sugarCube':
        // Small square with sparkle
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(-2, -2, 4, 4);
        break;

      case 'water':
        // Droplet shape
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.quadraticCurveTo(this.width / 2, -this.height / 4, this.width / 2, this.height / 4);
        ctx.quadraticCurveTo(this.width / 2, this.height / 2, 0, this.height / 2);
        ctx.quadraticCurveTo(-this.width / 2, this.height / 2, -this.width / 2, this.height / 4);
        ctx.quadraticCurveTo(-this.width / 2, -this.height / 4, 0, -this.height / 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.arc(-this.width * 0.1, -this.height * 0.16, 4, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'carrot':
        // Carrot enemy
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.lineTo(this.width / 2, this.height / 2);
        ctx.lineTo(-this.width / 2, this.height / 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#4f7a2f';
        ctx.fillRect(-4, -this.height / 2 - 4, 8, 8);
        break;

      case 'broccoli':
        // Broccoli enemy
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, -6, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-this.width * 0.25, -2, this.width / 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.width * 0.25, -2, this.width / 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#7b5b2d';
        ctx.fillRect(-4, -2, 8, this.height / 2);
        break;

      case 'tomato':
        // Tomato enemy
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4f7a2f';
        ctx.fillRect(-4, -this.height / 4 - 4, 8, 6);
        ctx.beginPath();
        ctx.arc(-3, -this.height / 4 - 1, 2, 0, Math.PI * 2);
        ctx.arc(3, -this.height / 4 - 1, 2, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'smog1':
      case 'smog2':
      case 'smog3': {
        // Climate gas cloud enemy
        const cloudRadius = this.width * 0.4;
        const hue = this.type === 'smog1' ? 200 : this.type === 'smog2' ? 180 : 160;
        const opacity = this.type === 'smog3' ? 0.9 : 0.75;
        ctx.fillStyle = `rgba(${Math.floor(220 - hue)}, ${Math.floor(220 - hue/1.2)}, ${Math.floor(220 - hue/1.4)}, ${opacity})`;
        ctx.beginPath();
        ctx.arc(-cloudRadius, 0, cloudRadius, 0, Math.PI * 2);
        ctx.arc(cloudRadius * 0.3, -cloudRadius * 0.2, cloudRadius * 0.85, 0, Math.PI * 2);
        ctx.arc(cloudRadius, 0, cloudRadius * 0.6, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(110, 110, 110, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = `rgba(255,255,255,${opacity * 0.2})`;
        ctx.beginPath();
        ctx.arc(-cloudRadius * 0.2, -2, cloudRadius * 0.3, 0, Math.PI * 2);
        ctx.arc(cloudRadius * 0.7, 2, cloudRadius * 0.2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'kid1':
        // Child enemy with a bright shirt
        ctx.fillStyle = '#fac49f';
        ctx.beginPath();
        ctx.arc(0, -10, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.color;
        ctx.fillRect(-9, -4, 18, 18);
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(-3, -10, 1.5, 0, Math.PI * 2);
        ctx.arc(3, -10, 1.5, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'kid2':
        // Child enemy with a cap
        ctx.fillStyle = '#f7d1ad';
        ctx.beginPath();
        ctx.arc(0, -10, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#222';
        ctx.fillRect(-7, -13, 14, 4);
        ctx.fillStyle = this.color;
        ctx.fillRect(-9, -4, 18, 18);
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(-3, -10, 1.5, 0, Math.PI * 2);
        ctx.arc(3, -10, 1.5, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'kid3':
        // Child enemy with a backpack
        ctx.fillStyle = '#fbcc9c';
        ctx.beginPath();
        ctx.arc(0, -10, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.color;
        ctx.fillRect(-9, -4, 18, 18);
        ctx.fillStyle = '#7b7b7b';
        ctx.fillRect(-11, -2, 4, 14);
        ctx.fillRect(7, -2, 4, 14);
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(-3, -10, 1.5, 0, Math.PI * 2);
        ctx.arc(3, -10, 1.5, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'alien1':
        // Small alien with two antennas
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, -2, this.width / 2, this.height / 2.2, 0, 0, Math.PI * 2);
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(-6, -6, 2, 0, Math.PI * 2);
        ctx.arc(6, -6, 2, 0, Math.PI * 2);
        ctx.fill();
        // Antennas
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-4, -12);
        ctx.lineTo(-10, -22);
        ctx.moveTo(4, -12);
        ctx.lineTo(10, -22);
        ctx.stroke();
        // Antenna tips
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(-10, -22, 2.5, 0, Math.PI * 2);
        ctx.arc(10, -22, 2.5, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'alien2':
        // Slim alien with curved antennas
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, -2, this.width / 2.4, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(-5, -7, 2.2, 0, Math.PI * 2);
        ctx.arc(5, -7, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-3, -12);
        ctx.quadraticCurveTo(-8, -18, -12, -16);
        ctx.moveTo(3, -12);
        ctx.quadraticCurveTo(8, -18, 12, -16);
        ctx.stroke();
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.arc(-12, -16, 2, 0, Math.PI * 2);
        ctx.arc(12, -16, 2, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'alien3':
        // Wider alien with a crown-like antenna array
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 1.8, this.height / 2.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(-7, -4, 2.4, 0, Math.PI * 2);
        ctx.arc(7, -4, 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1.6;
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(i * 4, -10);
          ctx.lineTo(i * 6, -20 - Math.abs(i) * 2);
          ctx.stroke();
          ctx.fillStyle = '#ff8888';
          ctx.beginPath();
          ctx.arc(i * 6, -20 - Math.abs(i) * 2, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
    }

    ctx.restore();
  }
}
