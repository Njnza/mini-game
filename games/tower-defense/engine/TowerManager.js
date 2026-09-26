/**
 * TowerManager.js
 * Manages turret deployment, target acquisition, tactical evolutions, aura buffs, and upgrades.
 */

import { TOWER_TYPES, getTowerStats, calculateSellValue, calculateInvestedGold } from '../data/towers.js';

export class TowerManager {
  constructor(map, projectileManager, fxManager, audioManager) {
    this.map = map;
    this.projectiles = projectileManager;
    this.fx = fxManager;
    this.audio = audioManager;

    this.towers = [];
    this.selectedTower = null;
    this.hoverTile = null;
    this.placementType = null; // typeId when player is placing a tower
  }

  reset() {
    this.towers = [];
    this.selectedTower = null;
    this.hoverTile = null;
    this.placementType = null;
  }

  /**
   * Attempt to build a new turret at grid tile
   */
  buildTower(typeId, tileX, tileY, currentGold) {
    const baseData = TOWER_TYPES[typeId];
    if (!baseData) return { success: false, reason: 'Unknown turret type' };
    if (currentGold < baseData.cost) return { success: false, reason: 'Insufficient Gold' };
    if (!this.map.isBuildable(tileX, tileY)) return { success: false, reason: 'Location Blocked' };

    const center = this.map.tileToWorldCenter(tileX, tileY);
    const stats = getTowerStats(typeId, 1);

    const tower = {
      id: `tower_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type: typeId,
      tileX,
      tileY,
      x: center.x,
      y: center.y,
      tier: 1,
      isEvolved: false,
      evolutionKey: null,
      stats: stats,
      targetMode: 'first', // 'first', 'strongest', 'weakest', 'nearest'
      target: null,
      angle: 0,
      targetAngle: 0,
      cooldown: 0,
      recoil: 0,
      totalDamageDealt: 0,
      killsCount: 0,

      // Aura Buff modifiers computed each frame
      damageBuff: 1.0,
      speedBuff: 1.0,

      // Drones for Drone Hub evolution
      drones: [],

      // Laser ramp up timer for Melter Beam
      melterLockTarget: null,
      melterRampUp: 1.0
    };

    this.towers.push(tower);
    this.map.setTowerPlaced(tileX, tileY, true);

    this.fx.addExplosion(center.x, center.y, baseData.color, 12, 80, 25);
    this.fx.addFloatingText(`-${baseData.cost}G`, center.x, center.y - 12, '#f87171', 12);

    if (this.audio && typeof this.audio.playScore === 'function') {
      this.audio.playScore();
    }

    this.selectedTower = tower;
    return { success: true, cost: baseData.cost, tower };
  }

  /**
   * Upgrade an existing turret
   */
  upgradeTower(tower, evolutionKey = null, currentGold) {
    if (!tower) return { success: false, reason: 'No tower selected' };

    let nextTier = tower.tier + 1;
    let upgradeCost = 0;

    if (tower.tier < 3) {
      upgradeCost = tower.stats.tiers[tower.tier].cost;
    } else if (tower.tier === 3) {
      if (!evolutionKey) return { success: false, reason: 'Must choose an evolution branch' };
      const base = TOWER_TYPES[tower.type];
      const evo = base.evolutions[evolutionKey];
      if (!evo) return { success: false, reason: 'Invalid evolution branch' };
      upgradeCost = evo.cost;
      nextTier = 4;
    } else {
      return { success: false, reason: 'Turret at maximum evolution' };
    }

    if (currentGold < upgradeCost) {
      return { success: false, reason: 'Insufficient Gold for Upgrade' };
    }

    tower.tier = nextTier;
    if (nextTier === 4) {
      tower.isEvolved = true;
      tower.evolutionKey = evolutionKey;
      // Initialize drones if Drone Hub
      if (evolutionKey === 'drone_hub') {
        tower.drones = [
          { angle: 0, radius: 35, speed: 2.2, cooldown: 0 },
          { angle: Math.PI, radius: 35, speed: 2.2, cooldown: 0 }
        ];
      }
    }

    tower.stats = getTowerStats(tower.type, tower.tier, tower.evolutionKey);

    this.fx.addExplosion(tower.x, tower.y, tower.stats.color, 18, 120, 40);
    this.fx.addFloatingText('UPGRADED!', tower.x, tower.y - 14, '#38bdf8', 13);
    this.fx.addFloatingText(`-${upgradeCost}G`, tower.x, tower.y + 10, '#f87171', 11);

    if (this.audio && typeof this.audio.playScore === 'function') {
      this.audio.playScore();
    }

    return { success: true, cost: upgradeCost, tower };
  }

  /**
   * Sell turret with 50% refund
   */
  sellTower(tower) {
    if (!tower) return { success: false, reason: 'No tower selected' };

    const refund = calculateSellValue(tower.type, tower.tier, tower.evolutionKey);
    this.map.setTowerPlaced(tower.tileX, tower.tileY, false);

    const idx = this.towers.indexOf(tower);
    if (idx !== -1) {
      this.towers.splice(idx, 1);
    }

    this.fx.addExplosion(tower.x, tower.y, '#f59e0b', 12, 90, 30);
    this.fx.addFloatingText(`+${refund}G`, tower.x, tower.y - 10, '#10b981', 13);

    if (this.selectedTower === tower) {
      this.selectedTower = null;
    }

    if (this.audio && typeof this.audio.playScore === 'function') {
      this.audio.playScore();
    }

    return { success: true, refund };
  }

  /**
   * Find best target for tower according to targeting rules
   */
  acquireTarget(tower, enemies) {
    const range = tower.stats.range;
    const canHitAir = tower.stats.antiAir;

    // Filter valid enemies in range
    const inRange = [];
    for (const enemy of enemies) {
      if (enemy.dead) continue;
      if (enemy.isAirborne && !canHitAir) continue;

      const d = Math.hypot(enemy.x - tower.x, enemy.y - tower.y);
      if (d <= range) {
        inRange.push({ enemy, dist: d });
      }
    }

    if (inRange.length === 0) return null;

    if (tower.targetMode === 'first') {
      inRange.sort((a, b) => b.enemy.pathProgress - a.enemy.pathProgress);
      return inRange[0].enemy;
    } else if (tower.targetMode === 'weakest') {
      inRange.sort((a, b) => a.enemy.hp - b.enemy.hp);
      return inRange[0].enemy;
    } else if (tower.targetMode === 'strongest') {
      inRange.sort((a, b) => b.enemy.hp - a.enemy.hp);
      return inRange[0].enemy;
    } else if (tower.targetMode === 'nearest') {
      inRange.sort((a, b) => a.dist - b.dist);
      return inRange[0].enemy;
    }

    return inRange[0].enemy;
  }

  update(dt, enemies) {
    // 1. Reset & Calculate Support Tower Auras
    for (const tower of this.towers) {
      tower.damageBuff = 1.0;
      tower.speedBuff = 1.0;
    }

    for (const tower of this.towers) {
      if (tower.type === 'support') {
        const auraRange = tower.stats.range;
        for (const other of this.towers) {
          if (other === tower || other.type === 'support') continue;
          const d = Math.hypot(other.x - tower.x, other.y - tower.y);
          if (d <= auraRange) {
            other.damageBuff = Math.max(other.damageBuff, 1.0 + (tower.stats.buffDamagePct || 0));
            other.speedBuff = Math.max(other.speedBuff, 1.0 + (tower.stats.buffSpeedPct || 0));
          }
        }
      }
    }

    // 2. Update each tower's targeting and firing
    for (const tower of this.towers) {
      // Recoil decay
      if (tower.recoil > 0) {
        tower.recoil = Math.max(0, tower.recoil - dt * 25);
      }

      // Decrement attack cooldown
      if (tower.cooldown > 0) {
        tower.cooldown -= dt;
      }

      if (tower.type === 'support') continue; // Support does not attack

      // Acquire target
      const target = this.acquireTarget(tower, enemies);
      tower.target = target;

      if (target) {
        // Aim barrel towards target smoothly
        tower.targetAngle = Math.atan2(target.y - tower.y, target.x - tower.x);
        const diff = tower.targetAngle - tower.angle;
        // Normalize angle difference to [-PI, PI]
        const normalizedDiff = Math.atan2(Math.sin(diff), Math.cos(diff));
        tower.angle += normalizedDiff * Math.min(dt * 15, 1.0);

        // Firing logic
        if (tower.cooldown <= 0) {
          this.fireTower(tower, target, enemies);
        }
      }

      // Update Drones if Drone Carrier evolution
      if (tower.drones && tower.drones.length > 0) {
        for (const drone of tower.drones) {
          drone.angle += drone.speed * dt;
          const droneX = tower.x + Math.cos(drone.angle) * drone.radius;
          const droneY = tower.y + Math.sin(drone.angle) * drone.radius;

          drone.cooldown -= dt;
          if (drone.cooldown <= 0) {
            // Find target for drone
            const droneTarget = this.acquireTarget(tower, enemies);
            if (droneTarget) {
              this.projectiles.spawnProjectile({
                type: 'drone_laser',
                x: droneX,
                y: droneY,
                target: droneTarget,
                damage: tower.stats.damage * tower.damageBuff,
                speed: 480,
                color: '#38bdf8',
                antiAir: true
              });
              drone.cooldown = 0.45;
            }
          }
        }
      }
    }
  }

  fireTower(tower, target, enemies) {
    const stats = tower.stats;
    const effectiveDamage = Math.round(stats.damage * tower.damageBuff);
    const fireInterval = 1.0 / (stats.fireRate * tower.speedBuff);
    tower.cooldown = fireInterval;
    tower.recoil = 6;

    // Dispatch based on projectile archetype
    if (stats.projectileType === 'railgun_beam') {
      this.projectiles.firePiercingBeam(tower.x, tower.y, target.x, target.y, effectiveDamage, stats.pierce || 6, enemies, stats.color);
      this.fx.triggerShake(4);
    } else if (stats.projectileType === 'continuous_beam' || stats.projectileType === 'prism_beam' || stats.projectileType === 'melter_beam') {
      // Continuous Laser damage tick
      let dmg = effectiveDamage;

      if (stats.id === 'melter_beam') {
        if (tower.melterLockTarget === target) {
          tower.melterRampUp = Math.min(stats.rampUpMultiplier || 3.0, tower.melterRampUp + 0.08);
        } else {
          tower.melterLockTarget = target;
          tower.melterRampUp = 1.0;
        }
        dmg = Math.round(dmg * tower.melterRampUp);
      }

      target.takeDamage(dmg, 'laser');
      this.projectiles.addContinuousLaser(tower.x, tower.y, target.x, target.y, stats.color, 3.5);

      // Prism Laser splits to 2 extra nearby targets!
      if (stats.id === 'prism_laser' && stats.maxTargets > 1) {
        let extra = 0;
        for (const other of enemies) {
          if (other === target || other.dead) continue;
          if (other.isAirborne && !stats.antiAir) continue;
          const d = Math.hypot(other.x - tower.x, other.y - tower.y);
          if (d <= stats.range) {
            other.takeDamage(Math.round(dmg * 0.75), 'laser');
            this.projectiles.addContinuousLaser(tower.x, tower.y, other.x, other.y, stats.color, 2.5);
            extra++;
            if (extra >= stats.maxTargets - 1) break;
          }
        }
      }
    } else {
      // Ballistic, Rocket, or Cryo Shell
      this.projectiles.spawnProjectile({
        type: stats.projectileType,
        x: tower.x,
        y: tower.y,
        target,
        damage: effectiveDamage,
        speed: stats.projectileSpeed,
        color: stats.color,
        splashRadius: stats.splashRadius || 0,
        slowFactor: stats.slowFactor || 0,
        slowDuration: stats.slowDuration || 0,
        stunDuration: stats.stunDuration || 0,
        shatterDmg: stats.shatterDmg || 0,
        bomblets: stats.bomblets || 0,
        antiAir: stats.antiAir || false
      });
    }
  }

  render(ctx) {
    ctx.save();

    // 1. Render Range Indicator for Selected Tower or Placement Hover
    if (this.selectedTower) {
      this.renderRangeCircle(ctx, this.selectedTower.x, this.selectedTower.y, this.selectedTower.stats.range, this.selectedTower.stats.color);
    } else if (this.placementType && this.hoverTile) {
      const center = this.map.tileToWorldCenter(this.hoverTile.tileX, this.hoverTile.tileY);
      const stats = getTowerStats(this.placementType, 1);
      const isBuildable = this.map.isBuildable(this.hoverTile.tileX, this.hoverTile.tileY);
      this.renderRangeCircle(ctx, center.x, center.y, stats.range, isBuildable ? stats.color : '#ef4444');
    }

    // 2. Render Towers
    for (const tower of this.towers) {
      ctx.save();
      ctx.translate(tower.x, tower.y);

      // Support Aura pulse visualization
      if (tower.type === 'support') {
        ctx.strokeStyle = tower.stats.color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.arc(0, 0, tower.stats.range, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }

      // Base Platform (Tech Hexagon/Pad)
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = tower.stats.color;
      ctx.lineWidth = 2;
      ctx.shadowColor = tower.stats.glowColor;
      ctx.shadowBlur = 8;

      ctx.beginPath();
      ctx.roundRect(-16, -16, 32, 32, 6);
      ctx.fill();
      ctx.stroke();

      // Tier Rank Pips / Indicators
      ctx.fillStyle = tower.stats.color;
      for (let p = 0; p < tower.tier; p++) {
        const px = -10 + p * 7;
        ctx.fillRect(px, 11, 4, 3);
      }

      // Overclock / Aura buff indicator
      if (tower.speedBuff > 1.05 || tower.damageBuff > 1.05) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 19, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Turret Head & Rotating Barrels
      ctx.save();
      ctx.rotate(tower.angle);

      // Recoil kickback translation
      ctx.translate(-tower.recoil, 0);

      ctx.fillStyle = tower.stats.color;

      if (tower.type === 'cannon') {
        // Heavy twin cannon barrel
        ctx.fillRect(0, -5, 16, 10);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-8, -8, 16, 16);
      } else if (tower.type === 'gatling') {
        // Multi-barrel rotary
        ctx.fillRect(2, -4, 15, 3);
        ctx.fillRect(2, 1, 15, 3);
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();
      } else if (tower.type === 'rocket') {
        // Quad missile pods
        ctx.fillRect(-2, -7, 14, 5);
        ctx.fillRect(-2, 2, 14, 5);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-8, -8, 12, 16);
      } else if (tower.type === 'laser') {
        // Photon emitter lens
        ctx.beginPath();
        ctx.moveTo(14, 0);
        ctx.lineTo(-4, -6);
        ctx.lineTo(-4, 6);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(4, 0, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (tower.type === 'frost') {
        // Cryo crystal spire
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(0, -7);
        ctx.lineTo(-7, 0);
        ctx.lineTo(0, 7);
        ctx.closePath();
        ctx.fill();
      } else {
        // Support emitter dish
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // Render Drones if Drone Hub
      if (tower.drones && tower.drones.length > 0) {
        for (const drone of tower.drones) {
          const dx = Math.cos(drone.angle) * drone.radius;
          const dy = Math.sin(drone.angle) * drone.radius;
          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(dx, dy, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    }

    ctx.restore();
  }

  renderRangeCircle(ctx, x, y, radius, color) {
    ctx.save();
    // Soft transparent fill
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.12;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Glowing border ring
    ctx.globalAlpha = 0.75;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}
