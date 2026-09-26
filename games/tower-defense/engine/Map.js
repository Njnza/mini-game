/**
 * Map.js
 * Manages grid layout, path geometry, placement validation, and futuristic neon rendering.
 */

export class Map {
  constructor(mapData) {
    this.mapData = mapData;
    this.cols = mapData.cols || 20;
    this.rows = mapData.rows || 13;
    this.tileSize = 40; // 20 * 40 = 800w, 13 * 40 = 520h
    this.width = this.cols * this.tileSize;
    this.height = this.rows * this.tileSize;

    this.theme = mapData.theme;
    this.spawns = mapData.spawns || [];
    this.base = mapData.base;
    this.paths = mapData.paths || [];
    this.obstacles = mapData.obstacles || [];

    // Precalculate pixel paths (world waypoints)
    this.pixelPaths = this.paths.map(pathWaypoints => {
      return pathWaypoints.map(pt => ({
        x: (pt.x + 0.5) * this.tileSize,
        y: (pt.y + 0.5) * this.tileSize
      }));
    });

    // Grid matrix: 0 = empty/buildable, 1 = path, 2 = obstacle, 3 = spawn, 4 = base, 5 = tower
    this.grid = Array.from({ length: this.rows }, () => new Array(this.cols).fill(0));

    // Mark paths onto grid
    this.rasterizePaths();

    // Mark obstacles
    for (const obs of this.obstacles) {
      if (this.isValidTile(obs.x, obs.y)) {
        this.grid[obs.y][obs.x] = 2; // obstacle
      }
    }

    // Mark spawns & base
    for (const sp of this.spawns) {
      if (this.isValidTile(sp.x, sp.y)) this.grid[sp.y][sp.x] = 3;
    }
    if (this.isValidTile(this.base.x, this.base.y)) {
      this.grid[this.base.y][this.base.x] = 4;
    }

    // Energy pulse animation phase
    this.animTime = 0;
  }

  /**
   * Rasterize paths onto the discrete tile grid so no towers can be built on the paths
   */
  rasterizePaths() {
    for (const path of this.paths) {
      for (let i = 0; i < path.length - 1; i++) {
        const p1 = path[i];
        const p2 = path[i + 1];

        const minX = Math.min(p1.x, p2.x);
        const maxX = Math.max(p1.x, p2.x);
        const minY = Math.min(p1.y, p2.y);
        const maxY = Math.max(p1.y, p2.y);

        for (let y = minY; y <= maxY; y++) {
          for (let x = minX; x <= maxX; x++) {
            if (this.isValidTile(x, y)) {
              this.grid[y][x] = 1; // path
            }
          }
        }
      }
    }
  }

  isValidTile(tileX, tileY) {
    return tileX >= 0 && tileX < this.cols && tileY >= 0 && tileY < this.rows;
  }

  isBuildable(tileX, tileY) {
    if (!this.isValidTile(tileX, tileY)) return false;
    return this.grid[tileY][tileX] === 0;
  }

  setTowerPlaced(tileX, tileY, placed = true) {
    if (this.isValidTile(tileX, tileY)) {
      this.grid[tileY][tileX] = placed ? 5 : 0;
    }
  }

  worldToTile(x, y) {
    return {
      tileX: Math.floor(x / this.tileSize),
      tileY: Math.floor(y / this.tileSize)
    };
  }

  tileToWorldCenter(tileX, tileY) {
    return {
      x: (tileX + 0.5) * this.tileSize,
      y: (tileY + 0.5) * this.tileSize
    };
  }

  update(dt) {
    this.animTime += dt;
  }

  render(ctx) {
    ctx.save();

    // 1. Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, this.width, this.height);
    bgGrad.addColorStop(0, this.theme.bgGradient[0]);
    bgGrad.addColorStop(1, this.theme.bgGradient[1]);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Subtle grid lines
    ctx.strokeStyle = this.theme.gridColor;
    ctx.lineWidth = 1;
    for (let c = 0; c <= this.cols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * this.tileSize, 0);
      ctx.lineTo(c * this.tileSize, this.height);
      ctx.stroke();
    }
    for (let r = 0; r <= this.rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * this.tileSize);
      ctx.lineTo(this.width, r * this.tileSize);
      ctx.stroke();
    }

    // 3. Render Path Conduits (Roads)
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Base path track
    for (const pixelPath of this.pixelPaths) {
      if (pixelPath.length < 2) continue;

      // Outer glow track
      ctx.strokeStyle = this.theme.pathBorderColor;
      ctx.lineWidth = this.tileSize * 0.72;
      ctx.shadowColor = this.theme.pathPulseColor;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(pixelPath[0].x, pixelPath[0].y);
      for (let i = 1; i < pixelPath.length; i++) {
        ctx.lineTo(pixelPath[i].x, pixelPath[i].y);
      }
      ctx.stroke();

      // Inner conduit groove
      ctx.strokeStyle = this.theme.pathColor;
      ctx.lineWidth = this.tileSize * 0.56;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(pixelPath[0].x, pixelPath[0].y);
      for (let i = 1; i < pixelPath.length; i++) {
        ctx.lineTo(pixelPath[i].x, pixelPath[i].y);
      }
      ctx.stroke();

      // Animated energy pulse line down the center
      ctx.strokeStyle = this.theme.pathPulseColor;
      ctx.lineWidth = 3;
      ctx.shadowColor = this.theme.pathPulseColor;
      ctx.shadowBlur = 6;
      ctx.setLineDash([14, 22]);
      ctx.lineDashOffset = -this.animTime * 45;
      ctx.beginPath();
      ctx.moveTo(pixelPath[0].x, pixelPath[0].y);
      for (let i = 1; i < pixelPath.length; i++) {
        ctx.lineTo(pixelPath[i].x, pixelPath[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;
    }

    // 4. Render Obstacles
    for (const obs of this.obstacles) {
      const cx = (obs.x + 0.5) * this.tileSize;
      const cy = (obs.y + 0.5) * this.tileSize;
      const half = this.tileSize * 0.4;

      ctx.fillStyle = this.theme.obstacleColor;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(cx - half, cy - half, half * 2, half * 2, 6);
      ctx.fill();
      ctx.stroke();

      // Obstacle tech core
      ctx.fillStyle = this.theme.pathPulseColor;
      ctx.globalAlpha = 0.4 + Math.sin(this.animTime * 2 + obs.x) * 0.2;
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    // 5. Render Spawns (Vortex Portals)
    for (const sp of this.spawns) {
      const sx = (sp.x + 0.5) * this.tileSize;
      const sy = (sp.y + 0.5) * this.tileSize;

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(this.animTime * 2);

      ctx.strokeStyle = this.theme.spawnColor;
      ctx.shadowColor = this.theme.spawnColor;
      ctx.shadowBlur = 12;
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.arc(0, 0, this.tileSize * 0.38, 0, Math.PI * 2);
      ctx.stroke();

      // Spinning vortex spikes
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.fillStyle = this.theme.spawnColor;
        ctx.beginPath();
        ctx.arc(this.tileSize * 0.35, 0, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // 6. Render Citadel Core (Player Base)
    const bx = (this.base.x + 0.5) * this.tileSize;
    const by = (this.base.y + 0.5) * this.tileSize;

    // Glowing protective perimeter
    ctx.save();
    ctx.strokeStyle = this.theme.coreColor;
    ctx.shadowColor = this.theme.coreColor;
    ctx.shadowBlur = 16;
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.arc(bx, by, this.tileSize * 0.42, 0, Math.PI * 2);
    ctx.stroke();

    // Rotating energy ring
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(-this.animTime * 1.5);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, this.tileSize * 0.34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Core crystal diamond
    ctx.fillStyle = this.theme.coreColor;
    const pulse = 1 + Math.sin(this.animTime * 4) * 0.15;
    ctx.beginPath();
    ctx.arc(bx, by, 7 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.restore();
  }
}
