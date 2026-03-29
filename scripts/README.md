# Model Pipeline

## Adding a new weapon

### 1. Download the model

**Recommended:** Download official Valve models from https://www.counter-strike.net/workshop/workshopresources — the "CS2 weapon models" zip (`cs2_weapon_model_geometry.zip`). These are OBJ files with exact UV layouts matching the in-game models, ensuring exported TGA textures align correctly in Workshop.

**Alternative:** Sketchfab CS2 models (GLB format). UVs may not match Valve's exactly — exported skins could appear misaligned in-game.

### 2. Convert OBJ to GLB

For official Valve OBJ files:

```bash
npm install -g obj2gltf

obj2gltf -i weapon_rif_ak47.obj -o apps/web/public/models/ak47.glb --binary
```

The output is already clean geometry — no stripping needed (no textures, bones, or animations in the OBJ files).

For Sketchfab GLB files, use the strip script instead:

```bash
npm install -g @gltf-transform/cli

node scripts/strip-glb.mjs source/AWP.glb apps/web/public/models/awp.glb
```

### 3. Register in the editor

Add an entry to the `WEAPONS` array in `apps/web/app/editor/page.tsx`:

```ts
const WEAPONS = [
  { id: "ak47", label: "AK-47", path: "/models/ak47.glb" },
  { id: "m4a4", label: "M4A4", path: "/models/m4a4.glb" },
  { id: "awp",  label: "AWP",  path: "/models/awp.glb" },
  // Add your weapon here:
  { id: "deagle", label: "Desert Eagle", path: "/models/deagle.glb" },
] as const;
```

### 4. Verify

- Open the editor, select the new weapon from the dropdown
- 3D model should auto-fit the viewport
- UV wireframe should align with the model geometry
- Painting on the 2D texture should update the 3D model

---

## Scripts

### strip-glb.mjs

Strips textures, materials, bone nodes, animations, and extensions from a Sketchfab GLB. Not needed for official Valve OBJ models.

**Prerequisites:** `npm install -g @gltf-transform/cli`

### convert-model.py

Converts Valve FBX weapon models to GLB using Blender. Requires Blender 3.6+ on PATH.

```bash
blender --background --python scripts/convert-model.py -- path/to/weapon.fbx apps/web/public/models/weapon.glb
```

---

## TGA Export & Alpha Channel

The TGA export uses `compositeForExport()` which produces a Workshop-compatible texture:

- **RGB** = skin color (composited layers without wear applied)
- **Alpha** = paint coverage mask (255 = painted, 0 = bare metal)
- **Seam dilation** = 16px color spread into UV gutters (alpha stays 0 for dilated pixels)
- **Wear** is NOT baked into the export — CS2's engine handles wear via `wearremapmin`/`wearremapmax` based on the alpha mask

The base layer (white fill) starts everything as "painted" (alpha=255). Areas with no layer content export as bare metal (alpha=0).
