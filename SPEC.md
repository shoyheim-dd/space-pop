# SPACE POP — Game Design Specification

## Overview
**Space Pop** is an arcade-style shoot-em-up inspired by Space Invaders, set in a fizzy soda universe. Players control soda bottles battling waves of invading snack-time enemies. Shoot caps, spray fizz, and unleash carbonation fury!

---

## Core Concept
- **Genre**: Fixed-shooter / arcade
- **Perspective**: Top-down, vertical scrolling
- **Canvas**: 800×600 pixels
- **Target**: Browser (HTML5 Canvas + TypeScript)

---

## Player Characters (Bottles)

| Bottle   | Color   | Weapon            | Special Ability                      | Speed | Fire Rate |
|----------|---------|-------------------|--------------------------------------|-------|-----------|
| Cola     | #500a0a | Bottle cap shots  | **Mentos Drop** – massive explosion  | ★★★   | ★★★       |
| Fanta    | #FF8C00 | Orange fizz spray | **Citrus Burst** – wide spread shot  | ★★    | ★★★★      |
| Sprite   | #7CFC00 | Homing bubbles    | **Lemon Twist** – piercing beam      | ★★★★  | ★★        |
| RootBeer | #8B4513 | Foam blobs (AoE)  | **Foam Tsunami** – screen-wide wave  | ★     | ★★        |

Each bottle has **3 lives** (represented as caps in the HUD).

Current implementation note: player bottles use a slimmer, Coca-Cola-inspired contour silhouette with a more pronounced waist/shoulder profile and 3D glass shading/highlights.

---

## Enemy Types

### Regular Enemies (Waves)
| Enemy       | HP | Behavior                            | Points |
|-------------|----|-------------------------------------|--------|
| Mentos      | 1  | Standard grid movement              | 10     |
| Ice Cube    | 2  | Slow, takes 2 hits, freezes player  | 25     |
| Straw       | 1  | Fast, diagonal movement             | 15     |
| Cup Lid     | 3  | Shield enemy, blocks shots          | 30     |
| Sugar Cube  | 1  | Tiny, appears in swarms             | 5      |

### Mid-Bosses (Every 5 waves)
| Boss              | HP  | Attack Pattern                                    |
|-------------------|-----|---------------------------------------------------|
| Giant Blender     | 50  | Spinning blade projectiles, pulls player toward it|
| Soda Fountain     | 60  | Multi-stream spray, spawns mini-cups              |

### Final Boss
| Boss              | HP   | Attack Pattern                                   |
|-------------------|------|--------------------------------------------------|
| The Crusher       | 100  | Recycling crusher — slams down, shockwaves, spawns crushed-can minions |

---

## Power-Up System

| Power-Up             | Icon  | Effect                           | Duration |
|----------------------|-------|----------------------------------|----------|
| Shake-Up             | 🫧    | Screen-clearing fizz explosion   | Instant  |
| Fresh Cap            | 🧢    | Shield — absorbs 1 hit          | 10s      |
| Double Carbonation   | ⚡    | 2× fire rate                    | 8s       |
| Flavor Mix           | 🌈    | Dual weapon (yours + random)    | 6s       |
| Extra Life           | 🥤    | +1 life                         | Instant  |
| Sidewinder Bottles   | 🍾    | Adds 2 mini side bottles per pickup; stacks additional wingman pairs and lanes | Until next hit |

Power-ups drop randomly from defeated enemies (~10% chance). In the current implementation, Sidewinder Bottles are weighted rarer than other drops.
Sidewinder behavior (current implementation):
- Each pickup adds one stack (+2 side bottles / +2 firing lanes)
- Stacks are persistent and do not expire over time
- All Sidewinder stacks are cleared on the next player hit

---

## Carbonation Meter (Overheat Mechanic)
- Shooting increases the **carbonation meter** (0–100%)
- At **100%** the bottle **goes flat**: cannot shoot for 2 seconds while it "re-fizzes"
- Meter depletes passively (~5%/sec when not shooting)
- Some power-ups reduce carbonation

---

## Combo System
- Hitting enemies in quick succession builds a **combo multiplier**
- Chain window: 1.5 seconds between kills
- Multipliers: ×2 (3 kills), ×3 (6 kills), ×4 (10 kills), ×5 (15+ kills)
- Combo shown as floating text with fizz particles

---

## Wave Structure
- **Waves 1–4**: Mentos & Sugar Cubes (tutorial waves)
- **Wave 5**: Mid-Boss — Giant Blender
- **Waves 6–9**: Mix of Straws, Ice Cubes, Cup Lids
- **Wave 10**: Mid-Boss — Soda Fountain
- **Waves 11–14**: All enemy types, faster patterns
- **Wave 15**: Final Boss — The Crusher
- After Wave 15: Endless mode with increasing speed/density

---

## Controls
| Input           | Action          |
|-----------------|-----------------|
| ← → / A D      | Move left/right |
| ↑ ↓ / W S      | Move up/down (limited range) |
| Space / Click   | Shoot           |
| Shift / RClick  | Special ability (when charged) |
| P / Esc         | Pause           |

Readiness feedback: the player bottle gets a pulsing glow when special charge reaches 100%.

---

## Visual Style
- **Background**: Scrolling deep-space imagery (NASA public-domain assets stored locally), layered with drifting bubbles and starfield effects
- **Color palette**: Neon-on-dark — bright fizzy colors against dark navy
- **Player style**: Slimmer Coca-Cola-inspired contour bottles with 3D shading, gloss streaks, and reflective highlights
- **Power-up icon style**: Sidewinder drop uses a custom tiny contour-bottle icon (with neck/cap/label), plus bottle icon feedback on pickup
- **Enemy style updates**:
    - Straw enemy uses cylindrical 3D shading/highlights to read as a tube
    - Enemy projectiles are glowing mini-stars (instead of flat red dots)
- **Particles**: Fizz spray, cap ricochets, foam splashes, bubble pops
- **Screen shake** on explosions and boss hits

---

## Audio (Future)
- Fizz/pop SFX for shooting
- Clink sound for caps
- Bubbly ambient background music
- Satisfying "pop" on enemy defeat

---

## Scoring
- Points per enemy (see enemy table)
- Combo multiplier applied
- Wave completion bonus: 100 × wave number
- No-damage wave bonus: +500
- Final score displayed on game over screen with fizzy animation

---

## Technical Architecture
```
src/
├── main.ts              # Entry point, game loop
├── game.ts              # Game state manager
├── renderer.ts          # Canvas rendering
├── input.ts             # Keyboard/mouse input handler
├── entities/
│   ├── player.ts        # Player bottle
│   ├── projectile.ts    # Caps, fizz, bubbles, foam
│   ├── enemy.ts         # Enemy base + types
│   ├── boss.ts          # Boss entities
│   └── powerup.ts       # Power-up drops
├── systems/
│   ├── collision.ts     # Collision detection
│   ├── wave.ts          # Wave spawning & progression
│   ├── particles.ts     # Particle effects
│   └── combo.ts         # Combo tracking
└── utils/
    ├── math.ts          # Vector math helpers
    └── constants.ts     # Game constants & config
```

---

## MVP Milestones
1. **M1**: Player movement + shooting on canvas
2. **M2**: Enemy grid + basic AI + collision
3. **M3**: Wave system + scoring
4. **M4**: Power-ups + carbonation meter + combo
5. **M5**: Bosses + game over/restart flow
6. **M6**: Polish — particles, screen shake, UI
7. **M7**: Sound, unlockables, endless mode
