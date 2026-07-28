"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { useSession } from "@/lib/useSession";
import RoleSelectModal from "@/components/RoleSelectModal";
import ScorePopupStack, { Popup } from "@/components/ScorePopup";
import ScoreOverlay, { ScoreTarget } from "@/components/ScoreOverlay";
import SquadAvatar from "@/components/SquadAvatar";

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const ORDER_STORAGE_KEY = "scoring_student_order_v1";

type View = "STUDENTS" | "GROUP";

export default function ScoringPage() {
  const { session } = useSession();
  const { data: studentsData, mutate: refetchStudents } = useSWR("/api/students", fetcher);
  const { data: buttonsData } = useSWR("/api/buttons", fetcher);
  const { data: squadsData } = useSWR("/api/squads", fetcher);

  const [view, setView] = useState<View>("STUDENTS");
  const [multiSelect, setMultiSelect] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [overlayTarget, setOverlayTarget] = useState<ScoreTarget | null>(null);
  const [popups, setPopups] = useState<Popup[]>([]);
  const [pendingRoleAction, setPendingRoleAction] = useState<null | {
    points: number;
    sourceLabel?: string;
    target: ScoreTarget;
  }>(null);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") setIsMobile(window.innerWidth < 768);
  }, []);
  // 管理員專屬的自訂排序：只存在這台瀏覽器（localStorage），
  // 不會寫回資料庫，不影響排名、公開科學榜，也不會影響其他帳號畫面上的順序
  const [customOrder, setCustomOrder] = useState<string[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);

  const orderKey = session?.accountId ? `${ORDER_STORAGE_KEY}_${session.accountId}` : null;
  const students = studentsData?.students ?? [];
  const buttons = buttonsData?.buttons ?? [];
  const squads = squadsData?.squads ?? [];
  const actingRoles = session?.actingRoles ?? [];
  const isAdmin = !!session?.roles?.isAdmin;
  const classTotal = students.reduce((sum: number, s: any) => sum + s.score, 0);

  useEffect(() => {
    if (!orderKey) return;
    try {
      const saved = localStorage.getItem(orderKey);
      if (saved) setCustomOrder(JSON.parse(saved));
    } catch {
      // 忽略讀取失敗（例如無痕模式禁用 localStorage）
    }
  }, [orderKey]);

  function persistOrder(order: string[]) {
    setCustomOrder(order);
    if (!orderKey) return;
    try {
      localStorage.setItem(orderKey, JSON.stringify(order));
    } catch {
      // 忽略寫入失敗
    }
  }

  function handleDrop(targetId: string) {
    if (!isAdmin || !dragId || dragId === targetId) {
      setDragId(null);
      return;
    }
    const baseOrder =
      customOrder.length > 0 ? customOrder : students.map((s: any) => s.id);
    const withoutDragged = baseOrder.filter((id: string) => id !== dragId);
    const targetIndex = withoutDragged.indexOf(targetId);
    withoutDragged.splice(targetIndex, 0, dragId);
    persistOrder(withoutDragged);
    setDragId(null);
  }

  // 依自訂順序排列學生卡片；新加入、尚未被排過序的學生自動排在最後
  const orderedStudents =
    customOrder.length === 0
      ? students
      : [...students].sort((a: any, b: any) => {
          const ia = customOrder.indexOf(a.id);
          const ib = customOrder.indexOf(b.id);
          if (ia === -1 && ib === -1) return 0;
          if (ia === -1) return 1;
          if (ib === -1) return -1;
          return ia - ib;
        });

  function toggleSelected(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function handleStudentCardClick(student: any) {
    if (multiSelect) {
      toggleSelected(student.id);
    } else {
      setOverlayTarget({
        label: student.name,
        mode: "INDIVIDUAL",
        studentIds: [student.id],
      });
    }
  }

  function handleClassCardClick() {
    if (multiSelect) {
      // 多選模式下點「全班」= 全選/取消全選
      setSelectedIds((prev) =>
        prev.length === students.length ? [] : students.map((s: any) => s.id)
      );
    } else {
      setOverlayTarget({ label: "全班", mode: "WHOLE_CLASS" });
    }
  }

  function openOverlayForSelection() {
    if (selectedIds.length === 0) return;
    setOverlayTarget({
      label: `已選 ${selectedIds.length} 位學生`,
      mode: "INDIVIDUAL",
      studentIds: selectedIds,
    });
  }

  function handleSquadCardClick(squadCode: string) {
    setOverlayTarget({ label: `${squadCode} 小隊`, mode: "GROUP", squadCode });
  }

  function handleOverlayApply(points: number, sourceLabel?: string) {
    if (!overlayTarget || points === 0) return;
    if (actingRoles.length > 1) {
      setPendingRoleAction({ points, sourceLabel, target: overlayTarget });
      setOverlayTarget(null);
    } else if (actingRoles.length === 1) {
      applyScore(overlayTarget, points, actingRoles[0].key, sourceLabel);
      setOverlayTarget(null);
    } else {
      alert("此帳號沒有任何可執行的身分");
    }
  }

  async function applyScore(
    target: ScoreTarget,
    points: number,
    actingAs: string,
    sourceLabel?: string
  ) {
    const res = await fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: target.mode,
        points,
        actingAs,
        sourceLabel,
        studentIds: target.studentIds,
        squadCode: target.squadCode,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "操作失敗");
      return;
    }

    let newPopups: Popup[];
    if (target.mode === "WHOLE_CLASS") {
      newPopups = [{ id: `${Date.now()}`, name: "全班", points }];
    } else if (target.mode === "GROUP") {
      newPopups = [{ id: `${Date.now()}`, name: `${target.squadCode}組`, points }];
    } else {
      newPopups = data.popups.slice(0, 6).map((p: any, i: number) => ({
        id: `${Date.now()}-${i}`,
        name: p.name,
        points: p.points,
      }));
    }

    setPopups((prev) => [...prev, ...newPopups]);
    setTimeout(() => {
      setPopups((prev) => prev.filter((p) => !newPopups.find((n) => n.id === p.id)));
    }, 2200);
    setSelectedIds([]);
    setMultiSelect(false);
    refetchStudents();
  }

  return (
    <div className="h-full flex flex-col">
      <ScorePopupStack popups={popups} />
      <ScoreOverlay
        target={overlayTarget}
        buttons={buttons}
        isAdmin={isAdmin}
        onApply={handleOverlayApply}
        onClose={() => setOverlayTarget(null)}
      />
      <RoleSelectModal
        open={!!pendingRoleAction}
        roles={actingRoles}
        onSelect={(roleKey) => {
          if (pendingRoleAction) {
            applyScore(
              pendingRoleAction.target,
              pendingRoleAction.points,
              roleKey,
              pendingRoleAction.sourceLabel
            );
          }
          setPendingRoleAction(null);
        }}
        onClose={() => setPendingRoleAction(null)}
      />

      {/* 固定不隨內容捲動的標題與頁籤 */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h1 className="text-2xl font-black">計分操作</h1>
        <div className="flex gap-2">
          {(
            [
              { key: "STUDENTS", label: "學生" },
              { key: "GROUP", label: "小隊" },
            ] as { key: View; label: string }[]
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setView(t.key)}
              className={
                "px-4 py-2 rounded-xl font-bold " +
                (view === t.key ? "bg-primary text-white" : "bg-white text-ink/60")
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {view === "GROUP" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 px-1">
          {squads.map((sq: any) => {
            const total = students
              .filter((s: any) => s.squad.code === sq.code)
              .reduce((sum: number, s: any) => sum + s.score, 0);
            return (
              <button
                key={sq.code}
                onClick={() => handleSquadCardClick(sq.code)}
                className="card p-3 md:p-4 flex items-center justify-between gap-3 text-left hover:brightness-95 transition"
              >
                <div className="flex items-center gap-3">
                  <SquadAvatar iconKey={sq.iconKey} color={sq.color} size={isMobile ? 45 : 56} />
                  <p className="font-black">{sq.code}</p>
                </div>
                <span
                  className={
                    "w-10 h-10 shrink-0 rounded-full text-white font-black text-sm flex items-center justify-center " +
                    (total < 0 ? "bg-red-600" : "bg-emerald-600")
                  }
                >
                  {total}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {view === "STUDENTS" && (
        // flex-1：填滿標題列以下的剩餘空間；只有這一層內部會出現捲軸
        <div className="card px-2 md:px-4 py-5 flex-1 min-h-0 overflow-x-hidden flex flex-col">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 md:gap-4 p-1 flex-1 overflow-y-auto overflow-x-hidden">
            {/* ClassDojo 風格的「全班」卡片，放在第一位 */}
            <button
              onClick={handleClassCardClick}
              className={
                "flex flex-col items-center gap-1 p-2 rounded-2xl transition " +
                (multiSelect && selectedIds.length === students.length && students.length > 0
                  ? "bg-primary/10 ring-2 ring-primary"
                  : "hover:bg-ink/5")
              }
            >
              <div className="relative">
                <SquadAvatar iconKey="class" color="#e5e5e5" size={64} noBorder />
                <span
                  className={
                    "absolute -top-1 -right-1 text-white text-xs font-black rounded-full min-w-[22px] h-[22px] px-1 flex items-center justify-center " +
                    (classTotal < 0 ? "bg-red-600" : "bg-emerald-600")
                  }
                >
                  {classTotal}
                </span>
              </div>
              <span className="font-bold text-xs sm:text-sm text-center whitespace-nowrap">全班</span>
            </button>

            {orderedStudents.map((s: any) => {
              const selected = multiSelect && selectedIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => handleStudentCardClick(s)}
                  draggable={isAdmin}
                  onDragStart={() => isAdmin && setDragId(s.id)}
                  onDragOver={(e) => isAdmin && e.preventDefault()}
                  onDrop={() => isAdmin && handleDrop(s.id)}
                  className={
                    "flex flex-col items-center gap-1 p-2 rounded-2xl transition " +
                    (selected ? "bg-primary/10 ring-2 ring-primary" : "hover:bg-ink/5") +
                    (isAdmin ? " cursor-grab active:cursor-grabbing" : "") +
                    (dragId === s.id ? " opacity-40" : "")
                  }
                >
                  <div className="relative">
                    <SquadAvatar iconKey={s.squad.iconKey} color={s.squad.color} size={64} />
                    <span
                      className={
                        "absolute -top-1 -right-1 text-white text-xs font-black rounded-full min-w-[22px] h-[22px] px-1 flex items-center justify-center " +
                        (s.score < 0 ? "bg-red-600" : "bg-emerald-600")
                      }
                    >
                      {s.score}
                    </span>
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-center whitespace-nowrap">{s.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 懸浮勾選切換按鈕：開啟後可以一次勾選多位學生 */}
      {view === "STUDENTS" && (
        <button
          onClick={() => {
            setMultiSelect((v) => !v);
            setSelectedIds([]);
          }}
          title={multiSelect ? "結束多選" : "開啟多選"}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center cursor-pointer border border-ink/10"
        >
          <span className={"msi " + (multiSelect ? "text-primary" : "text-ink/60")}>
            select_check_box
          </span>
        </button>
      )}

      {/* 多選模式下，選了至少一位時顯示的「套用積分」浮動按鈕 */}
      {view === "STUDENTS" && multiSelect && selectedIds.length > 0 && (
        <button
          onClick={openOverlayForSelection}
          className="fixed bottom-6 right-24 z-40 h-14 px-5 rounded-full bg-primary text-white font-bold shadow-lg flex items-center gap-1 cursor-pointer"
        >
          <span className="msi">star</span>
          套用積分（{selectedIds.length}）
        </button>
      )}
    </div>
  );
}
