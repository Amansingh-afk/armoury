import { useEffect } from "react";
import type { ImageTransform } from "../painting/layer";

interface KeyboardShortcutHandlers {
	onUndo: () => void;
	onRedo: () => void;
	onEscape: () => void;
	getActivePlaceTransform: () => { layerId: number; transform: ImageTransform } | null;
	onImageTransformChange: (layerId: number, partial: Partial<ImageTransform>) => void;
	onTogglePartEditMode: () => void;
}

const SCALE_STEP = 0.02;
const ROTATION_SNAP = Math.PI / 12; // 15 degrees

export function useKeyboardShortcuts({
	onUndo,
	onRedo,
	onEscape,
	getActivePlaceTransform,
	onImageTransformChange,
	onTogglePartEditMode,
}: KeyboardShortcutHandlers) {
	useEffect(() => {
		const handleKey = (e: KeyboardEvent) => {
			if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

			if (e.ctrlKey || e.metaKey) {
				if (e.key === "z" && e.shiftKey) {
					e.preventDefault();
					onRedo();
				} else if (e.key === "z") {
					e.preventDefault();
					onUndo();
				}
				return;
			}

			if (e.key === "Escape") {
				e.preventDefault();
				onEscape();
				return;
			}

			if (e.key === "p" || e.key === "P") {
				e.preventDefault();
				onTogglePartEditMode();
				return;
			}

			const place = getActivePlaceTransform();
			if (!place) return;

			const { layerId, transform } = place;

			switch (e.key) {
				case "[":
					e.preventDefault();
					onImageTransformChange(layerId, {
						scale: Math.max(0.02, transform.scale - SCALE_STEP),
					});
					break;
				case "]":
					e.preventDefault();
					onImageTransformChange(layerId, {
						scale: Math.min(0.8, transform.scale + SCALE_STEP),
					});
					break;
				case "h":
					e.preventDefault();
					onImageTransformChange(layerId, { flipX: !transform.flipX });
					break;
				case "v":
					e.preventDefault();
					onImageTransformChange(layerId, { flipY: !transform.flipY });
					break;
				case "r":
					e.preventDefault();
					onImageTransformChange(layerId, { rotation: 0 });
					break;
			}
		};

		const handleWheel = (e: WheelEvent) => {
			const place = getActivePlaceTransform();
			if (!place) return;

			if (e.target instanceof HTMLInputElement) return;

			const { layerId, transform } = place;

			if (e.shiftKey) {
				e.preventDefault();
				const dir = e.deltaY < 0 ? 1 : -1;
				onImageTransformChange(layerId, {
					rotation: transform.rotation + dir * ROTATION_SNAP,
				});
			} else if (e.altKey) {
				e.preventDefault();
				const factor = e.deltaY < 0 ? SCALE_STEP : -SCALE_STEP;
				onImageTransformChange(layerId, {
					scale: Math.max(0.02, Math.min(0.8, transform.scale + factor)),
				});
			}
		};

		window.addEventListener("keydown", handleKey);
		window.addEventListener("wheel", handleWheel, { passive: false });
		return () => {
			window.removeEventListener("keydown", handleKey);
			window.removeEventListener("wheel", handleWheel);
		};
	}, [onUndo, onRedo, onEscape, getActivePlaceTransform, onImageTransformChange, onTogglePartEditMode]);
}
