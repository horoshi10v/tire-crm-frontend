import OrdersFilters from './orders-view/OrdersFilters';
import OrderDetailsModal from './orders-view/OrderDetailsModal';
import OrdersList from './orders-view/OrdersList';
import OrderMessageModal from './orders-view/OrderMessageModal';
import useOrdersViewState from './orders-view/useOrdersViewState';

export default function OrdersView() {
  const {
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
  } = useOrdersViewState();

  return (
    <section className="space-y-4 p-4 text-white">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">Замовлення</h2>
      </div>

      <OrdersFilters
        customerInput={customerInput}
        onCustomerInputChange={setCustomerInput}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        channelFilter={channelFilter}
        onChannelFilterChange={setChannelFilter}
        statusCounts={statusCounts}
      />

      {isLoading ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-sm text-gray-400">Завантаження замовлень...</div>
      ) : null}

      {isError ? (
        <div className="rounded-xl border border-red-800/60 bg-red-950/30 p-4 text-sm text-red-300">
          Не вдалося завантажити список замовлень.
        </div>
      ) : null}

      {!isLoading && !isError && sortedOrders.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-sm text-gray-400">Замовлення не знайдені.</div>
      ) : null}

      <OrdersList
        orders={sortedOrders}
        lotMap={lotMap}
        updatingOrderId={updatingOrderId}
        onSelectOrder={setSelectedOrder}
        onStatusChange={handleStatusChange}
        onOpenMessageModal={openMessageModal}
      />

      {isFetching && !isLoading ? <p className="text-xs text-gray-500">Оновлення списку...</p> : null}

      <OrderDetailsModal
        order={selectedOrder}
        lotMap={lotMap}
        updatingOrderId={updatingOrderId}
        editingPriceItemId={editingPriceItemId}
        priceDrafts={priceDrafts}
        isMessagesLoading={isMessagesLoading}
        isMessagesError={isMessagesError}
        orderedMessages={orderedMessages}
        onClose={() => setSelectedOrder(null)}
        onStatusChange={handleStatusChange}
        onOpenMessageModal={openMessageModal}
        onPriceDraftChange={(itemId, value) =>
          setPriceDrafts((prev) => ({
            ...prev,
            [itemId]: value,
          }))
        }
        onItemPriceSave={handleItemPriceSave}
      />

      {messageOrder ? (
        <OrderMessageModal
          customerName={messageOrder.customer_name}
          customerTelegramId={messageOrder.customer_telegram_id}
          messageText={messageText}
          onMessageTextChange={setMessageText}
          onClose={closeMessageModal}
          onSend={() => void handleSendBotMessage()}
          isSending={sendOrderBotMessageMutation.isPending}
        />
      ) : null}
    </section>
  );
}
