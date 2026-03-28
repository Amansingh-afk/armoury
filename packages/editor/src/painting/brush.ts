import type { TextureCanvas } from "./texture-canvas";
import type { BrushSettings } from "./types";

export function stampBrush(target: TextureCanvas, x: number, y: number, brush: BrushSettings): void {
	const ctx = target.getContext();
	const radius = brush.size / 2;
	if (radius < 0.5) return;

	ctx.save();
	ctx.globalAlpha = brush.opacity;

	const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
	const hardStop = Math.max(0, Math.min(1, brush.hardness));
	gradient.addColorStop(0, brush.color);
	gradient.addColorStop(hardStop, brush.color);
	gradient.addColorStop(1, `${brush.color}00`); // transparent

	ctx.fillStyle = gradient;
	ctx.beginPath();
	ctx.arc(x, y, radius, 0, Math.PI * 2);
	ctx.fill();
	ctx.restore();
}

export function strokeBrush(
	target: TextureCanvas,
	points: Array<{ x: number; y: number }>,
	brush: BrushSettings,
): void {
	if (points.length === 0) return;
	if (points.length === 1) {
		stampBrush(target, points[0].x, points[0].y, brush);
		return;
	}

	const spacing = Math.max(1, brush.size * 0.25);

	for (let i = 0; i < points.length - 1; i++) {
		const p0 = points[i];
		const p1 = points[i + 1];
		const dx = p1.x - p0.x;
		const dy = p1.y - p0.y;
		const dist = Math.sqrt(dx * dx + dy * dy);
		const steps = Math.max(1, Math.ceil(dist / spacing));

		for (let s = 0; s <= steps; s++) {
			const t = s / steps;
			stampBrush(target, p0.x + dx * t, p0.y + dy * t, brush);
		}
	}
}
