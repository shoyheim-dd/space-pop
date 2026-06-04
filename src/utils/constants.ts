// ─── Game Constants ───

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const PLAYER_Y_MIN = CANVAS_HEIGHT * 0.6; // player can't go above 60% of screen
export const PLAYER_Y_MAX = CANVAS_HEIGHT - 40;

// Carbonation
export const CARBONATION_PER_SHOT = 4;
export const CARBONATION_DECAY_RATE = 5; // per second
export const CARBONATION_FLAT_DURATION = 2000; // ms

// Combo
export const COMBO_WINDOW = 1500; // ms between kills to maintain combo
export const COMBO_THRESHOLDS = [3, 6, 10, 15]; // kills needed for ×2, ×3, ×4, ×5

// Power-ups
export const POWERUP_DROP_CHANCE = 0.10;
export const POWERUP_SHIELD_DURATION = 10000;
export const POWERUP_DOUBLE_CARB_DURATION = 8000;
export const POWERUP_FLAVOR_MIX_DURATION = 6000;

// Scoring
export const WAVE_CLEAR_BONUS_MULTIPLIER = 100;
export const NO_DAMAGE_BONUS = 500;

// Colors
export const COLORS = {
  cola: '#8B0000',
  fanta: '#FF8C00',
  sprite: '#7CFC00',
  rootBeer: '#8B4513',
  background: '#0a0a2e',
  star: '#ffffff',
  bubble: 'rgba(150, 220, 255, 0.3)',
} as const;

export type BottleType = 'cola' | 'fanta' | 'sprite' | 'rootBeer';

export interface BottleConfig {
  name: string;
  color: string;
  speed: number;
  fireRate: number; // shots per second
  projectileType: string;
  specialName: string;
  specialCooldown: number; // ms
}

export const BOTTLES: Record<BottleType, BottleConfig> = {
  cola: {
    name: 'Cola',
    color: COLORS.cola,
    speed: 300,
    fireRate: 5,
    projectileType: 'cap',
    specialName: 'Mentos Drop',
    specialCooldown: 12000,
  },
  fanta: {
    name: 'Fanta',
    color: COLORS.fanta,
    speed: 220,
    fireRate: 7,
    projectileType: 'fizz',
    specialName: 'Citrus Burst',
    specialCooldown: 10000,
  },
  sprite: {
    name: 'Sprite',
    color: COLORS.sprite,
    speed: 350,
    fireRate: 3.5,
    projectileType: 'bubble',
    specialName: 'Lemon Twist',
    specialCooldown: 14000,
  },
  rootBeer: {
    name: 'Root Beer',
    color: COLORS.rootBeer,
    speed: 160,
    fireRate: 3,
    projectileType: 'foam',
    specialName: 'Foam Tsunami',
    specialCooldown: 15000,
  },
};
