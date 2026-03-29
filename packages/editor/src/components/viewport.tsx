import { Environment, OrbitControls, Html } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { type ReactNode, Suspense } from "react";

export function ModelLoadingFallback() {
	return (
		<Html center>
			<div className="flex flex-col items-center gap-3">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />
				<span className="text-xs text-zinc-500">Loading model...</span>
			</div>
		</Html>
	);
}

export type LightingPreset = "studio" | "outdoor" | "dark";

const PRESET_INTENSITY: Record<LightingPreset, number> = {
	studio: 1,
	outdoor: 1.5,
	dark: 0.3,
};

interface ViewportProps {
	hdriPath?: string;
	lightingPreset?: LightingPreset;
	children?: ReactNode;
}

export function Viewport({
	hdriPath = "/hdri/studio.hdr",
	lightingPreset = "studio",
	children,
}: ViewportProps) {
	return (
		<div style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}>
			<Canvas
				camera={{ fov: 45, near: 0.01, far: 500 }}
				gl={{ preserveDrawingBuffer: true, antialias: true }}
				onCreated={({ gl }) => {
					gl.domElement.style.touchAction = "none";
				}}
			>
				<ambientLight intensity={0.4 * PRESET_INTENSITY[lightingPreset]} />
				<directionalLight position={[5, 5, 5]} intensity={0.6 * PRESET_INTENSITY[lightingPreset]} />
				<Suspense fallback={<ModelLoadingFallback />}>
					<Environment files={hdriPath} />
				</Suspense>
				<OrbitControls
					makeDefault
					enablePan={true}
					enableDamping={false}
					minDistance={0.05}
					maxDistance={200}
					minPolarAngle={0}
					maxPolarAngle={Math.PI}
				/>
				{children}
			</Canvas>
		</div>
	);
}
