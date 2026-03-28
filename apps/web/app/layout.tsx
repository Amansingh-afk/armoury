import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
});

export const metadata: Metadata = {
	title: "Armoury — CS2 Skin Editor",
	description:
		"Browser-based 3D skin editor for CS2. Layer patterns, images, and stickers onto weapon models with real-time PBR preview.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className={inter.variable}>
			<body className="bg-zinc-950 text-zinc-100 antialiased font-sans">{children}</body>
		</html>
	);
}
