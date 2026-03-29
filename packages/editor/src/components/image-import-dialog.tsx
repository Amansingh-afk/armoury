"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface ImageImportResult {
	bitmap: ImageBitmap;
}

interface Props {
	file: File;
	onConfirm: (result: ImageImportResult) => void;
	onCancel: () => void;
}

interface CropBox {
	x: number;
	y: number;
	w: number;
	h: number;
}

type DragHandle =
	| "move"
	| "tl"
	| "tr"
	| "bl"
	| "br"
	| "t"
	| "b"
	| "l"
	| "r"
	| null;

export function ImageImportDialog({ file, onConfirm, onCancel }: Props) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [image, setImage] = useState<HTMLImageElement | null>(null);
	const [crop, setCrop] = useState<CropBox | null>(null);
	const [isCropping, setIsCropping] = useState(false);
	const [removingBg, setRemovingBg] = useState(false);
	const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
	const dragRef = useRef<{
		handle: DragHandle;
		startX: number;
		startY: number;
		startCrop: CropBox;
	} | null>(null);

	// Load image
	useEffect(() => {
		const url = URL.createObjectURL(file);
		const img = new Image();
		img.onload = () => {
			setImage(img);
		};
		img.src = url;
		return () => URL.revokeObjectURL(url);
	}, [file]);

	// Canvas dimensions that fit the image within the dialog
	const getCanvasSize = useCallback(() => {
		if (!image) return { cw: 400, ch: 400, scale: 1, ox: 0, oy: 0 };
		const maxW = 480;
		const maxH = 400;
		const scale = Math.min(maxW / image.width, maxH / image.height, 1);
		const cw = Math.round(image.width * scale);
		const ch = Math.round(image.height * scale);
		return { cw, ch, scale, ox: 0, oy: 0 };
	}, [image]);

	// Draw canvas
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || !image) return;
		const { cw, ch, scale } = getCanvasSize();
		canvas.width = cw;
		canvas.height = ch;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Checkerboard for transparency
		const size = 8;
		for (let y = 0; y < ch; y += size) {
			for (let x = 0; x < cw; x += size) {
				ctx.fillStyle =
					(Math.floor(x / size) + Math.floor(y / size)) % 2 === 0
						? "#3f3f46"
						: "#27272a";
				ctx.fillRect(x, y, size, size);
			}
		}

		ctx.drawImage(image, 0, 0, cw, ch);

		// Draw crop overlay
		if (crop) {
			const cx = crop.x * scale;
			const cy = crop.y * scale;
			const cWidth = crop.w * scale;
			const cHeight = crop.h * scale;

			// Darken outside
			ctx.fillStyle = "rgba(0,0,0,0.6)";
			ctx.fillRect(0, 0, cw, cy);
			ctx.fillRect(0, cy, cx, cHeight);
			ctx.fillRect(cx + cWidth, cy, cw - cx - cWidth, cHeight);
			ctx.fillRect(0, cy + cHeight, cw, ch - cy - cHeight);

			// Crop border
			ctx.strokeStyle = "#3b82f6";
			ctx.lineWidth = 2;
			ctx.strokeRect(cx, cy, cWidth, cHeight);

			// Corner handles
			const hs = 6;
			ctx.fillStyle = "#3b82f6";
			for (const [hx, hy] of [
				[cx, cy],
				[cx + cWidth, cy],
				[cx, cy + cHeight],
				[cx + cWidth, cy + cHeight],
			]) {
				ctx.fillRect(hx - hs / 2, hy - hs / 2, hs, hs);
			}
		}
	}, [image, crop, getCanvasSize]);

	const getHandle = useCallback(
		(mx: number, my: number): DragHandle => {
			if (!crop || !image) return null;
			const { scale } = getCanvasSize();
			const cx = crop.x * scale;
			const cy = crop.y * scale;
			const cw = crop.w * scale;
			const ch = crop.h * scale;
			const threshold = 8;

			const nearL = Math.abs(mx - cx) < threshold;
			const nearR = Math.abs(mx - (cx + cw)) < threshold;
			const nearT = Math.abs(my - cy) < threshold;
			const nearB = Math.abs(my - (cy + ch)) < threshold;

			if (nearT && nearL) return "tl";
			if (nearT && nearR) return "tr";
			if (nearB && nearL) return "bl";
			if (nearB && nearR) return "br";
			if (nearT) return "t";
			if (nearB) return "b";
			if (nearL) return "l";
			if (nearR) return "r";

			if (mx > cx && mx < cx + cw && my > cy && my < cy + ch) return "move";
			return null;
		},
		[crop, image, getCanvasSize],
	);

	const handlePointerDown = useCallback(
		(e: React.PointerEvent) => {
			if (!image) return;
			const canvas = canvasRef.current;
			if (!canvas) return;
			const rect = canvas.getBoundingClientRect();
			const mx = e.clientX - rect.left;
			const my = e.clientY - rect.top;
			const { scale } = getCanvasSize();

			if (crop) {
				const handle = getHandle(mx, my);
				if (handle) {
					dragRef.current = {
						handle,
						startX: mx,
						startY: my,
						startCrop: { ...crop },
					};
					canvas.setPointerCapture(e.pointerId);
					return;
				}
			}

			// Start new crop
			const imgX = mx / scale;
			const imgY = my / scale;
			setCrop({ x: imgX, y: imgY, w: 0, h: 0 });
			dragRef.current = {
				handle: "br",
				startX: mx,
				startY: my,
				startCrop: { x: imgX, y: imgY, w: 0, h: 0 },
			};
			canvas.setPointerCapture(e.pointerId);
		},
		[image, crop, getHandle, getCanvasSize],
	);

	const handlePointerMove = useCallback(
		(e: React.PointerEvent) => {
			if (!dragRef.current || !image) return;
			const canvas = canvasRef.current;
			if (!canvas) return;
			const rect = canvas.getBoundingClientRect();
			const mx = e.clientX - rect.left;
			const my = e.clientY - rect.top;
			const { scale } = getCanvasSize();
			const dx = (mx - dragRef.current.startX) / scale;
			const dy = (my - dragRef.current.startY) / scale;
			const sc = dragRef.current.startCrop;
			const iw = image.width;
			const ih = image.height;

			let { x, y, w, h } = sc;

			switch (dragRef.current.handle) {
				case "move":
					x = Math.max(0, Math.min(sc.x + dx, iw - sc.w));
					y = Math.max(0, Math.min(sc.y + dy, ih - sc.h));
					w = sc.w;
					h = sc.h;
					break;
				case "br":
					w = Math.max(1, Math.min(sc.w + dx, iw - sc.x));
					h = Math.max(1, Math.min(sc.h + dy, ih - sc.y));
					break;
				case "bl":
					x = Math.max(0, Math.min(sc.x + dx, sc.x + sc.w - 1));
					w = sc.w - (x - sc.x);
					h = Math.max(1, Math.min(sc.h + dy, ih - sc.y));
					break;
				case "tr":
					y = Math.max(0, Math.min(sc.y + dy, sc.y + sc.h - 1));
					h = sc.h - (y - sc.y);
					w = Math.max(1, Math.min(sc.w + dx, iw - sc.x));
					break;
				case "tl":
					x = Math.max(0, Math.min(sc.x + dx, sc.x + sc.w - 1));
					y = Math.max(0, Math.min(sc.y + dy, sc.y + sc.h - 1));
					w = sc.w - (x - sc.x);
					h = sc.h - (y - sc.y);
					break;
				case "t":
					y = Math.max(0, Math.min(sc.y + dy, sc.y + sc.h - 1));
					h = sc.h - (y - sc.y);
					break;
				case "b":
					h = Math.max(1, Math.min(sc.h + dy, ih - sc.y));
					break;
				case "l":
					x = Math.max(0, Math.min(sc.x + dx, sc.x + sc.w - 1));
					w = sc.w - (x - sc.x);
					break;
				case "r":
					w = Math.max(1, Math.min(sc.w + dx, iw - sc.x));
					break;
			}

			setCrop({ x, y, w, h });
		},
		[image, getCanvasSize],
	);

	const handlePointerUp = useCallback(() => {
		if (dragRef.current && crop && crop.w < 3 && crop.h < 3) {
			setCrop(null);
		}
		dragRef.current = null;
	}, [crop]);

	const handleRemoveBg = useCallback(async () => {
		if (!image) return;
		setRemovingBg(true);
		try {
			const { removeBackground } = await import("@imgly/background-removal");
			const blob = await removeBackground(file, {
				output: { format: "image/png" },
			});
			setProcessedBlob(blob);

			// Update the displayed image
			const url = URL.createObjectURL(blob);
			const img = new Image();
			img.onload = () => {
				setImage(img);
				URL.revokeObjectURL(url);
			};
			img.src = url;
		} catch {
			// Silently fail — user can still proceed with original
		} finally {
			setRemovingBg(false);
		}
	}, [image, file]);

	const handleConfirm = useCallback(async () => {
		if (!image) return;

		let sourceBlob: Blob;
		if (processedBlob) {
			sourceBlob = processedBlob;
		} else {
			sourceBlob = file;
		}

		if (crop && crop.w > 3 && crop.h > 3) {
			// Apply crop
			const offscreen = new OffscreenCanvas(
				Math.round(crop.w),
				Math.round(crop.h),
			);
			const ctx = offscreen.getContext("2d");
			if (ctx) {
				ctx.drawImage(
					image,
					crop.x,
					crop.y,
					crop.w,
					crop.h,
					0,
					0,
					crop.w,
					crop.h,
				);
				const croppedBlob = await offscreen.convertToBlob({
					type: "image/png",
				});
				const bitmap = await createImageBitmap(croppedBlob);
				onConfirm({ bitmap });
				return;
			}
		}

		const bitmap = await createImageBitmap(sourceBlob);
		onConfirm({ bitmap });
	}, [image, crop, processedBlob, file, onConfirm]);

	const handleResetCrop = useCallback(() => {
		setCrop(null);
	}, []);

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
			<div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/50">
				{/* Header */}
				<div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
					<h3 className="text-sm font-semibold text-zinc-200">
						Import Image
					</h3>
					<button
						type="button"
						onClick={onCancel}
						className="text-zinc-500 hover:text-zinc-300 transition-colors"
					>
						<svg
							className="h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={2}
						>
							<title>Close</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				{/* Canvas */}
				<div className="flex items-center justify-center p-5">
					{image ? (
						<canvas
							ref={canvasRef}
							className="rounded-lg cursor-crosshair max-w-full"
							onPointerDown={isCropping ? handlePointerDown : undefined}
							onPointerMove={isCropping ? handlePointerMove : undefined}
							onPointerUp={isCropping ? handlePointerUp : undefined}
						/>
					) : (
						<div className="flex h-48 w-full items-center justify-center">
							<span className="text-sm text-zinc-500">Loading...</span>
						</div>
					)}
				</div>

				{/* Tools */}
				<div className="flex flex-wrap items-center gap-2 border-t border-zinc-800 px-5 py-3">
					<button
						type="button"
						onClick={handleRemoveBg}
						disabled={removingBg || !image}
						className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-40"
					>
						{removingBg ? (
							<>
								<svg
									className="h-3.5 w-3.5 animate-spin"
									fill="none"
									viewBox="0 0 24 24"
								>
									<title>Loading</title>
									<circle
										className="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										strokeWidth="4"
									/>
									<path
										className="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
									/>
								</svg>
								Removing...
							</>
						) : (
							"Remove Background"
						)}
					</button>

					<button
						type="button"
						onClick={() => {
							setIsCropping(!isCropping);
							if (isCropping) setCrop(null);
						}}
						className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
							isCropping
								? "border-blue-500/50 bg-blue-600/20 text-blue-400"
								: "border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
						}`}
					>
						Crop
					</button>

					{crop && crop.w > 3 && crop.h > 3 && (
						<button
							type="button"
							onClick={handleResetCrop}
							className="text-xs text-zinc-500 hover:text-zinc-300"
						>
							Reset crop
						</button>
					)}

					<div className="flex-1" />

					<button
						type="button"
						onClick={onCancel}
						className="rounded-lg border border-zinc-700 px-4 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleConfirm}
						disabled={!image}
						className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-40"
					>
						Import
					</button>
				</div>
			</div>
		</div>
	);
}
