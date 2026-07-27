import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: "只有管理員可以編輯學生資料" }, { status: 403 });
  }
  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.name) data.name = body.name;
  if (body.squadCode) {
    const squad = await prisma.squad.findUnique({ where: { code: body.squadCode } });
    if (!squad) return NextResponse.json({ error: "找不到該小隊代號" }, { status: 400 });
    data.squadId = squad.id;
  }

  const student = await prisma.student.update({ where: { id: params.id }, data });
  return NextResponse.json({ student });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: "只有管理員可以刪除學生" }, { status: 403 });
  }
  await prisma.student.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
