// apps/client-tma/src/api/useCreateOrder.ts
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@tire-crm/shared';

// Types based strictly on domain.CreateOrderDTO from Swagger
export interface OrderItemDTO {
    lot_id: string;
    quantity: number;
}

export interface CreateOrderDTO {
    customer_name: string;
    customer_phone: string;
    customer_username?: string;
    customer_telegram_id?: number;
    items: OrderItemDTO[];
}

export const useCreateOrder = () => {
    return useMutation({
        mutationFn: async (orderData: CreateOrderDTO) => {
            // POST request to the /orders endpoint
            const { data } = await apiClient.post('/orders', orderData);
            return data;
        },
    });
};
