import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as usersApi from "../api/users";
import type { RoleKey } from "../types";

export function useUsers(role?: RoleKey) {
  return useQuery({
    queryKey: ["admin", "users", role ?? "all"],
    queryFn: () => usersApi.listUsers(role).then((r) => r.users),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: usersApi.CreateUserInput) => usersApi.createUser(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}
