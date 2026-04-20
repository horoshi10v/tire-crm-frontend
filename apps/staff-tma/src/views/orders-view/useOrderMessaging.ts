import { useState } from 'react';
import { useSendOrderBotMessage } from '../../api/staffOrders';
import type { LotInternalResponse } from '../../types/lot';
import type { OrderResponse } from '../../types/order';
import { createBuyerMessage } from './helpers';

type Args = {
  lotMap: Map<string, LotInternalResponse>;
};

export default function useOrderMessaging({ lotMap }: Args) {
  const [messageOrder, setMessageOrder] = useState<OrderResponse | null>(null);
  const [messageText, setMessageText] = useState('');
  const sendOrderBotMessageMutation = useSendOrderBotMessage();

  const openMessageModal = (order: OrderResponse) => {
    setMessageOrder(order);
    setMessageText(createBuyerMessage(order, lotMap));
  };

  const closeMessageModal = () => {
    if (sendOrderBotMessageMutation.isPending) {
      return;
    }
    setMessageOrder(null);
    setMessageText('');
  };

  const handleSendBotMessage = async () => {
    if (!messageOrder) {
      return;
    }

    const trimmedMessage = messageText.trim();
    if (!trimmedMessage) {
      alert('Вкажіть текст повідомлення.');
      return;
    }

    try {
      await sendOrderBotMessageMutation.mutateAsync({
        id: messageOrder.id,
        payload: { message: trimmedMessage },
      });
      alert('Повідомлення успішно відправлено через бота.');
      setMessageOrder(null);
      setMessageText('');
    } catch {
      alert('Не вдалося відправити повідомлення через бота.');
    }
  };

  return {
    messageOrder,
    setMessageOrder,
    messageText,
    setMessageText,
    sendOrderBotMessageMutation,
    openMessageModal,
    closeMessageModal,
    handleSendBotMessage,
  };
}
