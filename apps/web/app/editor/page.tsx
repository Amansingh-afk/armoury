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
	// Rifles
	{ id: "ak47", label: "AK-47", path: "/models/ak47.glb", category: "Rifles" },
	{ id: "m4a4", label: "M4A4", path: "/models/m4a4.glb", category: "Rifles" },
	{ id: "m4a1_silencer", label: "M4A1-S", path: "/models/m4a1_silencer.glb", category: "Rifles" },
	{ id: "aug", label: "AUG", path: "/models/aug.glb", category: "Rifles" },
	{ id: "sg556", label: "SG 553", path: "/models/sg556.glb", category: "Rifles" },
	{ id: "famas", label: "FAMAS", path: "/models/famas.glb", category: "Rifles" },
	{ id: "galilar", label: "Galil AR", path: "/models/galilar.glb", category: "Rifles" },
	// Snipers
	{ id: "awp", label: "AWP", path: "/models/awp.glb", category: "Snipers" },
	{ id: "ssg08", label: "SSG 08", path: "/models/ssg08.glb", category: "Snipers" },
	{ id: "scar20", label: "SCAR-20", path: "/models/scar20.glb", category: "Snipers" },
	{ id: "g3sg1", label: "G3SG1", path: "/models/g3sg1.glb", category: "Snipers" },
	// SMGs
	{ id: "p90", label: "P90", path: "/models/p90.glb", category: "SMGs" },
	{ id: "mp7", label: "MP7", path: "/models/mp7.glb", category: "SMGs" },
	{ id: "mp9", label: "MP9", path: "/models/mp9.glb", category: "SMGs" },
	{ id: "mp5sd", label: "MP5-SD", path: "/models/mp5sd.glb", category: "SMGs" },
	{ id: "mac10", label: "MAC-10", path: "/models/mac10.glb", category: "SMGs" },
	{ id: "ump45", label: "UMP-45", path: "/models/ump45.glb", category: "SMGs" },
	{ id: "bizon", label: "PP-Bizon", path: "/models/bizon.glb", category: "SMGs" },
	// Pistols
	{ id: "glock18", label: "Glock-18", path: "/models/glock18.glb", category: "Pistols" },
	{ id: "usp_silencer", label: "USP-S", path: "/models/usp_silencer.glb", category: "Pistols" },
	{ id: "hkp2000", label: "P2000", path: "/models/hkp2000.glb", category: "Pistols" },
	{ id: "p250", label: "P250", path: "/models/p250.glb", category: "Pistols" },
	{ id: "fiveseven", label: "Five-SeveN", path: "/models/fiveseven.glb", category: "Pistols" },
	{ id: "deagle", label: "Desert Eagle", path: "/models/deagle.glb", category: "Pistols" },
	{ id: "elite", label: "Dual Berettas", path: "/models/elite.glb", category: "Pistols" },
	{ id: "tec9", label: "Tec-9", path: "/models/tec9.glb", category: "Pistols" },
	{ id: "cz75a", label: "CZ75-Auto", path: "/models/cz75a.glb", category: "Pistols" },
	{ id: "revolver", label: "R8 Revolver", path: "/models/revolver.glb", category: "Pistols" },
	// Heavy
	{ id: "nova", label: "Nova", path: "/models/nova.glb", category: "Heavy" },
	{ id: "mag7", label: "MAG-7", path: "/models/mag7.glb", category: "Heavy" },
	{ id: "sawedoff", label: "Sawed-Off", path: "/models/sawedoff.glb", category: "Heavy" },
	{ id: "xm1014", label: "XM1014", path: "/models/xm1014.glb", category: "Heavy" },
	{ id: "m249", label: "M249", path: "/models/m249.glb", category: "Heavy" },
	{ id: "negev", label: "Negev", path: "/models/negev.glb", category: "Heavy" },
	// Other
	{ id: "taser", label: "Zeus x27", path: "/models/taser.glb", category: "Other" },
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
