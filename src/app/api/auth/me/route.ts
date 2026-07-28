import { NextResponse } from "next/server";
import { getSession, availableActingRoles } from "@/lib/auth";

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ authenticated: false });

  return NextResponse.json({
    authenticated: true,
    accountId: session.accountId,
    name: session.name,
    roles: {
      isAdmin: session.isAdmin,
      isTeacher: session.isTeacher,
      isAssistant: session.isAssistant,
      isCounselor: session.isCounselor,
      isOfficer: session.isOfficer,
      isChiefOfficer: session.isChiefOfficer,
      isDeputyChiefOfficer: session.isDeputyChiefOfficer,
    },
    actingRoles: availableActingRoles(session),
  });
}
