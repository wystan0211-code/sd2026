import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signSession, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: "請輸入帳號與密碼" }, { status: 400 });
  }

  const account = await prisma.account.findUnique({ where: { username } });
  if (!account) {
    return NextResponse.json({ error: "帳號或密碼錯誤" }, { status: 401 });
  }
  if (account.suspended) {
    return NextResponse.json({ error: "此帳號已被停權，請聯繫管理員" }, { status: 403 });
  }

  const valid = await bcrypt.compare(password, account.password);
  if (!valid) {
    return NextResponse.json({ error: "帳號或密碼錯誤" }, { status: 401 });
  }

  const token = signSession({
    accountId: account.id,
    name: account.name,
    isAdmin: account.isAdmin,
    isTeacher: account.isTeacher,
    isAssistant: account.isAssistant,
    isCounselor: account.isCounselor,
    isOfficer: account.isOfficer,
    isChiefOfficer: account.isChiefOfficer,
    isDeputyChiefOfficer: account.isDeputyChiefOfficer,
  });
  setSessionCookie(token);

  return NextResponse.json({ ok: true, name: account.name });
}
