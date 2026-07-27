// 六個小隊的正式角色頭像（/public/icons/*.svg），
// 空心圓圈邊框使用該小隊代表色，中央置入角色圖案。
const ICON_FILE: Record<string, string> = {
  a1_bee: "/icons/a1_bee.svg",
  a2_fox: "/icons/a2_fox.svg",
  a3_turtle: "/icons/a3_turtle.svg",
  b4_octopus: "/icons/b4_octopus.svg",
  b5_gem: "/icons/b5_gem.svg",
  b6_mask: "/icons/b6_mask.svg",
};

export default function SquadAvatar({
  iconKey,
  color,
  size = 48,
}: {
  iconKey: string;
  color: string;
  size?: number;
}) {
  const isDark = color.toLowerCase() === "#000000";
  const src = ICON_FILE[iconKey];
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 overflow-hidden"
      style={{
        width: size,
        height: size,
        border: `3px solid ${color}`,
        background: isDark ? "#f2f2f2" : `${color}1a`,
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          style={{ width: size * 0.72, height: size * 0.72, objectFit: "contain" }}
        />
      ) : (
        <span className="msi" style={{ color, fontSize: size * 0.55 }}>
          face
        </span>
      )}
    </div>
  );
}
