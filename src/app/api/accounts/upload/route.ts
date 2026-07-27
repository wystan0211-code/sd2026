import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// 帳號批次上傳 Excel：欄位為 姓名、帳號、密碼，以及各身分用 1/0 標示：
// 管理員、老師、實驗助理、隊輔、值星官、總值星
export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: "只有管理員可以批次上傳帳號" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "請附上 Excel 檔案" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  const errors: string[] = [];
  let createdCount = 0;

  const flag = (v: unknown) => String(v ?? "0").trim() === "1";

  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];
    const rowNum = idx + 2;
    const name = String(row["姓名"] ?? "").trim();
    const username = String(row["帳號"] ?? "").trim();
    const password = String(row["密碼"] ?? "").trim();

    if (!name || !username || !password) {
      errors.push(`第 ${rowNum} 列：姓名／帳號／密碼有缺漏`);
      continue;
    }

    const existing = await prisma.account.findUnique({ where: { username } });
    if (existing) {
      errors.push(`第 ${rowNum} 列：帳號「${username}」已存在，已略過`);
      continue;
    }

    const hashed = await bcrypt.hash(password, 10);
    await prisma.account.create({
      data: {
        name,
        username,
        password: hashed,
        isAdmin: flag(row["管理員"]),
        isTeacher: flag(row["老師"]),
        isAssistant: flag(row["實驗助理"]) || flag(row["隊輔"]),
        isOfficer: flag(row["值星官"]),
        isChiefOfficer: flag(row["總值星"]),
      },
    });
    createdCount++;
  }

  return NextResponse.json({ createdCount, errorCount: errors.length, errors });
}
