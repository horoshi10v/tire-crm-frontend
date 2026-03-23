import { useEffect, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import {
  useAdminUsers,
  useCreateAdminUser,
  useDeleteAdminUser,
  useUpdateAdminUserRole,
} from '../api/adminUsers';
import type { AdminUser, CreateWorkerDTO, UserRole } from '../types/adminUser';

type CreateWorkerFormState = {
  first_name: string;
  phone_number: string;
  username: string;
  telegram_id: string;
  role: Exclude<UserRole, 'BUYER'>;
};

const createInitialWorkerForm = (): CreateWorkerFormState => ({
  first_name: '',
  phone_number: '',
  username: '',
  telegram_id: '',
  role: 'STAFF',
});

const extractApiErrorMessage = (error: unknown): string => {
  if (!isAxiosError(error)) {
    return 'Невідома помилка. Спробуйте ще раз.';
  }

  const status = error.response?.status;
  const data = error.response?.data;

  if (typeof data === 'string' && data.trim()) {
    return `${status ? `HTTP ${status}: ` : ''}${data}`;
  }

  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const message =
      (typeof record.message === 'string' && record.message) ||
      (typeof record.error === 'string' && record.error) ||
      (typeof record.detail === 'string' && record.detail) ||
      (typeof record.title === 'string' && record.title);

    if (message) {
      return `${status ? `HTTP ${status}: ` : ''}${message}`;
    }

    const flattened = Object.values(record)
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .join('; ');

    if (flattened) {
      return `${status ? `HTTP ${status}: ` : ''}${flattened}`;
    }
  }

  return `${status ? `HTTP ${status}. ` : ''}${error.message || 'Помилка запиту до сервера.'}`;
};

const formatUserName = (user: AdminUser): string => {
  const firstName = user.first_name?.trim();
  if (firstName) {
    return firstName;
  }

  const username = user.username?.trim();
  if (username) {
    return `@${username}`;
  }

  const phone = user.phone_number?.trim();
  if (phone) {
    return phone;
  }

  return `Користувач ${user.id.slice(0, 8)}`;
};

export default function AdminUsersView() {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'' | UserRole>('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateWorkerFormState>(createInitialWorkerForm());
  const [createError, setCreateError] = useState<string | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);
  const [roleDrafts, setRoleDrafts] = useState<Record<string, UserRole>>({});

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchInput]);

  const { data: users = [], isLoading, isError, isFetching, error } = useAdminUsers({
    page: 1,
    page_size: 200,
    search: debouncedSearch || undefined,
    role: roleFilter || undefined,
  });

  const createMutation = useCreateAdminUser();
  const updateRoleMutation = useUpdateAdminUserRole();
  const deleteMutation = useDeleteAdminUser();

  const isCreateSubmitting = createMutation.isPending;

  const closeCreateModal = () => {
    if (isCreateSubmitting) {
      return;
    }

    setIsCreateModalOpen(false);
    setCreateError(null);
    setCreateForm(createInitialWorkerForm());
  };

  const openCreateModal = () => {
    setIsCreateModalOpen(true);
    setCreateError(null);
    setCreateForm(createInitialWorkerForm());
  };

  const handleCreateWorker = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError(null);

    const username = createForm.username.trim().replace(/^@+/, '');
    const phoneNumber = createForm.phone_number.trim();
    const firstName = createForm.first_name.trim();
    const telegramInput = createForm.telegram_id.trim();

    if (!telegramInput && !username && !phoneNumber) {
      setCreateError('Вкажіть хоча б один ідентифікатор: Telegram ID, username або номер телефону.');
      return;
    }

    let telegramId: number | undefined;
    if (telegramInput) {
      telegramId = Number.parseInt(telegramInput, 10);
      if (!Number.isFinite(telegramId)) {
        setCreateError('Telegram ID повинен бути числом.');
        return;
      }
    }

    const payload: CreateWorkerDTO = {
      role: createForm.role,
      first_name: firstName || undefined,
      phone_number: phoneNumber || undefined,
      username: username || undefined,
      telegram_id: telegramId,
    };

    try {
      await createMutation.mutateAsync(payload);
      closeCreateModal();
    } catch (mutationError) {
      setCreateError(`Не вдалося додати працівника: ${extractApiErrorMessage(mutationError)}`);
    }
  };

  const handleUpdateRole = async (user: AdminUser) => {
    setActionError(null);
    const nextRole = roleDrafts[user.id] ?? user.role;

    if (nextRole === user.role) {
      return;
    }

    try {
      await updateRoleMutation.mutateAsync({
        id: user.id,
        payload: { role: nextRole },
      });
    } catch (mutationError) {
      setActionError(`Не вдалося змінити роль: ${extractApiErrorMessage(mutationError)}`);
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    setActionError(null);
    const isConfirmed = window.confirm(`Видалити користувача "${formatUserName(user)}"?`);
    if (!isConfirmed) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(user.id);
    } catch (mutationError) {
      setActionError(`Не вдалося видалити користувача: ${extractApiErrorMessage(mutationError)}`);
    }
  };

  return (
    <section className="space-y-4 p-4 text-white">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">Керування персоналом</h2>
        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          Додати працівника
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm text-gray-300">Пошук</span>
          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Ім'я, username або телефон"
            className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm text-gray-300">Роль</span>
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as '' | UserRole)}
            className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
          >
            <option value="">Усі ролі</option>
            <option value="ADMIN">ADMIN</option>
            <option value="STAFF">STAFF</option>
            <option value="BUYER">BUYER</option>
          </select>
        </label>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-sm text-gray-400">Завантаження користувачів...</div>
      ) : null}

      {isError ? (
        <div className="rounded-xl border border-red-800/60 bg-red-950/30 p-4 text-sm text-red-300">
          Не вдалося завантажити користувачів: {extractApiErrorMessage(error)}
        </div>
      ) : null}

      {actionError ? (
        <div className="rounded-xl border border-red-800/60 bg-red-950/30 p-4 text-sm text-red-300">{actionError}</div>
      ) : null}

      {!isLoading && !isError && users.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-sm text-gray-400">Користувачів не знайдено.</div>
      ) : null}

      <div className="space-y-3">
        {users.map((user) => {
          const selectedRole = roleDrafts[user.id] ?? user.role;
          const isRoleUpdating = updateRoleMutation.isPending;
          const isDeleting = deleteMutation.isPending;

          return (
            <article key={user.id} className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold text-white">{formatUserName(user)}</h3>
                  <div className="mt-1 space-y-0.5 text-xs text-gray-400">
                    {user.username ? <p>Username: @{user.username}</p> : null}
                    {user.phone_number ? <p>Телефон: {user.phone_number}</p> : null}
                    {typeof user.telegram_id === 'number' ? <p>Telegram ID: {user.telegram_id}</p> : null}
                    <p className="break-all text-[11px] text-gray-500">ID: {user.id}</p>
                  </div>
                </div>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    user.role === 'ADMIN'
                      ? 'border border-blue-700/60 bg-blue-900/30 text-blue-200'
                      : user.role === 'STAFF'
                        ? 'border border-emerald-700/60 bg-emerald-900/30 text-emerald-200'
                        : 'border border-zinc-700/60 bg-zinc-800/70 text-zinc-300'
                  }`}
                >
                  {user.role}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto]">
                <select
                  value={selectedRole}
                  onChange={(event) =>
                    setRoleDrafts((prev) => ({
                      ...prev,
                      [user.id]: event.target.value as UserRole,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="STAFF">STAFF</option>
                  <option value="BUYER">BUYER</option>
                </select>

                <button
                  type="button"
                  onClick={() => handleUpdateRole(user)}
                  disabled={isRoleUpdating || selectedRole === user.role}
                  className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-100 transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Змінити роль
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteUser(user)}
                  disabled={isDeleting}
                  className="rounded-lg border border-red-700/70 bg-red-900/25 px-3 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-900/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Видалити
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {isFetching && !isLoading ? <p className="text-xs text-gray-500">Оновлення списку...</p> : null}

      {isCreateModalOpen ? (
        <div className="fixed inset-0 z-[85] flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Новий працівник</h3>
              <button
                type="button"
                onClick={closeCreateModal}
                disabled={isCreateSubmitting}
                className="rounded-md px-2 py-1 text-sm text-gray-400 transition hover:bg-gray-800 hover:text-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Закрити
              </button>
            </div>

            <form onSubmit={handleCreateWorker} className="space-y-3">
              <label className="space-y-1">
                <span className="text-sm text-gray-300">Роль *</span>
                <select
                  value={createForm.role}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      role: event.target.value as Exclude<UserRole, 'BUYER'>,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
                >
                  <option value="STAFF">STAFF</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-sm text-gray-300">Ім'я</span>
                <input
                  type="text"
                  value={createForm.first_name}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, first_name: event.target.value }))}
                  placeholder="Наприклад: Іван"
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-gray-300">Telegram ID</span>
                <input
                  type="number"
                  value={createForm.telegram_id}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, telegram_id: event.target.value }))}
                  placeholder="Наприклад: 123456789"
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-gray-300">Username</span>
                <input
                  type="text"
                  value={createForm.username}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, username: event.target.value }))}
                  placeholder="Наприклад: worker_name"
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-gray-300">Телефон</span>
                <input
                  type="text"
                  value={createForm.phone_number}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, phone_number: event.target.value }))}
                  placeholder="Наприклад: +380501234567"
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
                />
              </label>

              <p className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-gray-400">
                Вкажіть хоча б один ідентифікатор: Telegram ID або username або телефон.
              </p>

              {createError ? (
                <div className="rounded-lg border border-red-800/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">{createError}</div>
              ) : null}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={isCreateSubmitting}
                  className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={isCreateSubmitting}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCreateSubmitting ? 'Збереження...' : 'Додати'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
