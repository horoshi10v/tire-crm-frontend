import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@tire-crm/shared';
import type { InventoryExportFilters, PnLReport, PnLReportFilters } from '../types/adminReports';

type ExportResponse = Record<string, string>;

const buildParams = <T extends object>(filters: T): Record<string, string | number | boolean> => {
  const params: Record<string, string | number | boolean> = {};

  Object.entries(filters as Record<string, unknown>).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params[key] = value as string | number | boolean;
  });

  return params;
};

const extractExportUrl = (payload: ExportResponse): string => {
  const prioritizedKeys = ['url', 'sheet_url', 'sheetUrl', 'export_url', 'exportUrl'];
  for (const key of prioritizedKeys) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  const firstString = Object.values(payload).find((value) => typeof value === 'string' && value.trim().length > 0);
  if (!firstString) {
    throw new Error('Сервер не повернув URL експорту');
  }
  return firstString;
};

export const useAdminPnLReport = (filters: PnLReportFilters, enabled = false) => {
  return useQuery({
    queryKey: ['admin-pnl-report', filters],
    queryFn: async () => {
      const params = buildParams(filters);
      try {
        const { data } = await apiClient.get<PnLReport>('/admin/reports/pnl', { params });
        return data;
      } catch (error: unknown) {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status !== 404) {
          throw error;
        }
        const { data } = await apiClient.get<PnLReport>('/reports/pnl', { params });
        return data;
      }
    },
    enabled,
  });
};

export const useExportPnL = () => {
  return useMutation({
    mutationFn: async (filters: PnLReportFilters) => {
      const params = buildParams(filters);
      const { data } = await apiClient.get<ExportResponse>('/admin/exports/pnl', { params });
      return extractExportUrl(data ?? {});
    },
  });
};

export const useExportInventory = () => {
  return useMutation({
    mutationFn: async (filters: InventoryExportFilters) => {
      const params = buildParams({
        ...filters,
        page_size: filters.page_size ?? 10000,
      });
      const { data } = await apiClient.get<ExportResponse>('/admin/exports/inventory', { params });
      return extractExportUrl(data ?? {});
    },
  });
};
