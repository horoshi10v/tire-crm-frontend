// apps/client-tma/src/api/useLots.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@tire-crm/shared';
import type { LotPublicResponse } from '../types/lot';
import type { LotFilters } from '../store/useFilterStore';

export const useLots = (filters: LotFilters, page = 1, pageSize = 10) => {
    return useQuery({
        // React Query будет автоматически перезапрашивать данные при изменении filters
        queryKey: ['lots', filters, page, pageSize],
        queryFn: async () => {
            // Подготавливаем параметры, отсекая пустые строки и false
            const params: Record<string, any> = { page, page_size: pageSize };

            Object.entries(filters).forEach(([key, value]) => {
                if (value !== '' && value !== false) {
                    params[key] = value;
                }
            });

            const { data } = await apiClient.get<LotPublicResponse[]>('/lots', { params });
            return data || [];
        },
    });
};