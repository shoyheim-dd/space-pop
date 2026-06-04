import { Vec2 } from '../utils/math';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants';
import { randomRange } from '../utils/math';

export type EnemyType = 'mentos' | 'iceCube' | 'straw' | 'cupLid' | 'sugarCube';

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
        // Mentos pill shape
        ctx.beginPath();
        ctx.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 12);
        ctx.fill();
        // Letter M
        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('M', 0, 5);
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
    }

    ctx.restore();
  }
}
