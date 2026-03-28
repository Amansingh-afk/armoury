import type { BlendMode, Layer } from "../painting/layer";

interface LayersPanelProps {
	layers: Layer[];
	activeLayerId: number;
	onSelectLayer: (id: number) => void;
	onAddLayer: () => void;
	onDeleteLayer: (id: number) => void;
	onToggleVisibility: (id: number) => void;
	onSetOpacity: (id: number, opacity: number) => void;
	onSetBlendMode: (id: number, mode: BlendMode) => void;
	onImportImage: () => void;
}

const BLEND_MODE_OPTIONS: { value: BlendMode; label: string }[] = [
	{ value: "normal", label: "Normal" },
	{ value: "multiply", label: "Multiply" },
	{ value: "screen", label: "Screen" },
	{ value: "overlay", label: "Overlay" },
	{ value: "soft-light", label: "Soft Light" },
	{ value: "color-dodge", label: "Color Dodge" },
	{ value: "color-burn", label: "Color Burn" },
	{ value: "difference", label: "Difference" },
];

export function LayersPanel({
	layers,
	activeLayerId,
	onSelectLayer,
	onAddLayer,
	onDeleteLayer,
	onToggleVisibility,
	onSetOpacity,
	onSetBlendMode,
	onImportImage,
}: LayersPanelProps) {
	return (
		<div className="flex w-52 flex-col border-r border-zinc-800 bg-zinc-900">
			<div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
				<span className="text-xs font-medium text-zinc-300">Layers</span>
				<div className="flex gap-1">
					<button
						type="button"
						onClick={onImportImage}
						className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300 hover:bg-zinc-700"
						title="Import image as new layer"
					>
						+ Image
					</button>
					<button
						type="button"
						onClick={onAddLayer}
						className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300 hover:bg-zinc-700"
						title="Add empty pattern layer"
					>
						+ Layer
					</button>
				</div>
			</div>
			<div className="flex-1 overflow-y-auto">
				{[...layers].reverse().map((layer) => (
					<div
						key={layer.id}
						onClick={() => onSelectLayer(layer.id)}
						className={`flex items-center gap-2 border-b border-zinc-800/50 px-3 py-2 cursor-pointer ${
							layer.id === activeLayerId ? "bg-zinc-800" : "hover:bg-zinc-800/50"
						}`}
					>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onToggleVisibility(layer.id);
							}}
							className={`w-5 text-center text-xs ${layer.visible ? "text-zinc-300" : "text-zinc-600"}`}
							title={layer.visible ? "Hide layer" : "Show layer"}
						>
							{layer.visible ? "\u25C9" : "\u25CE"}
						</button>
						<span className="text-[10px] text-zinc-500">{layer.isImageLayer ? "IMG" : "PAT"}</span>
						<div className="flex-1 min-w-0">
							<span className="text-xs text-zinc-300 truncate block">{layer.name}</span>
							<select
								value={layer.blendMode}
								onChange={(e) => onSetBlendMode(layer.id, e.target.value as BlendMode)}
								onClick={(e) => e.stopPropagation()}
								className="w-full bg-zinc-700 text-[10px] text-zinc-400 rounded px-1 py-0.5 mt-0.5 border-none outline-none"
							>
								{BLEND_MODE_OPTIONS.map((opt) => (
									<option key={opt.value} value={opt.value}>
										{opt.label}
									</option>
								))}
							</select>
						</div>
						<input
							type="range"
							min={0}
							max={1}
							step={0.01}
							value={layer.opacity}
							onChange={(e) => onSetOpacity(layer.id, Number.parseFloat(e.target.value))}
							onClick={(e) => e.stopPropagation()}
							className="w-14 h-1"
						/>
						{layers.length > 1 && (
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									onDeleteLayer(layer.id);
								}}
								className="text-xs text-zinc-600 hover:text-red-400"
								title="Delete layer"
							>
								\u2715
							</button>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
