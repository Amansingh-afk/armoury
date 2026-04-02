"use client";

import { useEffect, useRef } from "react";
import type { PartOverrides } from "../store/editor-store";
import { WEAR_PRESETS } from "../painting/wear";

export interface FinishPreset {
  name: string;
  roughness: number;
  metalness: number;
}

const FINISH_PRESETS: FinishPreset[] = [
  { name: "Matte", roughness: 0.9, metalness: 0 },
  { name: "Satin", roughness: 0.5, metalness: 0.1 },
  { name: "Glossy", roughness: 0.15, metalness: 0.1 },
  { name: "Metallic", roughness: 0.3, metalness: 0.9 },
  { name: "Chrome", roughness: 0.05, metalness: 1.0 },
  { name: "Battle-Scarred", roughness: 0.8, metalness: 0.2 },
];

interface PartContextMenuProps {
  meshName: string;
  screenX: number;
  screenY: number;
  overrides: PartOverrides;
  globalRoughness: number;
  globalMetalness: number;
  globalWearLevel: number;
  onUpdate: (overrides: Partial<PartOverrides>) => void;
  onReset: () => void;
  onClose: () => void;
}

export function PartContextMenu({
  meshName,
  screenX,
  screenY,
  overrides,
  globalRoughness,
  globalMetalness,
  globalWearLevel,
  onUpdate,
  onReset,
  onClose,
}: PartContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Dismiss on click-outside or Escape
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  // Clamp position to viewport
  const style: React.CSSProperties = {
    position: "fixed",
    left: Math.min(screenX, window.innerWidth - 260),
    top: Math.min(screenY, window.innerHeight - 480),
    zIndex: 100,
  };

  const currentRoughness = overrides.roughness ?? globalRoughness;
  const currentMetalness = overrides.metalness ?? globalMetalness;
  const currentWear = overrides.wearLevel ?? globalWearLevel;
  const currentTint = overrides.colorTint ?? "#ffffff";
  const removeTexture = overrides.removeTexture ?? false;

  const handlePreset = (preset: FinishPreset) => {
    onUpdate({
      roughness: preset.roughness,
      metalness: preset.metalness,
      finishPreset: preset.name,
    });
  };

  return (
    <div ref={ref} style={style} className="w-60 rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl p-3 flex flex-col gap-2.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-200 truncate">{meshName}</span>
        <button type="button" onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-xs px-1">✕</button>
      </div>

      {/* Remove Image Layer */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-400">Remove Texture</span>
        <button
          type="button"
          onClick={() => onUpdate({ removeTexture: !removeTexture })}
          className={`rounded px-2 py-0.5 text-[10px] transition-colors ${
            removeTexture ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
          }`}
        >
          {removeTexture ? "ON" : "OFF"}
        </button>
      </div>

      {/* Finish Preset */}
      <div>
        <label className="mb-1 block text-xs text-zinc-400">Finish</label>
        <div className="grid grid-cols-3 gap-1">
          {FINISH_PRESETS.map((preset) => {
            const isActive = overrides.finishPreset === preset.name;
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => handlePreset(preset)}
                className={`rounded px-1.5 py-1 text-[10px] transition-colors ${
                  isActive ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Roughness */}
      <div>
        <label className="mb-0.5 block text-[10px] text-zinc-500">
          Roughness: {currentRoughness.toFixed(2)}
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={currentRoughness}
          onChange={(e) => onUpdate({ roughness: Number.parseFloat(e.target.value), finishPreset: undefined })}
          className="w-full"
        />
      </div>

      {/* Metalness */}
      <div>
        <label className="mb-0.5 block text-[10px] text-zinc-500">
          Metallic: {currentMetalness.toFixed(2)}
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={currentMetalness}
          onChange={(e) => onUpdate({ metalness: Number.parseFloat(e.target.value), finishPreset: undefined })}
          className="w-full"
        />
      </div>

      {/* Wear Level */}
      <div>
        <label className="mb-0.5 block text-[10px] text-zinc-500">
          Wear: {currentWear.toFixed(2)}
        </label>
        <select
          value={WEAR_PRESETS.find((p) => Math.abs(currentWear - p.value) < 0.02)?.name ?? "custom"}
          onChange={(e) => {
            const preset = WEAR_PRESETS.find((p) => p.name === e.target.value);
            if (preset) onUpdate({ wearLevel: preset.value });
          }}
          className="w-full bg-zinc-800 text-[10px] text-zinc-300 rounded px-1.5 py-1 border border-zinc-700 outline-none mb-1"
        >
          {WEAR_PRESETS.map((preset) => (
            <option key={preset.name} value={preset.name}>
              {preset.name}
            </option>
          ))}
          {!WEAR_PRESETS.some((p) => Math.abs(currentWear - p.value) < 0.02) && (
            <option value="custom" disabled>Custom</option>
          )}
        </select>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={currentWear}
          onChange={(e) => onUpdate({ wearLevel: Number.parseFloat(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Color Tint */}
      <div>
        <label className="mb-0.5 block text-[10px] text-zinc-500">Color Tint</label>
        <input
          type="color"
          value={currentTint}
          onChange={(e) => onUpdate({ colorTint: e.target.value })}
          className="h-6 w-full cursor-pointer rounded border border-zinc-700 bg-zinc-800"
        />
      </div>

      {/* Reset */}
      <button
        type="button"
        onClick={onReset}
        className="rounded bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-700 transition-colors"
      >
        Reset to Default
      </button>
    </div>
  );
}
