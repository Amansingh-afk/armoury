import { useRef } from "react";
import type { BrushSettings } from "../painting/types";
import type { StickerState, Tool, ViewMode } from "../store/editor-store";

interface ToolbarProps {
	onUndo: () => void;
	onRedo: () => void;
	canUndo: boolean;
	canRedo: boolean;
	onImportImage: () => void;
	showWireframe: boolean;
	onToggleWireframe: () => void;
	viewMode: ViewMode;
	onSetViewMode: (mode: ViewMode) => void;
	activeTool: Tool;
	onSetTool: (tool: Tool) => void;
	brush: BrushSettings;
	onBrushChange: (partial: Partial<BrushSettings>) => void;
	sticker: StickerState | null;
	onLoadSticker: (file: File) => void;
	onStickerScaleChange: (scale: number) => void;
	onStickerRotationChange: (rotation: number) => void;
	onClearSticker: () => void;
}

const VIEW_MODES: { value: ViewMode; label: string }[] = [
	{ value: "3d", label: "3D" },
	{ value: "2d", label: "2D" },
	{ value: "split", label: "Split" },
];

export function Toolbar({
	onUndo,
	onRedo,
	canUndo,
	canRedo,
	onImportImage,
	showWireframe,
	onToggleWireframe,
	viewMode,
	onSetViewMode,
	activeTool,
	onSetTool,
	brush,
	onBrushChange,
	sticker,
	onLoadSticker,
	onStickerScaleChange,
	onStickerRotationChange,
	onClearSticker,
}: ToolbarProps) {
	const stickerInputRef = useRef<HTMLInputElement>(null);
	const show2DTools = viewMode === "2d" || viewMode === "split";

	return (
		<div className="flex items-center gap-1 border-b border-zinc-800 bg-zinc-900 px-3 py-1.5">
			<button
				type="button"
				onClick={onImportImage}
				className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-500"
			>
				Import Image
			</button>
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

					<div className="mx-1 h-4 w-px bg-zinc-700" />

					{/* Sticker tool */}
					<button
						type="button"
						onClick={() => stickerInputRef.current?.click()}
						className={`rounded px-3 py-1 text-xs transition-colors ${
							activeTool === "sticker"
								? "bg-orange-600 text-white"
								: "text-zinc-400 hover:bg-zinc-800"
						}`}
					>
						Sticker
					</button>
					<input
						ref={stickerInputRef}
						type="file"
						accept="image/*"
						className="hidden"
						onChange={(e) => {
							const file = e.target.files?.[0];
							if (file) onLoadSticker(file);
							e.target.value = "";
						}}
					/>

					{activeTool === "sticker" && sticker && (
						<div className="flex items-center gap-2 ml-1">
							<label className="text-[10px] text-zinc-500 whitespace-nowrap">
								Scale: {sticker.scale.toFixed(2)}
							</label>
							<input
								type="range"
								min={0.05}
								max={5}
								step={0.01}
								value={sticker.scale}
								onChange={(e) => onStickerScaleChange(Number.parseFloat(e.target.value))}
								className="w-16 h-1"
							/>
							<label className="text-[10px] text-zinc-500 whitespace-nowrap">
								Rot: {Math.round(sticker.rotation * (180 / Math.PI))}°
							</label>
							<input
								type="range"
								min={-3.14159}
								max={3.14159}
								step={0.01}
								value={sticker.rotation}
								onChange={(e) => onStickerRotationChange(Number.parseFloat(e.target.value))}
								className="w-16 h-1"
							/>
							<button
								type="button"
								onClick={onClearSticker}
								className="rounded px-2 py-0.5 text-[10px] text-zinc-400 hover:bg-zinc-800"
							>
								Done
							</button>
						</div>
					)}
				</>
			)}
		</div>
	);
}
