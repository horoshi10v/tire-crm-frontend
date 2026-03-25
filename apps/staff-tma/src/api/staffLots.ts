// apps/staff-tma/src/api/staffLots.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@tire-crm/shared';
import type { LotInternalResponse, CreateLotDTO, StaffLotFilters, UpdateLotDTO } from '../types/lot';

type UseStaffLotsOptions = {
    page?: number;
    pageSize?: number;
    filters?: Partial<StaffLotFilters>;
};

type UseStaffLotsArgs = {
    page: number;
    pageSize: number;
    filters: Partial<StaffLotFilters>;
};

const normalizeUseStaffLotsArgs = (
    pageOrOptions: number | UseStaffLotsOptions | undefined,
    pageSize?: number,
    filters?: Partial<StaffLotFilters>,
): UseStaffLotsArgs => {
    if (typeof pageOrOptions === 'number') {
        return {
            page: pageOrOptions,
            pageSize: pageSize ?? 20,
            filters: filters ?? {},
        };
    }

    return {
        page: pageOrOptions?.page ?? 1,
        pageSize: pageOrOptions?.pageSize ?? 20,
        filters: pageOrOptions?.filters ?? {},
    };
};

// 1. ЧТЕНИЕ (GET /staff/lots)
export function useStaffLots(options?: UseStaffLotsOptions): ReturnType<typeof useQuery<LotInternalResponse[]>>;
export function useStaffLots(
    page?: number,
    pageSize?: number,
    filters?: Partial<StaffLotFilters>,
): ReturnType<typeof useQuery<LotInternalResponse[]>>;
export function useStaffLots(
    pageOrOptions: number | UseStaffLotsOptions = {},
    pageSize?: number,
    filters?: Partial<StaffLotFilters>,
) {
    const normalizedArgs = normalizeUseStaffLotsArgs(pageOrOptions, pageSize, filters);
    const { page, pageSize: normalizedPageSize, filters: normalizedFilters } = normalizedArgs;

    return useQuery({
        queryKey: ['staff-lots', page, normalizedPageSize, normalizedFilters],
        queryFn: async () => {
            const params: Record<string, string | number> = { page, page_size: normalizedPageSize };
            if (normalizedFilters.search?.trim()) params.search = normalizedFilters.search.trim();
            if (normalizedFilters.type) params.type = normalizedFilters.type;
            if (normalizedFilters.sort_by) params.sort_by = normalizedFilters.sort_by;
            if (normalizedFilters.sort_order) params.sort_order = normalizedFilters.sort_order;
            if (normalizedFilters.condition) params.condition = normalizedFilters.condition;
            if (normalizedFilters.season) params.season = normalizedFilters.season;
            if (normalizedFilters.width !== '' && normalizedFilters.width !== undefined) params.width = normalizedFilters.width;
            if (normalizedFilters.profile !== '' && normalizedFilters.profile !== undefined) params.profile = normalizedFilters.profile;
            if (normalizedFilters.diameter !== '' && normalizedFilters.diameter !== undefined) params.diameter = normalizedFilters.diameter;
            if (normalizedFilters.is_run_flat) params.is_run_flat = 'true';
            if (normalizedFilters.is_spiked) params.is_spiked = 'true';
            if (normalizedFilters.anti_puncture) params.anti_puncture = 'true';
            if (normalizedFilters.warehouse_id?.trim()) params.warehouse_id = normalizedFilters.warehouse_id.trim();
            if (normalizedFilters.accessory_category) params.accessory_category = normalizedFilters.accessory_category;
            if (normalizedFilters.fastener_type) params.fastener_type = normalizedFilters.fastener_type;
            if (normalizedFilters.thread_size?.trim()) params.thread_size = normalizedFilters.thread_size.trim();
            if (normalizedFilters.seat_type?.trim()) params.seat_type = normalizedFilters.seat_type.trim();
            if (normalizedFilters.ring_inner_diameter !== '' && normalizedFilters.ring_inner_diameter !== undefined) {
                params.ring_inner_diameter = normalizedFilters.ring_inner_diameter;
            }
            if (normalizedFilters.ring_outer_diameter !== '' && normalizedFilters.ring_outer_diameter !== undefined) {
                params.ring_outer_diameter = normalizedFilters.ring_outer_diameter;
            }
            if (normalizedFilters.spacer_type) params.spacer_type = normalizedFilters.spacer_type;
            if (normalizedFilters.spacer_thickness !== '' && normalizedFilters.spacer_thickness !== undefined) {
                params.spacer_thickness = normalizedFilters.spacer_thickness;
            }
            if (normalizedFilters.package_quantity !== '' && normalizedFilters.package_quantity !== undefined) {
                params.package_quantity = normalizedFilters.package_quantity;
            }

            const { data } = await apiClient.get<LotInternalResponse[]>('/staff/lots', { params });
            return data || [];
        },
    });
}

// 2. СОЗДАНИЕ (POST /staff/lots)
export const useCreateLot = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newLot: CreateLotDTO) => {
            const { data } = await apiClient.post('/staff/lots', newLot);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff-lots'] }); // Обновляем список
        },
    });
};

// 3. ОБНОВЛЕНИЕ (PUT /staff/lots/{id})
export const useUpdateLot = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, lot }: { id: string; lot: UpdateLotDTO }) => {
            const { data } = await apiClient.put(`/staff/lots/${id}`, lot);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff-lots'] });
        },
    });
};

// 4. УДАЛЕНИЕ (DELETE /staff/lots/{id})
export const useDeleteLot = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/staff/lots/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff-lots'] });
        },
    });
};

// 5. ГЕНЕРАЦИЯ QR-КОДА (GET /staff/lots/{id}/qr)
type LotQRData = {
    objectUrl: string;
    dataUrl: string;
};

const blobToDataUrl = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
                return;
            }

            reject(new Error('Не вдалося перетворити QR у data URL'));
        };
        reader.onerror = () => {
            reject(reader.error ?? new Error('Не вдалося прочитати QR blob'));
        };
        reader.readAsDataURL(blob);
    });
};

export const getLotQRData = async (id: string): Promise<LotQRData> => {
    const { data } = await apiClient.get(`/staff/lots/${id}/qr`, {
        responseType: 'blob',
    });

    return {
        objectUrl: URL.createObjectURL(data),
        dataUrl: await blobToDataUrl(data),
    };
};

export const useLotQR = (id: string | null) => {
    return useQuery({
        queryKey: ['lot-qr', id],
        queryFn: async () => {
            if (!id) return null;
            return getLotQRData(id);
        },
        enabled: !!id, // Запрос улетит только если передали ID
    });
};

type UploadPhotoResponse = Record<string, string>;

const extractPhotoUrl = (payload: UploadPhotoResponse): string => {
    const prioritizedKeys = ['url', 'photo_url', 'photoUrl', 'public_url', 'publicUrl'];
    for (const key of prioritizedKeys) {
        const value = payload[key];
        if (typeof value === 'string' && value.length > 0) {
            return value;
        }
    }

    const firstValue = Object.values(payload).find((value) => typeof value === 'string' && value.length > 0);
    if (!firstValue) {
        throw new Error('Сервер не повернув URL фото');
    }

    return firstValue;
};

// 6. ЗАГРУЗКА ФОТО (POST /staff/lots/upload)
export const useUploadLotPhoto = () => {
    return useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);

            const { data } = await apiClient.post<UploadPhotoResponse>('/staff/lots/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return extractPhotoUrl(data ?? {});
        },
    });
};

const LOT_SEARCH_PAGE_SIZE = 200;
const LOT_SEARCH_MAX_PAGES = 25;

// 7. ПОИСК ЛОТА ПО ID (для QR-сканера)
export const useFindStaffLotById = () => {
    return useMutation({
        mutationFn: async (rawLotId: string) => {
            const lotId = rawLotId.trim();
            if (!lotId) {
                return null;
            }

            const { data: searchData } = await apiClient.get<LotInternalResponse[]>('/staff/lots', {
                params: {
                    page: 1,
                    page_size: LOT_SEARCH_PAGE_SIZE,
                    search: lotId,
                },
            });
            const searchItems = searchData ?? [];
            const exactFromSearch = searchItems.find((lot) => lot.id === lotId);
            if (exactFromSearch) {
                return exactFromSearch;
            }

            for (let page = 1; page <= LOT_SEARCH_MAX_PAGES; page += 1) {
                const { data } = await apiClient.get<LotInternalResponse[]>('/staff/lots', {
                    params: {
                        page,
                        page_size: LOT_SEARCH_PAGE_SIZE,
                    },
                });

                const items = data ?? [];
                const foundLot = items.find((lot) => lot.id === lotId);
                if (foundLot) {
                    return foundLot;
                }

                if (items.length < LOT_SEARCH_PAGE_SIZE) {
                    break;
                }
            }

            return null;
        },
    });
};
