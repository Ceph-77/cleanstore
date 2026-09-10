import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as usersApi from "../api/users";
import type { RoleKey } from "../types";

export function useUsers(role?: RoleKey) {
  return useInfiniteQuery({
    queryKey: ["admin", "users", "list", role ?? "all"],
    queryFn: ({ pageParam }) => usersApi.listUsers(role, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ["admin", "users", "detail", id],
    queryFn: () => usersApi.getUser(id).then((r) => r.user),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: usersApi.CreateUserInput) => usersApi.createUser(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useSetUserActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      usersApi.setUserActive(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: usersApi.UserAdminPatch) => usersApi.updateUser(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users", "detail", id] });
    },
  });
}

export function useSetUserRoles(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roles, organizationId }: { roles: RoleKey[]; organizationId?: string | null }) =>
      usersApi.setUserRoles(id, roles, organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users", "detail", id] });
    },
  });
}

export function useUploadUserAvatar(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => usersApi.uploadUserAvatar(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users", "detail", id] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.deleteUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}
