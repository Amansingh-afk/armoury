import Link from "next/link";
import { Suspense } from "react";
import { PreviewShowcase } from "./preview-showcase";

function GridBackground() {
	return (
		<div className="pointer-events-none absolute inset-0 overflow-hidden">
			{/* Grid pattern */}
			<div
				className="absolute inset-0 animate-grid-fade"
				style={{
					backgroundImage:
						"linear-gradient(#a1a1aa 1px, transparent 1px), linear-gradient(90deg, #a1a1aa 1px, transparent 1px)",
					backgroundSize: "64px 64px",
				}}
			/>
			{/* Radial fade so grid is visible only in center */}
			<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#09090b_70%)]" />
			{/* Top glow */}
			<div className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-[48rem] rounded-full bg-blue-600/8 blur-3xl animate-glow-pulse" />
		</div>
	);
}

function HeroSection() {
	return (
		<section className="relative flex min-h-[100dvh] flex-col items-center justify-center px-6 py-24">
			<GridBackground />

			<div className="relative z-10 flex max-w-4xl flex-col items-center text-center">
				{/* Badge */}
				<div className="animate-fade-in-up mb-8 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-1.5 text-xs text-zinc-400 backdrop-blur-sm">
					<span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-glow-pulse" />
					Open-source CS2 skin editor
				</div>

				{/* Title */}
				<h1 className="animate-fade-in-up delay-100 text-6xl font-bold tracking-tight sm:text-8xl">
					<span className="bg-gradient-to-b from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
						Armoury
					</span>
				</h1>

				{/* Subtitle */}
				<p className="animate-fade-in-up delay-200 mt-6 max-w-2xl text-lg text-zinc-400 sm:text-xl leading-relaxed">
					Layer patterns, images, and stickers onto weapon models —{" "}
					<span className="text-zinc-200">directly in your browser</span>. Real-time PBR
					preview, procedural wear, Workshop-ready export.
				</p>

				{/* CTA group */}
				<div className="animate-fade-in-up delay-300 mt-10 flex gap-4">
					<Link
						href="/editor"
						className="group relative inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-600/20"
					>
						Open Editor
						<svg
							className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={2}
						>
							<path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
						</svg>
					</Link>
					<a
						href="https://github.com"
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-6 py-3.5 text-sm font-medium text-zinc-300 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-800/50 hover:text-zinc-100"
					>
						<svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
							<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
						</svg>
						GitHub
					</a>
				</div>

				{/* Scroll hint */}
				<div className="animate-fade-in-up delay-500 mt-20 flex flex-col items-center gap-2 text-zinc-600">
					<span className="text-[10px] uppercase tracking-[0.2em]">Scroll</span>
					<div className="h-8 w-px bg-gradient-to-b from-zinc-600 to-transparent" />
				</div>
			</div>
		</section>
	);
}

function PreviewSection() {
	return (
		<section className="relative px-6 py-32">
			<div className="mx-auto max-w-6xl">
				<div className="text-center mb-16">
					<h2 className="text-3xl font-bold tracking-tight sm:text-5xl bg-gradient-to-b from-zinc-100 to-zinc-500 bg-clip-text text-transparent">
						What you can create
					</h2>
					<p className="mt-4 text-zinc-500 text-lg">
						Procedural patterns, custom images, PBR materials — all composited in real time.
					</p>
				</div>
				<Suspense
					fallback={
						<div className="flex h-96 items-center justify-center">
							<div className="flex flex-col items-center gap-3 text-zinc-600">
								<div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />
								<span className="text-xs">Loading 3D preview...</span>
							</div>
						</div>
					}
				>
					<PreviewShowcase />
				</Suspense>
			</div>
		</section>
	);
}

const FEATURES = [
	{
		icon: (
			<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75 6.429 9.75m11.142 0l4.179 2.25-4.179 2.25m0 0L12 17.25l-5.571-3m11.142 0l4.179 2.25L12 21.75l-9.75-5.25 4.179-2.25"
				/>
			</svg>
		),
		title: "Layer Stack",
		desc: "Stack patterns, images, and stickers. Reorder, toggle, adjust opacity — like Photoshop layers, but on a 3D model.",
	},
	{
		icon: (
			<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
				/>
			</svg>
		),
		title: "12 Procedural Fills",
		desc: "Camo, carbon fiber, damascus steel, marble, wood grain, geometric — generate patterns with your color choices.",
	},
	{
		icon: (
			<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25"
				/>
			</svg>
		),
		title: "PBR Preview",
		desc: "Real-time physically based rendering. Matte, glossy, metallic, chrome — see exactly how your skin will look in-game.",
	},
	{
		icon: (
			<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"
				/>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z"
				/>
			</svg>
		),
		title: "Wear Simulation",
		desc: "Factory New to Battle-Scarred. Procedural scratch masks that match CS2's wear system, adjustable in real time.",
	},
	{
		icon: (
			<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
				/>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
				/>
			</svg>
		),
		title: "Click-to-Place Stickers",
		desc: "Click anywhere on the model to drop a sticker. UV-aware clipping keeps it exactly where you placed it.",
	},
	{
		icon: (
			<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
				/>
			</svg>
		),
		title: "Workshop Export",
		desc: "Export TGA files with seam dilation, ready for CS2 Workshop submission. PNG export too.",
	},
];

function FeaturesSection() {
	return (
		<section className="relative px-6 py-32">
			{/* Divider glow */}
			<div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />

			<div className="mx-auto max-w-6xl">
				<div className="text-center mb-16">
					<h2 className="text-3xl font-bold tracking-tight sm:text-5xl bg-gradient-to-b from-zinc-100 to-zinc-500 bg-clip-text text-transparent">
						Everything you need
					</h2>
					<p className="mt-4 text-zinc-500 text-lg">
						No installs. No Photoshop. Just open the browser and start designing.
					</p>
				</div>

				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{FEATURES.map((f) => (
						<div
							key={f.title}
							className="group relative rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-6 backdrop-blur-sm transition-all duration-300 hover:border-zinc-700/50 hover:bg-zinc-900/60"
						>
							<div className="mb-4 inline-flex rounded-lg border border-zinc-800 bg-zinc-900 p-2.5 text-blue-400 transition-colors group-hover:border-blue-900/50 group-hover:bg-blue-950/30">
								{f.icon}
							</div>
							<h3 className="text-sm font-semibold text-zinc-200 mb-2">{f.title}</h3>
							<p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

function WorkflowSection() {
	const steps = [
		{ num: "01", title: "Pick a weapon", desc: "Start with the AK-47. More weapons coming soon." },
		{ num: "02", title: "Stack layers", desc: "Fill with patterns, import images, or place stickers." },
		{ num: "03", title: "Tune materials", desc: "Set PBR finish — matte, glossy, chrome. Apply wear." },
		{ num: "04", title: "Export", desc: "Download Workshop-ready TGA or PNG with seam dilation." },
	];

	return (
		<section className="relative px-6 py-32">
			<div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />

			<div className="mx-auto max-w-4xl">
				<div className="text-center mb-16">
					<h2 className="text-3xl font-bold tracking-tight sm:text-5xl bg-gradient-to-b from-zinc-100 to-zinc-500 bg-clip-text text-transparent">
						Four steps. That&apos;s it.
					</h2>
				</div>

				<div className="grid gap-0">
					{steps.map((step, i) => (
						<div
							key={step.num}
							className="group relative flex items-start gap-6 py-8"
						>
							{/* Connector line */}
							{i < steps.length - 1 && (
								<div className="absolute left-[1.125rem] top-[4.5rem] h-[calc(100%-2.5rem)] w-px bg-gradient-to-b from-zinc-800 to-transparent" />
							)}
							{/* Number circle */}
							<div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-xs font-mono text-zinc-500 transition-all group-hover:border-blue-800 group-hover:text-blue-400">
								{step.num}
							</div>
							<div>
								<h3 className="text-base font-semibold text-zinc-200">{step.title}</h3>
								<p className="mt-1 text-sm text-zinc-500">{step.desc}</p>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

function CTASection() {
	return (
		<section className="relative px-6 py-32">
			<div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />

			<div className="mx-auto max-w-2xl text-center">
				<h2 className="text-4xl font-bold tracking-tight sm:text-6xl bg-gradient-to-b from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
					Ready to build?
				</h2>
				<p className="mt-6 text-lg text-zinc-500">
					No account needed. No downloads. Just open the editor.
				</p>
				<div className="mt-10">
					<Link
						href="/editor"
						className="group relative inline-flex items-center gap-2 rounded-lg bg-blue-600 px-10 py-4 text-base font-semibold text-white transition-all hover:bg-blue-500 hover:shadow-xl hover:shadow-blue-600/20"
					>
						Launch Armoury
						<svg
							className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={2}
						>
							<path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
						</svg>
					</Link>
				</div>
			</div>
		</section>
	);
}

function Footer() {
	return (
		<footer className="border-t border-zinc-900 px-6 py-8">
			<div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
				<div className="flex items-center gap-2 text-sm text-zinc-600">
					<span className="font-semibold text-zinc-400">Armoury</span>
					<span>&middot;</span>
					<span>Open source</span>
				</div>
				<div className="flex items-center gap-6 text-sm text-zinc-600">
					<Link href="/editor" className="transition-colors hover:text-zinc-300">
						Editor
					</Link>
					<a href="https://github.com" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-zinc-300">
						GitHub
					</a>
				</div>
			</div>
		</footer>
	);
}

export default function Home() {
	return (
		<main className="relative overflow-hidden">
			<HeroSection />
			<PreviewSection />
			<FeaturesSection />
			<WorkflowSection />
			<CTASection />
			<Footer />
		</main>
	);
}
