import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = getSession();
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: "只有管理員可以查看帳號列表" }, { status: 403 });
  }
  const accounts = await prisma.account.findMany({
    select: {
      id: true,
      name: true,
      username: true,
      isAdmin: true,
      isTeacher: true,
      isAssistant: true,
      isOfficer: true,
      isChiefOfficer: true,
      suspended: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ accounts });
}

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: "只有管理員可以新增帳號" }, { status: 403 });
  }

  const body = await req.json();
  const { name, username, password } = body;
  if (!name || !username || !password) {
    return NextResponse.json({ error: "姓名、帳號、密碼為必填" }, { status: 400 });
  }

  const existing = await prisma.account.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: "此帳號已存在" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);
  const account = await prisma.account.create({
    data: {
      name,
      username,
      password: hashed,
      isAdmin: !!body.isAdmin,
      isTeacher: !!body.isTeacher,
      isAssistant: !!body.isAssistant,
      isOfficer: !!body.isOfficer,
      isChiefOfficer: !!body.isChiefOfficer,
    },
  });

  return NextResponse.json({
    account: { id: account.id, name: account.name, username: account.username },
  });
}
