"use client";

import { useState } from "react";
import type { PatternType } from "../painting/fill";
import type { ColorAdjust, ImageFillMode, ImageTransform } from "../painting/layer";
import { WEAR_PRESETS } from "../painting/wear";

export interface FinishPreset {
	name: string;
	roughness: number;
	metallic: number;
}

const FINISH_PRESETS: FinishPreset[] = [
	{ name: "Matte", roughness: 0.9, metallic: 0 },
	{ name: "Satin", roughness: 0.5, metallic: 0.1 },
	{ name: "Glossy", roughness: 0.15, metallic: 0.1 },
	{ name: "Metallic", roughness: 0.3, metallic: 0.9 },
	{ name: "Chrome", roughness: 0.05, metallic: 1.0 },
	{ name: "Battle-Scarred", roughness: 0.8, metallic: 0.2 },
];

const PATTERNS: { type: PatternType; label: string; defaultColors: string[] }[] = [
	{ type: "solid", label: "Solid Color", defaultColors: ["#ffffff"] },
	{ type: "camo", label: "Camo", defaultColors: ["#4a5a2b", "#2d3a1a", "#6b7a3d"] },
	{ type: "digital-camo", label: "Digital Camo", defaultColors: ["#5a6b3c", "#3a4a2a", "#7a8b4e"] },
	{ type: "carbon-fiber", label: "Carbon Fiber", defaultColors: ["#1a1a1a", "#2a2a2a"] },
	{ type: "stripes", label: "Stripes", defaultColors: ["#cc0000", "#000000"] },
	{ type: "checker", label: "Checker", defaultColors: ["#ffffff", "#000000"] },
	{ type: "noise", label: "Noise / Grain", defaultColors: ["#555555"] },
	{ type: "gradient", label: "Gradient", defaultColors: ["#1a1a2e", "#e94560"] },
	{ type: "damascus", label: "Damascus Steel", defaultColors: ["#2a2a2a", "#4a4a4a"] },
	{ type: "marble", label: "Marble", defaultColors: ["#f0f0f0", "#333333"] },
	{ type: "wood-grain", label: "Wood Grain", defaultColors: ["#8B4513", "#D2691E"] },
	{ type: "geometric", label: "Geometric", defaultColors: ["#1a1a2e", "#e94560"] },
	{ type: "stripes-horizontal", label: "H. Stripes", defaultColors: ["#cc0000", "#000000"] },
	{ type: "stripes-vertical", label: "V. Stripes", defaultColors: ["#cc0000", "#000000"] },
	{ type: "stripes-crosshatch", label: "Crosshatch", defaultColors: ["#cc0000", "#000000"] },
	{ type: "stripes-pinstripe", label: "Pinstripe", defaultColors: ["#1a1a1a", "#cc9900"] },
	{ type: "stripes-racing", label: "Racing", defaultColors: ["#ffffff", "#cc0000"] },
	{ type: "triangles", label: "Triangles", defaultColors: ["#1a1a2e", "#e94560"] },
	{ type: "dots", label: "Dots", defaultColors: ["#1a1a1a", "#cc0000"] },
	{ type: "diamond", label: "Diamond", defaultColors: ["#1a1a2e", "#e94560", "#333355"] },
	{ type: "scales", label: "Scales", defaultColors: ["#2a4a2a", "#1a3a1a"] },
	{ type: "tribal", label: "Tribal", defaultColors: ["#1a1a1a", "#cc0000"] },
];

interface StylePanelProps {
	roughness: number;
	metallic: number;
	onRoughnessChange: (v: number) => void;
	onMetallicChange: (v: number) => void;
	onApplyToAll: (pattern: PatternType, colors: string[]) => void;
	// Image layer controls
	isImageLayer: boolean;
	imageTransform: ImageTransform | null;
	onImageTransformChange: (partial: Partial<ImageTransform>) => void;
	// Color adjustments
	colorAdjust: ColorAdjust | null;
	onColorAdjustChange: (partial: Partial<ColorAdjust>) => void;
	// Emboss/engrave
	emboss: boolean;
	embossStrength: number;
	onEmbossChange: (enabled: boolean, strength?: number) => void;
	// Wear controls
	wearLevel: number;
	onWearLevelChange: (value: number) => void;
	wearBaseColor: string;
	onWearBaseColorChange: (hex: string) => void;
	wearSharpness: number;
	onWearSharpnessChange: (value: number) => void;
}

export function StylePanel({
	roughness,
	metallic,
	onRoughnessChange,
	onMetallicChange,
	onApplyToAll,
	isImageLayer,
	imageTransform,
	onImageTransformChange,
	colorAdjust,
	onColorAdjustChange,
	emboss,
	embossStrength,
	onEmbossChange,
	wearLevel,
	onWearLevelChange,
	wearBaseColor,
	onWearBaseColorChange,
	wearSharpness,
	onWearSharpnessChange,
}: StylePanelProps) {
	const [selectedPattern, setSelectedPattern] = useState<PatternType>("solid");
	const [patternColors, setPatternColors] = useState<string[]>(["#ffffff"]);

	const selectPattern = (type: PatternType) => {
		setSelectedPattern(type);
		const p = PATTERNS.find((x) => x.type === type);
		if (p) setPatternColors([...p.defaultColors]);
	};

	const updateColor = (index: number, value: string) => {
		setPatternColors((prev) => {
			const next = [...prev];
			next[index] = value;
			return next;
		});
	};

	const addColor = () => {
		setPatternColors((prev) => [...prev, "#808080"]);
	};

	const removeColor = (index: number) => {
		if (patternColors.length <= 1) return;
		setPatternColors((prev) => prev.filter((_, i) => i !== index));
	};

	return (
		<div className="flex w-56 flex-col gap-3 overflow-y-auto border-l border-zinc-800 bg-zinc-900 p-3">
		{isImageLayer && imageTransform ? (
			<>
				{/* Fill Mode */}
				<div>
					<label className="mb-1.5 block text-xs font-medium text-zinc-400">Fill Mode</label>
					<div className="grid grid-cols-3 gap-1">
						{(["stretch", "tile", "place"] as ImageFillMode[]).map((mode) => (
							<button
								key={mode}
								type="button"
								onClick={() => onImageTransformChange({ fillMode: mode })}
								className={`rounded px-2 py-1.5 text-xs transition-colors ${
									imageTransform.fillMode === mode
										? "bg-blue-600 text-white"
										: "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
								}`}
							>
								{mode === "stretch" ? "Fill UV" : mode === "tile" ? "Tile" : "Sticker"}
							</button>
						))}
					</div>
				</div>

				{/* Scale (tile mode) */}
				{imageTransform.fillMode === "tile" && (
					<div>
						<label className="mb-0.5 block text-[10px] text-zinc-500">
							Scale: {imageTransform.scale.toFixed(2)}
						</label>
						<input
							type="range"
							min={0.05}
							max={5}
							step={0.01}
							value={imageTransform.scale}
							onChange={(e) =>
								onImageTransformChange({ scale: Number.parseFloat(e.target.value) })
							}
							className="w-full"
						/>
					</div>
				)}

				{/* Sticker controls (place mode) */}
				{imageTransform.fillMode === "place" && (
					<>
						<div>
							<label className="mb-0.5 block text-[10px] text-zinc-500">
								Size: {Math.round(imageTransform.scale * 100)}%
							</label>
							<input
								type="range"
								min={0.02}
								max={0.8}
								step={0.005}
								value={imageTransform.scale}
								onChange={(e) =>
									onImageTransformChange({ scale: Number.parseFloat(e.target.value) })
								}
								className="w-full"
							/>
						</div>
						<div>
							<label className="mb-0.5 block text-[10px] text-zinc-500">
								X: {Math.round(imageTransform.x * 100)}%
							</label>
							<input
								type="range"
								min={0}
								max={1}
								step={0.005}
								value={imageTransform.x}
								onChange={(e) =>
									onImageTransformChange({ x: Number.parseFloat(e.target.value) })
								}
								className="w-full"
							/>
						</div>
						<div>
							<label className="mb-0.5 block text-[10px] text-zinc-500">
								Y: {Math.round(imageTransform.y * 100)}%
							</label>
							<input
								type="range"
								min={0}
								max={1}
								step={0.005}
								value={imageTransform.y}
								onChange={(e) =>
									onImageTransformChange({ y: Number.parseFloat(e.target.value) })
								}
								className="w-full"
							/>
						</div>
						<div>
							<label className="mb-0.5 block text-[10px] text-zinc-500">
								Rotation: {Math.round(imageTransform.rotation * (180 / Math.PI))}°
							</label>
							<input
								type="range"
								min={-3.14159}
								max={3.14159}
								step={0.01}
								value={imageTransform.rotation}
								onChange={(e) =>
									onImageTransformChange({ rotation: Number.parseFloat(e.target.value) })
								}
								className="w-full"
							/>
						</div>
						<div className="flex gap-1">
							<button
								type="button"
								onClick={() => onImageTransformChange({ flipX: !imageTransform.flipX })}
								className={`flex-1 rounded px-2 py-1.5 text-xs transition-colors ${
									imageTransform.flipX
										? "bg-orange-600 text-white"
										: "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
								}`}
							>
								Flip H
							</button>
							<button
								type="button"
								onClick={() => onImageTransformChange({ flipY: !imageTransform.flipY })}
								className={`flex-1 rounded px-2 py-1.5 text-xs transition-colors ${
									imageTransform.flipY
										? "bg-orange-600 text-white"
										: "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
								}`}
							>
								Flip V
							</button>
						</div>
					</>
				)}

				{/* Instructions */}
				<div className="border-t border-zinc-800 pt-2">
					<p className="text-xs text-zinc-600 leading-relaxed">
						{imageTransform.fillMode === "stretch" &&
							"Image stretched to fill the UV texture."}
						{imageTransform.fillMode === "tile" &&
							"Image repeats across the UV texture. Adjust scale to change tile size."}
						{imageTransform.fillMode === "place" &&
							"Sticker placed on texture. Adjust position, size, rotation, and flip. Use scroll wheel to resize, Shift+scroll to rotate."}
					</p>
				</div>
			</>
		) : (
				<>
					{/* Pattern Selection */}
					<div>
						<label className="mb-1.5 block text-xs font-medium text-zinc-400">Pattern</label>
						<select
							value={selectedPattern}
							onChange={(e) => selectPattern(e.target.value as PatternType)}
							className="w-full bg-zinc-800 text-xs text-zinc-300 rounded px-2 py-1.5 border border-zinc-700 outline-none"
						>
							{PATTERNS.map((p) => (
								<option key={p.type} value={p.type}>
									{p.label}
								</option>
							))}
						</select>
					</div>

					{/* Color Swatches */}
					<div>
						<label className="mb-1 block text-xs font-medium text-zinc-400">Colors</label>
						<div className="flex flex-col gap-1.5">
							{patternColors.map((c, i) => (
								<div key={`color-${i}-${patternColors.length}`} className="flex items-center gap-1.5">
									<input
										type="color"
										value={c}
										onChange={(e) => updateColor(i, e.target.value)}
										className="h-7 w-10 cursor-pointer rounded border border-zinc-700 bg-zinc-800"
									/>
									<span className="text-[10px] text-zinc-500 flex-1">{c}</span>
									{patternColors.length > 1 && (
										<button
											type="button"
											onClick={() => removeColor(i)}
											className="text-xs text-zinc-600 hover:text-red-400 px-1"
										>
											✕
										</button>
									)}
								</div>
							))}
							<button
								type="button"
								onClick={addColor}
								className="rounded bg-zinc-800 px-2 py-1 text-[10px] text-zinc-400 hover:bg-zinc-700 self-start"
							>
								+ Add Color
							</button>
						</div>
					</div>

					{/* Apply Button */}
					<button
						type="button"
						onClick={() => onApplyToAll(selectedPattern, patternColors)}
						className="rounded bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-500 transition-colors"
					>
						Apply to Layer
					</button>
				</>
			)}

			{/* Finish Presets */}
			<div className="border-t border-zinc-800 pt-3">
				<label className="mb-1.5 block text-xs font-medium text-zinc-400">Finish</label>
				<div className="grid grid-cols-2 gap-1">
					{FINISH_PRESETS.map((preset) => {
						const isActive =
							Math.abs(roughness - preset.roughness) < 0.05 &&
							Math.abs(metallic - preset.metallic) < 0.05;
						return (
							<button
								key={preset.name}
								type="button"
								onClick={() => {
									onRoughnessChange(preset.roughness);
									onMetallicChange(preset.metallic);
								}}
								className={`rounded px-2 py-1.5 text-xs transition-colors ${
									isActive
										? "bg-blue-600 text-white"
										: "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
								}`}
							>
								{preset.name}
							</button>
						);
					})}
				</div>
			</div>

			{/* Fine-tune sliders */}
			<div>
				<label className="mb-1 block text-xs text-zinc-500">
					Roughness: {roughness.toFixed(2)}
				</label>
				<input
					type="range"
					min={0}
					max={1}
					step={0.01}
					value={roughness}
					onChange={(e) => onRoughnessChange(Number.parseFloat(e.target.value))}
					className="w-full"
				/>
			</div>
			<div>
				<label className="mb-1 block text-xs text-zinc-500">Metallic: {metallic.toFixed(2)}</label>
				<input
					type="range"
					min={0}
					max={1}
					step={0.01}
					value={metallic}
					onChange={(e) => onMetallicChange(Number.parseFloat(e.target.value))}
					className="w-full"
				/>
			</div>

			{/* Color Adjustments */}
			{colorAdjust && (
				<div className="border-t border-zinc-800 pt-3">
					<label className="mb-1.5 block text-xs font-medium text-zinc-400">Color Adjust</label>
					<div>
						<label className="mb-0.5 block text-[10px] text-zinc-500">
							Hue: {colorAdjust.hue > 0 ? "+" : ""}{colorAdjust.hue}°
						</label>
						<input
							type="range"
							min={-180}
							max={180}
							step={1}
							value={colorAdjust.hue}
							onChange={(e) => onColorAdjustChange({ hue: Number.parseInt(e.target.value) })}
							className="w-full"
						/>
					</div>
					<div>
						<label className="mb-0.5 block text-[10px] text-zinc-500">
							Saturation: {colorAdjust.saturation > 0 ? "+" : ""}{colorAdjust.saturation.toFixed(2)}
						</label>
						<input
							type="range"
							min={-1}
							max={1}
							step={0.01}
							value={colorAdjust.saturation}
							onChange={(e) => onColorAdjustChange({ saturation: Number.parseFloat(e.target.value) })}
							className="w-full"
						/>
					</div>
					<div>
						<label className="mb-0.5 block text-[10px] text-zinc-500">
							Brightness: {colorAdjust.brightness > 0 ? "+" : ""}{colorAdjust.brightness.toFixed(2)}
						</label>
						<input
							type="range"
							min={-1}
							max={1}
							step={0.01}
							value={colorAdjust.brightness}
							onChange={(e) => onColorAdjustChange({ brightness: Number.parseFloat(e.target.value) })}
							className="w-full"
						/>
					</div>
					<button
						type="button"
						onClick={() => onColorAdjustChange({ hue: 0, saturation: 0, brightness: 0 })}
						className="mt-1 rounded bg-zinc-800 px-2 py-1 text-[10px] text-zinc-400 hover:bg-zinc-700"
					>
						Reset
					</button>
				</div>
			)}

			{/* Emboss / Engrave */}
			<div className="border-t border-zinc-800 pt-3">
				<div className="flex items-center justify-between mb-1.5">
					<label className="text-xs font-medium text-zinc-400">Engrave Effect</label>
					<button
						type="button"
						onClick={() => onEmbossChange(!emboss)}
						className={`rounded px-2 py-0.5 text-[10px] transition-colors ${
							emboss
								? "bg-purple-600 text-white"
								: "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
						}`}
					>
						{emboss ? "ON" : "OFF"}
					</button>
				</div>
				{emboss && (
					<div>
						<label className="mb-0.5 block text-[10px] text-zinc-500">
							Depth: {embossStrength.toFixed(2)}
						</label>
						<input
							type="range"
							min={0.05}
							max={1}
							step={0.01}
							value={embossStrength}
							onChange={(e) => onEmbossChange(true, Number.parseFloat(e.target.value))}
							className="w-full"
						/>
					</div>
				)}
			</div>

			{/* Wear / Aging */}
			<div className="border-t border-zinc-800 pt-3">
				<label className="mb-1.5 block text-xs font-medium text-zinc-400">Wear Level</label>
				<select
					value={WEAR_PRESETS.find((p) => Math.abs(wearLevel - p.value) < 0.02)?.name ?? "custom"}
					onChange={(e) => {
						const preset = WEAR_PRESETS.find((p) => p.name === e.target.value);
						if (preset) onWearLevelChange(preset.value);
					}}
					className="w-full bg-zinc-800 text-xs text-zinc-300 rounded px-2 py-1.5 border border-zinc-700 outline-none mb-2"
				>
					{WEAR_PRESETS.map((preset) => (
						<option key={preset.name} value={preset.name}>
							{preset.name} ({preset.value})
						</option>
					))}
					{!WEAR_PRESETS.some((p) => Math.abs(wearLevel - p.value) < 0.02) && (
						<option value="custom" disabled>
							Custom ({wearLevel.toFixed(2)})
						</option>
					)}
				</select>
				<div>
					<label className="mb-0.5 block text-[10px] text-zinc-500">
						Wear: {wearLevel.toFixed(2)}
					</label>
					<input
						type="range"
						min={0}
						max={1}
						step={0.01}
						value={wearLevel}
						onChange={(e) => onWearLevelChange(Number.parseFloat(e.target.value))}
						className="w-full"
					/>
				</div>
				<div className="mt-2">
					<label className="mb-0.5 block text-[10px] text-zinc-500">Base Color</label>
					<input
						type="color"
						value={wearBaseColor}
						onChange={(e) => onWearBaseColorChange(e.target.value)}
						className="h-6 w-full cursor-pointer rounded border border-zinc-700 bg-zinc-800"
					/>
				</div>
				<div className="mt-1">
					<label className="mb-0.5 block text-[10px] text-zinc-500">
						Edge Sharpness: {wearSharpness.toFixed(2)}
					</label>
					<input
						type="range"
						min={0}
						max={1}
						step={0.01}
						value={wearSharpness}
						onChange={(e) => onWearSharpnessChange(Number.parseFloat(e.target.value))}
						className="w-full"
					/>
				</div>
			</div>
		</div>
	);
}
