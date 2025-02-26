// Fruit skins
export const fruitSkins = {
  default: {
    name: 'Default',
    cost: 0,
    colors: [
      '#f44336', '#e91e63', '#9c27b0', '#ff9800', '#ff5722',
      '#4caf50', '#8bc34a', '#ffeb3b', '#ffc107', '#cddc39', '#2196f3'
    ]
  },
  neon: {
    name: 'Neon',
    cost: 1000,
    colors: [
      '#ff1744', '#f50057', '#d500f9', '#ff6d00', '#ff3d00',
      '#00e676', '#76ff03', '#ffea00', '#ffd600', '#c6ff00', '#2979ff'
    ]
  },
  pastel: {
    name: 'Pastel',
    cost: 1500,
    colors: [
      '#ffcdd2', '#f8bbd0', '#e1bee7', '#ffe0b2', '#ffccbc',
      '#c8e6c9', '#dcedc8', '#fff9c4', '#ffecb3', '#f0f4c3', '#bbdefb'
    ]
  },
  metallic: {
    name: 'Metallic',
    cost: 2000,
    colors: [
      '#b71c1c', '#880e4f', '#4a148c', '#e65100', '#bf360c',
      '#1b5e20', '#33691e', '#f57f17', '#ff6f00', '#827717', '#0d47a1'
    ]
  }
};

// Fruit definitions
export const fruits = [
  {
    name: 'Cherry',
    radius: 15,
    color: '#f44336',
    textColor: '#ffffff',
    score: 1
  },
  {
    name: 'Strawberry',
    radius: 25,
    color: '#e91e63',
    textColor: '#ffffff',
    score: 3
  },
  {
    name: 'Grape',
    radius: 35,
    color: '#9c27b0',
    textColor: '#ffffff',
    score: 6
  },
  {
    name: 'Orange',
    radius: 45,
    color: '#ff9800',
    textColor: '#ffffff',
    score: 10
  },
  {
    name: 'Persimmon',
    radius: 55,
    color: '#ff5722',
    textColor: '#ffffff',
    score: 15
  },
  {
    name: 'Apple',
    radius: 65,
    color: '#4caf50',
    textColor: '#ffffff',
    score: 21
  },
  {
    name: 'Pear',
    radius: 75,
    color: '#8bc34a',
    textColor: '#ffffff',
    score: 28
  },
  {
    name: 'Peach',
    radius: 85,
    color: '#ffeb3b',
    textColor: '#333333',
    score: 36
  },
  {
    name: 'Pineapple',
    radius: 95,
    color: '#ffc107',
    textColor: '#333333',
    score: 45
  },
  {
    name: 'Melon',
    radius: 110,
    color: '#cddc39',
    textColor: '#333333',
    score: 55
  },
  {
    name: 'Watermelon',
    radius: 130,
    color: '#2196f3',
    textColor: '#ffffff',
    score: 66
  }
];

// Fruit factory class
export class Fruit {
  static create(Matter, world, type, x, y) {
    const fruitType = fruits[type];
    const activeSkin = localStorage.getItem('activeFruitSkin') || 'default';
    const skinColor = fruitSkins[activeSkin].colors[type];
    
    const body = Matter.Bodies.circle(
      x, y, fruitType.radius,
      {
        restitution: 0.3,
        friction: 0.01,
        density: 0.001,
        fruitType: type,
        label: fruitType.name,
        fruitTextColor: activeSkin === 'pastel' ? '#333333' : '#ffffff',
        circleRadius: fruitType.radius,
        render: {
          fillStyle: skinColor
        }
      }
    );
    
    Matter.Composite.add(world, body);
    return body;
  }
}