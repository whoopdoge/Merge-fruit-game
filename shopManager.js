import { fruitSkins } from './fruits.js';

export class ShopManager {
  constructor(gameManager) {
    this.gameManager = gameManager;
    this.upgrades = {
      startFruit: {
        name: "Better Starting Fruit",
        description: "Start with a higher level fruit",
        baseCost: 200,
        levelCost: 300,
        maxLevel: 4,
        currentLevel: 0,
        effect: (level) => {
          this.gameManager.startingFruitBonus = level;
        }
      },
      gravity: {
        name: "Reduced Gravity",
        description: "Makes fruits fall slower",
        baseCost: 75,
        levelCost: 150,
        maxLevel: 3,
        currentLevel: 0,
        effect: (level) => {
          const newGravity = Math.max(0.8, 1.5 - (level * 0.25));
          this.gameManager.engine.gravity.y = newGravity;
        }
      },
      scoreMultiplier: {
        name: "Score Multiplier",
        description: "Increase points earned from merges",
        baseCost: 100,
        levelCost: 200,
        maxLevel: 5,
        currentLevel: 0,
        effect: (level) => {
          this.gameManager.scoreMultiplier = 1 + (level * 0.2);
        }
      },
      comboBonus: {
        name: "Combo Bonus",
        description: "Earn extra points for rapid merges",
        baseCost: 150,
        levelCost: 250,
        maxLevel: 3,
        currentLevel: 0,
        effect: (level) => {
          this.gameManager.comboMultiplier = 1 + (level * 0.5);
        }
      },
      friction: {
        name: "Surface Friction",
        description: "Fruits slide less on surfaces",
        baseCost: 80,
        levelCost: 120,
        maxLevel: 3,
        currentLevel: 0,
        effect: (level) => {
          // Apply to all new fruits
          this.gameManager.frictionModifier = 0.01 + (level * 0.05);
        }
      }
    };
    
    this.powerups = {
      removeFruit: {
        name: "Remove Fruit",
        description: "Remove a fruit from the board",
        cost: 200,
        use: () => {
          if (this.gameManager.fruitBodies.length > 0) {
            const highestFruit = this.gameManager.fruitBodies.reduce((prev, current) => {
              return (prev.position.y < current.position.y) ? current : prev;
            });
            
            this.gameManager.removeFruit(highestFruit);
            return true;
          }
          return false;
        }
      },
      slowTime: {
        name: "Slow Time",
        description: "Slow down the game for 10 seconds",
        cost: 150,
        use: () => {
          const originalGravity = this.gameManager.engine.gravity.y;
          this.gameManager.engine.gravity.y *= 0.3;
          
          setTimeout(() => {
            this.gameManager.engine.gravity.y = originalGravity;
          }, 10000);
          
          return true;
        }
      },
      upgradeFruit: {
        name: "Upgrade Next Fruit",
        description: "Get a better fruit for your next drop",
        cost: 100,
        use: () => {
          // Increase next fruit by 1-2 levels
          const maxStartingType = 4;
          this.gameManager.nextFruitIndex = Math.min(
            maxStartingType,
            this.gameManager.nextFruitIndex + 1 + Math.floor(Math.random() * 2)
          );
          return true;
        }
      }
    };
    
    this.skins = fruitSkins;
    this.initShop();
  }
  
  initShop() {
    const shopItemsContainer = document.getElementById('shop-items');
    
    // Create sections
    const upgradesSection = document.createElement('div');
    upgradesSection.innerHTML = '<h3>Upgrades</h3>';
    const powerupsSection = document.createElement('div');
    powerupsSection.innerHTML = '<h3>Power-ups</h3>';
    const skinsSection = document.createElement('div');
    skinsSection.innerHTML = '<h3>Fruit Skins</h3>';
    
    // Add upgrade items
    Object.keys(this.upgrades).forEach(upgradeId => {
      const upgrade = this.upgrades[upgradeId];
      const itemElement = this.createShopItem('upgrade', upgradeId, upgrade);
      upgradesSection.appendChild(itemElement);
    });
    
    // Add powerup items
    Object.keys(this.powerups).forEach(powerupId => {
      const powerup = this.powerups[powerupId];
      const itemElement = this.createShopItem('powerup', powerupId, powerup);
      powerupsSection.appendChild(itemElement);
    });
    
    // Add skin items
    Object.keys(this.skins).forEach(skinId => {
      const skin = this.skins[skinId];
      if (skinId === 'default') return; // Skip default skin
      
      const itemElement = document.createElement('div');
      itemElement.className = 'shop-item';
      itemElement.id = `skin-${skinId}`;
      
      const isOwned = localStorage.getItem(`skin_${skinId}_owned`) === 'true';
      const isActive = localStorage.getItem('activeFruitSkin') === skinId;
      
      itemElement.innerHTML = `
        <div class="shop-item-info">
          <div class="shop-item-title">${skin.name} Skin</div>
          <div class="shop-item-description">A ${skin.name.toLowerCase()} color scheme for your fruits</div>
          <div class="skin-preview">
            ${skin.colors.slice(0, 5).map(color => 
              `<div class="color-preview" style="background-color: ${color}"></div>`
            ).join('')}
          </div>
        </div>
        <button class="shop-buy-button" data-type="skin" data-id="${skinId}">
          ${isOwned ? (isActive ? 'Active' : 'Activate') : `Buy for ${skin.cost}`}
        </button>
      `;
      
      skinsSection.appendChild(itemElement);
    });
    
    // Add sections to shop
    shopItemsContainer.appendChild(upgradesSection);
    shopItemsContainer.appendChild(powerupsSection);
    shopItemsContainer.appendChild(skinsSection);
    
    // Add buy button event listeners
    document.querySelectorAll('.shop-buy-button').forEach(button => {
      button.addEventListener('click', (e) => {
        const itemType = e.target.dataset.type;
        const itemId = e.target.dataset.id;
        
        if (itemType === 'upgrade') {
          this.purchaseUpgrade(itemId);
        } else if (itemType === 'powerup') {
          this.purchasePowerup(itemId);
        } else if (itemType === 'skin') {
          this.purchaseSkin(itemId);
        }
      });
    });
  }
  
  purchaseSkin(skinId) {
    const skin = this.skins[skinId];
    const isOwned = localStorage.getItem(`skin_${skinId}_owned`) === 'true';
    
    if (isOwned) {
      // Activate owned skin
      localStorage.setItem('activeFruitSkin', skinId);
      this.showMessage(`Activated ${skin.name} skin!`);
      this.updateShopItems();
      return;
    }
    
    if (this.gameManager.score >= skin.cost) {
      this.gameManager.score -= skin.cost;
      localStorage.setItem(`skin_${skinId}_owned`, 'true');
      localStorage.setItem('activeFruitSkin', skinId);
      
      // Update UI
      this.updateShopItems();
      document.getElementById('score').textContent = `Score: ${this.gameManager.score}`;
      document.getElementById('shop-points').textContent = `Points: ${this.gameManager.score}`;
      
      this.showMessage(`Purchased ${skin.name} skin!`);
    } else {
      this.showMessage("Not enough points!");
    }
  }
  
  createShopItem(type, id, item) {
    const itemElement = document.createElement('div');
    itemElement.className = 'shop-item';
    itemElement.id = `${type}-${id}`;
    
    if (type === 'upgrade') {
      itemElement.innerHTML = `
        <div class="shop-item-info">
          <div class="shop-item-title">${item.name}</div>
          <div class="shop-item-description">${item.description}</div>
          <div class="shop-item-level">Level: ${item.currentLevel}/${item.maxLevel}</div>
        </div>
        <button class="shop-buy-button" data-type="${type}" data-id="${id}">
          ${item.currentLevel >= item.maxLevel ? 'Max Level' : `Buy for ${this.getUpgradeCost(id)}`}
        </button>
      `;
    } else if (type === 'powerup') {
      itemElement.innerHTML = `
        <div class="shop-item-info">
          <div class="shop-item-title">${item.name}</div>
          <div class="shop-item-description">${item.description}</div>
        </div>
        <button class="shop-buy-button" data-type="${type}" data-id="${id}">
          Buy for ${item.cost}
        </button>
      `;
    }
    
    return itemElement;
  }
  
  getUpgradeCost(upgradeId) {
    const upgrade = this.upgrades[upgradeId];
    return upgrade.baseCost + (upgrade.currentLevel * upgrade.levelCost);
  }
  
  purchaseUpgrade(upgradeId) {
    const upgrade = this.upgrades[upgradeId];
    const cost = this.getUpgradeCost(upgradeId);
    
    if (upgrade.currentLevel >= upgrade.maxLevel) {
      this.showMessage("Maximum level reached!");
      return;
    }
    
    if (this.gameManager.score >= cost) {
      this.gameManager.score -= cost;
      upgrade.currentLevel++;
      
      // Apply the upgrade effect
      upgrade.effect(upgrade.currentLevel);
      
      // Update UI
      this.updateShopItems();
      document.getElementById('score').textContent = `Score: ${this.gameManager.score}`;
      document.getElementById('shop-points').textContent = `Points: ${this.gameManager.score}`;
      
      this.showMessage(`Upgraded ${upgrade.name} to level ${upgrade.currentLevel}!`);
    } else {
      this.showMessage("Not enough points!");
    }
  }
  
  purchasePowerup(powerupId) {
    const powerup = this.powerups[powerupId];
    
    if (this.gameManager.score >= powerup.cost) {
      // Try to use the powerup
      if (powerup.use()) {
        this.gameManager.score -= powerup.cost;
        
        // Update UI
        document.getElementById('score').textContent = `Score: ${this.gameManager.score}`;
        document.getElementById('shop-points').textContent = `Points: ${this.gameManager.score}`;
        
        this.showMessage(`Used ${powerup.name}!`);
        
        // Close shop after using powerup
        document.getElementById('shop-container').style.display = 'none';
      } else {
        this.showMessage("Couldn't use powerup right now!");
      }
    } else {
      this.showMessage("Not enough points!");
    }
  }
  
  showMessage(text) {
    // Create message element if it doesn't exist
    let messageElement = document.getElementById('shop-message');
    if (!messageElement) {
      messageElement = document.createElement('div');
      messageElement.id = 'shop-message';
      messageElement.style.cssText = `
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        opacity: 0;
        transition: opacity 0.3s;
        z-index: 1000;
      `;
      document.body.appendChild(messageElement);
    }
    
    // Show message
    messageElement.textContent = text;
    messageElement.style.opacity = 1;
    
    // Hide after 2 seconds
    setTimeout(() => {
      messageElement.style.opacity = 0;
    }, 2000);
  }
  
  updateShopItems() {
    // Update upgrade items
    Object.keys(this.upgrades).forEach(upgradeId => {
      const upgrade = this.upgrades[upgradeId];
      const itemElement = document.getElementById(`upgrade-${upgradeId}`);
      
      if (itemElement) {
        const levelElement = itemElement.querySelector('.shop-item-level');
        const buttonElement = itemElement.querySelector('.shop-buy-button');
        
        levelElement.textContent = `Level: ${upgrade.currentLevel}/${upgrade.maxLevel}`;
        
        if (upgrade.currentLevel >= upgrade.maxLevel) {
          buttonElement.disabled = true;
          buttonElement.textContent = 'Max Level';
        } else {
          const cost = this.getUpgradeCost(upgradeId);
          buttonElement.textContent = `Buy for ${cost}`;
          buttonElement.disabled = this.gameManager.score < cost;
        }
      }
    });
    
    // Update powerup items
    Object.keys(this.powerups).forEach(powerupId => {
      const powerup = this.powerups[powerupId];
      const itemElement = document.getElementById(`powerup-${powerupId}`);
      
      if (itemElement) {
        const buttonElement = itemElement.querySelector('.shop-buy-button');
        buttonElement.disabled = this.gameManager.score < powerup.cost;
      }
    });
    
    // Update skin items
    Object.keys(this.skins).forEach(skinId => {
      const skin = this.skins[skinId];
      if (skinId === 'default') return; // Skip default skin
      
      const itemElement = document.getElementById(`skin-${skinId}`);
      
      if (itemElement) {
        const buttonElement = itemElement.querySelector('.shop-buy-button');
        const isOwned = localStorage.getItem(`skin_${skinId}_owned`) === 'true';
        const isActive = localStorage.getItem('activeFruitSkin') === skinId;
        
        buttonElement.textContent = isOwned ? (isActive ? 'Active' : 'Activate') : `Buy for ${skin.cost}`;
        buttonElement.disabled = isOwned && isActive || this.gameManager.score < skin.cost;
      }
    });
  }
  
  resetUpgrades() {
    // Reset all upgrades to initial state
    Object.keys(this.upgrades).forEach(upgradeId => {
      const upgrade = this.upgrades[upgradeId];
      upgrade.currentLevel = 0;
      upgrade.effect(0);
    });
    
    // Update UI
    this.updateShopItems();
  }
}