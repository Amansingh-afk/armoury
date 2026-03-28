# Armoury

Browser-based 3D skin editor for CS2. Stack layers — patterns, images, stickers — onto weapon models with real-time PBR preview, then export Workshop-ready files.

## Problem

Creating CS2 skins today means painting on flat UV maps in Photoshop. It's unintuitive, error-prone at seams, and has a steep learning curve. No browser-based tool exists that lets you work directly on the 3D model.

## How It Works

1. Pick a weapon (AK-47 to start)
2. Stack layers — fill with procedural patterns (camo, carbon fiber, damascus, etc.) or import your own images
3. Position, scale, rotate, and project images onto the 3D model
4. Preview in real time with PBR materials and wear simulation
5. Export TGA files ready for CS2 Workshop submission

## Tech Stack

- **Frontend:** React 19, Next.js, TypeScript
- **3D:** Three.js, React Three Fiber, Drei
- **Painting:** OffscreenCanvas layer compositing with Canvas2D
- **Projection:** Affine triangle-based UV projection (orthographic + camera-based)
- **Preview:** PBR metallic-roughness via Three.js MeshPhysicalMaterial
- **Export:** TGA (CS2 Workshop), PNG (generic), with UV seam dilation

## Current Features

- Procedural pattern fills: solid, camo, digital camo, carbon fiber, stripes, checker, noise, gradient, damascus, marble, wood grain, geometric
- Image layer import with fill modes: wrap (3D projection), stretch, tile, place (camera sticker projection)
- Layer stack: add, delete, reorder, visibility, opacity
- PBR material presets: matte, satin, glossy, metallic, chrome
- Wear simulation: Factory New through Battle-Scarred with procedural noise + scratch mask
- Undo/redo (Ctrl+Z / Ctrl+Shift+Z)
- TGA + PNG export with 16px seam dilation

## Dev Setup

### Prerequisites

- Node.js 18+
- pnpm 9+

### Install and run

```bash
pnpm install
pnpm dev        # starts Next.js at localhost:3000
```

Open `localhost:3000/editor` to launch the skin editor.

### Tests

```bash
pnpm test       # run all editor tests
```

### Lint

```bash
pnpm lint       # check with Biome
pnpm lint:fix   # auto-fix
```

### Project structure

```
apps/web/           # Next.js app (landing page + editor page)
packages/editor/    # Standalone painting engine (OSS core)
scripts/            # Blender model conversion tools
```

### Adding weapon models

1. Install CS2 Workshop Tools via Steam
2. Run the Blender conversion script:
   ```bash
   blender --background --python scripts/convert-model.py -- path/to/weapon.fbx apps/web/public/models/weapon.glb
   ```
3. Add an entry to `apps/web/public/manifest.json`

## Roadmap

- [ ] Multi-weapon support — roll out weapons one by one using Valve's official FBX models
- [ ] Per-pixel roughness/metallic painting
- [ ] Project save/load (IndexedDB)
- [ ] Advanced layer blending modes (multiply, overlay, screen)
- [ ] Performance — migrate compositing to WebGL render-to-texture for 4K support
- [ ] Layer drag-to-reorder and thumbnails

## References

- [CS2 Workshop Skin Guide](https://skinsmonkey.com/blog/how-to-create-cs2-skins-in-2026)
- [Valve Workshop Tools](https://developer.valvesoftware.com/wiki/Counter-Strike_2_Workshop_Tools)
