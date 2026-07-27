import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// 帳號批次上傳範本：姓名、帳號、密碼 + 各身分 1/0 欄位
export async function GET() {
  const session = getSession();
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: "只有管理員可以下載範本" }, { status: 403 });
  }

  const rows = [
    {
      姓名: "王老師",
      帳號: "wang_teacher",
      密碼: "changeme123",
      管理員: 0,
      老師: 1,
      實驗助理: 0,
      隊輔: 0,
      值星官: 0,
      總值星: 0,
      副總值星: 0,
    },
    {
      姓名: "陳隊輔",
      帳號: "chen_counselor",
      密碼: "changeme123",
      管理員: 0,
      老師: 0,
      實驗助理: 0,
      隊輔: 1,
      值星官: 0,
      總值星: 0,
      副總值星: 0,
    },
  ];
  const sheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "帳號名單");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="accounts_template.xlsx"',
    },
  });
}
