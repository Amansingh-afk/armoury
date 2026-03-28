interface ExportBarProps {
	onExportTGA: () => void;
	onExportPNG: () => void;
	onExportRoughnessMap: () => void;
	onExportNormalMap: () => void;
	textureSize: number;
}

export function ExportBar({ onExportTGA, onExportPNG, onExportRoughnessMap, onExportNormalMap, textureSize }: ExportBarProps) {
	return (
		<div className="flex items-center gap-2 border-t border-zinc-800 bg-zinc-900 px-3 py-2">
			<button
				type="button"
				onClick={onExportTGA}
				className="rounded bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-500"
			>
				Export TGA
			</button>
			<button
				type="button"
				onClick={onExportPNG}
				className="rounded bg-zinc-700 px-4 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-600"
			>
				Export PNG
			</button>
			<div className="mx-1 h-4 w-px bg-zinc-700" />
			<button
				type="button"
				onClick={onExportRoughnessMap}
				className="rounded bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-600"
				title="Export roughness map as grayscale PNG"
			>
				Roughness
			</button>
			<button
				type="button"
				onClick={onExportNormalMap}
				className="rounded bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-600"
				title="Export flat normal map PNG"
			>
				Normal
			</button>
			<span className="ml-auto text-xs text-zinc-500">
				{textureSize} &times; {textureSize}
			</span>
		</div>
	);
}
