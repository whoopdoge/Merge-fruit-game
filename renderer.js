export class CanvasRenderer {
  constructor(element, engine, Matter, options = {}) {
    this.engine = engine;
    this.Matter = Matter;
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d', {
      alpha: false,
      desynchronized: true
    });
    
    this.options = {
      width: options.width || window.innerWidth,
      height: options.height || window.innerHeight,
      background: options.background || '#f0f0f0',
      pixelRatio: options.pixelRatio || window.devicePixelRatio || 1,
      optimizeShadows: options.optimizeShadows || false,
      batchDrawing: options.batchDrawing || false
    };
    
    element.appendChild(this.canvas);
    this.setSize();

    this.isMouseDown = false;
    this.vertexPool = new Float32Array(1000 * 2); // Pool for vertex coordinates
    this.staticBodies = new Set(); // Cache static bodies
    
    this.canvas.addEventListener('mousedown', () => this.isMouseDown = true);
    this.canvas.addEventListener('mouseup', () => this.isMouseDown = false);
    this.canvas.addEventListener('mouseleave', () => this.isMouseDown = false);
  }

  setSize() {
    const { width, height, pixelRatio } = this.options;
    this.canvas.width = width * pixelRatio;
    this.canvas.height = height * pixelRatio;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.context.scale(pixelRatio, pixelRatio);

    if (this.mouseConstraint) {
      this.mouseConstraint.mouse.pixelRatio = pixelRatio;
      this.mouseConstraint.mouse.element = this.canvas;
    }
  }

  render() {
    const { context: ctx } = this;
    const bodies = this.Matter.Composite.allBodies(this.engine.world);

    // Clear canvas with background
    ctx.fillStyle = this.options.background;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Sort bodies by render layer and static state
    if (this.options.batchDrawing) {
      bodies.sort((a, b) => {
        if (a.isStatic !== b.isStatic) return a.isStatic ? -1 : 1;
        return (a.render.fillStyle || '').localeCompare(b.render.fillStyle || '');
      });
    }

    let currentFillStyle = null;
    let vertexCount = 0;

    // Draw game area background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    const gameWidth = Math.min(500, window.innerWidth - 20);
    const gameHeight = Math.min(700, window.innerHeight - 20);
    ctx.fillRect(
      window.innerWidth/2 - gameWidth/2,
      window.innerHeight/2 - gameHeight/2,
      gameWidth,
      gameHeight
    );
    
    ctx.beginPath();
    
    // Batch render bodies
    bodies.forEach(body => {
      if (!body.render.visible) return;

      const vertices = body.vertices;
      
      // Only apply shadows to dynamic bodies when optimizing
      if (this.options.optimizeShadows && !body.isStatic) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
      } else if (!this.options.optimizeShadows) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
      }

      // Batch similar fill styles
      if (this.options.batchDrawing && currentFillStyle !== body.render.fillStyle) {
        if (vertexCount > 0) {
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          vertexCount = 0;
        }
        currentFillStyle = body.render.fillStyle;
        ctx.fillStyle = currentFillStyle;
      }

      // Store vertices in pool
      for (let i = 0; i < vertices.length; i++) {
        this.vertexPool[vertexCount * 2] = vertices[i].x;
        this.vertexPool[vertexCount * 2 + 1] = vertices[i].y;
        vertexCount++;
      }

      ctx.moveTo(vertices[0].x, vertices[0].y);
      for (let j = 1; j < vertices.length; j++) {
        ctx.lineTo(vertices[j].x, vertices[j].y);
      }
      ctx.lineTo(vertices[0].x, vertices[0].y);
      
      // Draw fruit labels if they exist
      if (body.label && !body.isSensor) {
        // Complete the current path
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        vertexCount = 0;
        
        // Draw the fruit name in center
        ctx.font = `${Math.max(14, body.circleRadius/2)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = body.fruitTextColor || '#fff';
        
        // Adjust shadow for text
        ctx.shadowColor = 'rgba(0,0,0,0)';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Avoid overdraw by starting a new path
        if (body.circleRadius) {
          ctx.fillText(body.label, body.position.x, body.position.y);
        }
        
        // Reset for next shape
        currentFillStyle = null;
      }
    });

    // Final batch render
    if (vertexCount > 0) {
      ctx.shadowColor = 'transparent';
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.fill();
      ctx.stroke();
    }

    // Draw drop line indicator
    if (!this.engine.world.gameOver) {
      const dropY = window.innerHeight/2 - gameHeight/2 + 40;
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.moveTo(window.innerWidth/2 - gameWidth/2 + 20, dropY);
      ctx.lineTo(window.innerWidth/2 + gameWidth/2 - 20, dropY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  setMouse(mouseConstraint) {
    this.mouseConstraint = mouseConstraint;
    if (mouseConstraint) {
      mouseConstraint.mouse.element = this.canvas;
      mouseConstraint.mouse.pixelRatio = this.options.pixelRatio;
    }
  }
}