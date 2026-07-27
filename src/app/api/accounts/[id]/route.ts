import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: "只有管理員可以編輯帳號" }, { status: 403 });
  }
  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.name) data.name = body.name;
  if (typeof body.isAdmin === "boolean") data.isAdmin = body.isAdmin;
  if (typeof body.isTeacher === "boolean") data.isTeacher = body.isTeacher;
  if (typeof body.isAssistant === "boolean") data.isAssistant = body.isAssistant;
  if (typeof body.isOfficer === "boolean") data.isOfficer = body.isOfficer;
  if (typeof body.isChiefOfficer === "boolean") data.isChiefOfficer = body.isChiefOfficer;
  if (typeof body.suspended === "boolean") data.suspended = body.suspended;
  if (body.suspendedNote !== undefined) data.suspendedNote = body.suspendedNote;
  if (body.password) data.password = await bcrypt.hash(body.password, 10);

  const account = await prisma.account.update({ where: { id: params.id }, data });
  return NextResponse.json({
    account: { id: account.id, name: account.name, username: account.username },
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: "只有管理員可以刪除帳號" }, { status: 403 });
  }
  await prisma.account.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
