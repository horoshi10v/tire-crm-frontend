import { useEffect, useState } from 'react';
import { useUpdateStaffOrderItemPrice } from '../../api/staffOrders';
import type { OrderResponse } from '../../types/order';

type Args = {
  selectedOrder: OrderResponse | null;
  setSelectedOrder: (order: OrderResponse | null) => void;
};

export default function useOrderPriceEditing({ selectedOrder, setSelectedOrder }: Args) {
  const [editingPriceItemId, setEditingPriceItemId] = useState<string | null>(null);
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const updateOrderItemPriceMutation = useUpdateStaffOrderItemPrice();

  useEffect(() => {
    if (!selectedOrder) {
      setPriceDrafts({});
      setEditingPriceItemId(null);
      return;
    }

    setPriceDrafts((prev) => {
      const nextDrafts: Record<string, string> = {};
      for (const item of selectedOrder.items) {
        nextDrafts[item.id] = prev[item.id] ?? String(item.price);
      }
      return nextDrafts;
    });
  }, [selectedOrder]);

  const handleItemPriceSave = async (order: OrderResponse, itemId: string) => {
    const draftValue = priceDrafts[itemId] ?? '';
    const nextPrice = Number(draftValue);

    if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
      alert('Вкажіть коректну ціну.');
      return;
    }

    try {
      setEditingPriceItemId(itemId);
      const updatedOrder = await updateOrderItemPriceMutation.mutateAsync({
        orderId: order.id,
        itemId,
        payload: {
          price: nextPrice,
          comment: 'Ручне коригування фактичної ціни офлайн-продажу',
        },
      });
      setSelectedOrder(updatedOrder);
    } catch {
      alert('Не вдалося оновити ціну позиції.');
    } finally {
      setEditingPriceItemId(null);
    }
  };

  return {
    editingPriceItemId,
    priceDrafts,
    setPriceDrafts,
    handleItemPriceSave,
  };
}
