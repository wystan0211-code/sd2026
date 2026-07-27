import type { SessionPayload } from "./auth";

/**
 * 加扣分紀錄的復原/刪除權限規則：
 * - 管理員：可復原、可刪除「任何人」的紀錄
 * - 老師 / 值星官 / 總值星 / 副總值星：可復原「任何人」的紀錄（此操作會留紀錄），不可刪除
 * - 實驗助理／隊輔：只能復原「自己」操作過的紀錄，不可刪除
 */
export function canUndoLog(session: SessionPayload, log: { operatorId: string }) {
  if (session.isAdmin) return true;
  if (
    session.isTeacher ||
    session.isOfficer ||
    session.isChiefOfficer ||
    session.isDeputyChiefOfficer
  )
    return true;
  if (session.isAssistant || session.isCounselor) return log.operatorId === session.accountId;
  return false;
}

export function canDeleteLog(session: SessionPayload) {
  // 僅管理員可刪除紀錄
  return session.isAdmin;
}

export function canViewLog(session: SessionPayload, log: { operatorId: string }) {
  if (
    session.isAdmin ||
    session.isTeacher ||
    session.isOfficer ||
    session.isChiefOfficer ||
    session.isDeputyChiefOfficer
  ) {
    return true;
  }
  if (session.isAssistant || session.isCounselor) return log.operatorId === session.accountId;
  return false;
}
