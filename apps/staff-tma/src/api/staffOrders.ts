import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@tire-crm/shared';
import type {
  CreateOrderDTO,
  OrderChannel,
  OrderMessageResponse,
  OrderResponse,
  OrderStatus,
  SendOrderMessageDTO,
  UpdateOrderStatusDTO,
} from '../types/order';

type UseStaffOrdersOptions = {
  page?: number;
  pageSize?: number;
  status?: '' | OrderStatus;
  channel?: '' | OrderChannel;
  customer?: string;
};

export const useStaffOrders = ({
  page = 1,
  pageSize = 20,
  status = '',
  channel = '',
  customer = '',
}: UseStaffOrdersOptions = {}) => {
  return useQuery({
    queryKey: ['staff-orders', page, pageSize, status, channel, customer],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        page,
        page_size: pageSize,
      };

      if (status) params.status = status;
      if (channel) params.channel = channel;
      if (customer.trim()) params.customer = customer.trim();

      const { data } = await apiClient.get<OrderResponse[]>('/staff/orders', { params });
      return data ?? [];
    },
  });
};

export const useUpdateStaffOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateOrderStatusDTO }) => {
      const { data } = await apiClient.patch(`/staff/orders/${id}/status`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-orders'] });
    },
  });
};

export const useCreateStaffOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateOrderDTO) => {
      const { data } = await apiClient.post<OrderResponse>('/orders', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-orders'] });
      queryClient.invalidateQueries({ queryKey: ['staff-lots'] });
    },
  });
};

export const useOrderMessages = (orderId: string | null) => {
  return useQuery({
    queryKey: ['staff-order-messages', orderId],
    queryFn: async () => {
      if (!orderId) {
        return [];
      }

      const { data } = await apiClient.get<OrderMessageResponse[]>(`/staff/orders/${orderId}/messages`);
      return data ?? [];
    },
    enabled: !!orderId,
  });
};

export const useSendOrderBotMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: SendOrderMessageDTO }) => {
      const { data } = await apiClient.post(`/staff/orders/${id}/message`, payload);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['staff-order-messages', variables.id] });
    },
  });
};
