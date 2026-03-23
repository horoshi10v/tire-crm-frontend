import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@tire-crm/shared';
import type { CreateWarehouseDTO, UpdateWarehouseDTO, Warehouse } from '../types/warehouse';

export const useStaffWarehouses = () => {
  return useQuery({
    queryKey: ['staff-warehouses'],
    queryFn: async () => {
      const { data } = await apiClient.get<Warehouse[]>('/staff/warehouses');
      return data ?? [];
    },
  });
};

export const useCreateWarehouse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateWarehouseDTO) => {
      const { data } = await apiClient.post('/admin/warehouses', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-warehouses'] });
    },
  });
};

export const useUpdateWarehouse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateWarehouseDTO }) => {
      const { data } = await apiClient.put(`/admin/warehouses/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-warehouses'] });
    },
  });
};

export const useDeleteWarehouse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(`/admin/warehouses/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-warehouses'] });
    },
  });
};
