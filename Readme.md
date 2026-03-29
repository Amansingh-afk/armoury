# Armoury

CS2 skin editor in the browser. Paint on the model, stack layers, preview PBR + wear, export TGA/PNG when you’re done.

No install, no wrestling a flat UV sheet in Photoshop first—unless you want to.

Monorepo: **`apps/web`** is the Next.js shell, **`packages/editor`** is the editor (usable as `@armoury/editor` from another app in the same workspace).

---

## Run

Node 18+, pnpm 9+.

```bash
pnpm install
pnpm dev
```

- App: [http://localhost:3000](http://localhost:3000)
- Editor: [http://localhost:3000/editor](http://localhost:3000/editor)

```bash
pnpm build    # production build (web app)
pnpm test     # editor package (Vitest)
pnpm lint     # Biome check
pnpm lint:fix # Biome + auto-fix
```

---

## What you get

**Layers**

- Add / delete / rename, reorder, visibility, opacity
- Per-layer **blend modes** (normal, multiply, screen, overlay, soft-light, color-dodge, color-burn, difference)
- **Color adjust** (hue / saturation / brightness) and optional **emboss**

**Patterns**

- Procedural fills: solid, camo variants, carbon fiber, stripes (several styles), checker, noise, gradient, damascus, marble, wood, geometric, triangles, dots, diamond, scales, tribal — pick colors and apply to the active layer or **apply pattern to all layers** from the style panel

**Images**

- **Import image** — stretch, tile, or **place** (project from the current 3D view onto the UV texture)
- **Add sticker** — drops a place-mode layer you can move on the model
- Drag-and-drop images onto the editor window to import

**Viewport**

- **3D / 2D / split** view, optional UV wireframe on the 2D sheet
- **Pan** vs **brush** tools (2D / split)
- Brush: size, color, opacity, hardness

**Material & wear**

- Sliders for roughness and metallic, plus presets: Matte, Satin, Glossy, Metallic, Chrome, Battle-Scarred
- Wear: level, base tint, sharpness (Factory New → beat-up)

**History**

- Undo / redo (last ~30 snapshots)

**Export**

- **TGA** (CS2 Workshop-friendly) and **PNG**
- **Seam dilation** around UV islands so filters don’t leave gaps

Default working resolution is **2048×2048** unless you pass a different `textureSize` into `SkinEditor`.

---

## Keyboard & mouse (sticker / place mode)

When a layer is in **place** mode (typical for stickers):

| Input | Action |
|--------|--------|
| `Ctrl/Cmd+Z` | Undo |
| `Ctrl/Cmd+Shift+Z` | Redo |
| `Escape` | Switch to pan tool |
| `[` / `]` | Scale down / up |
| `H` / `V` | Flip horizontal / vertical |
| `R` | Reset rotation to 0 |
| `Shift` + mouse wheel | Rotate in 15° steps |
| `Alt` + mouse wheel | Scale |

Shortcuts are ignored while focus is in an input or textarea.

---

## Using the editor package

From another package in the repo:

```json
"dependencies": {
  "@armoury/editor": "workspace:*"
}
```

Import `SkinEditor` (and types) from `@armoury/editor`. The web app loads it with `next/dynamic` and `ssr: false` because of WebGL / canvas.

Props you’ll care about: `modelPath`, optional `hdriPath`, optional `textureSize`, optional `weaponOptions` + `selectedWeaponId` + `onWeaponChange` for a toolbar dropdown.

---

## Repo layout

```
apps/web/          Next.js — landing + /editor
packages/editor/   SkinEditor, painting, export, tests
scripts/           GLB pipeline — read scripts/README.md
```

---

## New weapon model

1. Produce a **geometry-focused `.glb`** (see **`scripts/README.md`**: `optimize-glb.mjs` and/or Blender `convert-model.py`).
2. Put it in **`apps/web/public/models/`**.
3. Register it in **`apps/web/app/editor/page.tsx`** (`WEAPONS` array: `id`, `label`, `path`).

Switching weapon in the demo **remounts** the editor, so layer work doesn’t carry across guns yet.

---

## Stack

React 19, Next.js 15, TypeScript, Three.js, React Three Fiber, Drei, Zustand, Canvas2D / OffscreenCanvas compositing, Biome, Vitest, Tailwind 4 (web app).

---

## Honest limits (for now)

- No project **save/load** — refresh loses work unless you exported.
- **Heavy 4K** sessions may stutter; compositing is still Canvas2D-first.
- No per-pixel **roughness/metal** paint maps — global sliders + presets only.

---

## Links

- [CS2 Workshop Tools](https://developer.valvesoftware.com/wiki/Counter-Strike_2_Workshop_Tools)
- [Workshop skin workflow (overview)](https://skinsmonkey.com/blog/how-to-create-cs2-skins-in-2026)
