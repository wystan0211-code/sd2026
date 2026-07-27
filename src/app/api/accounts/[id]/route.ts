import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSession, signSession, setSessionCookie } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: "只有管理員可以編輯帳號" }, { status: 403 });
  }
  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.name) data.name = body.name;
  if (body.username) {
    const existing = await prisma.account.findUnique({ where: { username: body.username } });
    if (existing && existing.id !== params.id) {
      return NextResponse.json({ error: "此帳號名稱已被使用" }, { status: 409 });
    }
    data.username = body.username;
  }
  if (typeof body.isAdmin === "boolean") data.isAdmin = body.isAdmin;
  if (typeof body.isTeacher === "boolean") data.isTeacher = body.isTeacher;
  if (typeof body.isAssistant === "boolean") data.isAssistant = body.isAssistant;
  if (typeof body.isCounselor === "boolean") data.isCounselor = body.isCounselor;
  if (typeof body.isOfficer === "boolean") data.isOfficer = body.isOfficer;
  if (typeof body.isChiefOfficer === "boolean") data.isChiefOfficer = body.isChiefOfficer;
  if (typeof body.isDeputyChiefOfficer === "boolean")
    data.isDeputyChiefOfficer = body.isDeputyChiefOfficer;
  if (typeof body.suspended === "boolean") data.suspended = body.suspended;
  if (body.suspendedNote !== undefined) data.suspendedNote = body.suspendedNote;
  if (body.password) data.password = await bcrypt.hash(body.password, 10);

  const account = await prisma.account.update({ where: { id: params.id }, data });

  // 如果管理員編輯的是「自己這個帳號」，立刻重新簽發登入憑證，
  // 讓身分/權限異動不需要登出重登就能馬上生效
  if (params.id === session.accountId) {
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
  }

  return NextResponse.json({
    account: { id: account.id, name: account.name, username: account.username },
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: "只有管理員可以刪除帳號" }, { status: 403 });
  }
  if (params.id === session.accountId) {
    return NextResponse.json({ error: "不能刪除自己目前登入的帳號" }, { status: 400 });
  }
  await prisma.account.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
