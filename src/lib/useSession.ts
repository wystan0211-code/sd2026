"use client";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export type ActingRole = { key: string; label: string };

export type MeResponse = {
  authenticated: boolean;
  accountId?: string;
  name?: string;
  roles?: {
    isAdmin: boolean;
    isTeacher: boolean;
    isAssistant: boolean;
    isCounselor: boolean;
    isOfficer: boolean;
    isChiefOfficer: boolean;
    isDeputyChiefOfficer: boolean;
  };
  actingRoles?: ActingRole[];
};

export function useSession() {
  const { data, isLoading } = useSWR<MeResponse>("/api/auth/me", fetcher);
  return { session: data, isLoading };
}
