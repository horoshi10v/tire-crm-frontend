import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@tire-crm/shared';
import type { CreateTransferDTO, TransferResponse, TransferStatus } from '../types/transfer';

type UseStaffTransfersOptions = {
  page?: number;
  pageSize?: number;
  status?: '' | TransferStatus;
  fromWarehouseId?: string;
  toWarehouseId?: string;
};

export const useStaffTransfers = ({
  page = 1,
  pageSize = 20,
  status = '',
  fromWarehouseId = '',
  toWarehouseId = '',
}: UseStaffTransfersOptions = {}) => {
  return useQuery({
    queryKey: ['staff-transfers', page, pageSize, status, fromWarehouseId, toWarehouseId],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        page,
        page_size: pageSize,
      };

      if (status) params.status = status;
      if (fromWarehouseId.trim()) params.from_warehouse_id = fromWarehouseId.trim();
      if (toWarehouseId.trim()) params.to_warehouse_id = toWarehouseId.trim();

      const { data } = await apiClient.get<TransferResponse[]>('/staff/transfers', { params });
      return data ?? [];
    },
  });
};

export const useStaffTransferById = (id: string | null) => {
  return useQuery({
    queryKey: ['staff-transfer', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await apiClient.get<TransferResponse>(`/staff/transfers/${id}`);
      return data;
    },
    enabled: Boolean(id),
  });
};

export const useCreateTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateTransferDTO) => {
      const { data } = await apiClient.post('/staff/transfers', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['staff-transfer'] });
      queryClient.invalidateQueries({ queryKey: ['staff-lots'] });
    },
  });
};

export const useAcceptTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post(`/staff/transfers/${id}/accept`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['staff-transfer'] });
      queryClient.invalidateQueries({ queryKey: ['staff-lots'] });
    },
  });
};

export const useCancelTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post(`/staff/transfers/${id}/cancel`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['staff-transfer'] });
      queryClient.invalidateQueries({ queryKey: ['staff-lots'] });
    },
  });
};
