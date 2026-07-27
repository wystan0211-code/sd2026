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
  const [popups, setPopups] = useState<Popup[]>([]);

  const [pendingAction, setPendingAction] = useState<null | {
    points: number;
    sourceLabel?: string;
  }>(null);

  const students = studentsData?.students ?? [];
  const buttons = buttonsData?.buttons ?? [];
  const squads = squadsData?.squads ?? [];
  const actingRoles = session?.actingRoles ?? [];

  function toggleStudent(id: string) {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function requestApply(points: number, sourceLabel?: string) {
    if (points === 0) return;
    if (mode === "INDIVIDUAL" && selectedStudentIds.length === 0) {
      alert("請先勾選至少一位學生");
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

  async function applyScore(points: number, actingAs: string, sourceLabel?: string, squadCode?: string) {
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

  function handleGroupClick(squadCode: string, points: number) {
    if (actingRoles.length > 1) {
      setPendingAction({ points, sourceLabel: `小組加分（${squadCode}）` });
      // 記錄目前操作的小隊，選完身分後套用
      pendingGroupCode.current = squadCode;
    } else if (actingRoles.length === 1) {
      applyScore(points, actingRoles[0].key, `小組加分（${squadCode}）`, squadCode);
    }
  }

  const pendingGroupCode = useSWRRefLike<string | null>(null);

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
              pendingGroupCode.current ?? undefined
            );
          }
          pendingGroupCode.current = null;
          setPendingAction(null);
        }}
        onClose={() => {
          pendingGroupCode.current = null;
          setPendingAction(null);
        }}
      />

      <h1 className="text-2xl font-black mb-4">計分操作</h1>

      <div className="flex gap-2 mb-6">
        {(
          [
            { key: "INDIVIDUAL", label: "個人勾選" },
            { key: "WHOLE_CLASS", label: "全班加分" },
            { key: "GROUP", label: "小組（GROUP）" },
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
              <div key={sq.code} className="card p-4 flex items-center gap-3">
                <SquadAvatar iconKey={sq.iconKey} color={sq.color} size={56} />
                <div className="flex-1">
                  <p className="font-black">{sq.code}</p>
                  <p className="text-sm text-ink/50">積分 {total}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-4 mb-8 max-h-80 overflow-y-auto">
          {mode === "WHOLE_CLASS" && (
            <p className="text-sm text-ink/50 mb-3">此模式將套用給「全部」學生</p>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {students.map((s: any) => (
              <label
                key={s.id}
                className={
                  "flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer " +
                  (mode === "INDIVIDUAL" && selectedStudentIds.includes(s.id)
                    ? "bg-primary/10"
                    : "hover:bg-ink/5")
                }
              >
                {mode === "INDIVIDUAL" && (
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.includes(s.id)}
                    onChange={() => toggleStudent(s.id)}
                  />
                )}
                <SquadAvatar iconKey={s.squad.iconKey} color={s.squad.color} size={28} />
                <span className="font-bold text-sm">{s.name}</span>
                <span className="text-xs text-ink/40 ml-auto">{s.score}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {mode !== "GROUP" && (
        <div className="card p-5">
          <h2 className="font-black mb-3">共用加扣分按鈕</h2>
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

          {session?.roles?.isAdmin && (
            <div>
              <h2 className="font-black mb-2">管理員：自訂數值</h2>
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

      {mode === "GROUP" && session?.roles && (
        <div className="card p-5">
          <h2 className="font-black mb-3">選擇小隊後套用按鈕分數</h2>
          <p className="text-sm text-ink/50 mb-3">
            按下按鈕後，該小隊每一位成員都會各自被加／扣相應分數
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {squads.map((sq: any) => (
              <div key={sq.code} className="border border-ink/10 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <SquadAvatar iconKey={sq.iconKey} color={sq.color} size={32} />
                  <span className="font-bold">{sq.code}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {buttons.map((b: any) => (
                    <button
                      key={b.id}
                      onClick={() => handleGroupClick(sq.code, b.points)}
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
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 簡易的可變 ref hook（避免額外引入 useRef 造成上方程式碼順序問題）
function useSWRRefLike<T>(initial: T) {
  const ref = { current: initial };
  return ref;
}
