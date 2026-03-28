"""
Blender CLI script to convert Valve FBX weapon models to glTF.

Usage:
    blender --background --python scripts/convert-model.py -- input.fbx output.glb

Requirements:
    - Blender 3.6+ installed and on PATH
    - Draco compression addon enabled (built-in since Blender 3.x)
"""

import sys
import bpy


def convert(input_path: str, output_path: str) -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)

    bpy.ops.import_scene.fbx(filepath=input_path)

    meshes = [obj for obj in bpy.data.objects if obj.type == "MESH"]
    if not meshes:
        print("ERROR: No meshes found in FBX")
        sys.exit(1)

    for mesh in meshes:
        if not mesh.data.uv_layers:
            print(f"WARNING: Mesh '{mesh.name}' has no UV layers")
        else:
            print(f"OK: Mesh '{mesh.name}' — {len(mesh.data.uv_layers)} UV layer(s), "
                  f"{len(mesh.data.vertices)} verts")

    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_materials="NONE",
        export_apply_modifiers=True,
    )

    print(f"Exported: {output_path}")


if __name__ == "__main__":
    argv = sys.argv
    separator = argv.index("--") if "--" in argv else -1
    if separator == -1 or len(argv) < separator + 3:
        print("Usage: blender --background --python convert-model.py -- input.fbx output.glb")
        sys.exit(1)

    input_fbx = argv[separator + 1]
    output_glb = argv[separator + 2]
    convert(input_fbx, output_glb)
