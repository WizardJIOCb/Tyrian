export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create(): void {
    this.createStarfield("stars-far", 512, 512, 90, 0.35, 2);
    this.createStarfield("stars-near", 512, 512, 46, 0.85, 4);
    this.createNebula("nebula", 768, 768);
    this.createShips();
    this.createProjectiles();
    this.createPickupsAndEffects();
    this.createPremiumSprites();
    this.scene.start("TitleScene");
  }

  private createStarfield(
    key: string,
    width: number,
    height: number,
    count: number,
    alpha: number,
    maxRadius: number
  ): void {
    const texture = this.textures.createCanvas(key, width, height);
    if (!texture) {
      return;
    }
    const canvas = texture.getSourceImage() as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < count; i += 1) {
      const x = seededNoise(i * 31.7) * width;
      const y = seededNoise(i * 77.1 + 15) * height;
      const radius = 0.4 + seededNoise(i * 13.9) * maxRadius;
      const brightness = alpha * (0.45 + seededNoise(i * 9.3) * 0.55);
      ctx.fillStyle = `rgba(200, 240, 255, ${brightness.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    texture.refresh();
  }

  private createNebula(key: string, width: number, height: number): void {
    const texture = this.textures.createCanvas(key, width, height);
    if (!texture) {
      return;
    }
    const canvas = texture.getSourceImage() as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#05070d";
    ctx.fillRect(0, 0, width, height);

    const clouds = [
      { x: 0.23, y: 0.18, r: 0.34, c0: "rgba(0, 210, 255, 0.18)", c1: "rgba(0, 30, 60, 0)" },
      { x: 0.72, y: 0.34, r: 0.28, c0: "rgba(255, 84, 114, 0.13)", c1: "rgba(50, 0, 30, 0)" },
      { x: 0.52, y: 0.76, r: 0.38, c0: "rgba(255, 192, 71, 0.12)", c1: "rgba(60, 24, 0, 0)" },
      { x: 0.9, y: 0.86, r: 0.24, c0: "rgba(106, 255, 188, 0.12)", c1: "rgba(0, 50, 32, 0)" }
    ];

    for (const cloud of clouds) {
      const gradient = ctx.createRadialGradient(
        cloud.x * width,
        cloud.y * height,
        0,
        cloud.x * width,
        cloud.y * height,
        cloud.r * width
      );
      gradient.addColorStop(0, cloud.c0);
      gradient.addColorStop(1, cloud.c1);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    texture.refresh();
  }

  private createShips(): void {
    const g = this.add.graphics();

    g.clear();
    g.fillGradientStyle(0x7df9ff, 0x7df9ff, 0x263a71, 0x263a71, 1);
    g.lineStyle(3, 0xd9fbff, 0.9);
    g.beginPath();
    g.moveTo(32, 3);
    g.lineTo(53, 61);
    g.lineTo(38, 52);
    g.lineTo(32, 74);
    g.lineTo(26, 52);
    g.lineTo(11, 61);
    g.closePath();
    g.fillPath();
    g.strokePath();
    g.fillStyle(0x101827, 0.9);
    g.fillTriangle(32, 15, 42, 48, 22, 48);
    g.fillStyle(0x7df9ff, 1);
    g.fillCircle(32, 34, 5);
    g.fillStyle(0xffd36a, 0.9);
    g.fillCircle(21, 60, 4);
    g.fillCircle(43, 60, 4);
    g.generateTexture("player", 64, 78);

    g.clear();
    g.fillGradientStyle(0xff5f7a, 0xff5f7a, 0x7a1525, 0x7a1525, 1);
    g.lineStyle(2, 0xffccd4, 0.85);
    g.fillTriangle(24, 4, 45, 42, 3, 42);
    g.strokeTriangle(24, 4, 45, 42, 3, 42);
    g.fillStyle(0x101827, 0.95);
    g.fillCircle(24, 28, 8);
    g.fillStyle(0xffd36a, 1);
    g.fillCircle(24, 28, 3);
    g.generateTexture("enemy-scout", 48, 48);

    g.clear();
    g.fillGradientStyle(0xffd36a, 0xffd36a, 0x7f3d16, 0x7f3d16, 1);
    g.lineStyle(2, 0xfff2b6, 0.8);
    g.fillRoundedRect(5, 6, 54, 42, 8);
    g.strokeRoundedRect(5, 6, 54, 42, 8);
    g.fillStyle(0x21334a, 1);
    g.fillCircle(22, 27, 10);
    g.fillCircle(42, 27, 10);
    g.fillStyle(0xff5f7a, 1);
    g.fillCircle(22, 27, 4);
    g.fillCircle(42, 27, 4);
    g.generateTexture("enemy-tank", 64, 58);

    g.clear();
    g.fillGradientStyle(0x5df7ae, 0x5df7ae, 0x165043, 0x165043, 1);
    g.lineStyle(2, 0xd9ffef, 0.8);
    g.fillCircle(28, 28, 23);
    g.strokeCircle(28, 28, 23);
    g.fillStyle(0x07111f, 0.95);
    g.fillCircle(28, 28, 12);
    g.lineStyle(5, 0xff5f7a, 0.9);
    g.lineBetween(28, 28, 28, 55);
    g.generateTexture("enemy-turret", 56, 62);

    g.clear();
    g.fillGradientStyle(0xba8cff, 0xba8cff, 0x322061, 0x322061, 1);
    g.lineStyle(2, 0xe8dcff, 0.85);
    g.beginPath();
    g.moveTo(40, 4);
    g.lineTo(75, 34);
    g.lineTo(58, 63);
    g.lineTo(40, 54);
    g.lineTo(22, 63);
    g.lineTo(5, 34);
    g.closePath();
    g.fillPath();
    g.strokePath();
    g.fillStyle(0xffd36a, 0.85);
    g.fillCircle(40, 32, 9);
    g.generateTexture("enemy-bomber", 80, 70);

    g.clear();
    g.fillGradientStyle(0xff5f7a, 0x7df9ff, 0x1e2444, 0x2b1128, 1);
    g.lineStyle(4, 0xf2fbff, 0.9);
    g.fillEllipse(80, 66, 132, 90);
    g.strokeEllipse(80, 66, 132, 90);
    g.fillStyle(0x07111f, 0.95);
    g.fillEllipse(80, 66, 70, 46);
    g.fillStyle(0xffd36a, 1);
    g.fillCircle(80, 66, 16);
    g.lineStyle(8, 0x7df9ff, 0.65);
    g.lineBetween(21, 66, 1, 90);
    g.lineBetween(139, 66, 159, 90);
    g.generateTexture("boss-core", 160, 122);

    g.clear();
    g.fillGradientStyle(0x7df9ff, 0x7df9ff, 0x1d6f89, 0x1d6f89, 1);
    g.lineStyle(2, 0xd9fbff, 0.9);
    g.fillEllipse(18, 18, 28, 34);
    g.strokeEllipse(18, 18, 28, 34);
    g.fillStyle(0x07111f, 0.9);
    g.fillCircle(18, 18, 7);
    g.generateTexture("sidekick-ion", 36, 36);

    g.clear();
    g.fillGradientStyle(0xffd36a, 0xffd36a, 0x7f3d16, 0x7f3d16, 1);
    g.lineStyle(2, 0xfff2b6, 0.9);
    g.fillTriangle(18, 2, 32, 31, 4, 31);
    g.strokeTriangle(18, 2, 32, 31, 4, 31);
    g.generateTexture("sidekick-missile", 36, 36);

    g.clear();
    g.fillGradientStyle(0xba8cff, 0xba8cff, 0x3a2770, 0x3a2770, 1);
    g.lineStyle(2, 0xe8dcff, 0.9);
    g.fillRoundedRect(6, 8, 24, 20, 6);
    g.strokeRoundedRect(6, 8, 24, 20, 6);
    g.fillStyle(0x7df9ff, 1);
    g.fillCircle(18, 18, 5);
    g.generateTexture("sidekick-beam", 36, 36);

    g.destroy();
  }

  private createProjectiles(): void {
    const g = this.add.graphics();

    this.makeShot(g, "shot-cyan", 0x7df9ff, 0xd9fbff, 10, 24);
    this.makeShot(g, "shot-green", 0x5df7ae, 0xd9ffef, 16, 30);
    this.makeShot(g, "shot-orange", 0xffd36a, 0xfff2b6, 14, 26);
    this.makeShot(g, "shot-red", 0xff5f7a, 0xffccd4, 12, 22);
    this.makeShot(g, "shot-purple", 0xba8cff, 0xe8dcff, 10, 42);

    g.clear();
    g.fillGradientStyle(0xffd36a, 0xffd36a, 0xff5f7a, 0xff5f7a, 1);
    g.lineStyle(2, 0xfff2b6, 0.9);
    g.fillTriangle(10, 0, 20, 28, 0, 28);
    g.strokeTriangle(10, 0, 20, 28, 0, 28);
    g.generateTexture("missile", 20, 30);

    g.clear();
    g.lineStyle(5, 0x7df9ff, 0.75);
    g.strokeCircle(48, 48, 42);
    g.lineStyle(2, 0xd9fbff, 0.6);
    g.strokeCircle(48, 48, 27);
    g.generateTexture("repulsor-ring", 96, 96);

    g.destroy();
  }

  private makeShot(
    g: Phaser.GameObjects.Graphics,
    key: string,
    fill: number,
    glow: number,
    width: number,
    height: number
  ): void {
    g.clear();
    g.fillStyle(glow, 0.3);
    g.fillEllipse(width, height / 2, width * 1.8, height);
    g.fillStyle(fill, 1);
    g.fillRoundedRect(width * 0.5, 2, width, height - 4, width / 2);
    g.lineStyle(1, glow, 0.9);
    g.strokeRoundedRect(width * 0.5, 2, width, height - 4, width / 2);
    g.generateTexture(key, width * 2, height);
  }

  private createPickupsAndEffects(): void {
    const g = this.add.graphics();

    g.clear();
    g.fillGradientStyle(0xffd36a, 0xfff2b6, 0x9b5b1d, 0x9b5b1d, 1);
    g.lineStyle(2, 0xfff2b6, 0.9);
    g.fillCircle(16, 16, 13);
    g.strokeCircle(16, 16, 13);
    g.fillStyle(0x07111f, 0.75);
    g.fillRect(14, 7, 4, 18);
    g.generateTexture("pickup-credit", 32, 32);

    g.clear();
    g.fillGradientStyle(0x5df7ae, 0xd9ffef, 0x165043, 0x165043, 1);
    g.lineStyle(2, 0xd9ffef, 0.9);
    g.fillCircle(16, 16, 13);
    g.strokeCircle(16, 16, 13);
    g.fillStyle(0x07111f, 0.75);
    g.fillTriangle(14, 6, 24, 16, 14, 26);
    g.generateTexture("pickup-power", 32, 32);

    g.clear();
    g.fillGradientStyle(0xba8cff, 0xe8dcff, 0x3a2770, 0x3a2770, 1);
    g.lineStyle(2, 0xe8dcff, 0.9);
    g.fillRect(5, 5, 22, 22);
    g.strokeRect(5, 5, 22, 22);
    g.fillStyle(0x7df9ff, 0.8);
    g.fillRect(11, 11, 10, 10);
    g.generateTexture("pickup-cube", 32, 32);

    g.clear();
    g.fillStyle(0xffd36a, 1);
    g.fillCircle(8, 8, 8);
    g.fillStyle(0xffffff, 0.85);
    g.fillCircle(8, 8, 3);
    g.generateTexture("spark", 16, 16);

    g.clear();
    g.fillStyle(0x7df9ff, 0.28);
    g.fillCircle(48, 48, 46);
    g.lineStyle(3, 0xd9fbff, 0.75);
    g.strokeCircle(48, 48, 44);
    g.generateTexture("shield-glow", 96, 96);

    g.destroy();
  }

  private createPremiumSprites(): void {
    this.replaceCanvasTexture("player", 86, 104, (ctx, w, h) => {
      drawGlow(ctx, w / 2, h * 0.68, 42, "rgba(125,249,255,0.34)");
      drawEngine(ctx, w * 0.34, h * 0.77, 7, 22, "#ffb15f");
      drawEngine(ctx, w * 0.66, h * 0.77, 7, 22, "#ffb15f");
      drawHull(ctx, [
        [w * 0.19, h * 0.58],
        [w * 0.36, h * 0.34],
        [w * 0.44, h * 0.68],
        [w * 0.31, h * 0.86],
        [w * 0.13, h * 0.76]
      ], "#5fd8ff", "#18355c", "#d9fbff");
      drawHull(ctx, [
        [w * 0.81, h * 0.58],
        [w * 0.64, h * 0.34],
        [w * 0.56, h * 0.68],
        [w * 0.69, h * 0.86],
        [w * 0.87, h * 0.76]
      ], "#5fd8ff", "#18355c", "#d9fbff");
      drawHull(ctx, [
        [w * 0.5, 5],
        [w * 0.64, h * 0.48],
        [w * 0.58, h * 0.82],
        [w * 0.5, h * 0.94],
        [w * 0.42, h * 0.82],
        [w * 0.36, h * 0.48]
      ], "#e8fdff", "#31567b", "#f2fbff");
      drawHull(ctx, [
        [w * 0.5, h * 0.18],
        [w * 0.59, h * 0.55],
        [w * 0.5, h * 0.71],
        [w * 0.41, h * 0.55]
      ], "#215c85", "#07111f", "#7df9ff", 0.95);
      roundedPanel(ctx, w * 0.29, h * 0.68, 13, 18, 5, "#0f2137", "#040910", "#7df9ff");
      roundedPanel(ctx, w * 0.56, h * 0.68, 13, 18, 5, "#0f2137", "#040910", "#7df9ff");
      drawEllipse(ctx, w * 0.5, h * 0.39, 16, 10, "#062034", "#7df9ff", 2);
      drawGlow(ctx, w * 0.5, h * 0.39, 11, "rgba(125,249,255,0.9)");
      drawEllipse(ctx, w * 0.5, h * 0.39, 7, 5, "#d9fbff", "#ffffff", 1);
      drawPanelLines(ctx, w, h, "#d9fbff");
    });

    this.replaceCanvasTexture("enemy-scout", 64, 58, (ctx, w, h) => {
      drawGlow(ctx, w / 2, h / 2, 28, "rgba(255,95,122,0.32)");
      drawHull(ctx, [
        [w * 0.5, 5],
        [w * 0.72, h * 0.42],
        [w * 0.92, h * 0.7],
        [w * 0.61, h * 0.64],
        [w * 0.5, h * 0.9],
        [w * 0.39, h * 0.64],
        [w * 0.08, h * 0.7],
        [w * 0.28, h * 0.42]
      ], "#ff8a9e", "#561423", "#ffd0d7");
      roundedPanel(ctx, w * 0.27, h * 0.4, w * 0.46, h * 0.28, 9, "#202842", "#080b14", "#ff9bac");
      drawGlow(ctx, w * 0.5, h * 0.53, 12, "rgba(255,211,106,0.75)");
      drawEllipse(ctx, w * 0.5, h * 0.53, 7, 7, "#ffd36a", "#fff2b6", 1);
    });

    this.replaceCanvasTexture("enemy-tank", 78, 68, (ctx, w, h) => {
      drawGlow(ctx, w / 2, h / 2, 31, "rgba(255,211,106,0.24)");
      roundedPanel(ctx, 6, 9, w - 12, h - 17, 10, "#ffca77", "#4c2410", "#fff2b6");
      roundedPanel(ctx, 14, 15, w - 28, h - 30, 7, "#2c3b56", "#0b1324", "#7df9ff");
      roundedPanel(ctx, 17, 18, 16, 28, 8, "#22344f", "#07111f", "#7df9ff");
      roundedPanel(ctx, w - 33, 18, 16, 28, 8, "#22344f", "#07111f", "#7df9ff");
      drawGlow(ctx, w * 0.32, h * 0.5, 9, "rgba(255,95,122,0.9)");
      drawGlow(ctx, w * 0.68, h * 0.5, 9, "rgba(255,95,122,0.9)");
      drawStripes(ctx, 13, 13, w - 26, h - 24, "rgba(255,242,182,0.28)");
    });

    this.replaceCanvasTexture("enemy-turret", 62, 70, (ctx, w, h) => {
      drawGlow(ctx, w / 2, h * 0.43, 29, "rgba(93,247,174,0.3)");
      drawEllipse(ctx, w / 2, h * 0.42, 24, 24, "#5df7ae", "#d9ffef", 3, "#143a35");
      drawEllipse(ctx, w / 2, h * 0.42, 12, 12, "#07111f", "#7df9ff", 2);
      ctx.lineCap = "round";
      ctx.strokeStyle = "#ff5f7a";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(w / 2, h * 0.52);
      ctx.lineTo(w / 2, h - 5);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w / 2 - 3, h * 0.54);
      ctx.lineTo(w / 2 - 3, h - 10);
      ctx.stroke();
    });

    this.replaceCanvasTexture("enemy-bomber", 96, 84, (ctx, w, h) => {
      drawGlow(ctx, w / 2, h / 2, 40, "rgba(186,140,255,0.24)");
      drawHull(ctx, [
        [w * 0.5, 5],
        [w * 0.92, h * 0.48],
        [w * 0.73, h * 0.86],
        [w * 0.5, h * 0.72],
        [w * 0.27, h * 0.86],
        [w * 0.08, h * 0.48]
      ], "#d1b2ff", "#251744", "#eadcff");
      roundedPanel(ctx, w * 0.2, h * 0.43, w * 0.6, h * 0.2, 11, "#443469", "#11101f", "#bfa5ff");
      drawEllipse(ctx, w / 2, h * 0.48, 16, 12, "#261540", "#ffd36a", 2);
      drawStripes(ctx, w * 0.23, h * 0.36, w * 0.54, h * 0.26, "rgba(232,220,255,0.26)");
    });

    this.replaceCanvasTexture("boss-core", 180, 132, (ctx, w, h) => {
      drawGlow(ctx, w / 2, h / 2, 78, "rgba(125,249,255,0.22)");
      drawGlow(ctx, w / 2, h / 2, 58, "rgba(255,95,122,0.18)");
      drawEllipse(ctx, w / 2, h / 2, 76, 46, "#263a71", "#f2fbff", 4, "#080b14");
      drawEllipse(ctx, w / 2, h / 2, 45, 27, "#07111f", "#7df9ff", 2);
      drawGlow(ctx, w / 2, h / 2, 22, "rgba(255,211,106,0.92)");
      drawEllipse(ctx, w / 2, h / 2, 17, 17, "#ffd36a", "#fff2b6", 2);
      roundedPanel(ctx, 16, 55, 34, 18, 8, "#162744", "#07111f", "#7df9ff");
      roundedPanel(ctx, w - 50, 55, 34, 18, 8, "#162744", "#07111f", "#7df9ff");
      drawStripes(ctx, 42, 30, w - 84, 72, "rgba(255,255,255,0.18)");
    });

    this.replaceCanvasTexture("sidekick-ion", 40, 40, (ctx, w, h) => {
      drawGlow(ctx, w / 2, h / 2, 19, "rgba(125,249,255,0.34)");
      drawEllipse(ctx, w / 2, h / 2, 14, 17, "#1d6f89", "#d9fbff", 2);
      drawEllipse(ctx, w / 2, h / 2, 6, 7, "#07111f", "#7df9ff", 2);
    });

    this.replaceCanvasTexture("sidekick-missile", 40, 40, (ctx, w, h) => {
      drawHull(ctx, [[w / 2, 3], [w * 0.78, 31], [w / 2, 25], [w * 0.22, 31]], "#ffd36a", "#7f3d16", "#fff2b6");
      drawEngine(ctx, w / 2, 31, 5, 9, "#ff5f7a");
    });

    this.replaceCanvasTexture("sidekick-beam", 40, 40, (ctx, w, h) => {
      roundedPanel(ctx, 7, 9, 26, 22, 7, "#ba8cff", "#241642", "#eadcff");
      drawGlow(ctx, w / 2, h / 2, 10, "rgba(125,249,255,0.75)");
      drawEllipse(ctx, w / 2, h / 2, 6, 6, "#7df9ff", "#f2fbff", 1);
    });

    this.createPremiumProjectiles();
    this.createPremiumPickups();
  }

  private createPremiumProjectiles(): void {
    const specs = [
      ["shot-cyan", "#7df9ff", "#f2fbff", 20, 30],
      ["shot-green", "#5df7ae", "#d9ffef", 26, 36],
      ["shot-orange", "#ffd36a", "#fff2b6", 24, 32],
      ["shot-red", "#ff5f7a", "#ffd0d7", 22, 30],
      ["shot-purple", "#ba8cff", "#eadcff", 20, 48]
    ] as const;

    for (const [key, color, core, w, h] of specs) {
      this.replaceCanvasTexture(key, w, h, (ctx, width, height) => {
        drawGlow(ctx, width / 2, height / 2, width * 0.65, hexToRgba(color, 0.55));
        const gradient = ctx.createLinearGradient(0, 2, 0, height - 2);
        gradient.addColorStop(0, core);
        gradient.addColorStop(0.5, color);
        gradient.addColorStop(1, "rgba(255,255,255,0.15)");
        ctx.fillStyle = gradient;
        ctx.strokeStyle = core;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(width * 0.3, 3, width * 0.4, height - 6, width * 0.2);
        ctx.fill();
        ctx.stroke();
      });
    }

    this.replaceCanvasTexture("missile", 24, 34, (ctx, w, h) => {
      drawHull(ctx, [[w / 2, 2], [w - 3, h - 9], [w / 2, h - 5], [3, h - 9]], "#ffd36a", "#7f3d16", "#fff2b6");
      drawEngine(ctx, w / 2, h - 5, 5, 9, "#ff5f7a");
    });

    this.replaceCanvasTexture("repulsor-ring", 116, 116, (ctx, w, h) => {
      for (let i = 0; i < 4; i += 1) {
        ctx.strokeStyle = `rgba(125,249,255,${0.62 - i * 0.12})`;
        ctx.lineWidth = 4 - i * 0.5;
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 22 + i * 10, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  }

  private createPremiumPickups(): void {
    this.replaceCanvasTexture("pickup-credit", 36, 36, (ctx, w, h) => {
      drawPickupCore(ctx, w, h, "#ffd36a", "#fff2b6");
      ctx.fillStyle = "#07111f";
      ctx.fillRect(w / 2 - 2, 9, 4, 18);
    });

    this.replaceCanvasTexture("pickup-power", 36, 36, (ctx, w, h) => {
      drawPickupCore(ctx, w, h, "#5df7ae", "#d9ffef");
      drawHull(ctx, [[14, 9], [25, 18], [14, 27]], "#07111f", "#07111f", "#07111f", 0.72);
    });

    this.replaceCanvasTexture("pickup-cube", 36, 36, (ctx, w, h) => {
      drawGlow(ctx, w / 2, h / 2, 17, "rgba(186,140,255,0.55)");
      roundedPanel(ctx, 7, 7, 22, 22, 4, "#ba8cff", "#3a2770", "#eadcff");
      roundedPanel(ctx, 13, 13, 10, 10, 3, "#7df9ff", "#1d6f89", "#d9fbff");
    });

    this.replaceCanvasTexture("spark", 18, 18, (ctx, w, h) => {
      drawGlow(ctx, w / 2, h / 2, 8, "rgba(255,211,106,0.95)");
      drawEllipse(ctx, w / 2, h / 2, 4, 4, "#fff2b6", "#ffffff", 1);
    });

    this.replaceCanvasTexture("shield-glow", 112, 112, (ctx, w, h) => {
      drawGlow(ctx, w / 2, h / 2, 52, "rgba(125,249,255,0.22)");
      ctx.strokeStyle = "rgba(217,251,255,0.7)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 48, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(125,249,255,0.36)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 34, 0, Math.PI * 2);
      ctx.stroke();
    });
  }

  private replaceCanvasTexture(
    key: string,
    width: number,
    height: number,
    draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void
  ): void {
    if (this.textures.exists(key)) {
      this.textures.remove(key);
    }

    const texture = this.textures.createCanvas(key, width, height);
    if (!texture) {
      return;
    }

    const canvas = texture.getSourceImage() as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, width, height);
    draw(ctx, width, height);
    texture.refresh();
  }
}

function seededNoise(value: number): number {
  return Math.abs(Math.sin(value * 12.9898) * 43758.5453) % 1;
}

function drawHull(
  ctx: CanvasRenderingContext2D,
  points: number[][],
  top: string,
  bottom: string,
  stroke: string,
  alpha = 1
): void {
  const ys = points.map((point) => point[1]);
  const gradient = ctx.createLinearGradient(0, Math.min(...ys), 0, Math.max(...ys));
  gradient.addColorStop(0, top);
  gradient.addColorStop(1, bottom);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = gradient;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawEllipse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  fill: string,
  stroke: string,
  lineWidth: number,
  shadow = "transparent"
): void {
  ctx.save();
  ctx.shadowColor = shadow;
  ctx.shadowBlur = shadow === "transparent" ? 0 : 12;
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string
): void {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawEngine(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  length: number,
  color: string
): void {
  drawGlow(ctx, x, y + length * 0.45, length, hexToRgba(color, 0.72));
  const gradient = ctx.createLinearGradient(x, y, x, y + length);
  gradient.addColorStop(0, "#fff2b6");
  gradient.addColorStop(0.45, color);
  gradient.addColorStop(1, "rgba(255,95,122,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(x, y + length * 0.4, rx, length * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
}

function roundedPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  top: string,
  bottom: string,
  stroke: string
): void {
  const gradient = ctx.createLinearGradient(x, y, x, y + h);
  gradient.addColorStop(0, top);
  gradient.addColorStop(1, bottom);
  ctx.fillStyle = gradient;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  ctx.stroke();
}

function drawStripes(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i += 1) {
    const yy = y + (h / 5) * (i + 1);
    ctx.beginPath();
    ctx.moveTo(x + 5, yy);
    ctx.lineTo(x + w - 5, yy);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPanelLines(ctx: CanvasRenderingContext2D, w: number, h: number, color: string): void {
  ctx.save();
  ctx.strokeStyle = hexToRgba(color, 0.46);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.18);
  ctx.lineTo(w * 0.5, h * 0.68);
  ctx.moveTo(w * 0.34, h * 0.52);
  ctx.lineTo(w * 0.66, h * 0.52);
  ctx.stroke();
  ctx.restore();
}

function drawPickupCore(ctx: CanvasRenderingContext2D, w: number, h: number, fill: string, stroke: string): void {
  drawGlow(ctx, w / 2, h / 2, 17, hexToRgba(fill, 0.5));
  drawEllipse(ctx, w / 2, h / 2, 13, 13, fill, stroke, 2);
  drawEllipse(ctx, w / 2 - 3, h / 2 - 4, 4, 4, "rgba(255,255,255,0.55)", "rgba(255,255,255,0)", 1);
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}
