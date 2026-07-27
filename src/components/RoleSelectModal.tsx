"use client";

import type { ActingRole } from "@/lib/useSession";

export default function RoleSelectModal({
  open,
  roles,
  onSelect,
  onClose,
}: {
  open: boolean;
  roles: ActingRole[];
  onSelect: (roleKey: string) => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 px-4">
      <div className="card p-6 w-full max-w-xs animate-popIn">
        <h2 className="text-lg font-black mb-1">請選擇這次的執行身分</h2>
        <p className="text-sm text-ink/50 mb-4">此操作會留下紀錄，請確認身分</p>
        <div className="flex flex-col gap-2">
          {roles.map((r) => (
            <button
              key={r.key}
              className="btn-outline text-left"
              onClick={() => onSelect(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="w-full mt-4 text-sm text-ink/40">
          取消
        </button>
      </div>
    </div>
  );
}
