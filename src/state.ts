export type FrontWeaponId = "pulse" | "plasma" | "rail";
export type RearWeaponId = "flare" | "mines" | "split";
export type SidekickId = "none" | "ion" | "missile" | "beam";
export type SpecialId = "overdrive" | "repulsor";

export interface EquipmentState {
  front: FrontWeaponId;
  rear: RearWeaponId;
  sidekick: SidekickId;
  special: SpecialId;
  ownedFront: FrontWeaponId[];
  ownedRear: RearWeaponId[];
  ownedSidekicks: SidekickId[];
  frontLevel: number;
  rearLevel: number;
  shieldLevel: number;
  armorLevel: number;
  generatorLevel: number;
  credits: number;
  wave: number;
  dataCubes: number;
}

export const defaultEquipment: EquipmentState = {
  front: "pulse",
  rear: "flare",
  sidekick: "ion",
  special: "repulsor",
  ownedFront: ["pulse"],
  ownedRear: ["flare"],
  ownedSidekicks: ["none", "ion"],
  frontLevel: 1,
  rearLevel: 1,
  shieldLevel: 1,
  armorLevel: 1,
  generatorLevel: 1,
  credits: 1800,
  wave: 1,
  dataCubes: 0
};

const saveKey = "velocity-rift-save-v1";

export function loadEquipment(): EquipmentState {
  const raw = localStorage.getItem(saveKey);
  if (!raw) {
    return { ...defaultEquipment };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<EquipmentState>;
    return {
      ...defaultEquipment,
      ...parsed,
      frontLevel: clampLevel(parsed.frontLevel),
      rearLevel: clampLevel(parsed.rearLevel),
      shieldLevel: clampLevel(parsed.shieldLevel),
      armorLevel: clampLevel(parsed.armorLevel),
      generatorLevel: clampLevel(parsed.generatorLevel),
      credits: clampInt(parsed.credits, 0, 999999, defaultEquipment.credits),
      wave: clampInt(parsed.wave, 1, 999, defaultEquipment.wave),
      dataCubes: clampInt(parsed.dataCubes, 0, 9999, defaultEquipment.dataCubes),
      ownedFront: normalizeOwned(parsed.ownedFront, defaultEquipment.ownedFront),
      ownedRear: normalizeOwned(parsed.ownedRear, defaultEquipment.ownedRear),
      ownedSidekicks: normalizeOwned(
        parsed.ownedSidekicks,
        defaultEquipment.ownedSidekicks
      )
    };
  } catch {
    return { ...defaultEquipment };
  }
}

export function saveEquipment(equipment: EquipmentState): void {
  localStorage.setItem(saveKey, JSON.stringify(equipment));
}

export function resetEquipment(): EquipmentState {
  localStorage.removeItem(saveKey);
  return { ...defaultEquipment };
}

function clampLevel(value: number | undefined): number {
  return Math.min(5, Math.max(1, value ?? 1));
}

function clampInt(
  value: number | undefined,
  min: number,
  max: number,
  fallback: number
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.floor(value)));
}

function normalizeOwned<T extends string>(
  value: T[] | undefined,
  fallback: T[]
): T[] {
  if (!Array.isArray(value) || value.length === 0) {
    return [...fallback];
  }

  return Array.from(new Set([...fallback, ...value]));
}
