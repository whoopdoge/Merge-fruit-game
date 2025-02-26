import Matter from 'https://cdn.skypack.dev/matter-js';
import { CanvasRenderer } from './renderer.js';
import { Fruit, fruits } from './fruits.js';
import { GameManager } from './gameManager.js';
import { ShopManager } from './shopManager.js';

// Module aliases
const Engine = Matter.Engine,
  Runner = Matter.Runner,
  Bodies = Matter.Bodies,
  Composite = Matter.Composite,
  Events = Matter.Events,
  Mouse = Matter.Mouse,
  MouseConstraint = Matter.MouseConstraint,
  Grid = Matter.Grid;

// Create engine and world
const engine = Engine.create({
  positionIterations: 6, 
  velocityIterations: 4, 
  constraintIterations: 2,
  enableSleeping: true, 
});

const world = engine.world;

// Configure grid-based broad-phase collision detection
world.grid = Grid.create({
  bucketWidth: 100,
  bucketHeight: 100
});

// Configure engine
engine.gravity.y = 1.5;

// Create custom renderer with optimization flags
const renderer = new CanvasRenderer(document.body, engine, Matter, {
  width: window.innerWidth,
  height: window.innerHeight,
  background: '#f8f4e3',
  pixelRatio: window.devicePixelRatio,
  optimizeShadows: true,
  batchDrawing: true
});

// Game area dimensions
const GAME_WIDTH = Math.min(500, window.innerWidth - 20);
const GAME_HEIGHT = Math.min(700, window.innerHeight - 20);
const WALL_THICKNESS = 20;

// Create game boundaries
const boundaries = [
  // Bottom
  Bodies.rectangle(window.innerWidth/2, window.innerHeight/2 + GAME_HEIGHT/2, GAME_WIDTH, WALL_THICKNESS, { 
    isStatic: true,
    chamfer: { radius: 0 },
    friction: 0.3,
    render: {
      fillStyle: '#2c3e50'
    }
  }),
  // Left wall
  Bodies.rectangle(window.innerWidth/2 - GAME_WIDTH/2, window.innerHeight/2, WALL_THICKNESS, GAME_HEIGHT, { 
    isStatic: true,
    chamfer: { radius: 0 },
    friction: 0.3,
    render: {
      fillStyle: '#2c3e50'
    }
  }),
  // Right wall
  Bodies.rectangle(window.innerWidth/2 + GAME_WIDTH/2, window.innerHeight/2, WALL_THICKNESS, GAME_HEIGHT, { 
    isStatic: true,
    friction: 0.3,
    chamfer: { radius: 0 },
    render: {
      fillStyle: '#2c3e50'
    }
  })
];

// Add boundaries to world
Composite.add(world, boundaries);

// Create game manager with Matter reference
const gameManager = new GameManager(engine, world, {
  gameWidth: GAME_WIDTH,
  gameHeight: GAME_HEIGHT,
  wallThickness: WALL_THICKNESS,
  dropY: window.innerHeight/2 - GAME_HEIGHT/2 + 40,
  Matter: Matter // Pass Matter to GameManager
});

// Create shop manager
const shopManager = new ShopManager(gameManager);

// Create UI elements if they don't exist
if (!document.getElementById('score')) {
  createUIElements();
}

// Function to create UI elements
function createUIElements() {
  const gameUI = document.createElement('div');
  gameUI.id = 'game-ui';
  
  const scoreElement = document.createElement('div');
  scoreElement.id = 'score';
  scoreElement.textContent = 'Score: 0';
  
  const nextFruitElement = document.createElement('div');
  nextFruitElement.id = 'next-fruit';
  nextFruitElement.textContent = 'Next: ';
  
  const nextPreviewElement = document.createElement('div');
  nextPreviewElement.id = 'next-preview';
  nextFruitElement.appendChild(nextPreviewElement);
  
  const gameOverElement = document.createElement('div');
  gameOverElement.id = 'game-over';
  gameOverElement.innerHTML = `
    <h2>Game Over!</h2>
    <p id="final-score">Your score: 0</p>
    <button id="restart-btn">Play Again</button>
  `;
  
  gameUI.appendChild(scoreElement);
  gameUI.appendChild(nextFruitElement);
  gameUI.appendChild(gameOverElement);
  
  document.body.appendChild(gameUI);
}

// Get UI elements
const scoreElement = document.getElementById('score');
const nextPreviewElement = document.getElementById('next-preview');
const gameOverElement = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const shopButton = document.getElementById('shop-button');
const shopContainer = document.getElementById('shop-container');
const shopClose = document.getElementById('shop-close');
const shopPointsElement = document.getElementById('shop-points');

// Setup shop button handlers
shopButton.addEventListener('click', () => {
  shopPointsElement.textContent = `Points: ${gameManager.score}`;
  shopManager.updateShopItems();
  shopContainer.style.display = 'flex';
});

shopClose.addEventListener('click', () => {
  shopContainer.style.display = 'none';
});

// Update UI with game state
function updateUI() {
  scoreElement.textContent = `Score: ${gameManager.score}`;
  shopPointsElement.textContent = `Points: ${gameManager.score}`;
  
  // Update next fruit preview
  const nextFruit = fruits[gameManager.nextFruitIndex];
  nextPreviewElement.style.backgroundColor = nextFruit.color;
  nextPreviewElement.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';
}

// Handle mouse movement for fruit dropping
const dropArea = {
  xMin: window.innerWidth/2 - GAME_WIDTH/2 + WALL_THICKNESS,
  xMax: window.innerWidth/2 + GAME_WIDTH/2 - WALL_THICKNESS,
  y: window.innerHeight/2 - GAME_HEIGHT/2 + 40
};

let previewFruit = null;
let isDropping = false;

// Add mouse control for dropping
document.addEventListener('mousemove', (e) => {
  if (isDropping || gameManager.gameOver || shopContainer.style.display === 'flex') return;
  
  // Create preview fruit if it doesn't exist
  if (!previewFruit) {
    const nextFruit = fruits[gameManager.nextFruitIndex];
    previewFruit = Bodies.circle(
      Math.max(dropArea.xMin, Math.min(e.clientX, dropArea.xMax)),
      dropArea.y,
      nextFruit.radius,
      {
        isSensor: true,
        isStatic: true,
        collisionFilter: { group: -1 },
        render: {
          fillStyle: nextFruit.color
        }
      }
    );
    Composite.add(world, previewFruit);
  }
  
  // Update preview position within bounds
  Matter.Body.setPosition(previewFruit, {
    x: Math.max(dropArea.xMin, Math.min(e.clientX, dropArea.xMax)),
    y: dropArea.y
  });
});

document.addEventListener('click', (e) => {
  if (isDropping || gameManager.gameOver || shopContainer.style.display === 'flex') return;
  
  // Get position from preview fruit or mouse
  const dropX = previewFruit ? previewFruit.position.x : 
                Math.max(dropArea.xMin, Math.min(e.clientX, dropArea.xMax));
  
  isDropping = true;
  
  // Remove preview
  if (previewFruit) {
    Composite.remove(world, previewFruit);
    previewFruit = null;
  }
  
  // Drop the fruit
  gameManager.dropFruit(dropX);
  
  // Wait before allowing next drop
  setTimeout(() => {
    isDropping = false;
    updateUI();
  }, 500);
});

// Event listener for game over
Events.on(engine, 'afterUpdate', () => {
  if (gameManager.checkGameOver() && !gameManager.gameOver) {
    gameManager.endGame();
    finalScoreElement.textContent = `Your score: ${gameManager.score}`;
    gameOverElement.style.display = 'block';
  }
});

// Handle restart button
if (restartBtn) {
  restartBtn.addEventListener('click', () => {
    gameOverElement.style.display = 'none';
    gameManager.reset();
    shopManager.resetUpgrades();
    updateUI();
  });
}

// Throttled resize handler
let resizeTimeout;
window.addEventListener('resize', () => {
  if (resizeTimeout) clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    renderer.options.width = window.innerWidth;
    renderer.options.height = window.innerHeight;
    renderer.setSize();
  }, 100);
});

// Create runner with fixed time step
const runner = Runner.create({
  isFixed: true,
  delta: 1000 / 60
});

// RAF with frame limiting
let lastTime = 0;
const frameInterval = 1000 / 60; 

function animate(currentTime) {
  requestAnimationFrame(animate);
  
  const deltaTime = currentTime - lastTime;
  
  if (deltaTime > frameInterval) {
    lastTime = currentTime - (deltaTime % frameInterval);
    renderer.render();
  }
}

// Initialize UI
updateUI();

// Run the engine
Runner.run(runner, engine);

// Start animation loop
animate(0);

// Export gameManager and shopManager for global access
window.gameManager = gameManager;
window.shopManager = shopManager;