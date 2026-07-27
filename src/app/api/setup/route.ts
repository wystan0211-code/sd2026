cat << 'EOF'
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

// 一鍵初始化：建立管理員帳號、六個小隊、預設按鈕
// 只能執行一次；只要偵測到已經有管理員帳號存在，就會拒絕重複執行
export async function GET() {
  const existing = await prisma.account.findFirst({ where: { isAdmin: true } });
  if (existing) {
    return NextResponse.json({
      message: "已經初始化過了，不需要也不會重複執行。",
    });
  }

  const hashed = await bcrypt.hash("sd2026", 10);
  await prisma.account.create({
    data: {
      name: "洪維昀",
      username: "hungweiyun",
      password: hashed,
      isAdmin: true,
    },
  });

  const squads = [
    { code: "A1", color: "#ffd429", iconKey: "a1_bee", sortOrder: 1 },
    { code: "A2", color: "#ff914d", iconKey: "a2_fox", sortOrder: 2 },
    { code: "A3", color: "#c1ff72", iconKey: "a3_turtle", sortOrder: 3 },
    { code: "B4", color: "#ed3db1", iconKey: "b4_octopus", sortOrder: 4 },
    { code: "B5", color: "#0e48c6", iconKey: "b5_gem", sortOrder: 5 },
    { code: "B6", color: "#000000", iconKey: "b6_mask", sortOrder: 6 },
  ];
  for (const s of squads) {
    await prisma.squad.upsert({
      where: { code: s.code },
      update: {},
      create: s,
    });
  }

  await prisma.scoreButton.createMany({
    data: [
      { label: "認真投入", points: 1, sortOrder: 1 },
      { label: "團隊合作", points: 2, sortOrder: 2 },
      { label: "表現優異", points: 5, sortOrder: 3 },
      { label: "違反規定", points: -1, sortOrder: 4 },
      { label: "態度不佳", points: -2, sortOrder: 5 },
      { label: "嚴重違規", points: -5, sortOrder: 6 },
    ],
  });

  return NextResponse.json({
    ok: true,
    message: "初始化完成！管理員帳號：hungweiyun / sd2026（顯示名稱：洪維昀）",
  });
}
EOF
Output

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

// 一鍵初始化：建立管理員帳號、六個小隊、預設按鈕
// 只能執行一次；只要偵測到已經有管理員帳號存在，就會拒絕重複執行
export async function GET() {
  const existing = await prisma.account.findFirst({ where: { isAdmin: true } });
  if (existing) {
    return NextResponse.json({
      message: "已經初始化過了，不需要也不會重複執行。",
    });
  }

  const hashed = await bcrypt.hash("sd2026", 10);
  await prisma.account.create({
    data: {
      name: "洪維昀",
      username: "hungweiyun",
      password: hashed,
      isAdmin: true,
    },
  });

  const squads = [
    { code: "A1", color: "#ffd429", iconKey: "a1_bee", sortOrder: 1 },
    { code: "A2", color: "#ff914d", iconKey: "a2_fox", sortOrder: 2 },
    { code: "A3", color: "#c1ff72", iconKey: "a3_turtle", sortOrder: 3 },
    { code: "B4", color: "#ed3db1", iconKey: "b4_octopus", sortOrder: 4 },
    { code: "B5", color: "#0e48c6", iconKey: "b5_gem", sortOrder: 5 },
    { code: "B6", color: "#000000", iconKey: "b6_mask", sortOrder: 6 },
  ];
  for (const s of squads) {
    await prisma.squad.upsert({
      where: { code: s.code },
      update: {},
      create: s,
    });
  }

  await prisma.scoreButton.createMany({
    data: [
      { label: "認真投入", points: 1, sortOrder: 1 },
      { label: "團隊合作", points: 2, sortOrder: 2 },
      { label: "表現優異", points: 5, sortOrder: 3 },
      { label: "違反規定", points: -1, sortOrder: 4 },
      { label: "態度不佳", points: -2, sortOrder: 5 },
      { label: "嚴重違規", points: -5, sortOrder: 6 },
    ],
  });

  return NextResponse.json({
    ok: true,
    message: "初始化完成！管理員帳號：hungweiyun / sd2026（顯示名稱：洪維昀）",
  });
}
