// apps/staff-tma/src/App.tsx
import { useState, useEffect } from 'react';
import { authenticateTelegramUser, useAuthStore } from '@tire-crm/shared';
import { useTelegramQR } from './hooks/useTelegramQR';
import { getLotQRData, useCreateLot, useDeleteLot, useFindStaffLotById, useUpdateLot } from './api/staffLots';
import { useStaffWarehouses } from './api/staffWarehouses';
import InventoryView from './views/InventoryView';
import PriceTagModal from './components/PriceTagModal';
import PriceTagPrintPage from './components/PriceTagPrintPage';
import LotFormModal from './components/LotFormModal';
import LotDetailsModal from './components/LotDetailsModal';
import SellLotModal from './components/SellLotModal';
import OrdersView from './views/OrdersView';
import WarehouseView from './views/WarehouseView';
import TransfersView from './views/TransfersView';
import AdminReportsView from './views/AdminReportsView';
import AdminUsersView from './views/AdminUsersView';
import AdminAuditLogView from './views/AdminAuditLogView';
import AdminNotificationsView from './views/AdminNotificationsView';
import type { CreateLotDTO, LotInternalResponse, UpdateLotDTO } from './types/lot';
import {
  buildPriceTagDetails,
  DEFAULT_PRICE_TAG_FORMAT,
  encodePriceTagBatch,
  formatSellPrice,
  openPriceTagPrintUrl,
} from './utils/priceTagPrint';

type LotFormState =
  | { mode: 'create' }
  | { mode: 'edit'; lot: LotInternalResponse }
  | null;

type LotDetailsState = {
  lot: LotInternalResponse;
  warehouseLabel: string;
} | null;

type SellLotState = {
  lot: LotInternalResponse;
} | null;

type StaffTab = 'inventory' | 'orders' | 'warehouses' | 'transfers' | 'admin' | 'admin-users' | 'audit-log' | 'notifications';

function App() {
  const isPrintRoute = window.location.pathname === '/print/price-tag';
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StaffTab>('inventory');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [priceTagLot, setPriceTagLot] = useState<LotInternalResponse | null>(null);
  const [isBulkPrinting, setIsBulkPrinting] = useState(false);
  const [lotFormState, setLotFormState] = useState<LotFormState>(null);
  const [lotDetails, setLotDetails] = useState<LotDetailsState>(null);
  const [sellLotState, setSellLotState] = useState<SellLotState>(null);

  const { isAuthenticated, user } = useAuthStore();
  const { scanQR } = useTelegramQR();
  const createLotMutation = useCreateLot();
  const updateLotMutation = useUpdateLot();
  const deleteLotMutation = useDeleteLot();
  const findLotByIdMutation = useFindStaffLotById();
  const { data: warehouses = [] } = useStaffWarehouses();

  // Авторизація
  useEffect(() => {
    const initApp = async () => {
      try {
        await authenticateTelegramUser();
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setIsAuthLoading(false);
      }
    };
    if (!isAuthenticated) initApp();
    else setIsAuthLoading(false);
  }, [isAuthenticated]);

  const extractLotIdFromQR = (rawValue: string): string | null => {
    const value = rawValue.trim();
    if (!value) {
      return null;
    }

    try {
      const url = new URL(value);
      const fromQuery =
        url.searchParams.get('lot_id') ?? url.searchParams.get('lotId') ?? url.searchParams.get('id');
      if (fromQuery) {
        return fromQuery.trim();
      }

      const parts = url.pathname.split('/').filter(Boolean);
      const lastPart = parts[parts.length - 1];
      if (lastPart) {
        return lastPart;
      }
    } catch {
      return value;
    }

    return value;
  };

  // Обробник сканування
  const handleScan = (scannedData: string) => {
    const openLotFromScanner = async () => {
      const parsedLotId = extractLotIdFromQR(scannedData);
      if (!parsedLotId) {
        alert('QR-код не містить коректний ID лота.');
        return;
      }

      try {
        const lot = await findLotByIdMutation.mutateAsync(parsedLotId);
        if (!lot) {
          alert(`Лот з ID "${parsedLotId}" не знайдено.`);
          return;
        }

        const warehouseLabel =
          warehouses.find((warehouse) => warehouse.id === lot.warehouse_id)?.name ?? 'Невідомий склад';

        setActiveTab('inventory');
        setLotFormState(null);
        setLotDetails({ lot, warehouseLabel });
      } catch {
        alert('Не вдалося відкрити лот після сканування QR.');
      }
    };

    void openLotFromScanner();
  };

  const closeLotForm = () => {
    if (createLotMutation.isPending || updateLotMutation.isPending) {
      return;
    }
    setLotFormState(null);
  };

  const handleCreateLot = async (payload: CreateLotDTO) => {
    await createLotMutation.mutateAsync(payload);
    setLotFormState(null);
  };

  const handleUpdateLot = async (payload: UpdateLotDTO) => {
    if (!lotFormState || lotFormState.mode !== 'edit') {
      return;
    }
    await updateLotMutation.mutateAsync({ id: lotFormState.lot.id, lot: payload });
    setLotFormState(null);
  };

  const handleDeleteLot = async (lot: LotInternalResponse) => {
    const isConfirmed = window.confirm(`Видалити товар "${lot.brand} ${lot.model}"?`);
    if (!isConfirmed) {
      return;
    }

    try {
      await deleteLotMutation.mutateAsync(lot.id);
    } catch {
      alert('Не вдалося видалити товар. Спробуйте ще раз.');
    }
  };

  const handleBulkDeleteLots = async (lots: LotInternalResponse[]) => {
    if (lots.length === 0) {
      return;
    }

    const isConfirmed = window.confirm(`Видалити вибрані товари (${lots.length})?`);
    if (!isConfirmed) {
      return;
    }

    const results = await Promise.allSettled(lots.map((lot) => deleteLotMutation.mutateAsync(lot.id)));
    const failedCount = results.filter((result) => result.status === 'rejected').length;

    if (failedCount > 0) {
      alert(`Не вдалося видалити ${failedCount} з ${lots.length} товарів.`);
    }
  };

  const handleBulkPrintLots = async (lots: LotInternalResponse[]) => {
    if (lots.length === 0 || isBulkPrinting) {
      return;
    }

    setIsBulkPrinting(true);

    try {
      const printItems = await Promise.all(
        lots.map(async (lot) => {
          try {
            const qrData = await getLotQRData(lot.id);
            return {
              lotId: lot.id,
              brand: lot.brand,
              stock: lot.current_quantity,
              title: `${lot.model ?? ''}`.trim() || lot.brand,
              price: formatSellPrice(lot.sell_price),
              qr: qrData.dataUrl,
              ...buildPriceTagDetails(lot),
            };
          } catch {
            return {
              lotId: lot.id,
              brand: lot.brand,
              stock: lot.current_quantity,
              title: `${lot.model ?? ''}`.trim() || lot.brand,
              price: formatSellPrice(lot.sell_price),
              qr: '',
              ...buildPriceTagDetails(lot),
            };
          }
        }),
      );

      const payload = encodePriceTagBatch(printItems);
      const printUrl = `${window.location.origin}/print/price-tag?format=${DEFAULT_PRICE_TAG_FORMAT}#payload=${payload}`;
      openPriceTagPrintUrl(printUrl);
    } finally {
      setIsBulkPrinting(false);
    }
  };

  if (isPrintRoute) {
    return <PriceTagPrintPage />;
  }

  // Екран завантаження
  if (isAuthLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-400">Авторизація...</div>;
  }

  // Role Guard: Якщо роль BUYER або юзер не знайдений — блокуємо доступ
  if (!user || user.role === 'BUYER') {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 p-6 text-center">
          <div className="text-6xl mb-4">🛑</div>
          <h1 className="text-2xl font-bold text-red-500 mb-2">Доступ заборонено</h1>
          <p className="text-gray-400">Цей додаток призначений лише для персоналу та адміністраторів.</p>
          <p className="text-sm text-gray-500 mt-4">Ваша роль: {user?.role || 'Невідома'}</p>
        </div>
    );
  }

  const isAdmin = user.role === 'ADMIN';
  const headerTitle =
    activeTab === 'inventory'
      ? 'Склад'
      : activeTab === 'warehouses'
        ? 'Склади'
        : activeTab === 'transfers'
          ? 'Трансфери'
          : activeTab === 'orders'
            ? 'Замовлення'
            : activeTab === 'admin-users'
              ? 'Персонал'
              : activeTab === 'audit-log'
                ? 'Журнал дій'
                : activeTab === 'notifications'
                  ? 'Сповіщення'
              : 'Адмін-звіти';
  const headerUserName = user.firstName || user.username || 'Користувач';
  const navigationItems: Array<{ key: StaffTab; label: string; icon: string }> = [
    { key: 'inventory', label: 'Склад', icon: '📦' },
    { key: 'orders', label: 'Замовлення', icon: '📝' },
    { key: 'warehouses', label: 'Склади', icon: '🏢' },
    { key: 'transfers', label: 'Трансфери', icon: '🔁' },
  ];
  if (isAdmin) {
    navigationItems.push({ key: 'notifications', label: 'Сповіщення', icon: '🔔' });
    navigationItems.push({ key: 'admin', label: 'Звіти', icon: '📊' });
    navigationItems.push({ key: 'admin-users', label: 'Персонал', icon: '👥' });
    navigationItems.push({ key: 'audit-log', label: 'Журнал дій', icon: '🧾' });
  }

  return (
      <div className="min-h-screen bg-gray-950 relative">
        <div className="flex min-h-screen flex-col print:hidden">
          {/* Шапка */}
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-800 bg-gray-900 p-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMenuOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-700 bg-gray-800 text-lg text-white transition hover:bg-gray-700"
              >
                ☰
              </button>
              <div>
                <h1 className="text-lg font-semibold text-white">{headerTitle}</h1>
                <p className="text-xs text-gray-400">{headerUserName}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => scanQR(handleScan)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-blue-700/40 bg-blue-600 text-xl text-white shadow-lg shadow-blue-900/30 transition active:scale-95"
            >
              📷
            </button>
          </header>

          {/* Основний контент (перемикач табів) */}
          <main className="flex-grow overflow-y-auto">
            {activeTab === 'inventory' ? (
              <InventoryView
                onCreateLot={() => setLotFormState({ mode: 'create' })}
                onEditLot={(lot) => setLotFormState({ mode: 'edit', lot })}
                onOpenDetails={(lot, warehouseLabel) => setLotDetails({ lot, warehouseLabel })}
                onDeleteLot={handleDeleteLot}
                onBulkDeleteLots={handleBulkDeleteLots}
                onBulkPrintLots={handleBulkPrintLots}
                isBulkPrinting={isBulkPrinting}
                onOpenPriceTag={(lot) => setPriceTagLot(lot)}
              />
            ) : activeTab === 'warehouses' ? (
              <WarehouseView />
            ) : activeTab === 'transfers' ? (
              <TransfersView />
            ) : activeTab === 'admin-users' && isAdmin ? (
              <AdminUsersView />
            ) : activeTab === 'notifications' && isAdmin ? (
              <AdminNotificationsView />
            ) : activeTab === 'audit-log' && isAdmin ? (
              <AdminAuditLogView />
            ) : activeTab === 'admin' && isAdmin ? (
              <AdminReportsView />
            ) : (
              <OrdersView />
            )}
          </main>

        </div>

        {isMenuOpen ? (
          <div className="fixed inset-0 z-[70] flex">
            <button type="button" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
            <aside className="relative z-[71] flex h-full w-[86%] max-w-xs flex-col overflow-hidden border-r border-gray-800 bg-gray-900 p-4 shadow-2xl">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-gray-500">Меню</p>
                  <p className="mt-1 text-lg font-semibold text-white">{headerUserName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-700 bg-gray-800 text-lg text-white transition hover:bg-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="mb-4 rounded-2xl border border-blue-700/30 bg-blue-900/20 p-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    scanQR(handleScan);
                  }}
                  className="flex w-full items-center justify-between rounded-xl bg-blue-600 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  <span>Сканувати QR</span>
                  <span className="text-lg">📷</span>
                </button>
              </div>

              <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {navigationItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.key);
                      setIsMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
                      activeTab === item.key
                        ? 'bg-[#10AD0B]/15 text-[#8ff38b]'
                        : 'bg-gray-800/70 text-gray-200 hover:bg-gray-800'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>
            </aside>
          </div>
        ) : null}

        <LotDetailsModal
          lot={lotDetails?.lot ?? null}
          warehouseLabel={lotDetails?.warehouseLabel ?? ''}
          onClose={() => setLotDetails(null)}
          onEdit={(lot) => {
            setLotDetails(null);
            setLotFormState({ mode: 'edit', lot });
          }}
          onOpenPriceTag={(lot) => {
            setLotDetails(null);
            setPriceTagLot(lot);
          }}
          onSell={(lot) => {
            setLotDetails(null);
            setSellLotState({ lot });
          }}
        />
        <SellLotModal
          lot={sellLotState?.lot ?? null}
          onClose={() => setSellLotState(null)}
          onSuccess={() => {
            setSellLotState(null);
            setActiveTab('orders');
          }}
        />
        <PriceTagModal lot={priceTagLot} onClose={() => setPriceTagLot(null)} />
        {lotFormState?.mode === 'create' ? (
          <LotFormModal
            key="create-lot-modal"
            mode="create"
            isOpen
            isSubmitting={createLotMutation.isPending}
            onClose={closeLotForm}
            onSubmit={handleCreateLot}
          />
        ) : null}
        {lotFormState?.mode === 'edit' ? (
          <LotFormModal
            key={lotFormState.lot.id}
            mode="edit"
            lot={lotFormState.lot}
            isOpen
            isSubmitting={updateLotMutation.isPending}
            onClose={closeLotForm}
            onSubmit={handleUpdateLot}
          />
        ) : null}
      </div>
  );
}

export default App;
