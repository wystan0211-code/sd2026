import { NextResponse } from "next/server";
import { getSession, availableActingRoles } from "@/lib/auth";

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ authenticated: false });

  return NextResponse.json({
    authenticated: true,
    name: session.name,
    roles: {
      isAdmin: session.isAdmin,
      isTeacher: session.isTeacher,
      isAssistant: session.isAssistant,
      isOfficer: session.isOfficer,
      isChiefOfficer: session.isChiefOfficer,
    },
    actingRoles: availableActingRoles(session),
  });
}
