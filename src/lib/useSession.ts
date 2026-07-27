"use client";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export type ActingRole = { key: string; label: string };

export type MeResponse = {
  authenticated: boolean;
  name?: string;
  roles?: {
    isAdmin: boolean;
    isTeacher: boolean;
    isAssistant: boolean;
    isOfficer: boolean;
    isChiefOfficer: boolean;
  };
  actingRoles?: ActingRole[];
};

export function useSession() {
  const { data, isLoading } = useSWR<MeResponse>("/api/auth/me", fetcher);
  return { session: data, isLoading };
}
