import {
  loadEquipment,
  saveEquipment
} from "../state.js";
import type {
  EquipmentState,
  FrontWeaponId,
  RearWeaponId,
  SidekickId
} from "../state.js";

type Option<T extends string> = {
  id: T;
  label: string;
  cost: number;
  texture?: string;
  note: string;
};

const frontOptions: Option<FrontWeaponId>[] = [
  { id: "pulse", label: "Pulse Cannon", cost: 0, texture: "shot-cyan", note: "fast spread" },
  { id: "plasma", label: "Plasma Arc", cost: 1400, texture: "shot-green", note: "wide impact" },
  { id: "rail", label: "Rail Lance", cost: 1900, texture: "shot-purple", note: "piercing beam" }
];

const rearOptions: Option<RearWeaponId>[] = [
  { id: "flare", label: "Rear Flare", cost: 0, texture: "shot-orange", note: "tail cover" },
  { id: "mines", label: "Pulse Mines", cost: 1100, texture: "shot-red", note: "proximity bursts" },
  { id: "split", label: "Split Star", cost: 1500, texture: "shot-purple", note: "diagonal rear fire" }
];

const sidekickOptions: Option<SidekickId>[] = [
  { id: "none", label: "No Wing", cost: 0, note: "extra credits" },
  { id: "ion", label: "Ion Wings", cost: 0, texture: "sidekick-ion", note: "steady fire" },
  { id: "missile", label: "Missile Wings", cost: 1700, texture: "sidekick-missile", note: "homing shots" },
  { id: "beam", label: "Beam Wings", cost: 2100, texture: "sidekick-beam", note: "piercing support" }
];

export class ShopScene extends Phaser.Scene {
  private equipment!: EquipmentState;
  private creditText?: Phaser.GameObjects.Text;

  constructor() {
    super("ShopScene");
  }

  create(): void {
    this.equipment =
      (this.registry.get("equipment") as EquipmentState | undefined) ?? loadEquipment();
    this.registry.set("equipment", this.equipment);

    this.cameras.main.setBackgroundColor("#05070d");
    this.add.tileSprite(480, 270, 1000, 620, "nebula").setAlpha(0.48);
    this.add.tileSprite(480, 270, 960, 540, "stars-far").setAlpha(0.72);

    this.add.text(44, 32, "HANGAR", {
      fontFamily: "Arial Black, Arial, sans-serif",
      fontSize: "40px",
      color: "#f2fbff",
      stroke: "#12203a",
      strokeThickness: 5
    });

    this.creditText = this.add.text(
      56,
      100,
      `WAVE ${this.equipment.wave}   CREDITS ${this.equipment.credits}\nDATA CUBES ${this.equipment.dataCubes}`,
      {
        fontFamily: "Arial Black, Arial, sans-serif",
        fontSize: "14px",
        color: "#b9d2dd",
        lineSpacing: 6
      }
    );

    this.renderShipBay();
    this.renderOptions();
    this.renderUpgradeColumn();

    this.makeButton(770, 472, 152, 42, "LAUNCH", () => {
      saveEquipment(this.equipment);
      this.scene.start("GameScene");
    });
  }

  private renderShipBay(): void {
    this.add
      .rectangle(186, 334, 292, 352, 0x08111f, 0.76)
      .setStrokeStyle(2, 0x263a71, 0.8);
    this.add.sprite(186, 256, "player").setScale(1.52);

    const sideTexture = sidekickOptions.find((item) => item.id === this.equipment.sidekick)
      ?.texture;
    if (sideTexture) {
      this.add.sprite(108, 316, sideTexture).setScale(0.96);
      this.add.sprite(264, 316, sideTexture).setScale(0.96);
    }

    const lines = [
      `FRONT: ${labelFor(frontOptions, this.equipment.front)} L${this.equipment.frontLevel}`,
      `REAR: ${labelFor(rearOptions, this.equipment.rear)} L${this.equipment.rearLevel}`,
      `WINGS: ${labelFor(sidekickOptions, this.equipment.sidekick)}`,
      `SHIELD: L${this.equipment.shieldLevel}`,
      `ARMOR: L${this.equipment.armorLevel}`,
      `GENERATOR: L${this.equipment.generatorLevel}`
    ];

    lines.forEach((line, index) => {
      this.addFittedText(70, 386 + index * 18, line, 236, 16, {
        fontFamily: "Consolas, monospace",
        fontSize: "13px",
        color: index < 3 ? "#f2fbff" : "#9fb6cf"
      }, 10);
    });
  }

  private renderOptions(): void {
    this.add.text(386, 48, "WEAPONS", {
      fontFamily: "Arial Black, Arial, sans-serif",
      fontSize: "20px",
      color: "#7df9ff"
    });

    this.renderOptionRow(386, 78, "FRONT", frontOptions, this.equipment.ownedFront, this.equipment.front, (id) => {
      this.buyOrEquip("front", id);
    });
    this.renderOptionRow(386, 190, "REAR", rearOptions, this.equipment.ownedRear, this.equipment.rear, (id) => {
      this.buyOrEquip("rear", id);
    });
    this.renderOptionRow(
      386,
      302,
      "WINGS",
      sidekickOptions,
      this.equipment.ownedSidekicks,
      this.equipment.sidekick,
      (id) => {
        this.buyOrEquip("sidekick", id);
      },
      2,
      154
    );
  }

  private renderOptionRow<T extends FrontWeaponId | RearWeaponId | SidekickId>(
    x: number,
    y: number,
    title: string,
    options: Option<T>[],
    owned: T[],
    selected: T,
    select: (id: T) => void,
    columns = 3,
    cardWidth = 100
  ): void {
    this.add.text(x, y, title, {
      fontFamily: "Arial Black, Arial, sans-serif",
      fontSize: "15px",
      color: "#9fb6cf"
    });

    const gap = 10;
    const cardHeight = columns === 2 ? 50 : 58;
    const buttonHeight = 24;
    const rowHeight = cardHeight + buttonHeight + 12;

    options.forEach((option, index) => {
      const ownedItem = owned.includes(option.id);
      const active = selected === option.id;
      const cost = ownedItem ? 0 : option.cost;
      const label = active
        ? "EQUIPPED"
        : ownedItem
          ? "EQUIP"
          : `$${cost}`;
      const col = index % columns;
      const row = Math.floor(index / columns);
      const bx = x + col * (cardWidth + gap);
      const by = y + 24 + row * rowHeight;
      const enabled = active || ownedItem || this.equipment.credits >= cost;

      const fill = active ? 0x1d4c6b : 0x111c31;
      this.add
        .rectangle(bx, by, cardWidth, cardHeight, fill, enabled ? 0.92 : 0.42)
        .setOrigin(0, 0)
        .setStrokeStyle(2, active ? 0x7df9ff : 0x263a71, active ? 0.9 : 0.75);

      if (option.texture) {
        this.add.sprite(bx + 18, by + 20, option.texture).setScale(0.62);
      }

      this.addFittedText(bx + 34, by + 8, option.label, cardWidth - 42, 28, {
        fontFamily: "Arial, sans-serif",
        fontSize: "11px",
        color: enabled ? "#f2fbff" : "#687b91",
        wordWrap: { width: cardWidth - 42 }
      }, 8);
      this.addFittedText(bx + 10, by + cardHeight - 18, option.note, cardWidth - 18, 14, {
        fontFamily: "Arial, sans-serif",
        fontSize: "10px",
        color: "#9fb6cf",
        wordWrap: { width: cardWidth - 18 }
      }, 8);

      this.makeButton(bx, by + cardHeight + 6, cardWidth, buttonHeight, label, () => select(option.id), enabled);
    });
  }

  private renderUpgradeColumn(): void {
    this.add.text(770, 48, "SYSTEMS", {
      fontFamily: "Arial Black, Arial, sans-serif",
      fontSize: "20px",
      color: "#7df9ff"
    });

    this.renderUpgradeButton(770, 92, "FRONT POWER", "frontLevel", 560);
    this.renderUpgradeButton(770, 145, "REAR POWER", "rearLevel", 460);
    this.renderUpgradeButton(770, 198, "SHIELD GRID", "shieldLevel", 520);
    this.renderUpgradeButton(770, 251, "ARMOR PLATE", "armorLevel", 500);
    this.renderUpgradeButton(770, 304, "GENERATOR", "generatorLevel", 620);

    this.makeButton(770, 382, 152, 34, "REPULSOR", () => {
      this.equipment.special = "repulsor";
      this.persistAndRefresh();
    }, this.equipment.special !== "repulsor");
    this.makeButton(770, 422, 152, 34, "OVERDRIVE", () => {
      this.equipment.special = "overdrive";
      this.persistAndRefresh();
    }, this.equipment.special !== "overdrive");
  }

  private renderUpgradeButton(
    x: number,
    y: number,
    label: string,
    key: "frontLevel" | "rearLevel" | "shieldLevel" | "armorLevel" | "generatorLevel",
    baseCost: number
  ): void {
    const level = this.equipment[key];
    const cost = baseCost * level;
    const canBuy = level < 5 && this.equipment.credits >= cost;
    const name = level >= 5 ? label : `${label} L${level + 1}`;
    const price = level >= 5 ? "MAX" : `$${cost}`;
    this.makeSplitButton(x, y, 152, 34, name, price, () => {
      if (!canBuy) {
        this.flashCredits();
        return;
      }
      this.equipment.credits -= cost;
      this.equipment[key] = (level + 1) as EquipmentState[typeof key];
      this.persistAndRefresh();
    }, level < 5);
  }

  private buyOrEquip(kind: "front", id: FrontWeaponId): void;
  private buyOrEquip(kind: "rear", id: RearWeaponId): void;
  private buyOrEquip(kind: "sidekick", id: SidekickId): void;
  private buyOrEquip(
    kind: "front" | "rear" | "sidekick",
    id: FrontWeaponId | RearWeaponId | SidekickId
  ): void {
    const option =
      kind === "front"
        ? frontOptions.find((item) => item.id === id)
        : kind === "rear"
          ? rearOptions.find((item) => item.id === id)
          : sidekickOptions.find((item) => item.id === id);
    if (!option) {
      return;
    }

    const ownedKey =
      kind === "front"
        ? "ownedFront"
        : kind === "rear"
          ? "ownedRear"
          : "ownedSidekicks";
    const owned = this.equipment[ownedKey] as string[];

    if (!owned.includes(id)) {
      if (this.equipment.credits < option.cost) {
        this.flashCredits();
        return;
      }
      this.equipment.credits -= option.cost;
      (this.equipment[ownedKey] as string[]) = [...owned, id];
    }

    if (kind === "front") {
      this.equipment.front = id as FrontWeaponId;
    } else if (kind === "rear") {
      this.equipment.rear = id as RearWeaponId;
    } else {
      this.equipment.sidekick = id as SidekickId;
    }

    this.persistAndRefresh();
  }

  private makeButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    onClick: () => void,
    enabled = true
  ): void {
    const bg = this.add
      .rectangle(x, y, width, height, enabled ? 0x13213c : 0x0b1324, enabled ? 0.94 : 0.52)
      .setOrigin(0, 0)
      .setStrokeStyle(2, enabled ? 0x7df9ff : 0x263a71, enabled ? 0.55 : 0.32);
    const text = this.addFittedText(x + 10, y + 4, label, width - 20, height - 8, {
      fontFamily: "Arial Black, Arial, sans-serif",
      fontSize: height < 30 ? "10px" : "12px",
      color: enabled ? "#f2fbff" : "#687b91"
    }, 8);
    text.setY(y + Math.max(3, (height - text.height) / 2));

    if (!enabled) {
      return;
    }

    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerover", () => {
      bg.setFillStyle(0x1c365f, 0.98);
      text.setColor("#ffffff");
    });
    bg.on("pointerout", () => {
      bg.setFillStyle(0x13213c, 0.94);
      text.setColor("#f2fbff");
    });
    bg.on("pointerdown", onClick);
  }

  private makeSplitButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    value: string,
    onClick: () => void,
    enabled = true
  ): void {
    const bg = this.add
      .rectangle(x, y, width, height, enabled ? 0x13213c : 0x0b1324, enabled ? 0.94 : 0.52)
      .setOrigin(0, 0)
      .setStrokeStyle(2, enabled ? 0x7df9ff : 0x263a71, enabled ? 0.55 : 0.32);
    const labelText = this.addFittedText(x + 10, y + 8, label, width - 58, height - 12, {
      fontFamily: "Arial Black, Arial, sans-serif",
      fontSize: "11px",
      color: enabled ? "#f2fbff" : "#687b91"
    }, 8);
    const valueText = this.addFittedText(x + width - 48, y + 8, value, 38, height - 12, {
      fontFamily: "Arial Black, Arial, sans-serif",
      fontSize: "11px",
      color: enabled ? "#f2fbff" : "#687b91",
      align: "right"
    }, 8);
    valueText.setX(x + width - 10 - valueText.width);

    if (!enabled) {
      return;
    }

    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerover", () => {
      bg.setFillStyle(0x1c365f, 0.98);
      labelText.setColor("#ffffff");
      valueText.setColor("#ffffff");
    });
    bg.on("pointerout", () => {
      bg.setFillStyle(0x13213c, 0.94);
      labelText.setColor("#f2fbff");
      valueText.setColor("#f2fbff");
    });
    bg.on("pointerdown", onClick);
  }

  private addFittedText(
    x: number,
    y: number,
    text: string,
    width: number,
    height: number,
    style: Phaser.Types.GameObjects.Text.TextStyle,
    minFontSize: number
  ): Phaser.GameObjects.Text {
    const object = this.add.text(x, y, text, style);
    let fontSize = extractFontSize(style.fontSize, 12);

    while ((object.width > width || object.height > height) && fontSize > minFontSize) {
      fontSize -= 1;
      object.setFontSize(fontSize);
    }

    if (object.width > width) {
      object.setCrop(0, 0, width, Math.max(height, object.height));
    }

    return object;
  }

  private persistAndRefresh(): void {
    this.registry.set("equipment", this.equipment);
    saveEquipment(this.equipment);
    this.scene.restart();
  }

  private flashCredits(): void {
    if (!this.creditText) {
      return;
    }

    this.tweens.add({
      targets: this.creditText,
      alpha: 0.2,
      yoyo: true,
      duration: 80,
      repeat: 3
    });
  }
}

function labelFor<T extends string>(options: Option<T>[], id: T): string {
  return options.find((item) => item.id === id)?.label ?? id.toUpperCase();
}

function extractFontSize(
  value: string | number | undefined,
  fallback: number
): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}
