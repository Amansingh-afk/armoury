"use client";

import dynamic from "next/dynamic";

const SkinEditor = dynamic(
	() => import("@armoury/editor").then((mod) => ({ default: mod.SkinEditor })),
	{
		ssr: false,
		loading: () => (
			<div className="flex h-screen items-center justify-center text-zinc-500">
				Loading editor...
			</div>
		),
	},
);

export default function EditorPage() {
	return <SkinEditor modelPath="/models/ak47.glb" hdriPath="/hdri/studio.hdr" />;
}
