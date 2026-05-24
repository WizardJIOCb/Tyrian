import { loadEquipment, saveEquipment } from "../state.js";
import type { EquipmentState } from "../state.js";

type EnemyKind = "scout" | "tank" | "turret" | "bomber" | "boss";
type PickupKind = "credit" | "power" | "cube";

type EnemySprite = Phaser.Physics.Arcade.Sprite & {
  hp: number;
  maxHp: number;
  kind: EnemyKind;
  credits: number;
  phase: number;
  fireCooldown: number;
};

type ShotSprite = Phaser.Physics.Arcade.Sprite & {
  damage: number;
  pierce: number;
  owner: "player" | "enemy";
};

type PickupSprite = Phaser.Physics.Arcade.Sprite & {
  pickupKind: PickupKind;
  value: number;
};

type SidekickSprite = Phaser.GameObjects.Sprite & {
  offsetX: number;
};

const W = 960;
const H = 540;

export class GameScene extends Phaser.Scene {
  private equipment!: EquipmentState;
  private player!: Phaser.Physics.Arcade.Sprite;
  private shieldVisual!: Phaser.GameObjects.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private playerShots!: Phaser.Physics.Arcade.Group;
  private enemyShots!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private pickups!: Phaser.Physics.Arcade.Group;
  private sidekicks: SidekickSprite[] = [];
  private far?: Phaser.GameObjects.TileSprite;
  private near?: Phaser.GameObjects.TileSprite;
  private nebula?: Phaser.GameObjects.TileSprite;
  private particles?: Phaser.GameObjects.Particles.ParticleEmitter;
  private hp = 100;
  private maxHp = 100;
  private shield = 100;
  private maxShield = 100;
  private energy = 100;
  private maxEnergy = 100;
  private creditsEarned = 0;
  private cubesEarned = 0;
  private waveProgress = 0;
  private frontTimer = 0;
  private rearTimer = 0;
  private sideTimer = 0;
  private enemySpawnTimer = 0;
  private eliteSpawned = false;
  private bossSpawned = false;
  private bossKilled = false;
  private isGameOver = false;
  private isVictory = false;
  private invulnerableUntil = 0;
  private shieldRegenDelayUntil = 0;
  private hpText?: Phaser.GameObjects.Text;
  private shieldText?: Phaser.GameObjects.Text;
  private energyText?: Phaser.GameObjects.Text;
  private scoreText?: Phaser.GameObjects.Text;
  private waveText?: Phaser.GameObjects.Text;
  private centerText?: Phaser.GameObjects.Text;

  constructor() {
    super("GameScene");
  }

  create(): void {
    this.equipment =
      (this.registry.get("equipment") as EquipmentState | undefined) ?? loadEquipment();
    this.registry.set("equipment", this.equipment);
    this.resetRunState();

    this.cameras.main.setBackgroundColor("#05070d");
    this.nebula = this.add.tileSprite(W / 2, H / 2, 1100, 700, "nebula").setAlpha(0.58);
    this.far = this.add.tileSprite(W / 2, H / 2, W, H, "stars-far");
    this.near = this.add.tileSprite(W / 2, H / 2, W, H, "stars-near");

    this.playerShots = this.physics.add.group({ runChildUpdate: false });
    this.enemyShots = this.physics.add.group({ runChildUpdate: false });
    this.enemies = this.physics.add.group({ runChildUpdate: false });
    this.pickups = this.physics.add.group({ runChildUpdate: false });

    this.player = this.physics.add.sprite(W / 2, H - 86, "player");
    this.player.setDepth(10);
    this.physics.world.enable(this.player);
    const playerBody = this.getPlayerBody();
    if (playerBody) {
      playerBody.setCircle(20, 12, 20);
      playerBody.setCollideWorldBounds(true);
      playerBody.setDrag(1200, 1200);
      playerBody.setMaxVelocity(350, 350);
    }
    this.shieldVisual = this.add.sprite(this.player.x, this.player.y, "shield-glow").setDepth(9);
    this.shieldVisual.setBlendMode(Phaser.BlendModes.ADD);

    this.maxHp = 78 + this.equipment.armorLevel * 22;
    this.hp = this.maxHp;
    this.maxShield = 60 + this.equipment.shieldLevel * 30;
    this.shield = this.maxShield;
    this.maxEnergy = 70 + this.equipment.generatorLevel * 34;
    this.energy = this.maxEnergy;

    this.createSidekicks();
    this.createParticles();
    this.createHud();
    this.createInput();
    this.createCollisions();

    this.centerText = this.add
      .text(W / 2, 88, `WAVE ${this.equipment.wave}`, {
        fontFamily: "Arial Black, Arial, sans-serif",
        fontSize: "34px",
        color: "#f2fbff",
        stroke: "#12203a",
        strokeThickness: 5
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: this.centerText,
      alpha: 0,
      y: 58,
      delay: 700,
      duration: 700,
      onComplete: () => this.centerText?.destroy()
    });
  }

  update(time: number, delta: number): void {
    const dt = delta / 1000;
    this.scrollBackground(delta);

    if (this.isGameOver || this.isVictory) {
      this.handleEndInput();
      return;
    }

    this.updatePlayer(dt);
    this.updateShooting(delta);
    this.updateSpawning(delta);
    this.updateEnemies(delta);
    this.updateProjectiles();
    this.updatePickups();
    this.updateHud();
    this.cleanupDeadObjects();

    if (this.bossKilled && this.enemies.countActive(true) === 0) {
      this.completeWave();
    }

    this.waveProgress = Math.min(100, this.waveProgress + dt * (2.7 + this.equipment.wave * 0.13));
    if (this.waveText) {
      this.waveText.setText(`WAVE ${this.equipment.wave}  ${Math.floor(this.waveProgress)}%`);
    }

    this.shieldVisual.setPosition(this.player.x, this.player.y);
    this.shieldVisual.setAlpha(Phaser.Math.Clamp(this.shield / this.maxShield, 0.08, 0.45));
    this.shieldVisual.rotation = time * 0.0012;
  }

  private createInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys("W,A,S,D,SPACE,SHIFT,E,ESC,ENTER") as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;
  }

  private resetRunState(): void {
    this.hp = 100;
    this.maxHp = 100;
    this.shield = 100;
    this.maxShield = 100;
    this.energy = 100;
    this.maxEnergy = 100;
    this.creditsEarned = 0;
    this.cubesEarned = 0;
    this.waveProgress = 0;
    this.frontTimer = 0;
    this.rearTimer = 0;
    this.sideTimer = 0;
    this.enemySpawnTimer = 0;
    this.eliteSpawned = false;
    this.bossSpawned = false;
    this.bossKilled = false;
    this.isGameOver = false;
    this.isVictory = false;
    this.invulnerableUntil = 0;
    this.shieldRegenDelayUntil = 0;
    this.sidekicks = [];
  }

  private createParticles(): void {
    this.particles = this.add.particles(0, 0, "spark", {
      lifespan: { min: 220, max: 520 },
      speed: { min: 40, max: 210 },
      scale: { start: 0.9, end: 0 },
      alpha: { start: 0.9, end: 0 },
      blendMode: "ADD",
      emitting: false
    });
  }

  private createSidekicks(): void {
    this.sidekicks = [];
    if (this.equipment.sidekick === "none") {
      return;
    }

    const texture =
      this.equipment.sidekick === "missile"
        ? "sidekick-missile"
        : this.equipment.sidekick === "beam"
          ? "sidekick-beam"
          : "sidekick-ion";

    for (const offsetX of [-56, 56]) {
      const sprite = this.add.sprite(this.player.x + offsetX, this.player.y + 30, texture) as SidekickSprite;
      sprite.offsetX = offsetX;
      sprite.setDepth(8);
      this.sidekicks.push(sprite);
    }
  }

  private createHud(): void {
    this.add.rectangle(0, 0, W, 42, 0x05070d, 0.9).setOrigin(0, 0).setDepth(50);
    this.add.rectangle(0, H - 34, W, 34, 0x05070d, 0.72).setOrigin(0, 0).setDepth(50);
    this.hpText = this.add.text(16, 12, "", hudStyle("#ffccd4")).setDepth(51);
    this.shieldText = this.add.text(154, 12, "", hudStyle("#d9fbff")).setDepth(51);
    this.energyText = this.add.text(310, 12, "", hudStyle("#fff2b6")).setDepth(51);
    this.scoreText = this.add.text(520, 12, "", hudStyle("#d9ffef")).setDepth(51);
    this.waveText = this.add.text(772, 12, "", hudStyle("#f2fbff")).setDepth(51);

    this.add.text(18, H - 23, "MOVE WASD/ARROWS     FIRE SPACE     SPECIAL E/SHIFT     ESC HANGAR", {
      fontFamily: "Arial, sans-serif",
      fontSize: "12px",
      color: "#8da1b8"
    }).setDepth(51);
  }

  private createCollisions(): void {
    this.physics.add.overlap(this.playerShots, this.enemies, (a, b) => {
      const shot = this.resolveShot(a, b, "player");
      const enemy = this.resolveEnemy(a, b);
      if (shot && enemy) {
        this.hitEnemy(shot, enemy);
      }
    });

    this.physics.add.overlap(this.enemyShots, this.player, (a, b) => {
      const shot = this.resolveShot(a, b, "enemy");
      if (!shot) {
        return;
      }
      const damage = shot.damage;
      const x = shot.x;
      const y = shot.y;
      shot.destroy();
      this.hitPlayer(damage, x, y);
    });

    this.physics.add.overlap(this.enemies, this.player, (a, b) => {
      const target = this.resolveEnemy(a, b);
      if (!target || !target.active) {
        return;
      }

      const didHit = this.hitPlayer(target.kind === "boss" ? 34 : 18, target.x, target.y);
      if (!didHit) {
        return;
      }

      if (target.kind === "boss") {
        this.pushEnemy(target, this.player.x, this.player.y, 180);
      } else {
        this.killEnemy(target, false);
      }
    });

    this.physics.add.overlap(this.pickups, this.player, (a, b) => {
      const pickup = this.resolvePickup(a, b);
      if (pickup) {
        this.collectPickup(pickup);
      }
    });
  }

  private updatePlayer(dt: number): void {
    const body = this.getPlayerBody();
    if (!body) {
      return;
    }
    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const up = this.cursors.up.isDown || this.keys.W.isDown;
    const down = this.cursors.down.isDown || this.keys.S.isDown;

    const speed = 245 + this.equipment.generatorLevel * 16;
    const vx = (right ? 1 : 0) - (left ? 1 : 0);
    const vy = (down ? 1 : 0) - (up ? 1 : 0);
    const vector = new Phaser.Math.Vector2(vx, vy);
    if (vector.lengthSq() > 0) {
      vector.normalize().scale(speed);
      body.setVelocity(vector.x, vector.y);
    } else {
      body.setVelocity(0, 0);
    }

    this.energy = Math.min(this.maxEnergy, this.energy + dt * (24 + this.equipment.generatorLevel * 7));
    if (this.time.now > this.shieldRegenDelayUntil) {
      this.shield = Math.min(this.maxShield, this.shield + dt * (7 + this.equipment.shieldLevel * 1.8));
    }

    this.player.setAngle(Phaser.Math.Clamp(body.velocity.x * 0.04, -13, 13));
    this.sidekicks.forEach((sidekick, index) => {
      const targetX = this.player.x + sidekick.offsetX;
      const targetY = this.player.y + 28 + Math.sin(this.time.now * 0.004 + index) * 5;
      sidekick.x = Phaser.Math.Linear(sidekick.x, targetX, 0.18);
      sidekick.y = Phaser.Math.Linear(sidekick.y, targetY, 0.18);
    });

    if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) {
      saveEquipment(this.equipment);
      this.scene.start("ShopScene");
    }
  }

  private updateShooting(delta: number): void {
    this.frontTimer -= delta;
    this.rearTimer -= delta;
    this.sideTimer -= delta;

    const firing = this.cursors.space.isDown || this.keys.SPACE.isDown;
    if (firing && this.frontTimer <= 0) {
      this.fireFrontWeapon();
    }
    if (firing && this.rearTimer <= 0) {
      this.fireRearWeapon();
    }
    if (firing && this.sideTimer <= 0) {
      this.fireSidekicks();
    }

    const specialPressed =
      Phaser.Input.Keyboard.JustDown(this.keys.E) ||
      Phaser.Input.Keyboard.JustDown(this.keys.SHIFT);
    if (specialPressed) {
      this.fireSpecial();
    }
  }

  private fireFrontWeapon(): void {
    const level = this.equipment.frontLevel;
    if (this.equipment.front === "pulse") {
      if (!this.consumeEnergy(3 + level * 0.4)) {
        return;
      }
      const spread = level >= 4 ? [-14, -7, 0, 7, 14] : level >= 2 ? [-9, 0, 9] : [0];
      spread.forEach((angle) => {
        this.spawnShot(this.player.x, this.player.y - 38, "shot-cyan", angle, 560, 10 + level * 4, 1);
      });
      this.frontTimer = Math.max(78, 165 - level * 16);
      return;
    }

    if (this.equipment.front === "plasma") {
      if (!this.consumeEnergy(7 + level)) {
        return;
      }
      const spread = level >= 3 ? [-12, 0, 12] : [0];
      spread.forEach((angle) => {
        const shot = this.spawnShot(this.player.x, this.player.y - 40, "shot-green", angle, 480, 20 + level * 6, 0);
        shot.setScale(1.1 + level * 0.08);
      });
      this.frontTimer = Math.max(150, 330 - level * 22);
      return;
    }

    if (!this.consumeEnergy(10 + level * 1.6)) {
      return;
    }
    const shot = this.spawnShot(this.player.x, this.player.y - 46, "shot-purple", 0, 760, 30 + level * 10, 2 + Math.floor(level / 2));
    shot.setScale(0.85, 1.35);
    this.frontTimer = Math.max(220, 430 - level * 24);
  }

  private fireRearWeapon(): void {
    const level = this.equipment.rearLevel;
    if (this.equipment.rear === "flare") {
      if (!this.consumeEnergy(2.4 + level * 0.3)) {
        return;
      }
      const spread = level >= 3 ? [-158, 158, 180] : [180];
      spread.forEach((angle) => {
        this.spawnShot(this.player.x, this.player.y + 32, "shot-orange", angle, 420, 7 + level * 3, 1);
      });
      this.rearTimer = Math.max(130, 290 - level * 22);
      return;
    }

    if (this.equipment.rear === "mines") {
      if (!this.consumeEnergy(5 + level)) {
        return;
      }
      const mine = this.spawnShot(this.player.x, this.player.y + 38, "shot-red", 180, 170, 18 + level * 5, 0);
      mine.setScale(1.35);
      mine.setAngularVelocity(260);
      this.rearTimer = Math.max(300, 640 - level * 42);
      return;
    }

    if (!this.consumeEnergy(5 + level * 0.8)) {
      return;
    }
    [-142, 142, 180].forEach((angle) => {
      this.spawnShot(this.player.x, this.player.y + 32, "shot-purple", angle, 410, 11 + level * 4, 1);
    });
    this.rearTimer = Math.max(210, 410 - level * 28);
  }

  private fireSidekicks(): void {
    if (this.sidekicks.length === 0 || !this.consumeEnergy(3.5)) {
      return;
    }

    for (const sidekick of this.sidekicks) {
      if (this.equipment.sidekick === "missile") {
        const shot = this.spawnShot(sidekick.x, sidekick.y - 8, "missile", 0, 360, 18, 0);
        shot.setData("homing", true);
      } else if (this.equipment.sidekick === "beam") {
        const shot = this.spawnShot(sidekick.x, sidekick.y - 10, "shot-purple", 0, 660, 14, 3);
        shot.setScale(0.52, 1.3);
      } else {
        this.spawnShot(sidekick.x, sidekick.y - 12, "shot-cyan", 0, 520, 9, 1);
      }
    }

    this.sideTimer = this.equipment.sidekick === "missile" ? 520 : 250;
  }

  private fireSpecial(): void {
    if (this.equipment.special === "overdrive") {
      if (!this.consumeEnergy(this.maxEnergy * 0.75)) {
        return;
      }
      this.frontTimer = 0;
      this.rearTimer = 0;
      for (let i = 0; i < 16; i += 1) {
        const angle = -70 + i * (140 / 15);
        this.spawnShot(this.player.x, this.player.y - 22, "shot-green", angle, 620, 28 + this.equipment.frontLevel * 5, 1);
      }
      this.cameras.main.shake(140, 0.004);
      return;
    }

    if (!this.consumeEnergy(this.maxEnergy * 0.58)) {
      return;
    }

    const ring = this.add.sprite(this.player.x, this.player.y, "repulsor-ring").setDepth(30);
    ring.setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: ring,
      scale: 5.8,
      alpha: 0,
      duration: 420,
      ease: "Cubic.out",
      onComplete: () => ring.destroy()
    });

    this.enemyShots.children.each((child) => {
      const shot = child as ShotSprite;
      const distance = Phaser.Math.Distance.Between(shot.x, shot.y, this.player.x, this.player.y);
      if (shot.active && distance < 230) {
        shot.destroy();
      }
      return true;
    });

    this.enemies.children.each((child) => {
      const enemy = child as EnemySprite;
      const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      if (enemy.active && distance < 190) {
        enemy.hp -= 48;
        this.pushEnemy(enemy, this.player.x, this.player.y, 260);
        if (enemy.hp <= 0) {
          this.killEnemy(enemy);
        }
      }
      return true;
    });

    this.cameras.main.shake(160, 0.006);
  }

  private updateSpawning(delta: number): void {
    this.enemySpawnTimer -= delta;
    const activeEnemies = this.enemies.countActive(true);
    if (this.waveProgress < 82 && this.enemySpawnTimer <= 0 && activeEnemies < 13) {
      const roll = Math.random();
      const kind: EnemyKind =
        roll < 0.52 ? "scout" : roll < 0.76 ? "turret" : roll < 0.92 ? "tank" : "bomber";
      this.spawnEnemy(kind);
      this.enemySpawnTimer = Math.max(360, 1040 - this.equipment.wave * 42);
    }

    if (!this.eliteSpawned && this.waveProgress > 42) {
      this.eliteSpawned = true;
      this.spawnEnemy("bomber", W * 0.34);
      this.spawnEnemy("tank", W * 0.66);
    }

    if (!this.bossSpawned && this.waveProgress >= 100) {
      this.bossSpawned = true;
      this.spawnEnemy("boss", W / 2);
    }
  }

  private spawnEnemy(kind: EnemyKind, x = Phaser.Math.Between(70, W - 70)): EnemySprite {
    const texture =
      kind === "scout"
        ? "enemy-scout"
        : kind === "tank"
          ? "enemy-tank"
          : kind === "turret"
            ? "enemy-turret"
            : kind === "bomber"
              ? "enemy-bomber"
              : "boss-core";
    const enemy = this.enemies.create(x, kind === "boss" ? -86 : -40, texture) as EnemySprite;
    const wave = this.equipment.wave;
    const stats = {
      scout: { hp: 26 + wave * 3, credits: 55, speed: 98 },
      tank: { hp: 78 + wave * 8, credits: 130, speed: 66 },
      turret: { hp: 50 + wave * 6, credits: 90, speed: 52 },
      bomber: { hp: 120 + wave * 12, credits: 210, speed: 44 },
      boss: { hp: 620 + wave * 85, credits: 1250, speed: 34 }
    }[kind];

    enemy.kind = kind;
    enemy.hp = stats.hp;
    enemy.maxHp = stats.hp;
    enemy.credits = stats.credits + Math.floor(wave * 12);
    enemy.phase = Math.random() * Math.PI * 2;
    enemy.fireCooldown = Phaser.Math.Between(450, 1500);
    enemy.setDepth(kind === "boss" ? 7 : 6);
    enemy.setData("baseX", x);
    enemy.setData("speed", stats.speed);
    if (kind === "boss") {
      enemy.setScale(1.2);
      enemy.setSize(112, 76);
    }

    return enemy;
  }

  private updateEnemies(delta: number): void {
    this.enemies.children.each((child) => {
      const enemy = child as EnemySprite;
      if (!enemy.active) {
        return true;
      }

      const body = enemy.body as Phaser.Physics.Arcade.Body;
      const speed = enemy.getData("speed") as number;
      const t = this.time.now * 0.001 + enemy.phase;

      if (enemy.kind === "boss") {
        const targetY = 102;
        const targetX = W / 2 + Math.sin(t * 0.65) * 230;
        body.setVelocity((targetX - enemy.x) * 1.4, (targetY - enemy.y) * 1.2);
      } else if (enemy.kind === "scout") {
        body.setVelocity(Math.sin(t * 2.2) * 100, speed);
      } else if (enemy.kind === "turret") {
        body.setVelocity(Math.sin(t * 1.4) * 70, speed);
      } else if (enemy.kind === "bomber") {
        body.setVelocity(Math.sin(t * 0.9) * 52, speed);
      } else {
        body.setVelocity(Math.sin(t * 1.1) * 34, speed);
      }

      enemy.fireCooldown -= delta;
      if (enemy.fireCooldown <= 0 && enemy.y > 18 && enemy.y < H - 80) {
        this.enemyFire(enemy);
        enemy.fireCooldown = this.nextEnemyFireDelay(enemy);
      }

      if (enemy.y > H + 90) {
        enemy.destroy();
      }

      return true;
    });
  }

  private enemyFire(enemy: EnemySprite): void {
    if (enemy.kind === "boss") {
      for (let i = -2; i <= 2; i += 1) {
        this.spawnEnemyShot(enemy.x + i * 22, enemy.y + 50, "shot-red", 180 + i * 14, 210, 16);
      }
      this.spawnEnemyShot(enemy.x, enemy.y + 46, "shot-orange", 180, 255, 22);
      return;
    }

    if (enemy.kind === "bomber") {
      [-34, 0, 34].forEach((offset) => {
        this.spawnEnemyShot(enemy.x + offset, enemy.y + 30, "shot-orange", 180, 235, 16);
      });
      return;
    }

    const angle = Phaser.Math.RadToDeg(
      Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y)
    ) + 90;
    const texture = enemy.kind === "turret" ? "shot-green" : "shot-red";
    this.spawnEnemyShot(enemy.x, enemy.y + 18, texture, angle, enemy.kind === "tank" ? 230 : 280, 11);
  }

  private nextEnemyFireDelay(enemy: EnemySprite): number {
    if (enemy.kind === "boss") {
      return Phaser.Math.Between(450, 780);
    }
    if (enemy.kind === "bomber") {
      return Phaser.Math.Between(900, 1300);
    }
    return Phaser.Math.Between(800, 1700);
  }

  private updateProjectiles(): void {
    this.playerShots.children.each((child) => {
      const shot = child as ShotSprite;
      if (!shot.active) {
        return true;
      }
      if (shot.getData("homing")) {
        const target = this.findNearestEnemy(shot.x, shot.y, 300);
        if (target) {
          this.physics.moveToObject(shot, target, 430);
          shot.rotation = Phaser.Math.Angle.Between(shot.x, shot.y, target.x, target.y) + Math.PI / 2;
        }
      }
      if (shot.y < -80 || shot.y > H + 80 || shot.x < -90 || shot.x > W + 90) {
        shot.destroy();
      }
      return true;
    });

    this.enemyShots.children.each((child) => {
      const shot = child as ShotSprite;
      if (!shot.active) {
        return true;
      }
      if (shot.y < -80 || shot.y > H + 80 || shot.x < -90 || shot.x > W + 90) {
        shot.destroy();
      }
      return true;
    });
  }

  private updatePickups(): void {
    this.pickups.children.each((child) => {
      const pickup = child as PickupSprite;
      if (!pickup.active) {
        return true;
      }
      const distance = Phaser.Math.Distance.Between(pickup.x, pickup.y, this.player.x, this.player.y);
      if (distance < 110) {
        this.physics.moveToObject(pickup, this.player, 170 + (110 - distance) * 4);
      }
      if (pickup.y > H + 40) {
        pickup.destroy();
      }
      return true;
    });
  }

  private spawnShot(
    x: number,
    y: number,
    texture: string,
    angleDeg: number,
    speed: number,
    damage: number,
    pierce: number
  ): ShotSprite {
    const shot = this.playerShots.create(x, y, texture) as ShotSprite;
    const radians = Phaser.Math.DegToRad(angleDeg);
    const body = shot.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(Math.sin(radians) * speed, -Math.cos(radians) * speed);
    shot.damage = damage;
    shot.pierce = pierce;
    shot.owner = "player";
    shot.setDepth(5);
    shot.setAngle(angleDeg);
    shot.setBlendMode(Phaser.BlendModes.ADD);
    return shot;
  }

  private spawnEnemyShot(
    x: number,
    y: number,
    texture: string,
    angleDeg: number,
    speed: number,
    damage: number
  ): ShotSprite {
    const shot = this.enemyShots.create(x, y, texture) as ShotSprite;
    const radians = Phaser.Math.DegToRad(angleDeg);
    const body = shot.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(Math.sin(radians) * speed, -Math.cos(radians) * speed);
    shot.damage = damage + Math.floor(this.equipment.wave * 0.9);
    shot.pierce = 0;
    shot.owner = "enemy";
    shot.setDepth(4);
    shot.setAngle(angleDeg);
    shot.setTint(0xffccd4);
    return shot;
  }

  private hitEnemy(shot: ShotSprite, enemy: EnemySprite): void {
    enemy.hp -= shot.damage;
    this.flash(enemy, 0xffffff);
    if (this.particles) {
      this.particles.explode(6, shot.x, shot.y);
    }

    if (enemy.hp <= 0) {
      this.killEnemy(enemy);
    }

    if (shot.pierce > 0) {
      shot.pierce -= 1;
    } else {
      shot.destroy();
    }
  }

  private killEnemy(enemy: EnemySprite, dropLoot = true): void {
    if (!enemy.active) {
      return;
    }

    if (this.particles) {
      this.particles.explode(enemy.kind === "boss" ? 70 : 24, enemy.x, enemy.y);
    }
    this.cameras.main.shake(enemy.kind === "boss" ? 460 : 90, enemy.kind === "boss" ? 0.012 : 0.003);
    if (dropLoot) {
      this.dropLoot(enemy);
    }
    if (enemy.kind === "boss") {
      this.bossKilled = true;
    }
    enemy.destroy();
  }

  private dropLoot(enemy: EnemySprite): void {
    const chunks = enemy.kind === "boss" ? 11 : enemy.kind === "bomber" ? 4 : 2;
    for (let i = 0; i < chunks; i += 1) {
      const value = Math.max(25, Math.floor(enemy.credits / chunks));
      this.spawnPickup("credit", enemy.x + Phaser.Math.Between(-26, 26), enemy.y + Phaser.Math.Between(-16, 24), value);
    }

    const powerChance = enemy.kind === "boss" ? 1 : enemy.kind === "bomber" ? 0.55 : 0.18;
    if (Math.random() < powerChance) {
      this.spawnPickup("power", enemy.x, enemy.y, 1);
    }
    const cubeChance = enemy.kind === "boss" ? 1 : 0.06 + this.equipment.wave * 0.004;
    if (Math.random() < cubeChance) {
      this.spawnPickup("cube", enemy.x + 18, enemy.y, 1);
    }
  }

  private spawnPickup(kind: PickupKind, x: number, y: number, value: number): void {
    const texture =
      kind === "credit" ? "pickup-credit" : kind === "power" ? "pickup-power" : "pickup-cube";
    const pickup = this.pickups.create(x, y, texture) as PickupSprite;
    pickup.pickupKind = kind;
    pickup.value = value;
    pickup.setDepth(3);
    pickup.setVelocity(Phaser.Math.Between(-32, 32), Phaser.Math.Between(60, 120));
    pickup.setAngularVelocity(Phaser.Math.Between(-140, 140));
  }

  private collectPickup(pickup: PickupSprite): void {
    if (!pickup.active || !this.isPickup(pickup)) {
      return;
    }

    if (pickup.pickupKind === "credit") {
      this.creditsEarned += pickup.value;
    } else if (pickup.pickupKind === "power") {
      this.energy = Math.min(this.maxEnergy, this.energy + 35);
      this.shield = Math.min(this.maxShield, this.shield + 25);
    } else {
      this.cubesEarned += 1;
    }

    if (this.particles) {
      this.particles.explode(8, pickup.x, pickup.y);
    }
    pickup.destroy();
  }

  private hitPlayer(damage: number, impactX: number, impactY: number): boolean {
    if (!this.player.active || !Number.isFinite(damage) || damage <= 0) {
      return false;
    }

    if (this.time.now < this.invulnerableUntil) {
      return false;
    }

    this.invulnerableUntil = this.time.now + 420;
    this.shieldRegenDelayUntil = this.time.now + 1300;

    let armorDamage = damage;
    if (this.shield > 0) {
      const guaranteedBleed = damage * 0.18;
      const blocked = Math.min(this.shield, damage - guaranteedBleed);
      this.shield = Math.max(0, this.shield - blocked);
      armorDamage = damage - blocked;
    }

    this.hp -= Math.max(1, armorDamage);
    this.flash(this.player, 0xff5f7a);
    if (this.particles) {
      this.particles.explode(10, impactX, impactY);
    }
    this.cameras.main.shake(90, 0.004);
    if (this.hp <= 0) {
      this.failRun();
    }
    return true;
  }

  private completeWave(): void {
    this.isVictory = true;
    this.equipment.credits += this.creditsEarned + 650 + this.equipment.wave * 180;
    this.equipment.dataCubes += this.cubesEarned + 1;
    this.equipment.wave += 1;
    saveEquipment(this.equipment);
    this.registry.set("equipment", this.equipment);

    this.showEndPanel(
      "WAVE CLEARED",
      `SALVAGE +${this.creditsEarned}   BONUS +${650 + (this.equipment.wave - 1) * 180}   CUBES +${this.cubesEarned + 1}`
    );
  }

  private failRun(): void {
    this.isGameOver = true;
    this.player.setActive(false).setVisible(false);
    if (this.particles) {
      this.particles.explode(90, this.player.x, this.player.y);
    }
    this.equipment.credits += Math.floor(this.creditsEarned * 0.55);
    this.equipment.dataCubes += this.cubesEarned;
    saveEquipment(this.equipment);
    this.registry.set("equipment", this.equipment);
    this.showEndPanel("SHIP LOST", `RECOVERED CREDITS +${Math.floor(this.creditsEarned * 0.55)}   CUBES +${this.cubesEarned}`);
  }

  private showEndPanel(title: string, subtitle: string): void {
    this.add.rectangle(W / 2, H / 2, 470, 188, 0x05070d, 0.88).setDepth(80).setStrokeStyle(2, 0x7df9ff, 0.7);
    this.add
      .text(W / 2, H / 2 - 58, title, {
        fontFamily: "Arial Black, Arial, sans-serif",
        fontSize: "34px",
        color: "#f2fbff",
        stroke: "#12203a",
        strokeThickness: 4
      })
      .setOrigin(0.5)
      .setDepth(81);
    this.add
      .text(W / 2, H / 2 - 8, subtitle, {
        fontFamily: "Arial, sans-serif",
        fontSize: "15px",
        color: "#d9fbff",
        align: "center",
        wordWrap: { width: 410 }
      })
      .setOrigin(0.5)
      .setDepth(81);
    this.add
      .text(W / 2, H / 2 + 48, "SPACE HANGAR   ENTER REPLAY", {
        fontFamily: "Arial Black, Arial, sans-serif",
        fontSize: "14px",
        color: "#fff2b6"
      })
      .setOrigin(0.5)
      .setDepth(81);
  }

  private handleEndInput(): void {
    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
      this.scene.start("ShopScene");
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.ENTER)) {
      this.scene.restart();
    }
  }

  private updateHud(): void {
    if (!Number.isFinite(this.shield)) {
      this.shield = 0;
    }
    if (!Number.isFinite(this.hp)) {
      this.hp = 0;
    }

    this.hpText?.setText(`ARMOR ${Math.max(0, Math.ceil(this.hp))}/${this.maxHp}`);
    this.shieldText?.setText(`SHIELD ${Math.ceil(this.shield)}/${this.maxShield}`);
    this.energyText?.setText(`ENERGY ${Math.ceil(this.energy)}/${this.maxEnergy}`);
    this.scoreText?.setText(`CREDITS +${this.creditsEarned}   CUBES +${this.cubesEarned}`);
  }

  private scrollBackground(delta: number): void {
    if (this.nebula) {
      this.nebula.tilePositionY -= delta * 0.01;
      this.nebula.tilePositionX += delta * 0.004;
    }
    if (this.far) {
      this.far.tilePositionY -= delta * 0.025;
    }
    if (this.near) {
      this.near.tilePositionY -= delta * 0.105;
    }
  }

  private consumeEnergy(amount: number): boolean {
    if (this.energy < amount) {
      return false;
    }
    this.energy -= amount;
    return true;
  }

  private getPlayerBody(): Phaser.Physics.Arcade.Body | undefined {
    const body = this.player.body as Phaser.Physics.Arcade.Body | undefined;
    if (body) {
      return body;
    }

    this.physics.world.enable(this.player);
    return this.player.body as Phaser.Physics.Arcade.Body | undefined;
  }

  private flash(target: Phaser.GameObjects.Sprite, color: number): void {
    target.setTint(color);
    this.time.delayedCall(58, () => {
      if (target.active) {
        target.clearTint();
      }
    });
  }

  private pushEnemy(enemy: EnemySprite, originX: number, originY: number, force: number): void {
    const angle = Phaser.Math.Angle.Between(originX, originY, enemy.x, enemy.y);
    const body = enemy.body as Phaser.Physics.Arcade.Body;
    body.velocity.x += Math.cos(angle) * force;
    body.velocity.y += Math.sin(angle) * force;
  }

  private findNearestEnemy(x: number, y: number, radius: number): EnemySprite | undefined {
    let best: EnemySprite | undefined;
    let bestDistance = radius;
    this.enemies.children.each((child) => {
      const enemy = child as EnemySprite;
      if (!enemy.active) {
        return true;
      }
      const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
      if (distance < bestDistance) {
        best = enemy;
        bestDistance = distance;
      }
      return true;
    });
    return best;
  }

  private resolveShot(
    a: unknown,
    b: unknown,
    owner: "player" | "enemy"
  ): ShotSprite | undefined {
    if (this.isShot(a, owner)) {
      return a;
    }
    if (this.isShot(b, owner)) {
      return b;
    }
    return undefined;
  }

  private resolveEnemy(
    a: unknown,
    b: unknown
  ): EnemySprite | undefined {
    if (this.isEnemy(a)) {
      return a;
    }
    if (this.isEnemy(b)) {
      return b;
    }
    return undefined;
  }

  private resolvePickup(
    a: unknown,
    b: unknown
  ): PickupSprite | undefined {
    if (this.isPickup(a)) {
      return a;
    }
    if (this.isPickup(b)) {
      return b;
    }
    return undefined;
  }

  private isShot(
    value: unknown,
    owner: "player" | "enemy"
  ): value is ShotSprite {
    const shot = value as Partial<ShotSprite>;
    return shot.owner === owner && Number.isFinite(shot.damage);
  }

  private isEnemy(value: unknown): value is EnemySprite {
    const enemy = value as Partial<EnemySprite>;
    return typeof enemy.kind === "string" && Number.isFinite(enemy.hp);
  }

  private isPickup(value: unknown): value is PickupSprite {
    const pickup = value as Partial<PickupSprite>;
    return (
      pickup.pickupKind === "credit" ||
      pickup.pickupKind === "power" ||
      pickup.pickupKind === "cube"
    );
  }

  private cleanupDeadObjects(): void {
    this.playerShots.children.each((child) => {
      if (!child.active) {
        child.destroy();
      }
      return true;
    });
    this.enemyShots.children.each((child) => {
      if (!child.active) {
        child.destroy();
      }
      return true;
    });
  }
}

function hudStyle(color: string): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: "Consolas, monospace",
    fontSize: "15px",
    color
  };
}
