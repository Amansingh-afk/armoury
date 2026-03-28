# Model Pipeline

## convert-model.py

Converts Valve FBX weapon models to glTF (.glb) for use in Armoury.

### Prerequisites
- Blender 3.6+ on PATH

### Usage
```bash
blender --background --python scripts/convert-model.py -- path/to/weapon.fbx apps/web/public/models/weapon.glb
```

### Where to get source models
1. Install CS2 via Steam
2. Install CS2 Workshop Tools (Steam > CS2 > Properties > DLC)
3. Models are in: `Steam/steamapps/common/Counter-Strike Global Offensive/content/csgo/models/weapons/`
