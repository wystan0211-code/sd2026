import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: "只有管理員可以調整按鈕" }, { status: 403 });
  }
  const { label, points, sortOrder } = await req.json();
  const button = await prisma.scoreButton.update({
    where: { id: params.id },
    data: {
      ...(label !== undefined ? { label } : {}),
      ...(points !== undefined ? { points } : {}),
      ...(sortOrder !== undefined ? { sortOrder } : {}),
    },
  });
  return NextResponse.json({ button });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: "只有管理員可以刪除按鈕" }, { status: 403 });
  }
  await prisma.scoreButton.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
