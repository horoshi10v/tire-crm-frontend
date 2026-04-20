type Props = {
  customerName: string;
  customerTelegramId?: number;
  messageText: string;
  onMessageTextChange: (value: string) => void;
  onClose: () => void;
  onSend: () => void;
  isSending: boolean;
};

export default function OrderMessageModal({
  customerName,
  customerTelegramId,
  messageText,
  onMessageTextChange,
  onClose,
  onSend,
  isSending,
}: Props) {
  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div className="w-full max-w-xl rounded-2xl border border-gray-800 bg-gray-900 p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">Повідомлення покупцю</h3>
            <p className="text-xs text-gray-400">
              {customerName}
              {customerTelegramId ? ` • chat_id ${customerTelegramId}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-gray-400 transition hover:bg-gray-800 hover:text-gray-200"
          >
            Закрити
          </button>
        </div>

        <textarea
          value={messageText}
          onChange={(event) => onMessageTextChange(event.target.value)}
          rows={8}
          className="w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-3 text-sm text-white outline-none focus:border-blue-500"
        />

        <p className="mt-2 text-xs text-gray-500">
          Шаблон заповнюється автоматично за поточним статусом замовлення, але його можна відредагувати перед відправкою.
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-200 transition hover:bg-gray-700"
          >
            Скасувати
          </button>
          <button
            type="button"
            onClick={onSend}
            disabled={isSending}
            className="rounded-lg border border-blue-700/70 bg-blue-900/30 px-3 py-2 text-sm font-semibold text-blue-200 transition hover:bg-blue-900/45 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSending ? 'Відправка...' : 'Надіслати через бота'}
          </button>
        </div>
      </div>
    </div>
  );
}
