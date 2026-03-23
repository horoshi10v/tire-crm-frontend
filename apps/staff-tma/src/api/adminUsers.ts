import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@tire-crm/shared';
import type { AdminUser, AdminUsersFilters, CreateWorkerDTO, UpdateUserRoleDTO } from '../types/adminUser';

const normalizeFilters = (filters: AdminUsersFilters): Record<string, string | number> => {
  const params: Record<string, string | number> = {
    page: filters.page ?? 1,
    page_size: filters.page_size ?? 50,
  };

  if (filters.search?.trim()) {
    params.search = filters.search.trim();
  }

  if (filters.role) {
    params.role = filters.role;
  }

  return params;
};

export const useAdminUsers = (filters: AdminUsersFilters) => {
  return useQuery({
    queryKey: ['admin-users', filters],
    queryFn: async () => {
      const { data } = await apiClient.get<AdminUser[]>('/admin/users', { params: normalizeFilters(filters) });
      return data ?? [];
    },
  });
};

export const useCreateAdminUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateWorkerDTO) => {
      const { data } = await apiClient.post('/admin/users', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
};

export const useUpdateAdminUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateUserRoleDTO }) => {
      const { data } = await apiClient.put(`/admin/users/${id}/role`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
};

export const useDeleteAdminUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(`/admin/users/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
};
