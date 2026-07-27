"use client";

export type Popup = { id: string; name: string; points: number };

export default function ScorePopupStack({ popups }: { popups: Popup[] }) {
  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 items-end pointer-events-none">
      {popups.map((p) => (
        <div
          key={p.id}
          className={
            "relative px-5 py-3 rounded-2xl font-black text-lg shadow-lg animate-popIn " +
            (p.points >= 0
              ? "bg-white text-primary"
              : "bg-white text-red-600")
          }
          style={
            p.points < 0
              ? {
                  boxShadow:
                    "0 0 0 4px rgba(220,38,38,0.25), 0 8px 24px rgba(220,38,38,0.35)",
                  background:
                    "linear-gradient(135deg, rgba(220,38,38,0.12), rgba(220,38,38,0.02))",
                }
              : undefined
          }
        >
          {p.points >= 0 && (
            <>
              <span className="msi absolute -top-3 -left-3 text-secondary animate-confetti">
                star
              </span>
              <span className="msi absolute -top-2 right-2 text-primary animate-confetti">
                star
              </span>
            </>
          )}
          {p.name}{p.points >= 0 ? "+" : ""}
          {p.points}分
        </div>
      ))}
    </div>
  );
}
