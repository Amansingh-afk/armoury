"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { PreviewPreset } from "@armoury/editor";

const ModelPreview = dynamic(
	() => import("@armoury/editor").then((mod) => ({ default: mod.ModelPreview })),
	{
		ssr: false,
		loading: () => (
			<div className="flex h-full items-center justify-center">
				<div className="flex flex-col items-center gap-3 text-zinc-600">
					<div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />
					<span className="text-xs">Loading 3D preview...</span>
				</div>
			</div>
		),
	},
);

/**
 * Presets for the landing page showcase.
 *
 * Each preset defines layers that get composited onto the weapon model.
 * - "pattern" layers use procedural fills (no external files needed)
 * - "image" layers reference PNGs in public/previews/
 *
 * To add your own image presets:
 *   1. Place PNGs in apps/web/public/previews/
 *   2. Add a layer with type: "image" and imagePath: "/previews/your-file.png"
 */
const PRESETS: PreviewPreset[] = [
	{
		name: "Neon Shark",
		description: "Aggressive teal shark illustration with neon accents",
		roughness: 0.2,
		metallic: 0.7,
		wearLevel: 0.05,
		layers: [
			{ type: "pattern", pattern: "solid", colors: ["#0a1a1a"], opacity: 1 },
			{ type: "image", imagePath: "/previews/neon-shark.jpg", fillMode: "stretch", opacity: 1 },
		],
	},
	{
		name: "Japanese Art",
		description: "Traditional Japanese culture collage — daruma, maneki-neko, ramen",
		roughness: 0.45,
		metallic: 0.15,
		wearLevel: 0.1,
		layers: [
			{ type: "image", imagePath: "/previews/japanese-collage.jpg", fillMode: "stretch", opacity: 1 },
		],
	},
	{
		name: "Dark Lava",
		description: "Molten lava texture with crimson and gold edges",
		roughness: 0.3,
		metallic: 0.8,
		wearLevel: 0.15,
		layers: [
			{ type: "image", imagePath: "/previews/dark-lava.jpg", fillMode: "stretch", opacity: 1 },
		],
	},
	{
		name: "Oriental Clouds",
		description: "Traditional red and teal cloud pattern",
		roughness: 0.35,
		metallic: 0.4,
		wearLevel: 0,
		layers: [
			{ type: "image", imagePath: "/previews/oriental-clouds.jpg", fillMode: "stretch", opacity: 1 },
		],
	},
	{
		name: "Topographic",
		description: "Minimal black with white contour lines",
		roughness: 0.15,
		metallic: 0.9,
		wearLevel: 0,
		layers: [
			{ type: "image", imagePath: "/previews/topographic.jpg", fillMode: "stretch", opacity: 1 },
		],
	},
	{
		name: "Comic Boom",
		description: "Pop art explosion — loud, colorful, unmissable",
		roughness: 0.5,
		metallic: 0.1,
		wearLevel: 0.05,
		layers: [
			{ type: "image", imagePath: "/previews/comic-boom.jpg", fillMode: "stretch", opacity: 1 },
		],
	},
	{
		name: "Wave Cat",
		description: "Artistic black cat illustration with wavy stripes",
		roughness: 0.3,
		metallic: 0.5,
		wearLevel: 0,
		layers: [
			{ type: "pattern", pattern: "solid", colors: ["#f0e8d0"], opacity: 1 },
			{ type: "image", imagePath: "/previews/wave-cat.jpg", fillMode: "stretch", opacity: 1 },
		],
	},
	{
		name: "Supra Drift",
		description: "Neon green JDM Supra — street racing energy",
		roughness: 0.2,
		metallic: 0.65,
		wearLevel: 0.05,
		layers: [
			{ type: "pattern", pattern: "solid", colors: ["#0a1a0a"], opacity: 1 },
			{ type: "image", imagePath: "/previews/supra-drift.png", fillMode: "stretch", opacity: 1 },
		],
	},
];

const SHOWCASE_WEAPONS = [
	{ id: "ak47", label: "AK-47", path: "/models/ak47.glb" },
	{ id: "m4a4", label: "M4A4", path: "/models/m4a4.glb" },
	{ id: "awp", label: "AWP", path: "/models/awp.glb" },
	{ id: "deagle", label: "Deagle", path: "/models/deagle.glb" },
	{ id: "m4a1_silencer", label: "M4A1-S", path: "/models/m4a1_silencer.glb" },
	{ id: "usp_silencer", label: "USP-S", path: "/models/usp_silencer.glb" },
] as const;

export function PreviewShowcase() {
	const [activeIdx, setActiveIdx] = useState(0);
	const [weaponIdx, setWeaponIdx] = useState(0);
	const preset = PRESETS[activeIdx];
	const weapon = SHOWCASE_WEAPONS[weaponIdx];

	return (
		<div className="flex flex-col items-center gap-8">
			{/* 3D Viewport */}
			<div className="relative w-full max-w-3xl aspect-[16/10] rounded-2xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden backdrop-blur-sm">
				{/* Corner accents */}
				<div className="pointer-events-none absolute inset-0 z-10">
					<div className="absolute top-0 left-0 h-16 w-16 border-t border-l border-zinc-700/40 rounded-tl-2xl" />
					<div className="absolute top-0 right-0 h-16 w-16 border-t border-r border-zinc-700/40 rounded-tr-2xl" />
					<div className="absolute bottom-0 left-0 h-16 w-16 border-b border-l border-zinc-700/40 rounded-bl-2xl" />
					<div className="absolute bottom-0 right-0 h-16 w-16 border-b border-r border-zinc-700/40 rounded-br-2xl" />
				</div>

				{/* Preset label overlay */}
				<div className="absolute top-4 left-4 z-10 flex items-center gap-2">
					<div className="rounded-md bg-zinc-950/70 px-3 py-1.5 backdrop-blur-md border border-zinc-800/50">
						<p className="text-xs font-semibold text-zinc-200">{preset.name}</p>
					</div>
				</div>

				{/* Interaction hint */}
				<div className="absolute bottom-4 right-4 z-10 rounded-md bg-zinc-950/60 px-2.5 py-1 backdrop-blur-md border border-zinc-800/40">
					<p className="text-[10px] text-zinc-500">Drag to orbit</p>
				</div>

				{/* Weapon switcher */}
				<div className="absolute top-4 right-4 z-10 flex items-center gap-1 rounded-lg bg-zinc-950/70 p-1 backdrop-blur-md border border-zinc-800/50">
					{SHOWCASE_WEAPONS.map((w, i) => (
						<button
							key={w.id}
							type="button"
							onClick={() => setWeaponIdx(i)}
							className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
								i === weaponIdx
									? "bg-zinc-700/60 text-zinc-100"
									: "text-zinc-500 hover:text-zinc-300"
							}`}
						>
							{w.label}
						</button>
					))}
				</div>

				<ModelPreview
					key={weapon.id}
					modelPath={weapon.path}
					preset={preset}
					autoRotate
				/>
			</div>

			{/* Preset selector tabs */}
			<div className="flex flex-wrap justify-center gap-2">
				{PRESETS.map((p, i) => (
					<button
						key={p.name}
						type="button"
						onClick={() => setActiveIdx(i)}
						className={`group relative rounded-lg px-4 py-2.5 text-xs font-medium transition-all duration-200 ${
							i === activeIdx
								? "bg-blue-600/15 text-blue-400 border border-blue-500/30"
								: "bg-zinc-900/50 text-zinc-500 border border-zinc-800/50 hover:text-zinc-300 hover:border-zinc-700/50"
						}`}
					>
						<span>{p.name}</span>
						{i === activeIdx && (
							<span className="absolute -bottom-px left-1/2 -translate-x-1/2 h-px w-8 bg-blue-500" />
						)}
					</button>
				))}
			</div>

			{/* Description */}
			<p className="text-sm text-zinc-600 text-center max-w-md">
				{preset.description}
				<span className="text-zinc-700"> — </span>
				<span className="text-zinc-500">
					{preset.layers.length} layers, {preset.wearLevel > 0 ? `${Math.round(preset.wearLevel * 100)}% wear` : "factory new"}
				</span>
			</p>
		</div>
	);
}
