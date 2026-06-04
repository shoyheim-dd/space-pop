import { Game } from './game';
import { BottleType, BOTTLES } from './utils/constants';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const startScreen = document.getElementById('start-screen')!;
const startBtn = document.getElementById('start-btn')!;
const bottleSelect = document.getElementById('bottle-select')!;

const game = new Game(canvas);

// Ensure initial overlay state
startScreen.style.display = 'flex';

// Populate bottle selection
const bottleTypes: BottleType[] = ['cola', 'fanta', 'sprite', 'rootBeer', 'candyCup', 'chipBag', 'tree', 'bmwCar'];
const bottleIcons: Record<BottleType, string> = {
  cola: '🥤',
  fanta: '🍊',
  sprite: '🍋',
  rootBeer: '🍺',
  candyCup: '🍬',
  chipBag: '🍟',
  tree: '🌳',
  bmwCar: '🚘',
};

for (const bt of bottleTypes) {
  const div = document.createElement('div');
  div.className = `bottle-option${bt === 'cola' ? ' selected' : ''}`;
  div.dataset.bottle = bt;
  div.innerHTML = `
    <span class="team-badge">${BOTTLES[bt].name} Team</span>
    <span class="bottle-icon">${bottleIcons[bt]}</span>
    <span class="bottle-name">${BOTTLES[bt].name} Team</span>
  `;
  div.addEventListener('click', () => {
    document.querySelectorAll('.bottle-option').forEach(el => el.classList.remove('selected'));
    div.classList.add('selected');
    game.selectedBottle = bt;
  });
  bottleSelect.appendChild(div);
}

// (Info modal removed)

// Start button
startBtn.addEventListener('click', () => {
  startScreen.style.display = 'none';
  game.start();
});

canvas.addEventListener('click', () => {
  if (game.state === 'gameover') {
    startScreen.classList.remove('hidden');
  }
});

// Game loop
let lastTime = 0;

function loop(time: number): void {
  const dt = Math.min((time - lastTime) / 1000, 0.05); // cap dt to avoid spiral
  lastTime = time;

  game.handleMenuPause();
  game.update(dt);
  game.draw();

  requestAnimationFrame(loop);
}

requestAnimationFrame((time) => {
  lastTime = time;
  requestAnimationFrame(loop);
});
