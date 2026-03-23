import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@tire-crm/shared';
import type {
  AdminNotification,
  AdminNotificationFilters,
  AdminNotificationListResponse,
} from '../types/adminNotification';

export const useAdminNotifications = (filters: AdminNotificationFilters) => {
  return useQuery<AdminNotificationListResponse>({
    queryKey: ['admin-notifications', filters],
    queryFn: async () => {
      const response = await apiClient.get<AdminNotification[]>('/admin/notifications', {
        params: {
          page: filters.page ?? 1,
          page_size: filters.page_size ?? 20,
          type: filters.type || undefined,
          is_read: typeof filters.is_read === 'boolean' ? filters.is_read : undefined,
        },
      });

      return {
        items: response.data ?? [],
        total: Number(response.headers['x-total-count'] ?? 0),
      };
    },
  });
};

export const useMarkAdminNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post(`/admin/notifications/${id}/read`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
  });
};
