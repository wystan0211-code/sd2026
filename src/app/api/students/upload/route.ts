import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// 學生批次上傳 Excel：欄位只有「姓名」「小隊代號」（A1/A2/A3/B4/B5/B6）
export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: "只有管理員可以批次上傳學生資料" }, { status: 403 });
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

  const squads = await prisma.squad.findMany();
  const squadMap = new Map<string, string>(
    squads.map((s: (typeof squads)[number]) => [s.code as string, s.id as string])
  );

  const errors: string[] = [];
  const toCreate: { name: string; squadId: string }[] = [];

  rows.forEach((row, idx) => {
    const name = String(row["姓名"] ?? row["name"] ?? "").trim();
    const squadCode = String(row["小隊代號"] ?? row["squad"] ?? "").trim().toUpperCase();
    const rowNum = idx + 2; // 含標題列

    if (!name) {
      errors.push(`第 ${rowNum} 列：姓名為空`);
      return;
    }
    const squadId = squadMap.get(squadCode);
    if (!squadId) {
      errors.push(`第 ${rowNum} 列：小隊代號「${squadCode}」不存在（需為 A1/A2/A3/B4/B5/B6）`);
      return;
    }
    toCreate.push({ name, squadId });
  });

  if (toCreate.length > 0) {
    await prisma.student.createMany({ data: toCreate });
  }

  return NextResponse.json({
    createdCount: toCreate.length,
    errorCount: errors.length,
    errors,
  });
}
