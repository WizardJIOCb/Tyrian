import { defaultEquipment, loadEquipment, resetEquipment, saveEquipment } from "../state.js";

export class TitleScene extends Phaser.Scene {
  private far?: Phaser.GameObjects.TileSprite;
  private near?: Phaser.GameObjects.TileSprite;
  private nebula?: Phaser.GameObjects.TileSprite;

  constructor() {
    super("TitleScene");
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#05070d");
    this.nebula = this.add.tileSprite(480, 270, 1100, 680, "nebula").setAlpha(0.72);
    this.far = this.add.tileSprite(480, 270, 960, 540, "stars-far");
    this.near = this.add.tileSprite(480, 270, 960, 540, "stars-near");

    this.add
      .text(72, 88, "VELOCITY RIFT", {
        fontFamily: "Impact, Haettenschweiler, Arial Black, sans-serif",
        fontSize: "64px",
        color: "#f2fbff",
        stroke: "#12203a",
        strokeThickness: 6
      })
      .setLetterSpacing(0);

    this.add.text(77, 154, "WEBGL ARCADE COMBAT BUILD", {
      fontFamily: "Arial, sans-serif",
      fontSize: "16px",
      color: "#7df9ff"
    });

    const save = loadEquipment();
    this.add.text(76, 214, `WAVE ${save.wave}   CREDITS ${save.credits}`, {
      fontFamily: "Arial, sans-serif",
      fontSize: "20px",
      color: "#d9fbff"
    });

    this.makeButton(76, 262, 230, 48, "LAUNCH", () => {
      this.registry.set("equipment", save);
      this.scene.start("ShopScene");
    });

    this.makeButton(76, 324, 230, 48, "NEW RUN", () => {
      const fresh = { ...defaultEquipment };
      saveEquipment(fresh);
      this.registry.set("equipment", fresh);
      this.scene.start("ShopScene");
    });

    this.makeButton(76, 386, 230, 48, "RESET SAVE", () => {
      const fresh = resetEquipment();
      this.registry.set("equipment", fresh);
      this.scene.restart();
    });

    this.add.sprite(710, 310, "player").setScale(2.2).setAngle(-12);
    this.add.sprite(620, 350, "sidekick-ion").setScale(1.3).setAlpha(0.86);
    this.add.sprite(820, 350, "sidekick-ion").setScale(1.3).setAlpha(0.86);
    this.add.sprite(742, 220, "enemy-bomber").setScale(1.15).setAngle(18);
    this.add.sprite(850, 158, "enemy-scout").setScale(0.9).setAngle(8);

    this.tweens.add({
      targets: this.children.list.filter((child) => child.type === "Sprite"),
      y: "+=10",
      duration: 1500,
      ease: "Sine.inOut",
      yoyo: true,
      repeat: -1
    });
  }

  update(_: number, delta: number): void {
    if (this.nebula) {
      this.nebula.tilePositionY -= delta * 0.006;
      this.nebula.tilePositionX += delta * 0.004;
    }
    if (this.far) {
      this.far.tilePositionY -= delta * 0.018;
    }
    if (this.near) {
      this.near.tilePositionY -= delta * 0.052;
    }
  }

  private makeButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    onClick: () => void
  ): void {
    const bg = this.add
      .rectangle(x, y, width, height, 0x13213c, 0.92)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0x7df9ff, 0.55)
      .setInteractive({ useHandCursor: true });
    const text = this.add.text(x + 22, y + 14, label, {
      fontFamily: "Arial Black, Arial, sans-serif",
      fontSize: "16px",
      color: "#f2fbff"
    });

    bg.on("pointerover", () => {
      bg.setFillStyle(0x1c365f, 0.96);
      text.setColor("#ffffff");
    });
    bg.on("pointerout", () => {
      bg.setFillStyle(0x13213c, 0.92);
      text.setColor("#f2fbff");
    });
    bg.on("pointerdown", onClick);
  }
}
