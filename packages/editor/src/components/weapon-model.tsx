import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import {
	Box3,
	BufferAttribute,
	BufferGeometry,
	CanvasTexture,
	DoubleSide,
	MeshBasicMaterial,
	MeshPhysicalMaterial,
	SRGBColorSpace,
	Vector3,
	WireframeGeometry,
	LineSegments,
	LineBasicMaterial,
} from "three";
import { Mesh as ThreeMesh } from "three";
import type { LayerStack } from "../painting/layer-stack";
import { type UVIndex, buildUVIndex } from "../painting/uv-lookup";
import type { StickerState } from "../store/editor-store";

interface WeaponModelProps {
	modelPath: string;
	layerStack: LayerStack;
	roughness: number;
	metallic: number;
	textureVersion: number;
	showWireframe: boolean;
	hoveredFaces: number[];
	sticker: StickerState | null;
	stickerPreviewRef: React.MutableRefObject<{ x: number; y: number } | null>;
	onUVEdgesReady?: (edges: Array<[number, number, number, number]>) => void;
	onUVIndexReady?: (index: UVIndex) => void;
}

let textureDirty = false;
let lastPreviewPos: { x: number; y: number } | null = null;
let lastPreviewSticker: StickerState | null = null;

function drawStickerOnCanvas(
	ctx: CanvasRenderingContext2D,
	sticker: StickerState,
	pos: { x: number; y: number },
) {
	const sw = sticker.image.width * sticker.scale;
	const sh = sticker.image.height * sticker.scale;
	ctx.save();
	ctx.globalAlpha = 0.85;
	ctx.translate(pos.x, pos.y);
	ctx.rotate(sticker.rotation);
	ctx.drawImage(sticker.image, -sw / 2, -sh / 2, sw, sh);
	ctx.restore();
}

export function WeaponModel({
	modelPath,
	layerStack,
	roughness,
	metallic,
	textureVersion,
	showWireframe,
	hoveredFaces,
	sticker,
	stickerPreviewRef,
	onUVEdgesReady,
	onUVIndexReady,
}: WeaponModelProps) {
	const { scene } = useGLTF(modelPath);
	const { camera } = useThree();
	const controls = useThree((s) => s.controls);

	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const textureRef = useRef<CanvasTexture | null>(null);
	const materialRef = useRef<MeshPhysicalMaterial | null>(null);
	const [ready, setReady] = useState(false);

	// Auto-fit camera
	useEffect(() => {
		const box = new Box3().setFromObject(scene);
		const center = box.getCenter(new Vector3());
		const size = box.getSize(new Vector3());
		const maxDim = Math.max(size.x, size.y, size.z);

		scene.position.set(-center.x, -center.y, -center.z);
		scene.rotation.set(-Math.PI / 2, 0, 0);
		scene.updateMatrixWorld(true);

		const fov = 45 * (Math.PI / 180);
		const dist = (maxDim / 2 / Math.tan(fov / 2)) * 1.4;
		camera.position.set(0, dist * 0.3, dist);
		camera.lookAt(0, 0, 0);
		camera.updateProjectionMatrix();

		if (controls && "target" in controls) {
			(controls as any).target.set(0, 0, 0);
			(controls as any).update();
		}
	}, [scene, camera, controls]);

	// Extract UV edges for 2D paint view
	useEffect(() => {
		if (!onUVEdgesReady) return;
		const edges: Array<[number, number, number, number]> = [];
		const seen = new Set<string>();

		scene.traverse((child) => {
			if (!("isMesh" in child && child.isMesh)) return;
			const mesh = child as ThreeMesh;
			const uvAttr = mesh.geometry.getAttribute("uv");
			const index = mesh.geometry.index;
			if (!uvAttr || !index) return;

			const addEdge = (i0: number, i1: number) => {
				const key = i0 < i1 ? `${i0}-${i1}` : `${i1}-${i0}`;
				if (seen.has(key)) return;
				seen.add(key);
				edges.push([uvAttr.getX(i0), uvAttr.getY(i0), uvAttr.getX(i1), uvAttr.getY(i1)]);
			};

			for (let i = 0; i < index.count; i += 3) {
				const a = index.getX(i);
				const b = index.getX(i + 1);
				const c = index.getX(i + 2);
				addEdge(a, b);
				addEdge(b, c);
				addEdge(c, a);
			}
		});

		onUVEdgesReady(edges);
	}, [scene, onUVEdgesReady]);

	// Init canvas and texture
	useEffect(() => {
		const c = document.createElement("canvas");
		c.width = 2048;
		c.height = 2048;
		const ctx = c.getContext("2d");
		if (ctx) {
			ctx.fillStyle = "#808080";
			ctx.fillRect(0, 0, 2048, 2048);
		}
		canvasRef.current = c;

		const tex = new CanvasTexture(c);
		tex.colorSpace = SRGBColorSpace;
		tex.flipY = false;
		textureRef.current = tex;
		setReady(true);

		return () => {
			tex.dispose();
		};
	}, []);

	// Apply material
	useEffect(() => {
		if (!ready || !textureRef.current) return;
		materialRef.current?.dispose();
		const mat = new MeshPhysicalMaterial({
			map: textureRef.current,
			roughness,
			metalness: metallic,
		});
		materialRef.current = mat;
		scene.traverse((child) => {
			if ("isMesh" in child && child.isMesh) {
				(child as any).material = mat;
			}
		});
		return () => {
			mat.dispose();
			materialRef.current = null;
		};
	}, [scene, roughness, metallic, ready]);

	// Fast texture sync every frame + lightweight sticker preview
	useFrame(() => {
		if (!canvasRef.current || !textureRef.current) return;

		const ctx = canvasRef.current.getContext("2d")!;
		const previewPos = stickerPreviewRef.current;

		if (textureDirty) {
			textureDirty = false;
			const composited = layerStack.composite();
			ctx.putImageData(composited, 0, 0);

			if (previewPos && sticker) {
				drawStickerOnCanvas(ctx, sticker, previewPos);
			}

			textureRef.current.needsUpdate = true;
			lastPreviewPos = previewPos ? { x: previewPos.x, y: previewPos.y } : null;
			lastPreviewSticker = sticker;
			return;
		}

		const posChanged =
			previewPos?.x !== lastPreviewPos?.x ||
			previewPos?.y !== lastPreviewPos?.y;
		const stickerChanged = sticker !== lastPreviewSticker;

		if (posChanged || stickerChanged) {
			const cached = layerStack.getCachedComposite();
			if (!cached) return;

			ctx.putImageData(cached, 0, 0);

			if (previewPos && sticker) {
				drawStickerOnCanvas(ctx, sticker, previewPos);
			}

			textureRef.current.needsUpdate = true;
			lastPreviewPos = previewPos ? { x: previewPos.x, y: previewPos.y } : null;
			lastPreviewSticker = sticker;
		}
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: textureVersion change must trigger dirty flag
	useEffect(() => {
		textureDirty = true;
	}, [textureVersion]);

	// Restore clean composite when sticker is cleared
	useEffect(() => {
		if (sticker) return;
		if (!canvasRef.current || !textureRef.current) return;
		const cached = layerStack.getCachedComposite();
		if (!cached) return;

		const ctx = canvasRef.current.getContext("2d")!;
		ctx.putImageData(cached, 0, 0);
		textureRef.current.needsUpdate = true;
		lastPreviewPos = null;
		lastPreviewSticker = null;
	}, [sticker, layerStack]);

	// Wireframe overlay
	useEffect(() => {
		if (!showWireframe) {
			// Remove any existing wireframes
			const toRemove: LineSegments[] = [];
			scene.traverse((child) => {
				if (child instanceof LineSegments && child.userData.isWireframeOverlay) {
					toRemove.push(child);
				}
			});
			for (const obj of toRemove) {
				obj.parent?.remove(obj);
				obj.geometry.dispose();
				(obj.material as LineBasicMaterial).dispose();
			}
			return;
		}

		const wireframes: LineSegments[] = [];
		scene.traverse((child) => {
			if ("isMesh" in child && child.isMesh) {
				const mesh = child as ThreeMesh;
				const wireGeo = new WireframeGeometry(mesh.geometry);
				const wireMat = new LineBasicMaterial({ color: 0x8844ff, opacity: 0.6, transparent: true });
				const wire = new LineSegments(wireGeo, wireMat);
				wire.userData.isWireframeOverlay = true;
				mesh.add(wire);
				wireframes.push(wire);
			}
		});

		return () => {
			for (const wire of wireframes) {
				wire.parent?.remove(wire);
				wire.geometry.dispose();
				(wire.material as LineBasicMaterial).dispose();
			}
		};
	}, [scene, showWireframe]);

	// Build UV index for island detection
	useEffect(() => {
		if (!onUVIndexReady) return;
		scene.traverse((child) => {
			if ("isMesh" in child && child.isMesh) {
				const mesh = child as ThreeMesh;
				const index = buildUVIndex(mesh.geometry);
				onUVIndexReady(index);
			}
		});
	}, [scene, onUVIndexReady]);

	// Highlight overlay for hovered faces
	const highlightRef = useRef<{
		mesh: ThreeMesh;
		geo: BufferGeometry;
		mat: MeshBasicMaterial;
	} | null>(null);

	useEffect(() => {
		// Clean up previous highlight
		if (highlightRef.current) {
			highlightRef.current.mesh.parent?.remove(highlightRef.current.mesh);
			highlightRef.current.geo.dispose();
			highlightRef.current.mat.dispose();
			highlightRef.current = null;
		}

		if (hoveredFaces.length === 0) return;

		// Find the mesh to attach highlight to
		let targetMesh: ThreeMesh | null = null;
		scene.traverse((child) => {
			if ("isMesh" in child && child.isMesh && !targetMesh) {
				targetMesh = child as ThreeMesh;
			}
		});
		if (!targetMesh) return;

		const srcGeo = (targetMesh as ThreeMesh).geometry;
		const srcIndex = srcGeo.index;
		const srcPos = srcGeo.getAttribute("position");
		if (!srcIndex || !srcPos) return;

		// Build highlight geometry from hovered face indices
		const positions = new Float32Array(hoveredFaces.length * 9);
		let offset = 0;
		for (const faceIdx of hoveredFaces) {
			const i = faceIdx * 3;
			if (i + 2 >= srcIndex.count) continue;
			for (let v = 0; v < 3; v++) {
				const vi = srcIndex.getX(i + v);
				positions[offset++] = srcPos.getX(vi);
				positions[offset++] = srcPos.getY(vi);
				positions[offset++] = srcPos.getZ(vi);
			}
		}

		const geo = new BufferGeometry();
		geo.setAttribute("position", new BufferAttribute(positions.slice(0, offset), 3));

		const mat = new MeshBasicMaterial({
			color: 0xff8800,
			transparent: true,
			opacity: 0.4,
			side: DoubleSide,
			depthTest: true,
			polygonOffset: true,
			polygonOffsetFactor: -1,
		});

		const highlightMesh = new ThreeMesh(geo, mat);
		highlightMesh.userData.isHighlight = true;
		(targetMesh as ThreeMesh).add(highlightMesh);

		highlightRef.current = { mesh: highlightMesh, geo, mat };

		return () => {
			if (highlightRef.current) {
				highlightRef.current.mesh.parent?.remove(highlightRef.current.mesh);
				highlightRef.current.geo.dispose();
				highlightRef.current.mat.dispose();
				highlightRef.current = null;
			}
		};
	}, [scene, hoveredFaces]);

	return <primitive object={scene} />;
}
