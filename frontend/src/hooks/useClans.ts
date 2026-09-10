import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/clans";
import { POLL_MS } from "../queryClient";

const KEY = ["clans"];

export function useMyClans() {
  return useQuery({ queryKey: [...KEY, "mine"], queryFn: () => api.listMyClans().then((r) => r.clans) });
}

export function useClanInvites() {
  return useQuery({
    queryKey: [...KEY, "invites"],
    queryFn: () => api.listClanInvites().then((r) => r.invites),
    refetchInterval: POLL_MS,
  });
}

function useClanMutation<V>(fn: (v: V) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export const useCreateClan = () => useClanMutation((name: string) => api.createClan(name));
export const useJoinClan = () => useClanMutation((code: string) => api.joinClan(code));
export const useAcceptClanInvite = () =>
  useClanMutation((inviteId: string) => api.acceptClanInvite(inviteId));
export const useInviteToClan = () =>
  useClanMutation(({ clanId, email }: { clanId: string; email: string }) =>
    api.inviteToClan(clanId, email),
  );
export const useLeaveClan = () => useClanMutation((clanId: string) => api.leaveClan(clanId));
export const useRemoveClanMember = () =>
  useClanMutation(({ clanId, userId }: { clanId: string; userId: string }) =>
    api.removeClanMember(clanId, userId),
  );
