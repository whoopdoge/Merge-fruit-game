import { Fruit, fruits } from './fruits.js';

export class GameManager {
  constructor(engine, world, options) {
    this.engine = engine;
    this.world = world;
    this.options = options;
    this.Matter = options.Matter; // Get Matter reference from options
    
    this.fruitBodies = [];
    this.nextFruitIndex = 0;
    this.score = 0;
    this.gameOver = false;
    
    // Shop-related upgrade variables
    this.startingFruitBonus = 0;
    this.scoreMultiplier = 1;
    this.comboMultiplier = 1;
    this.comboTimer = 0;
    this.comboCount = 0;
    this.frictionModifier = 0.01;
    
    // Set up initial fruit indices (first 5 fruit types only)
    this.prepareNextFruit();
    
    // Set up collision handling
    this.setupCollisionHandling();
    
    // Add dropzone line
    this.dropZoneY = options.dropY;
  }
  
  setupCollisionHandling() {
    // Use the Matter instance passed through the options
    const Matter = this.Matter;
    
    // Listen for collisions
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      if (this.gameOver) return;
      
      const pairs = event.pairs;
      
      for (let i = 0; i < pairs.length; i++) {
        const bodyA = pairs[i].bodyA;
        const bodyB = pairs[i].bodyB;
        
        // Check if both bodies are fruits
        if (bodyA.fruitType !== undefined && bodyB.fruitType !== undefined) {
          // Check if they are the same type of fruit
          if (bodyA.fruitType === bodyB.fruitType) {
            // Don't merge the largest fruit type
            if (bodyA.fruitType < fruits.length - 1) {
              this.mergeFruits(bodyA, bodyB);
            }
          }
        }
      }
    });
  }
  
  mergeFruits(bodyA, bodyB) {
    const Matter = this.Matter;
    
    // Calculate the midpoint between the two fruits
    const midX = (bodyA.position.x + bodyB.position.x) / 2;
    const midY = (bodyA.position.y + bodyB.position.y) / 2;
    
    // Remove the collided fruits
    Matter.Composite.remove(this.world, bodyA);
    Matter.Composite.remove(this.world, bodyB);
    
    this.fruitBodies = this.fruitBodies.filter(b => b !== bodyA && b !== bodyB);
    
    // Create a new, larger fruit
    const newType = bodyA.fruitType + 1;
    const newFruit = Fruit.create(Matter, this.world, newType, midX, midY);
    
    // Add score with multipliers
    let baseScore = fruits[newType].score;
    
    // Apply score multiplier from upgrades
    baseScore = Math.round(baseScore * this.scoreMultiplier);
    
    // Apply combo multiplier if merging quickly
    if (Date.now() - this.comboTimer < 1500) { 
      this.comboCount++;
      const comboBonus = Math.min(this.comboCount * this.comboMultiplier, 5 * this.comboMultiplier);
      baseScore = Math.round(baseScore * (1 + comboBonus/10));
      
      // Show combo message
      if (this.comboCount > 1) {
        this.showComboMessage(this.comboCount);
      }
    } else {
      this.comboCount = 0;
    }
    
    // Update combo timer
    this.comboTimer = Date.now();
    
    // Add score
    this.score += baseScore;
    
    // Add to our tracking array
    this.fruitBodies.push(newFruit);
    
    // Play merge animation (optional)
    this.playMergeAnimation(midX, midY, fruits[newType].color);
    
    // Update score display
    document.getElementById('score').textContent = `Score: ${this.score}`;
  }
  
  removeFruit(fruit) {
    const Matter = this.Matter;
    Matter.Composite.remove(this.world, fruit);
    this.fruitBodies = this.fruitBodies.filter(b => b !== fruit);
  }
  
  playMergeAnimation(x, y, color) {
    // Create particle effect for merges
    const canvas = document.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    
    const particles = [];
    const particleCount = 10;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 3 + Math.random() * 5,
        color: color,
        alpha: 1,
        life: 30 + Math.random() * 20
      });
    }
    
    const particleAnimation = setInterval(() => {
      let finished = true;
      
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02;
        p.life--;
        
        if (p.life > 0) finished = false;
      }
      
      if (finished) clearInterval(particleAnimation);
    }, 16);
  }
  
  showComboMessage(comboCount) {
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.textContent = `${comboCount}x Combo!`;
    messageElement.style.cssText = `
      position: absolute;
      top: 100px;
      left: 50%;
      transform: translateX(-50%);
      color: #f39c12;
      font-size: ${20 + Math.min(comboCount, 10)}px;
      font-weight: bold;
      text-shadow: 0 0 5px rgba(0,0,0,0.3);
      opacity: 1;
      transition: all 0.5s;
      pointer-events: none;
    `;
    
    document.body.appendChild(messageElement);
    
    // Animate and remove after animation
    setTimeout(() => {
      messageElement.style.opacity = 0;
      messageElement.style.transform = 'translateX(-50%) translateY(-50px)';
      
      setTimeout(() => {
        messageElement.remove();
      }, 500);
    }, 500);
  }
  
  prepareNextFruit() {
    // Choose a random fruit with startingFruitBonus applied
    const maxStartingTypeIndex = Math.min(4 + this.startingFruitBonus, fruits.length - 2);
    this.nextFruitIndex = Math.floor(Math.random() * (maxStartingTypeIndex + 1));
  }
  
  dropFruit(x) {
    const Matter = this.Matter;
    
    // Create the fruit at the drop position
    const newFruit = Fruit.create(
      Matter, 
      this.world, 
      this.nextFruitIndex, 
      x, 
      this.dropZoneY
    );
    
    // Apply friction from upgrades
    Matter.Body.set(newFruit, 'friction', this.frictionModifier);
    
    // Add to our tracking array
    this.fruitBodies.push(newFruit);
    
    // Prepare the next fruit
    this.prepareNextFruit();
  }
  
  checkGameOver() {
    if (this.gameOver) return true;
    
    // Check if any fruit crosses the top line
    const topLine = this.options.gameHeight/2 - this.options.gameHeight + 80;
    
    for (const body of this.fruitBodies) {
      // Only check settled bodies (not the one being dropped)
      if (body.speed < 0.1) {
        if (body.position.y < topLine + this.options.wallThickness) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  endGame() {
    this.gameOver = true;
    // Any additional game over logic
  }
  
  reset() {
    const Matter = this.Matter;
    
    // Remove all fruit bodies
    for (const body of this.fruitBodies) {
      Matter.Composite.remove(this.world, body);
    }
    
    // Reset game state
    this.fruitBodies = [];
    this.score = 0;
    this.gameOver = false;
    
    // Reset combo
    this.comboCount = 0;
    this.comboTimer = 0;
    
    this.prepareNextFruit();
  }
}