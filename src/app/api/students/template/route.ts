import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// 學生批次上傳範本：姓名、小隊代號
export async function GET() {
  const session = getSession();
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: "只有管理員可以下載範本" }, { status: 403 });
  }

  const rows = [
    { 姓名: "王曉明", 小隊代號: "A1" },
    { 姓名: "陳小美", 小隊代號: "B4" },
  ];
  const sheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "學生名單");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="students_template.xlsx"',
    },
  });
}
