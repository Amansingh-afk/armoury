"use client";

import { Environment, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
	Box3,
	CanvasTexture,
	MeshPhysicalMaterial,
	SRGBColorSpace,
	Vector3,
} from "three";
import type { Mesh } from "three";
import { type PatternType, fillPattern } from "../painting/fill";
import type { BlendMode, ImageFillMode } from "../painting/layer";
import { LayerStack } from "../painting/layer-stack";

export interface PresetLayerConfig {
	type: "pattern" | "image";
	pattern?: PatternType;
	colors?: string[];
	imagePath?: string;
	fillMode?: ImageFillMode;
	scale?: number;
	opacity?: number;
	blendMode?: BlendMode;
}

export interface PreviewPreset {
	name: string;
	description: string;
	roughness: number;
	metallic: number;
	wearLevel: number;
	layers: PresetLayerConfig[];
}

const PREVIEW_TEX_SIZE = 1024;

function PreviewScene({
	modelPath,
	preset,
	autoRotate,
}: {
	modelPath: string;
	preset: PreviewPreset;
	autoRotate: boolean;
}) {
	const { scene } = useGLTF(modelPath);
	const { camera } = useThree();
	const controls = useThree((s) => s.controls);

	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const textureRef = useRef<CanvasTexture | null>(null);
	const materialRef = useRef<MeshPhysicalMaterial | null>(null);
	const sceneRef = useRef(scene);

	// Camera fit — runs once
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
			(controls as unknown as { target: Vector3; update: () => void }).target.set(0, 0, 0);
			(controls as unknown as { update: () => void }).update();
		}

		sceneRef.current = scene;
	}, [scene, camera, controls]);

	// Init canvas + texture
	useEffect(() => {
		const c = document.createElement("canvas");
		c.width = PREVIEW_TEX_SIZE;
		c.height = PREVIEW_TEX_SIZE;
		const ctx = c.getContext("2d");
		if (ctx) {
			ctx.fillStyle = "#808080";
			ctx.fillRect(0, 0, PREVIEW_TEX_SIZE, PREVIEW_TEX_SIZE);
		}
		canvasRef.current = c;

		const tex = new CanvasTexture(c);
		tex.colorSpace = SRGBColorSpace;
		tex.flipY = false;
		textureRef.current = tex;

		return () => {
			tex.dispose();
		};
	}, []);

	// Build layers from preset and composite
	useEffect(() => {
		if (!canvasRef.current || !textureRef.current) return;

		const layerStack = new LayerStack(PREVIEW_TEX_SIZE, PREVIEW_TEX_SIZE);

		let imagesToLoad = 0;
		let imagesLoaded = 0;

		const applyComposite = () => {
			layerStack.setWear(preset.wearLevel);
			const composited = layerStack.composite();
			const ctx = canvasRef.current?.getContext("2d");
			if (ctx && composited) {
				ctx.putImageData(composited, 0, 0);
				if (textureRef.current) textureRef.current.needsUpdate = true;
			}
		};

		for (const cfg of preset.layers) {
			const layer = layerStack.addLayer();
			if (cfg.opacity !== undefined) layer.opacity = cfg.opacity;
			if (cfg.blendMode) layer.blendMode = cfg.blendMode;

			if (cfg.type === "pattern" && cfg.pattern) {
				fillPattern(layer.textureCanvas, cfg.pattern, cfg.colors || ["#808080"]);
			} else if (cfg.type === "image" && cfg.imagePath) {
				imagesToLoad++;
				const img = new Image();
				img.crossOrigin = "anonymous";
				img.onload = () => {
					createImageBitmap(img).then((bitmap) => {
						layer.setImage(bitmap);
						layer.renderImage();
						imagesLoaded++;
						if (imagesLoaded >= imagesToLoad) applyComposite();
					});
				};
				img.onerror = () => {
					imagesLoaded++;
					if (imagesLoaded >= imagesToLoad) applyComposite();
				};
				img.src = cfg.imagePath;
			}
		}

		if (imagesToLoad === 0) applyComposite();
	}, [preset]);

	// Apply material
	useEffect(() => {
		if (!textureRef.current) return;
		materialRef.current?.dispose();
		const mat = new MeshPhysicalMaterial({
			map: textureRef.current,
			roughness: preset.roughness,
			metalness: preset.metallic,
		});
		materialRef.current = mat;
		scene.traverse((child) => {
			if ("isMesh" in child && child.isMesh) {
				(child as Mesh).material = mat;
			}
		});
		return () => {
			mat.dispose();
			materialRef.current = null;
		};
	}, [scene, preset.roughness, preset.metallic]);

	// Auto-rotate
	useFrame((_state, delta) => {
		if (!autoRotate) return;
		sceneRef.current.rotation.z += delta * 0.3;
	});

	return <primitive object={scene} />;
}

export interface ModelPreviewProps {
	modelPath: string;
	preset: PreviewPreset;
	autoRotate?: boolean;
	hdriPath?: string;
	className?: string;
}

export function ModelPreview({
	modelPath,
	preset,
	autoRotate = true,
	hdriPath = "/hdri/studio.hdr",
	className,
}: ModelPreviewProps) {
	return (
		<div className={className} style={{ position: "relative", width: "100%", height: "100%" }}>
			<Canvas
				camera={{ fov: 45, near: 0.01, far: 500 }}
				gl={{ antialias: true, alpha: true }}
				dpr={[1, 1.5]}
			>
				<ambientLight intensity={0.4} />
				<directionalLight position={[5, 5, 5]} intensity={0.6} />
				<Suspense fallback={null}>
					<Environment files={hdriPath} />
					<PreviewScene
						modelPath={modelPath}
						preset={preset}
						autoRotate={autoRotate}
					/>
				</Suspense>
				<OrbitControls
					enablePan={false}
					enableZoom={false}
					enableDamping
					dampingFactor={0.05}
					minPolarAngle={Math.PI * 0.2}
					maxPolarAngle={Math.PI * 0.8}
				/>
			</Canvas>
		</div>
	);
}
