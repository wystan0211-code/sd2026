import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ---- 管理員預設帳號 ----
  const hashed = await bcrypt.hash("sd2026", 10);
  await prisma.account.upsert({
    where: { username: "hongweiyun" },
    update: {},
    create: {
      name: "洪維昀",
      username: "hongweiyun",
      password: hashed,
      isAdmin: true,
    },
  });

  // ---- 六個小隊 ----
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
      update: { color: s.color, iconKey: s.iconKey, sortOrder: s.sortOrder },
      create: s,
    });
  }

  // ---- 預設加扣分按鈕（管理員可在後台調整） ----
  const existingButtons = await prisma.scoreButton.count();
  if (existingButtons === 0) {
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
  }

  console.log("Seed 完成：管理員帳號 hongweiyun / sd2026（顯示名稱：洪維昀）");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
