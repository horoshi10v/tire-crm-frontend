// apps/client-tma/src/api/useOrders.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@tire-crm/shared';

// Типы из Swagger: domain.OrderResponse и domain.OrderItemResponse
export interface OrderItemResponse {
    lot_id: string;
    brand?: string;
    model?: string;
    photo?: string;
    price: number;
    quantity: number;
    total: number;
}

export interface OrderResponse {
    id: string;
    created_at: string;
    customer_name: string;
    customer_phone: string;
    status: string;
    total_amount: number;
    items: OrderItemResponse[];
}

export const useOrders = (page = 1, pageSize = 10) => {
    return useQuery({
        queryKey: ['orders', page, pageSize],
        queryFn: async () => {
            const { data } = await apiClient.get<OrderResponse[]>('/orders', {
                params: { page, page_size: pageSize },
            });
            return data || [];
        },
    });
};
