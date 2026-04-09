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
	Raycaster,
	SRGBColorSpace,
	Vector2,
	Vector3,
	WireframeGeometry,
	LineSegments,
	LineBasicMaterial,
} from "three";
import { Mesh as ThreeMesh } from "three";
import type { LayerStack } from "../painting/layer-stack";
import { type UVIndex, buildUVIndex } from "../painting/uv-lookup";
import { buildRegionPropertyMap, applyRegionColorOverrides, applyRegionWear } from "../painting/region-texture";
import { computeVertexCurvature, bakeCurvatureToUV } from "../painting/curvature";

export interface StickerPreview {
	image: ImageBitmap;
	scale: number;
	rotation: number;
	flipX: boolean;
	flipY: boolean;
}

interface WeaponModelProps {
	modelPath: string;
	layerStack: LayerStack;
	roughness: number;
	metallic: number;
	textureVersion: number;
	showWireframe: boolean;
	hoveredFaces: number[];
	partRegions?: import("../store/editor-store").PartRegion[];
	uvIndex?: import("../painting/uv-lookup").UVIndex | null;
	wearBaseColor?: { r: number; g: number; b: number };
	wearSharpness?: number;
	onUVEdgesReady?: (edges: Array<[number, number, number, number]>) => void;
	onUVIndexReady?: (index: UVIndex) => void;
	onGeometryReady?: (geo: import("three").BufferGeometry) => void;
	stickerPreview?: StickerPreview | null;
	onStickerPlace?: (uvX: number, uvY: number) => void;
	partEditMode?: boolean;
	onIslandHover?: (faces: number[]) => void;
	onIslandRightClick?: (islandId: number, screenX: number, screenY: number) => void;
	onIslandShiftClick?: (islandId: number) => void;
	stickerSlots?: import("../data/sticker-slots").StickerSlotDef[];
	onSlotClick?: (slotIndex: number) => void;
}

let textureDirty = false;

const raycaster = new Raycaster();
const pointer = new Vector2();

export function WeaponModel({
	modelPath,
	layerStack,
	roughness,
	metallic,
	textureVersion,
	showWireframe,
	hoveredFaces,
	partRegions = [],
	uvIndex,
	wearBaseColor = { r: 45, g: 45, b: 48 },
	wearSharpness = 0.25,
	onUVEdgesReady,
	onUVIndexReady,
	onGeometryReady,
	stickerPreview,
	onStickerPlace,
	partEditMode = false,
	onIslandHover,
	onIslandRightClick,
	onIslandShiftClick,
	stickerSlots = [],
	onSlotClick,
}: WeaponModelProps) {
	const { scene } = useGLTF(modelPath);
	const { camera } = useThree();
	const controls = useThree((s) => s.controls);
	const gl = useThree((s) => s.gl);

	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const textureRef = useRef<CanvasTexture | null>(null);
	const materialRef = useRef<MeshPhysicalMaterial | null>(null);
	const roughnessMapRef = useRef<CanvasTexture | null>(null);
	const metalnessMapRef = useRef<CanvasTexture | null>(null);
	const roughnessCanvasRef = useRef<HTMLCanvasElement | null>(null);
	const metalnessCanvasRef = useRef<HTMLCanvasElement | null>(null);
	const stickerUVRef = useRef<{ x: number; y: number } | null>(null);
	const lastPreviewUV = useRef<{ x: number; y: number } | null>(null);
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

	// Init roughness/metalness map canvases
	useEffect(() => {
		const rc = document.createElement("canvas");
		rc.width = 2048;
		rc.height = 2048;
		roughnessCanvasRef.current = rc;
		const rt = new CanvasTexture(rc);
		rt.flipY = false;
		roughnessMapRef.current = rt;

		const mc = document.createElement("canvas");
		mc.width = 2048;
		mc.height = 2048;
		metalnessCanvasRef.current = mc;
		const mt = new CanvasTexture(mc);
		mt.flipY = false;
		metalnessMapRef.current = mt;

		return () => {
			rt.dispose();
			mt.dispose();
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

	// Build and apply roughness/metalness maps from regions
	useEffect(() => {
		if (!materialRef.current || !uvIndex) return;
		const mat = materialRef.current;

		if (partRegions.length === 0) {
			// No regions — use uniform values
			mat.roughnessMap = null;
			mat.metalnessMap = null;
			mat.roughness = roughness;
			mat.metalness = metallic;
			mat.needsUpdate = true;
			return;
		}

		// Check if any region actually has roughness/metalness overrides
		const hasRoughnessOverride = partRegions.some((r) => r.overrides.roughness != null);
		const hasMetalnessOverride = partRegions.some((r) => r.overrides.metalness != null);

		if (hasRoughnessOverride && roughnessCanvasRef.current && roughnessMapRef.current) {
			const imageData = buildRegionPropertyMap(partRegions, uvIndex, 2048, 2048, "roughness", roughness);
			const ctx = roughnessCanvasRef.current.getContext("2d")!;
			ctx.putImageData(imageData, 0, 0);
			roughnessMapRef.current.needsUpdate = true;
			mat.roughnessMap = roughnessMapRef.current;
			mat.roughness = 1; // When using roughnessMap, set base to 1 so map values are used directly
		} else {
			mat.roughnessMap = null;
			mat.roughness = roughness;
		}

		if (hasMetalnessOverride && metalnessCanvasRef.current && metalnessMapRef.current) {
			const imageData = buildRegionPropertyMap(partRegions, uvIndex, 2048, 2048, "metalness", metallic);
			const ctx = metalnessCanvasRef.current.getContext("2d")!;
			ctx.putImageData(imageData, 0, 0);
			metalnessMapRef.current.needsUpdate = true;
			mat.metalnessMap = metalnessMapRef.current;
			mat.metalness = 1;
		} else {
			mat.metalnessMap = null;
			mat.metalness = metallic;
		}

		mat.needsUpdate = true;
	}, [partRegions, uvIndex, roughness, metallic]);

	useFrame(() => {
		if (!canvasRef.current || !textureRef.current) return;

		const previewUV = stickerUVRef.current;
		const prevUV = lastPreviewUV.current;
		const hasPreviewChange = stickerPreview && (
			(previewUV?.x !== prevUV?.x || previewUV?.y !== prevUV?.y) ||
			(!previewUV && prevUV) || (previewUV && !prevUV)
		);

		if (!textureDirty && !hasPreviewChange) return;

		const ctx = canvasRef.current.getContext("2d")!;

		if (textureDirty) {
			textureDirty = false;
			const composited = layerStack.composite();
			ctx.putImageData(composited, 0, 0);
		} else {
			// Restore clean composite before drawing preview
			const cached = layerStack.getCachedComposite();
			if (cached) ctx.putImageData(cached, 0, 0);
		}

		// Apply region overrides (color + wear)
		if (uvIndex && partRegions.length > 0) {
			const hasColorOverride = partRegions.some(
				(r) => r.overrides.removeTexture || r.overrides.colorTint,
			);
			const hasWearOverride = partRegions.some(
				(r) => r.overrides.wearLevel != null && r.overrides.wearLevel > 0,
			);
			if (hasColorOverride || hasWearOverride) {
				const imgData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
				if (hasColorOverride) {
					applyRegionColorOverrides(imgData, partRegions, uvIndex);
				}
				if (hasWearOverride) {
					applyRegionWear(
						imgData, partRegions, uvIndex, wearBaseColor, wearSharpness,
						layerStack.getNoiseField(), layerStack.getCurvatureMask(),
					);
				}
				ctx.putImageData(imgData, 0, 0);
			}
		}

		// Draw sticker preview at UV position
		if (stickerPreview && previewUV) {
			const w = canvasRef.current.width;
			const h = canvasRef.current.height;
			const img = stickerPreview.image;
			const aspect = img.height / img.width;
			const sw = w * stickerPreview.scale;
			const sh = sw * aspect;
			const cx = previewUV.x * w;
			const cy = previewUV.y * h;

			ctx.save();
			ctx.globalAlpha = 0.85;
			ctx.translate(cx, cy);
			ctx.rotate(stickerPreview.rotation);
			ctx.scale(stickerPreview.flipX ? -1 : 1, stickerPreview.flipY ? -1 : 1);
			ctx.drawImage(img, -sw / 2, -sh / 2, sw, sh);
			ctx.restore();
		}

		lastPreviewUV.current = previewUV ? { ...previewUV } : null;
		textureRef.current.needsUpdate = true;
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: textureVersion change must trigger dirty flag
	useEffect(() => {
		textureDirty = true;
	}, [textureVersion]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: region changes must trigger texture redraw for color overrides
	useEffect(() => {
		textureDirty = true;
	}, [partRegions]);

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

	// Build UV index for island detection + curvature mask
	useEffect(() => {
		if (!onUVIndexReady) return;
		scene.traverse((child) => {
			if ("isMesh" in child && child.isMesh) {
				const mesh = child as ThreeMesh;
				const index = buildUVIndex(mesh.geometry);

				// Compute edge curvature and bake into UV space
				const vertCurv = computeVertexCurvature(mesh.geometry);
				if (vertCurv.length > 0) {
					index.curvatureMap = bakeCurvatureToUV(mesh.geometry, vertCurv, 2048, 2048);
					layerStack.setCurvatureMask(index.curvatureMap);
				}

				onUVIndexReady(index);
				onGeometryReady?.(mesh.geometry);
			}
		});
	}, [scene, onUVIndexReady, onGeometryReady, layerStack]);

	// Raycast for 3D sticker placement (freeform — only when no predefined slots)
	useEffect(() => {
		if (!stickerPreview || !onStickerPlace) return;
		// When predefined slots exist, stickers snap to slots — no freeform hover/place
		if (stickerSlots.length > 0) return;
		const canvas = gl.domElement;

		const getUVFromEvent = (e: PointerEvent): { x: number; y: number } | null => {
			const rect = canvas.getBoundingClientRect();
			pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
			pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
			raycaster.setFromCamera(pointer, camera);

			const meshes: ThreeMesh[] = [];
			scene.traverse((child) => {
				if ("isMesh" in child && child.isMesh && !child.userData.isHighlight && !child.userData.isWireframeOverlay) {
					meshes.push(child as ThreeMesh);
				}
			});

			const intersects = raycaster.intersectObjects(meshes, false);
			if (intersects.length === 0 || !intersects[0].uv) return null;
			return { x: intersects[0].uv.x, y: intersects[0].uv.y };
		};

		let pointerDownPos: { x: number; y: number } | null = null;

		const handleDown = (e: PointerEvent) => {
			if (e.button === 0) pointerDownPos = { x: e.clientX, y: e.clientY };
		};

		const handleMove = (e: PointerEvent) => {
			const uv = getUVFromEvent(e);
			stickerUVRef.current = uv;
			if (uv) {
				textureDirty = true;
			}
		};

		const handleUp = (e: PointerEvent) => {
			if (e.button !== 0 || !pointerDownPos) return;
			// Only place if pointer barely moved (not a drag/orbit)
			const dx = e.clientX - pointerDownPos.x;
			const dy = e.clientY - pointerDownPos.y;
			if (dx * dx + dy * dy < 25) {
				const uv = stickerUVRef.current;
				if (uv) onStickerPlace(uv.x, uv.y);
			}
			pointerDownPos = null;
		};

		const handleLeave = () => {
			pointerDownPos = null;
			stickerUVRef.current = null;
			textureDirty = true;
		};

		canvas.addEventListener("pointerdown", handleDown);
		canvas.addEventListener("pointermove", handleMove);
		canvas.addEventListener("pointerup", handleUp);
		canvas.addEventListener("pointerleave", handleLeave);

		return () => {
			canvas.removeEventListener("pointerdown", handleDown);
			canvas.removeEventListener("pointermove", handleMove);
			canvas.removeEventListener("pointerup", handleUp);
			canvas.removeEventListener("pointerleave", handleLeave);
			stickerUVRef.current = null;
			lastPreviewUV.current = null;
		};
	}, [stickerPreview, onStickerPlace, stickerSlots, gl, camera, scene]);

	// Part edit mode: UV island hover, right-click, shift+click
	useEffect(() => {
		if (!partEditMode || !uvIndex) return;
		const canvas = gl.domElement;
		canvas.style.cursor = "crosshair";

		const getIslandFromEvent = (e: PointerEvent | MouseEvent): number | null => {
			const rect = canvas.getBoundingClientRect();
			pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
			pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
			raycaster.setFromCamera(pointer, camera);

			const meshes: ThreeMesh[] = [];
			scene.traverse((child) => {
				if ("isMesh" in child && child.isMesh && !child.userData.isHighlight && !child.userData.isWireframeOverlay) {
					meshes.push(child as ThreeMesh);
				}
			});

			const intersects = raycaster.intersectObjects(meshes, false);
			if (intersects.length === 0) return null;

			const faceIndex = intersects[0].faceIndex;
			if (faceIndex == null) return null;

			return uvIndex.islandOf[faceIndex] ?? null;
		};

		let lastIslandId: number | null = null;

		const handleMove = (e: PointerEvent) => {
			const islandId = getIslandFromEvent(e);
			if (islandId === lastIslandId) return;
			lastIslandId = islandId;

			if (islandId != null) {
				const faces = uvIndex.islandFaces.get(islandId) ?? [];
				onIslandHover?.(faces);
			} else {
				onIslandHover?.([]);
			}
		};

		const handleContextMenu = (e: MouseEvent) => {
			e.preventDefault();
			const islandId = getIslandFromEvent(e);
			if (islandId != null) {
				onIslandRightClick?.(islandId, e.clientX, e.clientY);
			}
		};

		const handleClick = (e: MouseEvent) => {
			if (!e.shiftKey || e.button !== 0) return;
			const islandId = getIslandFromEvent(e);
			if (islandId != null) {
				onIslandShiftClick?.(islandId);
			}
		};

		const handleLeave = () => {
			lastIslandId = null;
			onIslandHover?.([]);
		};

		canvas.addEventListener("pointermove", handleMove);
		canvas.addEventListener("contextmenu", handleContextMenu);
		canvas.addEventListener("click", handleClick);
		canvas.addEventListener("pointerleave", handleLeave);

		return () => {
			canvas.removeEventListener("pointermove", handleMove);
			canvas.removeEventListener("contextmenu", handleContextMenu);
			canvas.removeEventListener("click", handleClick);
			canvas.removeEventListener("pointerleave", handleLeave);
			canvas.style.cursor = "";
			onIslandHover?.([]);
		};
	}, [partEditMode, uvIndex, gl, camera, scene, onIslandHover, onIslandRightClick, onIslandShiftClick]);

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

	// Sticker slot markers
	const slotMarkersRef = useRef<ThreeMesh[]>([]);

	useEffect(() => {
		// Clean up previous markers
		for (const marker of slotMarkersRef.current) {
			marker.parent?.remove(marker);
			marker.geometry.dispose();
			(marker.material as MeshBasicMaterial).dispose();
		}
		slotMarkersRef.current = [];

		if (stickerSlots.length === 0 || !uvIndex) return;

		// Find mesh to get geometry
		let targetMesh: ThreeMesh | null = null;
		scene.traverse((child) => {
			if ("isMesh" in child && child.isMesh && !child.userData.isHighlight && !child.userData.isWireframeOverlay && !child.userData.isSlotMarker) {
				if (!targetMesh) targetMesh = child as ThreeMesh;
			}
		});
		if (!targetMesh) return;

		const srcGeo = (targetMesh as ThreeMesh).geometry;
		const posAttr = srcGeo.getAttribute("position");
		const uvAttr = srcGeo.getAttribute("uv");
		const indexAttr = srcGeo.index;
		if (!posAttr || !uvAttr || !indexAttr) return;

		for (let i = 0; i < stickerSlots.length; i++) {
			const slot = stickerSlots[i];
			const pos = uvTo3D(slot.uvX, slot.uvY, uvIndex, posAttr, uvAttr, indexAttr);
			if (!pos) continue;

			const geo = new BufferGeometry();
			const s = 0.003;
			const verts = new Float32Array([
				0, s, 0,  s, 0, 0,  0, 0, s,
				0, s, 0,  0, 0, s,  -s, 0, 0,
				0, s, 0,  -s, 0, 0,  0, 0, -s,
				0, s, 0,  0, 0, -s,  s, 0, 0,
				0, -s, 0,  0, 0, s,  s, 0, 0,
				0, -s, 0,  -s, 0, 0,  0, 0, s,
				0, -s, 0,  0, 0, -s,  -s, 0, 0,
				0, -s, 0,  s, 0, 0,  0, 0, -s,
			]);
			geo.setAttribute("position", new BufferAttribute(verts, 3));

			const mat = new MeshBasicMaterial({
				color: 0xff4488,
				transparent: true,
				opacity: 0.9,
				side: DoubleSide,
				depthTest: false,
			});

			const marker = new ThreeMesh(geo, mat);
			marker.position.set(pos.x, pos.y, pos.z);
			marker.userData.isSlotMarker = true;
			marker.userData.slotIndex = i;
			(targetMesh as ThreeMesh).add(marker);
			slotMarkersRef.current.push(marker);
		}

		return () => {
			for (const marker of slotMarkersRef.current) {
				marker.parent?.remove(marker);
				marker.geometry.dispose();
				(marker.material as MeshBasicMaterial).dispose();
			}
			slotMarkersRef.current = [];
		};
	}, [scene, stickerSlots, uvIndex]);

	// Sticker mode: click slot to place sticker
	useEffect(() => {
		if (!stickerPreview || !onSlotClick || stickerSlots.length === 0) return;
		const canvas = gl.domElement;

		const handleClick = (e: MouseEvent) => {
			if (e.button !== 0) return;
			const rect = canvas.getBoundingClientRect();
			pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
			pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
			raycaster.setFromCamera(pointer, camera);

			// Check slot markers first
			const markers = slotMarkersRef.current;
			if (markers.length > 0) {
				const intersects = raycaster.intersectObjects(markers, false);
				if (intersects.length > 0) {
					const idx = intersects[0].object.userData.slotIndex;
					if (idx != null) {
						onSlotClick(idx);
						return;
					}
				}
			}

			// Also check proximity to slot UV positions via mesh raycast
			const meshes: ThreeMesh[] = [];
			scene.traverse((child) => {
				if ("isMesh" in child && child.isMesh && !child.userData.isHighlight && !child.userData.isWireframeOverlay && !child.userData.isSlotMarker) {
					meshes.push(child as ThreeMesh);
				}
			});

			const meshIntersects = raycaster.intersectObjects(meshes, false);
			if (meshIntersects.length > 0 && meshIntersects[0].uv) {
				const hitUV = meshIntersects[0].uv;
				let nearestIdx: number | null = null;
				let nearestDist = 0.05;
				for (let i = 0; i < stickerSlots.length; i++) {
					const slot = stickerSlots[i];
					const dx = hitUV.x - slot.uvX;
					const dy = hitUV.y - slot.uvY;
					const dist = Math.sqrt(dx * dx + dy * dy);
					if (dist < nearestDist) {
						nearestDist = dist;
						nearestIdx = i;
					}
				}
				if (nearestIdx != null) {
					onSlotClick(nearestIdx);
				}
			}
		};

		canvas.addEventListener("click", handleClick);
		return () => {
			canvas.removeEventListener("click", handleClick);
		};
	}, [stickerPreview, onSlotClick, stickerSlots, gl, camera, scene]);

	return <primitive object={scene} />;
}

/** Convert UV coordinates to 3D position by finding the containing triangle and interpolating */
function uvTo3D(
	uvX: number,
	uvY: number,
	uvIndex: UVIndex,
	posAttr: any,
	uvAttr: any,
	indexAttr: any,
): { x: number; y: number; z: number } | null {
	for (const tri of uvIndex.triangles) {
		if (uvX < tri.minX || uvX > tri.maxX || uvY < tri.minY || uvY > tri.maxY) continue;

		const { uvA, uvB, uvC } = tri;

		// Barycentric test
		const v0x = uvC.x - uvA.x, v0y = uvC.y - uvA.y;
		const v1x = uvB.x - uvA.x, v1y = uvB.y - uvA.y;
		const v2x = uvX - uvA.x, v2y = uvY - uvA.y;

		const dot00 = v0x * v0x + v0y * v0y;
		const dot01 = v0x * v1x + v0y * v1y;
		const dot02 = v0x * v2x + v0y * v2y;
		const dot11 = v1x * v1x + v1y * v1y;
		const dot12 = v1x * v2x + v1y * v2y;

		const inv = 1 / (dot00 * dot11 - dot01 * dot01);
		const u = (dot11 * dot02 - dot01 * dot12) * inv;
		const v = (dot00 * dot12 - dot01 * dot02) * inv;

		if (u >= 0 && v >= 0 && u + v <= 1) {
			const w = 1 - u - v;
			const i = tri.faceIndex * 3;
			const ai = indexAttr.getX(i);
			const bi = indexAttr.getX(i + 1);
			const ci = indexAttr.getX(i + 2);

			return {
				x: posAttr.getX(ai) * w + posAttr.getX(bi) * v + posAttr.getX(ci) * u,
				y: posAttr.getY(ai) * w + posAttr.getY(bi) * v + posAttr.getY(ci) * u,
				z: posAttr.getZ(ai) * w + posAttr.getZ(bi) * v + posAttr.getZ(ci) * u,
			};
		}
	}
	return null;
}
