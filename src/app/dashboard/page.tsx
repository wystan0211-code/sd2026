"use client";

import { useState } from "react";
import useSWR from "swr";
import { useSession } from "@/lib/useSession";
import RoleSelectModal from "@/components/RoleSelectModal";
import ScorePopupStack, { Popup } from "@/components/ScorePopup";
import SquadAvatar from "@/components/SquadAvatar";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Mode = "INDIVIDUAL" | "WHOLE_CLASS" | "GROUP";

export default function ScoringPage() {
  const { session } = useSession();
  const { data: studentsData, mutate: refetchStudents } = useSWR("/api/students", fetcher);
  const { data: buttonsData } = useSWR("/api/buttons", fetcher);
  const { data: squadsData } = useSWR("/api/squads", fetcher);

  const [mode, setMode] = useState<Mode>("INDIVIDUAL");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [customPoints, setCustomPoints] = useState("");
  const [groupCustomPoints, setGroupCustomPoints] = useState<Record<string, string>>({});
  const [popups, setPopups] = useState<Popup[]>([]);

  const [pendingAction, setPendingAction] = useState<null | {
    points: number;
    sourceLabel?: string;
    squadCode?: string;
  }>(null);

  const students = studentsData?.students ?? [];
  const buttons = buttonsData?.buttons ?? [];
  const squads = squadsData?.squads ?? [];
  const actingRoles = session?.actingRoles ?? [];
  const isAdmin = !!session?.roles?.isAdmin;

  function toggleStudent(id: string) {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function requestApply(points: number, sourceLabel?: string) {
    if (points === 0) return;
    if (mode === "INDIVIDUAL" && selectedStudentIds.length === 0) {
      alert("請先點選至少一位學生");
      return;
    }
    if (actingRoles.length > 1) {
      setPendingAction({ points, sourceLabel });
    } else if (actingRoles.length === 1) {
      applyScore(points, actingRoles[0].key, sourceLabel);
    } else {
      alert("此帳號沒有任何可執行的身分");
    }
  }

  async function applyScore(
    points: number,
    actingAs: string,
    sourceLabel?: string,
    squadCode?: string
  ) {
    const res = await fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode,
        points,
        actingAs,
        sourceLabel,
        studentIds: mode === "INDIVIDUAL" ? selectedStudentIds : undefined,
        squadCode: mode === "GROUP" ? squadCode : undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "操作失敗");
      return;
    }
    const newPopups: Popup[] = data.popups.slice(0, 6).map((p: any, i: number) => ({
      id: `${Date.now()}-${i}`,
      name: p.name,
      points: p.points,
    }));
    setPopups((prev) => [...prev, ...newPopups]);
    setTimeout(() => {
      setPopups((prev) => prev.filter((p) => !newPopups.find((n) => n.id === p.id)));
    }, 2200);
    setSelectedStudentIds([]);
    refetchStudents();
  }

  function handleGroupClick(squadCode: string, points: number, sourceLabel?: string) {
    if (actingRoles.length > 1) {
      setPendingAction({ points, sourceLabel: sourceLabel ?? `小隊加分（${squadCode}）`, squadCode });
    } else if (actingRoles.length === 1) {
      applyScore(points, actingRoles[0].key, sourceLabel ?? `小隊加分（${squadCode}）`, squadCode);
    }
  }

  return (
    <div>
      <ScorePopupStack popups={popups} />
      <RoleSelectModal
        open={!!pendingAction}
        roles={actingRoles}
        onSelect={(roleKey) => {
          if (pendingAction) {
            applyScore(
              pendingAction.points,
              roleKey,
              pendingAction.sourceLabel,
              pendingAction.squadCode
            );
          }
          setPendingAction(null);
        }}
        onClose={() => setPendingAction(null)}
      />

      <h1 className="text-2xl font-black mb-4">計分操作</h1>

      <div className="flex gap-2 mb-6">
        {(
          [
            { key: "INDIVIDUAL", label: "個人勾選" },
            { key: "WHOLE_CLASS", label: "全班加分" },
            { key: "GROUP", label: "小隊" },
          ] as { key: Mode; label: string }[]
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setMode(t.key)}
            className={
              "px-4 py-2 rounded-xl font-bold " +
              (mode === t.key ? "bg-primary text-white" : "bg-white text-ink/60")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {mode === "GROUP" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {squads.map((sq: any) => {
            const total = students
              .filter((s: any) => s.squad.code === sq.code)
              .reduce((sum: number, s: any) => sum + s.score, 0);
            return (
              <div key={sq.code} className="card p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <SquadAvatar iconKey={sq.iconKey} color={sq.color} size={56} />
                    <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-black rounded-full w-6 h-6 flex items-center justify-center">
                      {total}
                    </span>
                  </div>
                  <p className="font-black">{sq.code}</p>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {buttons.map((b: any) => (
                    <button
                      key={b.id}
                      onClick={() => handleGroupClick(sq.code, b.points, b.label)}
                      className={
                        "text-xs px-2 py-1 rounded-lg " +
                        (b.points >= 0 ? "bg-primary text-white" : "bg-ink/10")
                      }
                    >
                      {b.points >= 0 ? "+" : ""}
                      {b.points}
                    </button>
                  ))}
                </div>
                {isAdmin && (
                  <div className="flex gap-1 items-center border-t border-ink/5 pt-2">
                    <input
                      type="number"
                      value={groupCustomPoints[sq.code] ?? ""}
                      onChange={(e) =>
                        setGroupCustomPoints((prev) => ({ ...prev, [sq.code]: e.target.value }))
                      }
                      placeholder="分數"
                      className="w-16 rounded-lg border border-ink/10 px-2 py-1 text-xs"
                    />
                    <button
                      className="text-xs btn-primary !px-2 !py-1"
                      onClick={() =>
                        handleGroupClick(
                          sq.code,
                          Math.abs(Number(groupCustomPoints[sq.code]) || 0),
                          "自訂數值"
                        )
                      }
                    >
                      加分
                    </button>
                    <button
                      className="text-xs btn-outline !px-2 !py-1"
                      onClick={() =>
                        handleGroupClick(
                          sq.code,
                          -Math.abs(Number(groupCustomPoints[sq.code]) || 0),
                          "自訂數值"
                        )
                      }
                    >
                      扣分
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-5 mb-8">
          {mode === "WHOLE_CLASS" && (
            <p className="text-sm text-ink/50 mb-3">此模式將套用給「全部」學生</p>
          )}
          {/* ClassDojo 風格：頭像 + 右上角圓形分數徽章 + 名字 */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 max-h-[28rem] overflow-y-auto p-1">
            {students.map((s: any) => {
              const selected = mode === "INDIVIDUAL" && selectedStudentIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => mode === "INDIVIDUAL" && toggleStudent(s.id)}
                  className={
                    "flex flex-col items-center gap-1 p-2 rounded-2xl transition " +
                    (selected ? "bg-primary/10 ring-2 ring-primary" : "hover:bg-ink/5")
                  }
                >
                  <div className="relative">
                    <SquadAvatar iconKey={s.squad.iconKey} color={s.squad.color} size={64} />
                    <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-xs font-black rounded-full min-w-[22px] h-[22px] px-1 flex items-center justify-center">
                      {s.score}
                    </span>
                  </div>
                  <span className="font-bold text-sm text-center">{s.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {mode !== "GROUP" && (
        <div className="card p-5">
          <div className="flex flex-wrap gap-2 mb-5">
            {buttons.map((b: any) => (
              <button
                key={b.id}
                onClick={() => requestApply(b.points, b.label)}
                className={b.points >= 0 ? "btn-primary" : "btn-outline"}
              >
                {b.label} {b.points >= 0 ? "+" : ""}
                {b.points}
              </button>
            ))}
          </div>

          {isAdmin && (
            <div>
              <h2 className="font-black mb-2">自訂數值</h2>
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
                  onClick={() => requestApply(Math.abs(Number(customPoints) || 0), "自訂輸入")}
                >
                  加分
                </button>
                <button
                  className="btn-outline"
                  onClick={() => requestApply(-Math.abs(Number(customPoints) || 0), "自訂輸入")}
                >
                  扣分
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
