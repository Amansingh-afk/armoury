import { useEffect } from "react";

interface KeyboardShortcutHandlers {
	onUndo: () => void;
	onRedo: () => void;
}

export function useKeyboardShortcuts({ onUndo, onRedo }: KeyboardShortcutHandlers) {
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

			if (e.ctrlKey || e.metaKey) {
				if (e.key === "z" && e.shiftKey) {
					e.preventDefault();
					onRedo();
				} else if (e.key === "z") {
					e.preventDefault();
					onUndo();
				}
			}
		};

		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [onUndo, onRedo]);
}
