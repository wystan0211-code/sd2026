import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "camp-score-dev-secret-change-me";
const COOKIE_NAME = "camp_session";

export type SessionPayload = {
  accountId: string;
  name: string;
  isAdmin: boolean;
  isTeacher: boolean;
  isAssistant: boolean;
  isOfficer: boolean;
  isChiefOfficer: boolean;
};

export function signSession(payload: SessionPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "12h" });
}

export function setSessionCookie(token: string) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export function clearSessionCookie() {
  cookies().delete(COOKIE_NAME);
}

export function getSession(): SessionPayload | null {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

/** 該帳號目前可以「執行」的身分清單（供前端跳出選擇框使用） */
export function availableActingRoles(session: SessionPayload) {
  const roles: { key: string; label: string }[] = [];
  if (session.isAdmin) roles.push({ key: "ADMIN", label: "管理員" });
  if (session.isTeacher) roles.push({ key: "TEACHER", label: "老師" });
  if (session.isAssistant) roles.push({ key: "ASSISTANT", label: "實驗助理／隊輔" });
  if (session.isOfficer) roles.push({ key: "OFFICER", label: "值星官" });
  if (session.isChiefOfficer) roles.push({ key: "CHIEF_OFFICER", label: "總值星" });
  return roles;
}

/** 是否能查看所有人的加扣分紀錄（而非僅自己操作的） */
export function canViewAllLogs(session: SessionPayload) {
  return (
    session.isAdmin ||
    session.isTeacher ||
    session.isOfficer ||
    session.isChiefOfficer
  );
}

/** 是否只能復原/查看自己操作的紀錄（實驗助理／隊輔） */
export function isSelfOnlyRole(session: SessionPayload) {
  return (
    session.isAssistant &&
    !session.isAdmin &&
    !session.isTeacher &&
    !session.isOfficer &&
    !session.isChiefOfficer
  );
}

export async function requireSession() {
  const session = getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  const account = await prisma.account.findUnique({ where: { id: session.accountId } });
  if (!account || account.suspended) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
