"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

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

const WEAPONS = [
	{ id: "ak47", label: "AK-47", path: "/models/ak47.glb" },
	{ id: "m4a4", label: "M4A4", path: "/models/m4a4.glb" },
	{ id: "awp", label: "AWP", path: "/models/awp.glb" },
] as const;

export default function EditorPage() {
	const [weaponId, setWeaponId] = useState<string>("ak47");
	const weapon = WEAPONS.find((w) => w.id === weaponId) ?? WEAPONS[0];

	return (
		<SkinEditor
			key={weapon.id}
			modelPath={weapon.path}
			hdriPath="/hdri/studio.hdr"
			weaponOptions={[...WEAPONS]}
			selectedWeaponId={weaponId}
			onWeaponChange={setWeaponId}
		/>
	);
}
