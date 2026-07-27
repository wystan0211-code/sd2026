"use client";

import { useState } from "react";

export type ScoreTarget = {
  label: string;
  mode: "INDIVIDUAL" | "WHOLE_CLASS" | "GROUP";
  studentIds?: string[];
  squadCode?: string;
};

export default function ScoreOverlay({
  target,
  buttons,
  isAdmin,
  onApply,
  onClose,
}: {
  target: ScoreTarget | null;
  buttons: { id: string; label: string; points: number }[];
  isAdmin: boolean;
  onApply: (points: number, sourceLabel?: string) => void;
  onClose: () => void;
}) {
  const [customPoints, setCustomPoints] = useState("");

  if (!target) return null;

  return (
    <div
      className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <div
        className="card p-6 w-full max-w-lg animate-popIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black">{target.label}</h2>
          <button onClick={onClose} className="msi text-ink/40 cursor-pointer">
            close
          </button>
        </div>

        <div className="flex flex-wrap gap-3 mb-2">
          {buttons.map((b) => (
            <button
              key={b.id}
              onClick={() => onApply(b.points, b.label)}
              className={
                "px-5 py-3 rounded-full font-bold text-sm cursor-pointer transition " +
                (b.points >= 0
                  ? "bg-primary text-white hover:brightness-105"
                  : "bg-white text-ink border-2 border-ink hover:bg-ink/5")
              }
            >
              {b.label} {b.points >= 0 ? "+" : ""}
              {b.points}
            </button>
          ))}
        </div>

        {isAdmin && (
          <div className="border-t border-ink/5 mt-4 pt-4">
            <h3 className="font-black mb-2 text-sm">自訂數值</h3>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                value={customPoints}
                onChange={(e) => setCustomPoints(e.target.value)}
                className="w-28 rounded-xl border border-ink/10 px-3 py-2"
                placeholder="分數"
              />
              <button
                className="btn-primary"
                onClick={() => onApply(Math.abs(Number(customPoints) || 0), "自訂輸入")}
              >
                加分
              </button>
              <button
                className="btn-outline"
                onClick={() => onApply(-Math.abs(Number(customPoints) || 0), "自訂輸入")}
              >
                扣分
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
