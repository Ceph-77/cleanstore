import { apiClient } from "./client";
import type { Clan, ClanInviteRow } from "../types";

export const listMyClans = () => apiClient.get<{ clans: Clan[] }>("/clans/mine");
export const createClan = (name: string) => apiClient.post<{ clan: Clan }>("/clans", { name });
export const joinClan = (code: string) => apiClient.post<{ clan: Clan }>("/clans/join", { code });
export const listClanInvites = () =>
  apiClient.get<{ invites: ClanInviteRow[] }>("/clans/invites");
export const acceptClanInvite = (inviteId: string) =>
  apiClient.post<{ clan: Clan }>(`/clans/invites/${inviteId}/accept`);
export const inviteToClan = (clanId: string, email: string) =>
  apiClient.post<{ invite: unknown }>(`/clans/${clanId}/invite`, { email });
export const leaveClan = (clanId: string) => apiClient.post<void>(`/clans/${clanId}/leave`);
export const removeClanMember = (clanId: string, userId: string) =>
  apiClient.delete<{ clan: Clan }>(`/clans/${clanId}/members/${userId}`);
