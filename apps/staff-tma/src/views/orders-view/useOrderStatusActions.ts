import { useState } from 'react';
import { useUpdateStaffOrderStatus } from '../../api/staffOrders';
import type { OrderStatus } from '../../types/order';

export default function useOrderStatusActions() {
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const updateStatusMutation = useUpdateStaffOrderStatus();

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      setUpdatingOrderId(orderId);
      await updateStatusMutation.mutateAsync({
        id: orderId,
        payload: { status },
      });
    } catch {
      alert('Не вдалося змінити статус замовлення.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return {
    updatingOrderId,
    handleStatusChange,
  };
}
