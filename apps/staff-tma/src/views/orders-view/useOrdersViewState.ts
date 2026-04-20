import { useEffect, useMemo, useState } from 'react';
import { useStaffLots } from '../../api/staffLots';
import { useOrderMessages, useStaffOrders } from '../../api/staffOrders';
import type { OrderChannel, OrderResponse, OrderStatus } from '../../types/order';
import { countStatuses, sortMessagesByDateAsc, sortOrdersByDateDesc } from './helpers';
import useOrderMessaging from './useOrderMessaging';
import useOrderPriceEditing from './useOrderPriceEditing';
import useOrderStatusActions from './useOrderStatusActions';

export default function useOrdersViewState() {
  const [customerInput, setCustomerInput] = useState('');
  const [debouncedCustomer, setDebouncedCustomer] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | OrderStatus>('');
  const [channelFilter, setChannelFilter] = useState<'' | OrderChannel>('');
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedCustomer(customerInput.trim());
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [customerInput]);

  const { data: orders = [], isLoading, isError, isFetching } = useStaffOrders({
    page: 1,
    pageSize: 50,
    status: statusFilter,
    channel: channelFilter,
    customer: debouncedCustomer,
  });

  const { data: lots = [] } = useStaffLots({ page: 1, pageSize: 1000 });
  const {
    data: orderMessages = [],
    isLoading: isMessagesLoading,
    isError: isMessagesError,
  } = useOrderMessages(selectedOrder?.id ?? null);

  const sortedOrders = useMemo(() => sortOrdersByDateDesc(orders), [orders]);
  const lotMap = useMemo(() => new Map(lots.map((lot) => [lot.id, lot])), [lots]);
  const statusCounts = useMemo(() => countStatuses(sortedOrders), [sortedOrders]);
  const orderedMessages = useMemo(() => sortMessagesByDateAsc(orderMessages), [orderMessages]);
  const { updatingOrderId, handleStatusChange } = useOrderStatusActions();
  const { editingPriceItemId, priceDrafts, setPriceDrafts, handleItemPriceSave } = useOrderPriceEditing({
    selectedOrder,
    setSelectedOrder,
  });
  const {
    messageOrder,
    setMessageOrder,
    messageText,
    setMessageText,
    sendOrderBotMessageMutation,
    openMessageModal,
    closeMessageModal,
    handleSendBotMessage,
  } = useOrderMessaging({ lotMap });

  useEffect(() => {
    if (!selectedOrder) {
      return;
    }

    const nextSelectedOrder = orders.find((order) => order.id === selectedOrder.id) ?? null;
    if (nextSelectedOrder) {
      setSelectedOrder(nextSelectedOrder);
    }
  }, [orders, selectedOrder]);

  return {
    customerInput,
    setCustomerInput,
    statusFilter,
    setStatusFilter,
    channelFilter,
    setChannelFilter,
    updatingOrderId,
    selectedOrder,
    setSelectedOrder,
    messageOrder,
    setMessageOrder,
    messageText,
    setMessageText,
    editingPriceItemId,
    priceDrafts,
    setPriceDrafts,
    isLoading,
    isError,
    isFetching,
    isMessagesLoading,
    isMessagesError,
    sendOrderBotMessageMutation,
    sortedOrders,
    lotMap,
    statusCounts,
    orderedMessages,
    closeMessageModal,
    handleStatusChange,
    handleItemPriceSave,
    openMessageModal,
    handleSendBotMessage,
  };
}
