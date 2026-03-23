import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@tire-crm/shared';
import type { AuditLogFilters, AuditLogListResponse, AuditLogResponse } from '../types/adminAuditLog';

export const useAdminAuditLogs = (filters: AuditLogFilters) => {
  return useQuery<AuditLogListResponse>({
    queryKey: ['admin-audit-logs', filters],
    queryFn: async () => {
      const response = await apiClient.get<AuditLogResponse[]>('/admin/audit-logs', {
        params: {
          page: filters.page ?? 1,
          page_size: filters.page_size ?? 20,
          entity: filters.entity || undefined,
          action: filters.action || undefined,
          user: filters.user || undefined,
          start_date: filters.start_date || undefined,
          end_date: filters.end_date || undefined,
        },
      });

      return {
        items: response.data ?? [],
        total: Number(response.headers['x-total-count'] ?? 0),
      };
    },
  });
};
