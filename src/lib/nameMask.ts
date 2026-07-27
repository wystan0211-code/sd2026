/**
 * 公開排行榜姓名遮蔽規則：
 * 保留姓名第一字與最後一字，中間全部替換為 X
 *   王曉明 -> 王X明
 *   王明   -> 王X
 *   江謝小美 -> 江XX美
 *   單字姓名（僅1字）-> 原樣顯示（無法再遮蔽）
 */
export function maskName(fullName: string): string {
  const name = fullName.trim();
  if (name.length <= 1) return name;
  if (name.length === 2) return `${name[0]}X`;
  const first = name[0];
  const last = name[name.length - 1];
  const middleLength = name.length - 2;
  return `${first}${"X".repeat(middleLength)}${last}`;
}
