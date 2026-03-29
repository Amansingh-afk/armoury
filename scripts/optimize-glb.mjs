#!/usr/bin/env node
/**
 * Strips materials/textures from a GLB, keeping only geometry + UVs.
 * Then apply Draco compression using: gltf-transform draco output.glb output-final.glb
 *
 * Usage: node scripts/optimize-glb.mjs input.glb output.glb
 *
 * Requires: npm install -g @gltf-transform/cli
 */
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { statSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const globalRoot = execSync("npm root -g", { encoding: "utf8" }).trim();
const cliModules = `${globalRoot}/@gltf-transform/cli/node_modules`;

const require = createRequire(`${cliModules}/`);
const { NodeIO } = require("@gltf-transform/core");

const [,, inputPath, outputPath] = process.argv;
if (!inputPath || !outputPath) {
	console.error("Usage: node scripts/optimize-glb.mjs <input.glb> <output.glb>");
	process.exit(1);
}

mkdirSync(dirname(outputPath), { recursive: true });

const io = new NodeIO();
const doc = await io.read(inputPath);
const inputStat = statSync(inputPath);
console.log(`Read: ${inputPath} (${(inputStat.size / 1024 / 1024).toFixed(2)} MB)`);

let textureCount = 0;
for (const texture of doc.getRoot().listTextures()) {
	texture.dispose();
	textureCount++;
}

let materialCount = 0;
for (const material of doc.getRoot().listMaterials()) {
	material.dispose();
	materialCount++;
}

console.log(`Stripped: ${textureCount} textures, ${materialCount} materials`);

for (const ext of doc.getRoot().listExtensionsUsed()) {
	console.log(`Removing extension: ${ext.extensionName}`);
	ext.dispose();
}

const tmpPath = outputPath.replace(/\.glb$/, ".stripped.glb");
await io.write(tmpPath, doc);
const strippedStat = statSync(tmpPath);
console.log(`Stripped: ${tmpPath} (${(strippedStat.size / 1024 / 1024).toFixed(2)} MB)`);

console.log("Applying Draco compression...");
execSync(`gltf-transform draco "${tmpPath}" "${outputPath}"`, { stdio: "inherit" });

execSync(`rm "${tmpPath}"`);

const finalStat = statSync(outputPath);
console.log(`Final: ${outputPath} (${(finalStat.size / 1024 / 1024).toFixed(2)} MB)`);
