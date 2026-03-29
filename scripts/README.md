# Model Pipeline

## Adding a new weapon

### 1. Download the model

Get CS2 weapon models from:
- [Sketchfab](https://sketchfab.com) — search "CS2 weapon model", download as **GLB** format
- CS2 Workshop Tools: Steam → CS2 → Properties → DLC, models in `Steam/steamapps/common/Counter-Strike Global Offensive/content/csgo/models/weapons/`

### 2. Strip the GLB

```bash
node scripts/strip-glb.mjs <source.glb> apps/web/public/models/<weapon>.glb
```

Example with a Sketchfab download:

```bash
# Extract the GLB from the downloaded zip
unzip rifle-awp-weapon-model-cs2.zip "source/*" -d /tmp/models/

# Strip and place in public/models
node scripts/strip-glb.mjs /tmp/models/source/AWP.glb apps/web/public/models/awp.glb
```

The script prints a summary of the output — you should see a small number of nodes (typically 2-3), with the root node having `scale: [0.0254, 0.0254, 0.0254]` (Valve's inches-to-meters conversion).

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

### strip-glb.mjs (recommended)

Strips textures, materials, bone nodes, animations, and extensions from a GLB. Outputs an uncompressed geometry-only model for skin painting.

**Prerequisites:** `npm install -g @gltf-transform/cli`

**What it does:**
1. Removes all textures and materials (the editor paints its own)
2. Removes extensions like `KHR_draco_mesh_compression`
3. Removes animations and skin/bone rigs
4. Strips non-mesh node branches (e.g. `weapon_hand_r`, trigger, bolt, clip)
5. Writes an uncompressed GLB

### optimize-glb.mjs (legacy)

Strips textures/materials and applies Draco compression. **Not recommended** — `useGLTF` from `@react-three/drei` doesn't include DRACOLoader by default, so Draco-compressed models load with broken geometry.

### convert-model.py (legacy, for FBX sources)

Converts Valve FBX weapon models to GLB using Blender. Requires Blender 3.6+ on PATH.

```bash
blender --background --python scripts/convert-model.py -- path/to/weapon.fbx apps/web/public/models/weapon.glb
```

---

## Why bone nodes must be stripped

CS2 weapon models from Sketchfab include bone/animation nodes (`weapon_hand_r`, clip, trigger, bolt) with large translations (up to ~15 units). These nodes have no mesh geometry but inflate the Three.js `Box3.setFromObject()` bounding box, causing the camera auto-fit to zoom way out and making the weapon appear tiny relative to the UV wireframe.

The `strip-glb.mjs` script removes these nodes at the file level, leaving only the scene root (with the 0.0254 scale) and the mesh node(s).

## Why no Draco compression

`useGLTF` from `@react-three/drei` does not configure a `DRACOLoader` by default. Loading a Draco-compressed GLB silently produces broken geometry (vertices at origin, degenerate triangles). The uncompressed GLBs are 2-5MB which is fine for this use case.
