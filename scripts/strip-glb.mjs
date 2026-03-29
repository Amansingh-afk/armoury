/**
 * strip-glb.mjs — Strip textures, materials, bones, and animations from a GLB
 *
 * Produces a geometry-only model suitable for skin painting. Unlike Draco
 * compression (optimize-glb.mjs), this outputs an uncompressed GLB that
 * works directly with useGLTF (no DRACOLoader required).
 *
 * Usage:
 *   node scripts/strip-glb.mjs <input.glb> <output.glb>
 *
 * Prerequisites:
 *   npm install -g @gltf-transform/cli
 */

import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { statSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const [, , inputPath, outputPath] = process.argv;

if (!inputPath || !outputPath) {
	console.error("Usage: node scripts/strip-glb.mjs <input.glb> <output.glb>");
	process.exit(1);
}

// Resolve gltf-transform from the global CLI install
const globalRoot = execSync("npm root -g", { encoding: "utf8" }).trim();
const cliModules = `${globalRoot}/@gltf-transform/cli/node_modules`;
const require = createRequire(`${cliModules}/`);
const { NodeIO } = require("@gltf-transform/core");

mkdirSync(dirname(outputPath), { recursive: true });

const io = new NodeIO();
const doc = await io.read(inputPath);

// Strip textures and materials (we paint our own)
for (const t of doc.getRoot().listTextures()) t.dispose();
for (const m of doc.getRoot().listMaterials()) m.dispose();

// Remove extensions (e.g. KHR_draco_mesh_compression)
for (const ext of doc.getRoot().listExtensionsUsed()) ext.dispose();

// Remove animations and skins (bone rigs)
for (const anim of doc.getRoot().listAnimations()) anim.dispose();
for (const skin of doc.getRoot().listSkins()) skin.dispose();

// Find which nodes carry meshes
const meshNodes = new Set();
for (const node of doc.getRoot().listNodes()) {
	if (node.getMesh()) meshNodes.add(node);
}

// Strip non-mesh node branches (weapon_hand_r, bolt, trigger, clip, etc.)
// These bone nodes have large translations that inflate the bounding box
for (const scene of doc.getRoot().listScenes()) {
	for (const rootChild of scene.listChildren()) {
		const stripNonMesh = (parent) => {
			for (const child of parent.listChildren()) {
				if (meshNodes.has(child)) continue;
				let hasMeshDescendant = false;
				const check = (n) => {
					if (meshNodes.has(n)) {
						hasMeshDescendant = true;
						return;
					}
					for (const c of n.listChildren()) check(c);
				};
				check(child);
				if (!hasMeshDescendant) {
					parent.removeChild(child);
					child.dispose();
				} else {
					stripNonMesh(child);
				}
			}
		};
		stripNonMesh(rootChild);
	}
}

// Write uncompressed GLB
await io.write(outputPath, doc);

// Print summary
const doc2 = await io.read(outputPath);
const nodes = doc2.getRoot().listNodes();
const sizeKB = (statSync(outputPath).size / 1024).toFixed(0);
console.log(`\n✓ ${outputPath}: ${nodes.length} nodes, ${sizeKB}KB\n`);
for (const n of nodes) {
	const scale = n
		.getScale()
		.map((v) => v.toFixed(4))
		.join(", ");
	console.log(
		`  ${n.getName() || "(unnamed)"} — mesh: ${!!n.getMesh()}, scale: [${scale}], children: ${n.listChildren().length}`,
	);
}
