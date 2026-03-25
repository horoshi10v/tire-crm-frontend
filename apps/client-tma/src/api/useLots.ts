// apps/client-tma/src/api/useLots.ts
import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@tire-crm/shared';
import type { LotPublicResponse } from '../types/lot';
import type { LotFilters } from '../store/useFilterStore';

export type LotSortBy = 'price' | 'created_at' | 'stock' | 'popularity';
export type LotSortOrder = 'asc' | 'desc';

export interface LotsSortParams {
    sort_by: LotSortBy;
    sort_order: LotSortOrder;
}

export interface PaginatedLotsResponse {
    items: LotPublicResponse[];
    page: number;
    page_size: number;
    total: number;
    has_next: boolean;
}

type LotSuggestionsResponse = {
    items: string[];
};

type TrackSuggestionPayload = {
    suggestion: string;
};

export const useLots = (filters: LotFilters, sort?: LotsSortParams, pageSize = 12) => {
    return useInfiniteQuery({
        queryKey: ['lots', filters, sort, pageSize],
        initialPageParam: 1,
        queryFn: async ({ pageParam }) => {
            const page = Number(pageParam);
            const params: Record<string, any> = {
                page,
                page_size: pageSize,
            };

            if (sort) {
                params.sort_by = sort.sort_by;
                params.sort_order = sort.sort_order;
            }

            Object.entries(filters).forEach(([key, value]) => {
                if (value !== '' && value !== false) {
                    params[key] = value;
                }
            });

            const { data } = await apiClient.get<PaginatedLotsResponse>('/lots', { params });
            return data;
        },
        getNextPageParam: (lastPage, allPages) => {
            if (!lastPage?.has_next) {
                return undefined;
            }

            return allPages.length + 1;
        },
    });
};

export const useLotSuggestions = (filters: LotFilters, limit = 8) => {
    return useQuery({
        queryKey: ['lot-suggestions', filters, limit],
        queryFn: async () => {
            const params: Record<string, any> = { limit };

            Object.entries(filters).forEach(([key, value]) => {
                if (value !== '' && value !== false) {
                    params[key] = value;
                }
            });

            const { data } = await apiClient.get<LotSuggestionsResponse>('/lots/suggestions', { params });
            return data.items ?? [];
        },
        staleTime: 30_000,
    });
};

export const useTrackLotSuggestionSelection = () => {
    return useMutation({
        mutationFn: async (suggestion: string) => {
            await apiClient.post('/lots/suggestions/track', {
                suggestion,
            } satisfies TrackSuggestionPayload);
        },
    });
};
