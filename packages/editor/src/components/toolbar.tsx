import { useRef } from "react";
import type { BrushSettings } from "../painting/types";
import type { Tool, ViewMode } from "../store/editor-store";

export interface WeaponPickerOption {
	id: string;
	label: string;
	path: string;
	category?: string;
}

interface ToolbarProps {
	weaponPicker?: {
		options: WeaponPickerOption[];
		selectedId: string;
		onSelect: (id: string) => void;
	};
	onUndo: () => void;
	onRedo: () => void;
	canUndo: boolean;
	canRedo: boolean;
	onImportImage: () => void;
	onImportSticker: (file: File) => void;
	showWireframe: boolean;
	onToggleWireframe: () => void;
	partEditMode: boolean;
	onTogglePartEditMode: () => void;
	viewMode: ViewMode;
	onSetViewMode: (mode: ViewMode) => void;
	activeTool: Tool;
	onSetTool: (tool: Tool) => void;
	brush: BrushSettings;
	onBrushChange: (partial: Partial<BrushSettings>) => void;
}

const VIEW_MODES: { value: ViewMode; label: string }[] = [
	{ value: "3d", label: "3D" },
	{ value: "2d", label: "2D" },
	{ value: "split", label: "Split" },
];

export function Toolbar({
	weaponPicker,
	onUndo,
	onRedo,
	canUndo,
	canRedo,
	onImportImage,
	onImportSticker,
	showWireframe,
	onToggleWireframe,
	partEditMode,
	onTogglePartEditMode,
	viewMode,
	onSetViewMode,
	activeTool,
	onSetTool,
	brush,
	onBrushChange,
}: ToolbarProps) {
	const stickerInputRef = useRef<HTMLInputElement>(null);
	const show2DTools = viewMode === "2d" || viewMode === "split";

	return (
		<div className="flex items-center gap-1 border-b border-zinc-800 bg-zinc-900 px-3 py-1.5">
			{weaponPicker && weaponPicker.options.length > 0 && (
				<>
					<label className="sr-only" htmlFor="armoury-weapon-select">
						Weapon model
					</label>
					<select
						id="armoury-weapon-select"
						value={weaponPicker.selectedId}
						onChange={(e) => weaponPicker.onSelect(e.target.value)}
						className="shrink-0 rounded border border-zinc-700 bg-zinc-800 py-1 pl-2 pr-6 text-xs text-zinc-200 outline-none hover:bg-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
					>
						{(() => {
							const hasCategories = weaponPicker.options.some((w) => w.category);
							if (!hasCategories) {
								return weaponPicker.options.map((w) => (
									<option key={w.id} value={w.id}>{w.label}</option>
								));
							}
							const groups: [string, WeaponPickerOption[]][] = [];
							for (const w of weaponPicker.options) {
								const cat = w.category || "Other";
								const group = groups.find(([c]) => c === cat);
								if (group) group[1].push(w);
								else groups.push([cat, [w]]);
							}
							return groups.map(([cat, weapons]) => (
								<optgroup key={cat} label={cat}>
									{weapons.map((w) => (
										<option key={w.id} value={w.id}>{w.label}</option>
									))}
								</optgroup>
							));
						})()}
					</select>
					<div className="mx-1 h-4 w-px bg-zinc-700" />
				</>
			)}
			<button
				type="button"
				onClick={onImportImage}
				className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-500"
			>
				Import Image
			</button>
			<button
				type="button"
				onClick={() => stickerInputRef.current?.click()}
				className="rounded bg-orange-600 px-3 py-1 text-xs font-medium text-white hover:bg-orange-500"
			>
				Add Sticker
			</button>
			<input
				ref={stickerInputRef}
				type="file"
				accept="image/*"
				className="hidden"
				onChange={(e) => {
					const file = e.target.files?.[0];
					if (file) onImportSticker(file);
					e.target.value = "";
				}}
			/>
			<div className="mx-2 h-4 w-px bg-zinc-700" />
			<button
				type="button"
				onClick={onUndo}
				disabled={!canUndo}
				className="rounded px-3 py-1 text-xs text-zinc-400 hover:bg-zinc-800 disabled:opacity-30"
				title="Undo (Ctrl+Z)"
			>
				Undo
			</button>
			<button
				type="button"
				onClick={onRedo}
				disabled={!canRedo}
				className="rounded px-3 py-1 text-xs text-zinc-400 hover:bg-zinc-800 disabled:opacity-30"
				title="Redo (Ctrl+Shift+Z)"
			>
				Redo
			</button>
			<div className="mx-2 h-4 w-px bg-zinc-700" />

			{/* View Mode Toggle */}
			<div className="flex gap-0.5">
				{VIEW_MODES.map((mode) => (
					<button
						key={mode.value}
						type="button"
						onClick={() => onSetViewMode(mode.value)}
						className={`rounded px-2 py-1 text-xs transition-colors ${
							viewMode === mode.value
								? "bg-blue-600 text-white"
								: "text-zinc-400 hover:bg-zinc-800"
						}`}
					>
						{mode.label}
					</button>
				))}
			</div>

			<button
				type="button"
				onClick={onToggleWireframe}
				className={`rounded px-3 py-1 text-xs transition-colors ${
					showWireframe
						? "bg-purple-600 text-white"
						: "text-zinc-400 hover:bg-zinc-800"
				}`}
				title="Toggle UV wireframe overlay"
			>
				UV Wire
			</button>

			<button
				type="button"
				onClick={onTogglePartEditMode}
				className={`rounded px-3 py-1 text-xs transition-colors ${
					partEditMode
						? "bg-teal-600 text-white"
						: "text-zinc-400 hover:bg-zinc-800"
				}`}
				title="Part Edit Mode (P) — Right-click mesh parts to customize materials"
			>
				Parts
			</button>

			{/* Brush tools (only in 2D/split mode) */}
			{show2DTools && (
				<>
					<div className="mx-2 h-4 w-px bg-zinc-700" />
					<button
						type="button"
						onClick={() => onSetTool(activeTool === "brush" ? "pan" : "brush")}
						className={`rounded px-3 py-1 text-xs transition-colors ${
							activeTool === "brush"
								? "bg-green-600 text-white"
								: "text-zinc-400 hover:bg-zinc-800"
						}`}
					>
						Brush
					</button>

					{activeTool === "brush" && (
						<div className="flex items-center gap-2 ml-1">
							<input
								type="color"
								value={brush.color}
								onChange={(e) => onBrushChange({ color: e.target.value })}
								className="h-6 w-6 cursor-pointer rounded border border-zinc-700 bg-zinc-800"
							/>
							<label className="text-[10px] text-zinc-500 whitespace-nowrap">
								Size: {brush.size}
							</label>
							<input
								type="range"
								min={1}
								max={200}
								value={brush.size}
								onChange={(e) => onBrushChange({ size: Number.parseInt(e.target.value) })}
								className="w-16 h-1"
							/>
							<label className="text-[10px] text-zinc-500 whitespace-nowrap">
								Op: {Math.round(brush.opacity * 100)}%
							</label>
							<input
								type="range"
								min={0.01}
								max={1}
								step={0.01}
								value={brush.opacity}
								onChange={(e) => onBrushChange({ opacity: Number.parseFloat(e.target.value) })}
								className="w-12 h-1"
							/>
							<label className="text-[10px] text-zinc-500 whitespace-nowrap">
								Hard: {Math.round(brush.hardness * 100)}%
							</label>
							<input
								type="range"
								min={0}
								max={1}
								step={0.01}
								value={brush.hardness}
								onChange={(e) => onBrushChange({ hardness: Number.parseFloat(e.target.value) })}
								className="w-12 h-1"
							/>
						</div>
					)}
				</>
			)}
		</div>
	);
}
