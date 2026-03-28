import type { TextureCanvas } from "./texture-canvas";
import { hexToRgb, pseudoRandom } from "./types";

export type PatternType =
	| "solid"
	| "camo"
	| "carbon-fiber"
	| "stripes"
	| "checker"
	| "noise"
	| "digital-camo"
	| "gradient"
	| "damascus"
	| "marble"
	| "wood-grain"
	| "geometric"
	| "stripes-horizontal"
	| "stripes-vertical"
	| "stripes-crosshatch"
	| "stripes-pinstripe"
	| "stripes-racing"
	| "triangles"
	| "dots"
	| "diamond"
	| "scales"
	| "tribal";

/** Fill the entire canvas with a solid color */
export function fillSolid(target: TextureCanvas, color: string): void {
	const ctx = target.getContext();
	ctx.save();
	ctx.globalCompositeOperation = "source-over";
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, target.width, target.height);
	ctx.restore();
}

/** Fill with a procedural pattern */
export function fillPattern(target: TextureCanvas, pattern: PatternType, colors: string[]): void {
	switch (pattern) {
		case "solid":
			fillSolid(target, colors[0] || "#808080");
			break;
		case "camo":
			drawCamo(target, colors);
			break;
		case "carbon-fiber":
			drawCarbonFiber(target, colors);
			break;
		case "stripes":
			drawStripes(target, colors);
			break;
		case "checker":
			drawChecker(target, colors);
			break;
		case "noise":
			drawNoise(target, colors);
			break;
		case "digital-camo":
			drawDigitalCamo(target, colors);
			break;
		case "gradient":
			drawGradient(target, colors);
			break;
		case "damascus":
			drawDamascus(target, colors);
			break;
		case "marble":
			drawMarble(target, colors);
			break;
		case "wood-grain":
			drawWoodGrain(target, colors);
			break;
		case "geometric":
			drawGeometric(target, colors);
			break;
		case "stripes-horizontal":
			drawStripesHorizontal(target, colors);
			break;
		case "stripes-vertical":
			drawStripesVertical(target, colors);
			break;
		case "stripes-crosshatch":
			drawStripesCrosshatch(target, colors);
			break;
		case "stripes-pinstripe":
			drawStripesPinstripe(target, colors);
			break;
		case "stripes-racing":
			drawStripesRacing(target, colors);
			break;
		case "triangles":
			drawTriangles(target, colors);
			break;
		case "dots":
			drawDots(target, colors);
			break;
		case "diamond":
			drawDiamond(target, colors);
			break;
		case "scales":
			drawScales(target, colors);
			break;
		case "tribal":
			drawTribal(target, colors);
			break;
	}
}

function drawCamo(target: TextureCanvas, colors: string[]): void {
	const c1 = colors[0] || "#4a5a2b";
	const c2 = colors[1] || "#2d3a1a";
	const c3 = colors[2] || "#6b7a3d";
	const w = target.width;
	const h = target.height;
	const ctx = target.getContext();

	ctx.fillStyle = c1;
	ctx.fillRect(0, 0, w, h);

	// Random organic blobs
	const seed = 42;
	for (let layer = 0; layer < 2; layer++) {
		ctx.fillStyle = layer === 0 ? c2 : c3;
		for (let i = 0; i < 30; i++) {
			const cx = pseudoRandom(seed + i * 7 + layer * 200) * w;
			const cy = pseudoRandom(seed + i * 13 + layer * 200) * h;
			const rx = 40 + pseudoRandom(seed + i * 19 + layer * 200) * 200;
			const ry = 40 + pseudoRandom(seed + i * 23 + layer * 200) * 200;
			const rot = pseudoRandom(seed + i * 29 + layer * 200) * Math.PI;
			ctx.save();
			ctx.translate(cx, cy);
			ctx.rotate(rot);
			ctx.beginPath();
			ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
			ctx.fill();
			ctx.restore();
		}
	}
}

function drawDigitalCamo(target: TextureCanvas, colors: string[]): void {
	const c1 = colors[0] || "#5a6b3c";
	const c2 = colors[1] || "#3a4a2a";
	const c3 = colors[2] || "#7a8b4e";
	const w = target.width;
	const h = target.height;
	const ctx = target.getContext();
	const blockSize = 32;

	ctx.fillStyle = c1;
	ctx.fillRect(0, 0, w, h);

	const cols = Math.ceil(w / blockSize);
	const rows = Math.ceil(h / blockSize);
	const palette = [c2, c3];

	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			const val = pseudoRandom(r * 1000 + c * 7 + 99);
			if (val > 0.4) {
				ctx.fillStyle = palette[val > 0.7 ? 1 : 0];
				ctx.fillRect(c * blockSize, r * blockSize, blockSize, blockSize);
			}
		}
	}
}

function drawCarbonFiber(target: TextureCanvas, colors: string[]): void {
	const c1 = colors[0] || "#1a1a1a";
	const c2 = colors[1] || "#2a2a2a";
	const w = target.width;
	const h = target.height;
	const ctx = target.getContext();
	const cellSize = 16;

	ctx.fillStyle = c1;
	ctx.fillRect(0, 0, w, h);

	ctx.fillStyle = c2;
	for (let y = 0; y < h; y += cellSize * 2) {
		for (let x = 0; x < w; x += cellSize * 2) {
			ctx.fillRect(x, y, cellSize, cellSize);
			ctx.fillRect(x + cellSize, y + cellSize, cellSize, cellSize);
		}
	}

	// Subtle highlight lines
	ctx.strokeStyle = "rgba(255,255,255,0.05)";
	ctx.lineWidth = 1;
	for (let y = 0; y < h; y += cellSize) {
		ctx.beginPath();
		ctx.moveTo(0, y);
		ctx.lineTo(w, y);
		ctx.stroke();
	}
}

function drawStripes(target: TextureCanvas, colors: string[]): void {
	const c1 = colors[0] || "#cc0000";
	const c2 = colors[1] || "#000000";
	const w = target.width;
	const h = target.height;
	const ctx = target.getContext();
	const stripeWidth = 64;

	for (let x = 0; x < w + h; x += stripeWidth * 2) {
		ctx.fillStyle = c1;
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x + stripeWidth, 0);
		ctx.lineTo(x + stripeWidth - h, h);
		ctx.lineTo(x - h, h);
		ctx.closePath();
		ctx.fill();

		ctx.fillStyle = c2;
		ctx.beginPath();
		ctx.moveTo(x + stripeWidth, 0);
		ctx.lineTo(x + stripeWidth * 2, 0);
		ctx.lineTo(x + stripeWidth * 2 - h, h);
		ctx.lineTo(x + stripeWidth - h, h);
		ctx.closePath();
		ctx.fill();
	}
}

function drawChecker(target: TextureCanvas, colors: string[]): void {
	const c1 = colors[0] || "#ffffff";
	const c2 = colors[1] || "#000000";
	const w = target.width;
	const h = target.height;
	const ctx = target.getContext();
	const cellSize = 128;

	ctx.fillStyle = c1;
	ctx.fillRect(0, 0, w, h);

	ctx.fillStyle = c2;
	for (let y = 0; y < h; y += cellSize) {
		for (let x = 0; x < w; x += cellSize) {
			if ((x / cellSize + y / cellSize) % 2 === 1) {
				ctx.fillRect(x, y, cellSize, cellSize);
			}
		}
	}
}

function drawNoise(target: TextureCanvas, colors: string[]): void {
	const c1 = colors[0] || "#333333";
	const w = target.width;
	const h = target.height;
	const ctx = target.getContext();

	// Parse base color
	const base = hexToRgb(c1);

	const imageData = ctx.createImageData(w, h);
	const data = imageData.data;
	for (let i = 0; i < data.length; i += 4) {
		const noise = (pseudoRandom(i * 3 + 7) - 0.5) * 80;
		data[i] = Math.max(0, Math.min(255, base.r + noise));
		data[i + 1] = Math.max(0, Math.min(255, base.g + noise));
		data[i + 2] = Math.max(0, Math.min(255, base.b + noise));
		data[i + 3] = 255;
	}
	ctx.putImageData(imageData, 0, 0);
}

function drawGradient(target: TextureCanvas, colors: string[]): void {
	const c1 = colors[0] || "#1a1a2e";
	const c2 = colors[1] || "#e94560";
	const w = target.width;
	const h = target.height;
	const ctx = target.getContext();

	const rgb1 = hexToRgb(c1);
	const rgb2 = hexToRgb(c2);
	const imageData = ctx.createImageData(w, h);
	const data = imageData.data;
	for (let y = 0; y < h; y++) {
		const t = y / (h - 1);
		const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * t);
		const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * t);
		const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * t);
		for (let x = 0; x < w; x++) {
			const i = (y * w + x) * 4;
			data[i] = r;
			data[i + 1] = g;
			data[i + 2] = b;
			data[i + 3] = 255;
		}
	}
	ctx.putImageData(imageData, 0, 0);
}

function drawDamascus(target: TextureCanvas, colors: string[]): void {
	const c1 = colors[0] || "#2a2a2a";
	const c2 = colors[1] || "#4a4a4a";
	const w = target.width;
	const h = target.height;
	const ctx = target.getContext();
	const rgb1 = hexToRgb(c1);
	const rgb2 = hexToRgb(c2);

	const imageData = ctx.createImageData(w, h);
	const data = imageData.data;
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			let val = 0;
			val += Math.sin(x * 0.02 + Math.sin(y * 0.03 + pseudoRandom(y * 3) * 2) * 3);
			val += Math.sin(y * 0.015 + Math.sin(x * 0.025) * 2) * 0.7;
			val += Math.sin((x + y) * 0.01 + pseudoRandom(x * 7 + y * 13) * 0.5) * 0.5;
			const t = (Math.sin(val * 2) + 1) * 0.5;
			const i = (y * w + x) * 4;
			data[i] = Math.round(rgb1.r + (rgb2.r - rgb1.r) * t);
			data[i + 1] = Math.round(rgb1.g + (rgb2.g - rgb1.g) * t);
			data[i + 2] = Math.round(rgb1.b + (rgb2.b - rgb1.b) * t);
			data[i + 3] = 255;
		}
	}
	ctx.putImageData(imageData, 0, 0);
}

function drawMarble(target: TextureCanvas, colors: string[]): void {
	const c1 = colors[0] || "#f0f0f0";
	const c2 = colors[1] || "#333333";
	const w = target.width;
	const h = target.height;
	const ctx = target.getContext();
	const rgb1 = hexToRgb(c1);
	const rgb2 = hexToRgb(c2);

	const imageData = ctx.createImageData(w, h);
	const data = imageData.data;
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			let turb = 0;
			for (let oct = 1; oct <= 5; oct++) {
				const freq = oct * 0.005;
				turb +=
					(pseudoRandom(Math.floor(x * freq) * 997 + Math.floor(y * freq) * 991 + oct * 777) -
						0.5) /
					oct;
			}
			const vein = Math.abs(Math.sin((x + y) * 0.005 + turb * 10));
			const t = Math.pow(vein, 0.6);
			const i = (y * w + x) * 4;
			data[i] = Math.round(rgb1.r + (rgb2.r - rgb1.r) * t);
			data[i + 1] = Math.round(rgb1.g + (rgb2.g - rgb1.g) * t);
			data[i + 2] = Math.round(rgb1.b + (rgb2.b - rgb1.b) * t);
			data[i + 3] = 255;
		}
	}
	ctx.putImageData(imageData, 0, 0);
}

function drawWoodGrain(target: TextureCanvas, colors: string[]): void {
	const c1 = colors[0] || "#8B4513";
	const c2 = colors[1] || "#D2691E";
	const w = target.width;
	const h = target.height;
	const ctx = target.getContext();
	const rgb1 = hexToRgb(c1);
	const rgb2 = hexToRgb(c2);

	const cx = w / 2;
	const cy = h / 2;
	const imageData = ctx.createImageData(w, h);
	const data = imageData.data;
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const dx = x - cx;
			const dy = (y - cy) * 0.3;
			const dist = Math.sqrt(dx * dx + dy * dy);
			const noiseVal = pseudoRandom(Math.floor(x * 0.1) * 31 + Math.floor(y * 0.05) * 17) * 20;
			const ring = Math.sin((dist + noiseVal) * 0.08);
			const t = (ring + 1) * 0.5;
			const i = (y * w + x) * 4;
			data[i] = Math.round(rgb1.r + (rgb2.r - rgb1.r) * t);
			data[i + 1] = Math.round(rgb1.g + (rgb2.g - rgb1.g) * t);
			data[i + 2] = Math.round(rgb1.b + (rgb2.b - rgb1.b) * t);
			data[i + 3] = 255;
		}
	}
	ctx.putImageData(imageData, 0, 0);
}

function drawStripesHorizontal(target: TextureCanvas, colors: string[]): void {
	const c1 = colors[0] || "#cc0000";
	const c2 = colors[1] || "#000000";
	const w = target.width;
	const h = target.height;
	const ctx = target.getContext();
	const stripeWidth = 64;

	for (let y = 0; y < h; y += stripeWidth * 2) {
		ctx.fillStyle = c1;
		ctx.fillRect(0, y, w, stripeWidth);
		ctx.fillStyle = c2;
		ctx.fillRect(0, y + stripeWidth, w, stripeWidth);
	}
}

function drawStripesVertical(target: TextureCanvas, colors: string[]): void {
	const c1 = colors[0] || "#cc0000";
	const c2 = colors[1] || "#000000";
	const w = target.width;
	const h = target.height;
	const ctx = target.getContext();
	const stripeWidth = 64;

	for (let x = 0; x < w; x += stripeWidth * 2) {
		ctx.fillStyle = c1;
		ctx.fillRect(x, 0, stripeWidth, h);
		ctx.fillStyle = c2;
		ctx.fillRect(x + stripeWidth, 0, stripeWidth, h);
	}
}

function drawStripesCrosshatch(target: TextureCanvas, colors: string[]): void {
	const c1 = colors[0] || "#cc0000";
	const c2 = colors[1] || "#000000";
	const w = target.width;
	const h = target.height;
	const ctx = target.getContext();
	const stripeWidth = 48;

	ctx.fillStyle = c1;
	ctx.fillRect(0, 0, w, h);

	ctx.fillStyle = c2;
	// 45 deg stripes
	for (let x = -h; x < w + h; x += stripeWidth * 2) {
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x + stripeWidth, 0);
		ctx.lineTo(x + stripeWidth - h, h);
		ctx.lineTo(x - h, h);
		ctx.closePath();
		ctx.fill();
	}

	// 135 deg stripes (semi-transparent overlay)
	ctx.globalAlpha = 0.5;
	for (let x = -h; x < w + h; x += stripeWidth * 2) {
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x + stripeWidth, 0);
		ctx.lineTo(x + stripeWidth + h, h);
		ctx.lineTo(x + h, h);
		ctx.closePath();
		ctx.fill();
	}
	ctx.globalAlpha = 1;
}

function drawStripesPinstripe(target: TextureCanvas, colors: string[]): void {
	const c1 = colors[0] || "#1a1a1a";
	const c2 = colors[1] || "#cc9900";
	const w = target.width;
	const h = target.height;
	const ctx = target.getContext();
	const gap = 56;
	const lineW = 8;

	ctx.fillStyle = c1;
	ctx.fillRect(0, 0, w, h);

	ctx.fillStyle = c2;
	for (let x = -h; x < w + h; x += gap + lineW) {
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x + lineW, 0);
		ctx.lineTo(x + lineW - h, h);
		ctx.lineTo(x - h, h);
		ctx.closePath();
		ctx.fill();
	}
}

function drawStripesRacing(target: TextureCanvas, colors: string[]): void {
	const c1 = colors[0] || "#ffffff";
	const c2 = colors[1] || "#cc0000";
	const w = target.width;
	const h = target.height;
	const ctx = target.getContext();

	ctx.fillStyle = c1;
	ctx.fillRect(0, 0, w, h);

	// Racing stripe group: thin-gap-thick-gap-thin
	const thin = 16;
	const thick = 48;
	const innerGap = 12;
	const groupW = thin + innerGap + thick + innerGap + thin;
	const groupStart = (w - groupW) / 2;

	ctx.fillStyle = c2;
	// Vertical racing stripes centered
	ctx.fillRect(groupStart, 0, thin, h);
	ctx.fillRect(groupStart + thin + innerGap, 0, thick, h);
	ctx.fillRect(groupStart + thin + innerGap + thick + innerGap, 0, thin, h);
}

function drawTriangles(target: TextureCanvas, colors: string[]): void {
	const c1 = colors[0] || "#1a1a2e";
	const c2 = colors[1] || "#e94560";
	const w = target.width;
	const h = target.height;
	const ctx = target.getContext();
	const cellW = 80;
	const cellH = cellW * Math.sqrt(3) / 2;

	ctx.fillStyle = c1;
	ctx.fillRect(0, 0, w, h);

	const rows = Math.ceil(h / cellH) + 1;
	const cols = Math.ceil(w / cellW) + 1;

	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			const x = col * cellW + (row % 2 === 1 ? cellW / 2 : 0);
			const y = row * cellH;

			// Upward triangle
			ctx.fillStyle = (row + col) % 2 === 0 ? c2 : c1;
			ctx.beginPath();
			ctx.moveTo(x, y + cellH);
			ctx.lineTo(x + cellW / 2, y);
			ctx.lineTo(x + cellW, y + cellH);
			ctx.closePath();
			ctx.fill();
		}
	}
}

function drawDots(target: TextureCanvas, colors: string[]): void {
	const c1 = colors[0] || "#1a1a1a";
	const c2 = colors[1] || "#cc0000";
	const w = target.width;
	const h = target.height;
	const ctx = target.getContext();
	const spacing = 96;
	const radius = 28;

	ctx.fillStyle = c1;
	ctx.fillRect(0, 0, w, h);

	ctx.fillStyle = c2;
	for (let y = spacing / 2; y < h; y += spacing) {
		for (let x = spacing / 2; x < w; x += spacing) {
			ctx.beginPath();
			ctx.arc(x, y, radius, 0, Math.PI * 2);
			ctx.fill();
		}
	}
}

function drawDiamond(target: TextureCanvas, colors: string[]): void {
	const c1 = colors[0] || "#1a1a2e";
	const c2 = colors[1] || "#e94560";
	const c3 = colors[2] || "#333355";
	const w = target.width;
	const h = target.height;
	const ctx = target.getContext();
	const cellW = 96;
	const cellH = 128;

	ctx.fillStyle = c1;
	ctx.fillRect(0, 0, w, h);

	const cols = Math.ceil(w / cellW) + 1;
	const rows = Math.ceil(h / cellH) + 1;

	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			const cx = col * cellW + (row % 2 === 1 ? cellW / 2 : 0);
			const cy = row * cellH;

			ctx.fillStyle = (row + col) % 2 === 0 ? c2 : c3;
			ctx.beginPath();
			ctx.moveTo(cx, cy - cellH / 2);
			ctx.lineTo(cx + cellW / 2, cy);
			ctx.lineTo(cx, cy + cellH / 2);
			ctx.lineTo(cx - cellW / 2, cy);
			ctx.closePath();
			ctx.fill();
		}
	}

	// Thin diagonal lines
	ctx.strokeStyle = c2;
	ctx.lineWidth = 2;
	ctx.globalAlpha = 0.3;
	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			const cx = col * cellW + (row % 2 === 1 ? cellW / 2 : 0);
			const cy = row * cellH;
			ctx.beginPath();
			ctx.moveTo(cx, cy - cellH / 2);
			ctx.lineTo(cx + cellW / 2, cy);
			ctx.lineTo(cx, cy + cellH / 2);
			ctx.lineTo(cx - cellW / 2, cy);
			ctx.closePath();
			ctx.stroke();
		}
	}
	ctx.globalAlpha = 1;
}

function drawScales(target: TextureCanvas, colors: string[]): void {
	const c1 = colors[0] || "#2a4a2a";
	const c2 = colors[1] || "#1a3a1a";
	const w = target.width;
	const h = target.height;
	const ctx = target.getContext();
	const radius = 48;
	const cellW = radius * 2;
	const cellH = radius;

	ctx.fillStyle = c1;
	ctx.fillRect(0, 0, w, h);

	const rows = Math.ceil(h / cellH) + 2;
	const cols = Math.ceil(w / cellW) + 2;

	for (let row = 0; row < rows; row++) {
		const offset = row % 2 === 1 ? radius : 0;
		ctx.fillStyle = row % 2 === 0 ? c2 : c1;
		ctx.strokeStyle = "rgba(0,0,0,0.2)";
		ctx.lineWidth = 2;

		for (let col = -1; col < cols; col++) {
			const cx = col * cellW + offset;
			const cy = row * cellH;

			ctx.beginPath();
			ctx.arc(cx, cy, radius, 0, Math.PI);
			ctx.fill();
			ctx.stroke();
		}
	}
}

function drawTribal(target: TextureCanvas, colors: string[]): void {
	const c1 = colors[0] || "#1a1a1a";
	const c2 = colors[1] || "#cc0000";
	const w = target.width;
	const h = target.height;
	const ctx = target.getContext();

	ctx.fillStyle = c1;
	ctx.fillRect(0, 0, w, h);

	ctx.strokeStyle = c2;
	ctx.lineWidth = 8;
	ctx.lineCap = "round";
	ctx.lineJoin = "round";

	const seed = 42;
	const segments = 20;
	const segH = h / segments;

	// Generate one side of mirrored zigzag
	const points: Array<{ x: number; y: number }> = [];
	for (let i = 0; i <= segments; i++) {
		const x = w * 0.3 + pseudoRandom(seed + i * 17) * w * 0.2;
		points.push({ x, y: i * segH });
	}

	// Draw mirrored pair
	for (let mirror = 0; mirror < 2; mirror++) {
		ctx.beginPath();
		for (let i = 0; i < points.length; i++) {
			const px = mirror === 0 ? points[i].x : w - points[i].x;
			if (i === 0) ctx.moveTo(px, points[i].y);
			else ctx.lineTo(px, points[i].y);
		}
		ctx.stroke();

		// Inner parallel line
		ctx.lineWidth = 3;
		ctx.beginPath();
		for (let i = 0; i < points.length; i++) {
			const offset = mirror === 0 ? 20 : -20;
			const px = (mirror === 0 ? points[i].x : w - points[i].x) + offset;
			if (i === 0) ctx.moveTo(px, points[i].y);
			else ctx.lineTo(px, points[i].y);
		}
		ctx.stroke();
		ctx.lineWidth = 8;
	}

	// Center spine
	ctx.lineWidth = 12;
	ctx.beginPath();
	ctx.moveTo(w / 2, 0);
	ctx.lineTo(w / 2, h);
	ctx.stroke();

	// Horizontal bars connecting the zigzags
	ctx.lineWidth = 4;
	for (let i = 2; i < segments; i += 3) {
		const y = i * segH;
		const x1 = points[i].x;
		const x2 = w - points[i].x;
		ctx.beginPath();
		ctx.moveTo(x1, y);
		ctx.lineTo(x2, y);
		ctx.stroke();
	}
}

function drawGeometric(target: TextureCanvas, colors: string[]): void {
	const c1 = colors[0] || "#1a1a2e";
	const c2 = colors[1] || "#e94560";
	const w = target.width;
	const h = target.height;
	const ctx = target.getContext();

	ctx.fillStyle = c1;
	ctx.fillRect(0, 0, w, h);

	const hexR = 48;
	const hexH = hexR * Math.sqrt(3);
	const cols = Math.ceil(w / (hexR * 1.5)) + 1;
	const rows = Math.ceil(h / hexH) + 1;

	ctx.strokeStyle = c2;
	ctx.lineWidth = 2;
	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			const cx = col * hexR * 1.5;
			const cy = row * hexH + (col % 2 === 1 ? hexH / 2 : 0);
			ctx.beginPath();
			for (let k = 0; k < 6; k++) {
				const angle = (Math.PI / 3) * k - Math.PI / 6;
				const px = cx + hexR * Math.cos(angle);
				const py = cy + hexR * Math.sin(angle);
				if (k === 0) ctx.moveTo(px, py);
				else ctx.lineTo(px, py);
			}
			ctx.closePath();
			if (pseudoRandom(row * 100 + col * 7 + 42) > 0.6) {
				ctx.fillStyle = c2;
				ctx.globalAlpha = 0.15;
				ctx.fill();
				ctx.globalAlpha = 1;
			}
			ctx.stroke();
		}
	}
}
