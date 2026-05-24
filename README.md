# Velocity Rift

WebGL arcade shooter prototype inspired by classic vertical ship shooters. It uses original procedural art and does not include Tyrian sprites, names, levels, or data files.

## Run

Double-click `start-dev.bat`, or run it from PowerShell/CMD:

```powershell
.\start-dev.bat
```

Manual commands:

```powershell
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

The build is also self-contained after `npm run build`: open `dist/index.html` directly if a local server is inconvenient.

## Controls

- Move: `WASD` or arrow keys
- Fire: `Space`
- Special: `E` or `Shift`
- Hangar: `Esc`

## Current Systems

- Front and rear weapon slots with upgrade levels
- Sidekick wing modules
- Shield, armor, generator, energy drain and recharge
- Credits, data cubes, pickups, wave progression, boss clear
- Hangar shop with purchases, equipment selection, upgrades, and local save
